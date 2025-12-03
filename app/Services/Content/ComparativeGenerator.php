<?php

namespace App\Services\Content;

use App\Models\Article;
use App\Models\ArticleFaq;
use App\Models\Country;
use App\Models\Language;
use App\Models\Platform;
use App\Services\AI\GptService;
use App\Services\AI\PerplexityService;
use App\Services\AI\DalleService;
use App\Services\Content\PlatformKnowledgeService;
use App\Services\Content\BrandValidationService;
use App\Services\Quality\ContentQualityEnforcer;      // ← AJOUTÉ PHASE 13
use App\Services\Quality\GoldenExamplesService;       // ← AJOUTÉ PHASE 13
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * ComparativeGenerator - Générateur d'articles comparatifs
 * 
 * OBJECTIF RÉEL : Comparer LES PLATEFORMES elles-mêmes !
 * 
 * Génère des articles de type :
 * "SOS-Expat.com vs InterNations vs Expatica : Quelle plateforme choisir ?"
 * "Ulixai.com vs Fiverr vs Malt : Comparatif 2025"
 * 
 * BUT : Prouver que SOS-Expat.com et Ulixai.com sont LES MEILLEURES
 * alternatives pour expatriés vs tous les autres services concurrents.
 * 
 * STRATÉGIE :
 * 1. Rechercher concurrents réels (InterNations, Expatica, etc.)
 * 2. Comparer selon critères où nos plateformes excellent
 * 3. Assurer que nos plateformes ressortent #1 🥇
 * 4. Prouver objectivement avec scores, tableaux, graphiques
 * 5. CTA vers inscription sur nos plateformes
 * 
 * Avantages à mettre en avant :
 * - 197 pays (vs 50-100 pour concurrents)
 * - 9 langues (vs 2-3 pour concurrents)
 * - Prestataires vérifiés (vs annuaires basiques)
 * - Support 24/7 multilingue (unique)
 * - Assistance juridique SOS sous 5min (unique)
 * 
 * Support : 197 pays × 9 langues (fr, en, de, es, pt, ru, zh, ar, hi)
 * 
 * @package App\Services\Content
 */
class ComparativeGenerator
{
    protected GptService $gpt;
    protected PerplexityService $perplexity;
    protected DalleService $dalle;
    protected TitleService $titleService;
    protected LinkService $linkService;
    protected QualityChecker $qualityChecker;
    protected ChartGenerator $chartGenerator;
    protected ComparisonDataFetcher $dataFetcher;
    protected PlatformKnowledgeService $knowledgeService;
    protected BrandValidationService $brandValidator;
    protected ContentQualityEnforcer $qualityEnforcer;      // ← AJOUTÉ PHASE 13
    protected GoldenExamplesService $goldenService;         // ← AJOUTÉ PHASE 13

    // Configuration génération
    protected array $config = [
        'competitors_min' => 3,
        'competitors_max' => 10,
        'competitors_default' => 5,
        'criteria_min' => 4,
        'criteria_max' => 8,
        'section_words_min' => 200,
        'section_words_max' => 400,
        'total_words_min' => 1500,
        'total_words_max' => 3000,
        'faqs_count' => 6,
    ];

    // Statistiques de génération
    protected array $stats = [
        'start_time' => null,
        'end_time' => null,
        'duration_seconds' => 0,
        'total_cost' => 0,
        'gpt_calls' => 0,
        'perplexity_calls' => 0,
        'dalle_calls' => 0,
    ];

    /**
     * Constructeur avec injection de dépendances
     */
    public function __construct(
        GptService $gpt,
        PerplexityService $perplexity,
        DalleService $dalle,
        TitleService $titleService,
        LinkService $linkService,
        QualityChecker $qualityChecker,
        ChartGenerator $chartGenerator,
        ComparisonDataFetcher $dataFetcher,
        PlatformKnowledgeService $knowledgeService,
        BrandValidationService $brandValidator,
        ContentQualityEnforcer $qualityEnforcer,            // ← AJOUTÉ PHASE 13
        GoldenExamplesService $goldenService                // ← AJOUTÉ PHASE 13
    ) {
        $this->gpt = $gpt;
        $this->perplexity = $perplexity;
        $this->dalle = $dalle;
        $this->titleService = $titleService;
        $this->linkService = $linkService;
        $this->qualityChecker = $qualityChecker;
        $this->chartGenerator = $chartGenerator;
        $this->dataFetcher = $dataFetcher;
        $this->knowledgeService = $knowledgeService;
        $this->brandValidator = $brandValidator;
        $this->qualityEnforcer = $qualityEnforcer;          // ← AJOUTÉ PHASE 13
        $this->goldenService = $goldenService;              // ← AJOUTÉ PHASE 13
    }

    /**
     * Générer un article comparatif complet
     * 
     * @param array $params {
     *     @type int    $platform_id       ID plateforme (Ulixai, SOS-Expat...)
     *     @type int    $country_id        ID pays (197 pays)
     *     @type string $language_code     Code langue (9 langues)
     *     @type string $service_type      Type de service à comparer
     *     @type int    $competitors_count Nombre de prestataires (3-10)
     *     @type array  $criteria          Critères de comparaison (optionnel)
     *     @type bool   $with_cta          CTA vers plateforme (défaut: true)
     * }
     * @return Article Article comparatif généré
     */
    public function generate(array $params): Article
    {
        $this->stats['start_time'] = microtime(true);

        // Validation
        $this->validateParams($params);

        // Récupération entités
        $platform = Platform::findOrFail($params['platform_id']);
        $country = Country::with('translations')->findOrFail($params['country_id']);
        $language = Language::findOrFail(
            Language::where('code', $params['language_code'])->firstOrFail()->id
        );

        $competitorsCount = $params['competitors_count'] 
            ?? $this->config['competitors_default'];

        Log::info('Génération article comparatif', [
            'platform' => $platform->name,
            'country' => $country->name,
            'language' => $language->code,
            'service_type' => $params['service_type'],
            'competitors' => $competitorsCount,
        ]);

        DB::beginTransaction();

        try {
            // 1. Récupération données : NOTRE plateforme vs concurrents DU SERVICE
            $comparisonData = $this->dataFetcher->fetchComparisonData([
                'platform_id' => $params['platform_id'],
                'service_type' => $params['service_type'] ?? 'Services généraux',
                'country_code' => $country->code,
                'language_code' => $language->code,
                'competitors_count' => $competitorsCount,
                'criteria' => $params['criteria'] ?? null,
            ]);

            $this->stats['perplexity_calls']++;

            // Vérifier qu'on a bien des concurrents
            if (empty($comparisonData['competitors'])) {
                throw new \Exception('Aucun concurrent trouvé. Vérifiez la configuration Perplexity.');
            }

            // IMPORTANT : Il faut au moins 2 plateformes pour un comparatif
            if (count($comparisonData['competitors']) < 2) {
                throw new \Exception('Pas assez de concurrents (' . count($comparisonData['competitors']) . '). Minimum requis: 2 plateformes.');
            }

            Log::info('Concurrents trouvés', [
                'count' => count($comparisonData['competitors']),
                'names' => array_column($comparisonData['competitors'], 'name'),
            ]);

            // 2. Traduction automatique du service_type dans la langue cible
            $translatedServiceType = $this->translateServiceType(
                $params['service_type'],
                $params['language_code']
            );

            Log::info('Service type translated', [
                'original' => $params['service_type'],
                'translated' => $translatedServiceType,
                'language' => $params['language_code'],
            ]);

            // 3. Génération titre avec top 3-4 plateformes
            $competitorNames = array_slice(
                array_map(fn($c) => $c['name'], $comparisonData['competitors']), 
                0, 
                min(4, count($comparisonData['competitors'])) // Max 4 noms dans le titre
            );
            $title = implode(' vs ', $competitorNames) . ' : ' . 
                     $translatedServiceType . ' ' . 
                     $country->name . ' ' . date('Y');

            // 4. Génération introduction
            $introduction = $this->generateIntroduction([
                'title' => $title,
                'country' => $country->name,
                'language_code' => $language->code,
                'competitors' => $comparisonData['competitors'],
                'platform_name' => $platform->name,
                'platform' => $platform,  // ← AJOUTÉ pour golden examples
            ]);

            // 5. Génération tableau comparatif avec scores
            $comparisonTable = $this->generateComparativeTable(
                $comparisonData['competitors'],
                $comparisonData['criteria'],
                $language->code
            );

            // 6. Génération graphique en barres (SVG)
            $barChart = $this->generateBarChart(
                $comparisonData['competitors'],
                $language->code
            );

            // 7. Génération graphique radar (données Chart.js)
            $radarChart = $this->generateRadarChart(
                $comparisonData['competitors'],
                $comparisonData['criteria']
            );

            // 7. Génération podium avec CTA vers plateforme
            $podium = $this->generatePodium(
                array_slice($comparisonData['competitors'], 0, 3),
                $params['with_cta'] ?? true,
                $language->code,
                $platform->name
            );

            // 8. Génération sections détaillées par concurrent
            $detailedSections = [];
            foreach ($comparisonData['competitors'] as $index => $competitor) {
                $detailedSections[] = $this->generateElementSection(
                    $competitor,
                    $index + 1,
                    $params['service_type'],
                    $language->code
                );
                $this->stats['gpt_calls']++;
            }

            // 9. Génération FAQ spécifique aux comparatifs
            $faqs = $this->generateComparativeFaqs([
                'service_type' => $params['service_type'],
                'country' => $country->name,
                'language_code' => $language->code,
                'competitors' => $comparisonData['competitors'],
                'platform_id' => $params['platform_id'],  // ← AJOUTÉ pour golden examples
            ]);

            // 10. Génération conclusion
            $conclusion = $this->generateConclusion([
                'service_type' => $params['service_type'],
                'country' => $country->name,
                'language_code' => $language->code,
                'top_competitor' => $comparisonData['competitors'][0],
                'platform_name' => $platform->name,
            ]);

            // 11. Assemblage contenu HTML
            $content = $this->assembleComparativeContent([
                'introduction' => $introduction,
                'comparison_table' => $comparisonTable,
                'bar_chart' => $barChart,
                'podium' => $podium,
                'detailed_sections' => $detailedSections,
                'radar_chart' => $radarChart,
                'conclusion' => $conclusion,
            ]);

            // 12. Génération image DALL-E (optionnel)
            $imageUrl = null;
            if ($params['generate_image'] ?? false) {
                $image = $this->dalle->generateForArticle([
                    'title' => $title,
                    'theme' => $params['service_type'],
                    'country' => $country->name,
                ]);
                $imageUrl = $image->path;
                $this->stats['dalle_calls']++;
            }

            // 13. Insertion liens internes/externes
            $content = $this->linkService->insertLinks($content, [
                'platform_id' => $params['platform_id'],
                'country_id' => $params['country_id'],
                'language_id' => $language->id,
                'service_type' => $params['service_type'],
            ]);

            // 14. Création article
            $wordCount = ContentHelper::countWords($content);
            
            $article = Article::create([
                'uuid' => (string) Str::uuid(),
                'platform_id' => $params['platform_id'],
                'country_id' => $params['country_id'],
                'language_id' => $language->id,
                'type' => 'comparative',
                'title' => $title,
                'title_hash' => hash('sha256', $title),
                'slug' => Article::generateUniqueSlug(
                    $title,
                    $params['platform_id'],
                    $language->id
                ),
                'excerpt' => $this->generateExcerpt($introduction),
                'content' => $content,
                'word_count' => $wordCount,
                'reading_time' => ContentHelper::estimateReadingTime($wordCount),
                'meta_title' => $this->generateMetaTitle($title),
                'meta_description' => $this->generateMetaDescription($title, $country->name),
                'image_url' => $imageUrl,
                'status' => Article::STATUS_DRAFT,
                'quality_score' => 0,
                'theme_type' => 'comparative',
                'theme_id' => $params['theme_id'] ?? null,
                'generation_cost' => $this->calculateTotalCost(),
            ]);

            // ========== ✅ VALIDATION PHASE 13 (6 CRITÈRES) ==========
            $qualityCheck = $this->qualityEnforcer->validateArticle($article);

            // Mettre à jour article avec score et notes
            $article->quality_score = $qualityCheck->overall_score;
            $article->validation_notes = json_encode([
                'quality_check_id' => $qualityCheck->id,
                'knowledge_score' => $qualityCheck->knowledge_score,
                'brand_score' => $qualityCheck->brand_score,
                'seo_score' => $qualityCheck->seo_score,
                'readability_score' => $qualityCheck->readability_score,
                'structure_score' => $qualityCheck->structure_score,
                'originality_score' => $qualityCheck->originality_score,
                'status' => $qualityCheck->status,
                'validated_at' => now()->toIso8601String(),
            ], JSON_PRETTY_PRINT);

            // Status automatique basé sur résultat validation
            if ($qualityCheck->status === 'failed' || $qualityCheck->overall_score < 70) {
                $article->status = 'review_needed';
                
                Log::warning("Comparative #{$article->id} nécessite review", [
                    'overall_score' => $qualityCheck->overall_score,
                    'status' => $qualityCheck->status,
                ]);
            } elseif ($qualityCheck->status === 'warning') {
                $article->status = 'pending';
            } else {
                $article->status = 'draft';
                
                Log::info("Comparative #{$article->id} conforme", [
                    'overall_score' => $qualityCheck->overall_score,
                ]);
            }

            $article->save();

            // Auto-marking golden examples si score ≥90
            if ($qualityCheck->overall_score >= 90) {
                $this->qualityEnforcer->autoMarkAsGolden($article);
            }
            // ========== FIN VALIDATION PHASE 13 ==========

            // 15. Sauvegarde FAQs
            foreach ($faqs as $index => $faq) {
                ArticleFaq::create([
                    'article_id' => $article->id,
                    'question' => $faq['question'],
                    'answer' => $faq['answer'],
                    'order' => $index + 1,
                ]);
            }

            DB::commit();

            $this->stats['end_time'] = microtime(true);
            $this->stats['duration_seconds'] = round(
                $this->stats['end_time'] - $this->stats['start_time'],
                2
            );

            Log::info('Article comparatif généré avec succès', [
                'article_id' => $article->id,
                'word_count' => $wordCount,
                'competitors' => $competitorsCount,
                'quality_score' => $article->quality_score,
                'duration' => $this->stats['duration_seconds'] . 's',
                'cost' => '$' . number_format($this->stats['total_cost'], 4),
            ]);

            return $article->fresh(['country', 'language', 'platform', 'faqs']);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Erreur génération article comparatif', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'params' => $params,
            ]);
            
            throw $e;
        }
    }

    /**
     * Générer tableau comparatif avec scores et couleurs
     * 
     * @param array  $competitors Liste des concurrents avec scores
     * @param array  $criteria    Critères de comparaison
     * @param string $languageCode Code langue
     * @return string HTML du tableau
     */
    public function generateComparativeTable(
        array $competitors,
        array $criteria,
        string $languageCode
    ): string {
        return $this->chartGenerator->generateComparisonTableHtml(
            $competitors,
            $criteria,
            $languageCode
        );
    }

    /**
     * Générer graphique en barres horizontales (SVG)
     * 
     * @param array  $competitors Liste des concurrents
     * @param string $languageCode Code langue
     * @return string SVG du graphique
     */
    public function generateBarChart(array $competitors, string $languageCode): string
    {
        return $this->chartGenerator->generateBarChartSvg(
            $competitors,
            $languageCode
        );
    }

    /**
     * Générer données pour graphique radar (Chart.js)
     * 
     * @param array $competitors Liste des concurrents
     * @param array $criteria    Critères de comparaison
     * @return array Configuration Chart.js
     */
    public function generateRadarChart(array $competitors, array $criteria): array
    {
        $datasets = [];
        
        foreach ($competitors as $index => $competitor) {
            $datasets[] = [
                'label' => $competitor['name'],
                'data' => array_values($competitor['scores']),
                'backgroundColor' => $this->getRadarColor($index, 0.2),
                'borderColor' => $this->getRadarColor($index, 1),
                'borderWidth' => 2,
            ];
        }

        return [
            'type' => 'radar',
            'data' => [
                'labels' => array_column($criteria, 'name'),
                'datasets' => $datasets,
            ],
            'options' => [
                'scales' => [
                    'r' => [
                        'beginAtZero' => true,
                        'max' => 10,
                    ],
                ],
                'plugins' => [
                    'legend' => [
                        'position' => 'bottom',
                    ],
                ],
            ],
        ];
    }

    /**
     * Générer podium 🥇🥈🥉 avec CTA vers plateforme
     * 
     * @param array  $topThree      Top 3 prestataires
     * @param bool   $withCta       Inclure CTA vers plateforme
     * @param string $languageCode  Code langue
     * @param string $platformName  Nom de la plateforme
     * @return string HTML du podium
     */
    public function generatePodium(
        array $topThree,
        bool $withCta,
        string $languageCode,
        string $platformName = 'Ulixai.com'
    ): string {
        $medals = ['🥇', '🥈', '🥉'];
        $positions = [
            'fr' => ['1er', '2ème', '3ème'],
            'en' => ['1st', '2nd', '3rd'],
            'de' => ['1.', '2.', '3.'],
            'es' => ['1º', '2º', '3º'],
            'pt' => ['1º', '2º', '3º'],
            'ru' => ['1-е', '2-е', '3-е'],
            'zh' => ['第1', '第2', '第3'],
            'ar' => ['الأول', 'الثاني', 'الثالث'],
            'hi' => ['पहला', 'दूसरा', 'तीसरा'],
        ];

        $html = '<div class="podium-container">';
        $html .= '<h2>' . $this->getTranslation('our_top_3', $languageCode) . '</h2>';
        $html .= '<div class="podium-grid">';

        foreach ($topThree as $index => $competitor) {
            $position = $index + 1;
            $medal = $medals[$index];
            $positionText = $positions[$languageCode][$index] ?? ($position . 'th');

            $html .= '<div class="podium-item podium-rank-' . $position . '">';
            $html .= '<div class="podium-medal">' . $medal . '</div>';
            $html .= '<div class="podium-position">' . $positionText . '</div>';
            $html .= '<h3>' . htmlspecialchars($competitor['name']) . '</h3>';
            $html .= '<div class="podium-score">';
            $html .= $this->getTranslation('overall_score', $languageCode) . ': ';
            $html .= '<strong>' . number_format($competitor['overall_score'], 1) . '/10</strong>';
            $html .= '</div>';
            
            if ($withCta) {
                $html .= '<a href="/prestataires/' . ($competitor['slug'] ?? '#') . '" ';
                $html .= 'class="btn-primary">';
                $html .= str_replace('{platform}', $platformName, 
                    $this->getTranslation('contact_on_platform', $languageCode));
                $html .= '</a>';
            }
            
            $html .= '</div>';
        }

        $html .= '</div>';
        $html .= '</div>';

        return $html;
    }

    /**
     * Générer section détaillée H2 pour un concurrent
     * 
     * @param array  $competitor    Données concurrent
     * @param int    $rank          Classement
     * @param string $serviceType   Type de service
     * @param string $languageCode  Code langue
     * @return string HTML de la section
     */
    public function generateElementSection(
        array $competitor,
        int $rank,
        string $serviceType,
        string $languageCode
    ): string {
        $prompt = $this->buildElementSectionPrompt(
            $competitor,
            $rank,
            $serviceType,
            $languageCode
        );

        $response = $this->gpt->chat([
            'model' => GptService::MODEL_GPT4O,
            'messages' => [
                [
                    'role' => 'system',
                    'content' => $this->getSystemPrompt($languageCode),
                ],
                [
                    'role' => 'user',
                    'content' => $prompt,
                ],
            ],
            'temperature' => 0.7,
            'max_tokens' => 800,
        ]);

        $this->stats['total_cost'] += $response['cost'];

        $html = '<section class="competitor-section">';
        $html .= '<h2>' . $rank . '. ' . htmlspecialchars($competitor['name']) . '</h2>';
        $html .= ContentHelper::cleanHtml($response['content']);
        
        // Ajouter points forts/faibles
        $html .= $this->generateProsConsSection($competitor, $languageCode);
        
        $html .= '</section>';

        return $html;
    }

    // =========================================================================
    // MÉTHODES PRIVÉES - GÉNÉRATION CONTENU
    // =========================================================================

    /**
     * Générer introduction
     */
    private function generateIntroduction(array $params): string
    {
        $competitorsCount = count($params['competitors']);
        
        $prompt = <<<PROMPT
Rédige une introduction engageante pour un article comparatif de PLATEFORMES pour expatriés en {$params['country']}.

Contexte : Nous comparons {$params['platform_name']} avec {$competitorsCount} autres plateformes concurrentes.

Éléments à inclure :
1. Contexte : Pourquoi ce comparatif est utile pour les expatriés
2. Méthodologie : Comment les plateformes ont été évaluées (couverture mondiale, support multilingue, prestataires vérifiés)
3. Promesse : Ce que le lecteur va découvrir sur {$params['platform_name']} vs les alternatives

Longueur : 100-150 mots
Langue : {$params['language_code']}
Ton : Professionnel, objectif, informatif
IMPORTANT : Mentionner que {$params['platform_name']} se distingue par sa couverture exceptionnelle
PROMPT;

        // ✅ ENRICHISSEMENT AVEC GOLDEN EXAMPLES (PHASE 13)
        if (isset($params['platform'])) {
            $goldenExamples = $this->goldenService->getExamplesForContext(
                $params['platform'],
                'comparative',
                $params['language_code'],
                'intro',
                null,
                3
            );

            if (count($goldenExamples) >= 2) {
                $prompt = $this->goldenService->enrichPromptWithExamples($prompt, $goldenExamples);
                
                Log::info('Prompt enrichi avec golden examples (intro comparative)', [
                    'count' => count($goldenExamples),
                    'platform' => $params['platform']->slug,
                ]);
            }
        }

        $response = $this->gpt->chat([
            'model' => GptService::MODEL_GPT4O_MINI,
            'messages' => [
                ['role' => 'system', 'content' => $this->getSystemPrompt($params['language_code'])],
                ['role' => 'user', 'content' => $prompt],
            ],
            'temperature' => 0.7,
            'max_tokens' => 300,
        ]);

        $this->stats['gpt_calls']++;
        $this->stats['total_cost'] += $response['cost'];

        return ContentHelper::cleanHtml($response['content']);
    }

    /**
     * Générer section points forts/faibles
     */
    private function generateProsConsSection(array $competitor, string $languageCode): string
    {
        $html = '<div class="pros-cons-container">';
        
        // Points forts
        $html .= '<div class="pros">';
        $html .= '<h3>✅ ' . $this->getTranslation('pros', $languageCode) . '</h3>';
        $html .= '<ul>';
        foreach ($competitor['pros'] as $pro) {
            $html .= '<li>' . htmlspecialchars($pro) . '</li>';
        }
        $html .= '</ul>';
        $html .= '</div>';
        
        // Points faibles
        $html .= '<div class="cons">';
        $html .= '<h3>❌ ' . $this->getTranslation('cons', $languageCode) . '</h3>';
        $html .= '<ul>';
        foreach ($competitor['cons'] as $con) {
            $html .= '<li>' . htmlspecialchars($con) . '</li>';
        }
        $html .= '</ul>';
        $html .= '</div>';
        
        $html .= '</div>';

        return $html;
    }

    /**
     * Générer FAQ spécifique aux comparatifs
     */
    private function generateComparativeFaqs(array $params): array
    {
        $competitorsCount = count($params['competitors']);
        
        // Construire exemple de comparaison uniquement s'il y a au moins 2 concurrents
        $comparisonExample = '';
        if ($competitorsCount >= 2) {
            $comparisonExample = "- Comment choisir entre {$params['competitors'][0]['name']} et {$params['competitors'][1]['name']} ?\n";
        }
        
        $prompt = <<<PROMPT
Génère {$this->config['faqs_count']} questions-réponses pour un comparatif sur "{$params['service_type']}" en {$params['country']}.

Questions types :
- Quel est le meilleur {$params['service_type']} pour [cas d'usage] ?
{$comparisonExample}- Quel est le moins cher / le plus complet / le plus rapide ?
- Y a-t-il des options gratuites ?

Réponds en JSON :
{
    "faqs": [
        {"question": "...", "answer": "..."},
        ...
    ]
}
PROMPT;

        // ✅ ENRICHISSEMENT AVEC GOLDEN EXAMPLES (PHASE 13)
        if (isset($params['platform_id'])) {
            $platform = Platform::find($params['platform_id']);
            if ($platform) {
                $goldenExamples = $this->goldenService->getExamplesForContext(
                    $platform,
                    'comparative',
                    $params['language_code'],
                    'faq',
                    null,
                    3
                );

                if (count($goldenExamples) >= 2) {
                    $prompt = $this->goldenService->enrichPromptWithExamples($prompt, $goldenExamples);
                    
                    Log::info('Prompt enrichi avec golden examples (faq comparative)', [
                        'count' => count($goldenExamples),
                        'platform' => $platform->slug,
                    ]);
                }
            }
        }

        $response = $this->gpt->chat([
            'model' => GptService::MODEL_GPT4O_MINI,
            'messages' => [
                ['role' => 'system', 'content' => $this->getSystemPrompt($params['language_code'])],
                ['role' => 'user', 'content' => $prompt],
            ],
            'temperature' => 0.6,
            'max_tokens' => 1500,
        ]);

        $this->stats['gpt_calls']++;
        $this->stats['total_cost'] += $response['cost'];

        $parsed = json_decode($response['content'], true);
        return $parsed['faqs'] ?? [];
    }

    /**
     * Générer conclusion
     */
    private function generateConclusion(array $params): string
    {
        $prompt = <<<PROMPT
Rédige une conclusion pour un comparatif de plateformes pour expatriés en {$params['country']}.

Éléments :
1. Récapitulatif : La plateforme recommandée n°1 est {$params['top_competitor']['name']}
2. Avantage plateforme : Souligner que {$params['platform_name']} se distingue par sa couverture mondiale (197 pays), son support multilingue (9 langues) et ses prestataires vérifiés
3. CTA : Invitation à utiliser {$params['platform_name']} pour bénéficier de ces avantages

Longueur : 80-100 mots
Langue : {$params['language_code']}
Ton : Encourageant, mettant en valeur la plateforme
PROMPT;

        $response = $this->gpt->chat([
            'model' => GptService::MODEL_GPT4O_MINI,
            'messages' => [
                ['role' => 'system', 'content' => $this->getSystemPrompt($params['language_code'])],
                ['role' => 'user', 'content' => $prompt],
            ],
            'temperature' => 0.7,
            'max_tokens' => 200,
        ]);

        $this->stats['gpt_calls']++;
        $this->stats['total_cost'] += $response['cost'];

        return ContentHelper::cleanHtml($response['content']);
    }

    // =========================================================================
    // MÉTHODES PRIVÉES - HELPERS
    // =========================================================================

    /**
     * Assembler le contenu HTML complet
     */
    private function assembleComparativeContent(array $sections): string
    {
        $html = '';
        
        $html .= $sections['introduction'];
        $html .= $sections['comparison_table'];
        $html .= $sections['bar_chart'];
        $html .= $sections['podium'];
        
        foreach ($sections['detailed_sections'] as $section) {
            $html .= $section;
        }
        
        // Insérer graphique radar en JSON dans un attribut data
        $html .= '<div class="radar-chart-container" ';
        $html .= 'data-chart-config=\'' . json_encode($sections['radar_chart']) . '\'>';
        $html .= '<canvas id="radarChart"></canvas>';
        $html .= '</div>';
        
        $html .= $sections['conclusion'];

        return $html;
    }

    /**
     * Construire prompt pour section concurrent
     */
    private function buildElementSectionPrompt(
        array $competitor,
        int $rank,
        string $serviceType,
        string $languageCode
    ): string {
        return <<<PROMPT
Rédige une section détaillée sur "{$competitor['name']}" (classé #{$rank}) pour un comparatif de {$serviceType}.

Informations disponibles :
- Score global : {$competitor['overall_score']}/10
- Prix : {$competitor['price']}
- Description : {$competitor['description']}

Structure :
1. Présentation générale (2-3 phrases)
2. Caractéristiques principales (liste)
3. Pour qui c'est adapté (2-3 phrases)

Longueur : 200-400 mots
Langue : {$languageCode}
Ton : Objectif, informatif, sans exagération
PROMPT;
    }

    /**
     * Obtenir prompt système selon la langue
     */
    private function getSystemPrompt(string $languageCode): string
    {
        return "Tu es un expert en rédaction d'articles comparatifs pour expatriés. " .
            "Tu rédiges en {$languageCode} de manière objective, précise et utile. " .
            "Tu évites le marketing agressif et restes factuel.";
    }

    /**
     * Obtenir couleur pour graphique radar
     */
    private function getRadarColor(int $index, float $opacity = 1): string
    {
        $colors = [
            'rgba(54, 162, 235, ' . $opacity . ')',  // Bleu
            'rgba(255, 99, 132, ' . $opacity . ')',  // Rouge
            'rgba(75, 192, 192, ' . $opacity . ')',  // Vert
            'rgba(255, 206, 86, ' . $opacity . ')',  // Jaune
            'rgba(153, 102, 255, ' . $opacity . ')', // Violet
            'rgba(255, 159, 64, ' . $opacity . ')',  // Orange
        ];

        return $colors[$index % count($colors)];
    }

    /**
     * Obtenir traduction selon langue
     */
    private function getTranslation(string $key, string $languageCode): string
    {
        $translations = [
            'our_top_3' => [
                'fr' => 'Notre Top 3',
                'en' => 'Our Top 3',
                'de' => 'Unsere Top 3',
                'es' => 'Nuestro Top 3',
                'pt' => 'Nosso Top 3',
                'ru' => 'Наш Топ 3',
                'zh' => '我们的前3名',
                'ar' => 'أفضل 3 لدينا',
                'hi' => 'हमारे शीर्ष 3',
            ],
            'overall_score' => [
                'fr' => 'Note globale',
                'en' => 'Overall score',
                'de' => 'Gesamtbewertung',
                'es' => 'Puntuación global',
                'pt' => 'Pontuação geral',
                'ru' => 'Общая оценка',
                'zh' => '总分',
                'ar' => 'النتيجة الإجمالية',
                'hi' => 'कुल स्कोर',
            ],
            'see_offer' => [
                'fr' => 'Voir l\'offre',
                'en' => 'See offer',
                'de' => 'Angebot ansehen',
                'es' => 'Ver oferta',
                'pt' => 'Ver oferta',
                'ru' => 'Смотреть предложение',
                'zh' => '查看优惠',
                'ar' => 'انظر العرض',
                'hi' => 'ऑफ़र देखें',
            ],
            'contact_on_platform' => [
                'fr' => 'Contacter sur {platform}',
                'en' => 'Contact on {platform}',
                'de' => 'Kontakt auf {platform}',
                'es' => 'Contactar en {platform}',
                'pt' => 'Contatar em {platform}',
                'ru' => 'Связаться на {platform}',
                'zh' => '在{platform}上联系',
                'ar' => 'اتصل على {platform}',
                'hi' => '{platform} पर संपर्क करें',
            ],
            'pros' => [
                'fr' => 'Points forts',
                'en' => 'Pros',
                'de' => 'Vorteile',
                'es' => 'Ventajas',
                'pt' => 'Vantagens',
                'ru' => 'Преимущества',
                'zh' => '优点',
                'ar' => 'المزايا',
                'hi' => 'फायदे',
            ],
            'cons' => [
                'fr' => 'Points faibles',
                'en' => 'Cons',
                'de' => 'Nachteile',
                'es' => 'Desventajas',
                'pt' => 'Desvantagens',
                'ru' => 'Недостатки',
                'zh' => '缺点',
                'ar' => 'العيوب',
                'hi' => 'नुकसान',
            ],
        ];

        return $translations[$key][$languageCode] ?? $translations[$key]['en'];
    }

    /**
     * Valider paramètres
     */
    private function validateParams(array $params): void
    {
        $required = ['platform_id', 'country_id', 'language_code', 'service_type'];
        
        foreach ($required as $field) {
            if (empty($params[$field])) {
                throw new \InvalidArgumentException("Le champ {$field} est requis");
            }
        }

        if (isset($params['competitors_count'])) {
            $count = $params['competitors_count'];
            if ($count < $this->config['competitors_min'] || $count > $this->config['competitors_max']) {
                throw new \InvalidArgumentException(
                    "competitors_count doit être entre {$this->config['competitors_min']} et {$this->config['competitors_max']}"
                );
            }
        }
    }

    /**
     * Générer excerpt
     */
    private function generateExcerpt(string $introduction): string
    {
        $text = ContentHelper::extractText($introduction);
        return mb_substr($text, 0, 160);
    }

    /**
     * Générer meta title
     */
    private function generateMetaTitle(string $title): string
    {
        return mb_substr($title, 0, 60);
    }

    /**
     * Générer meta description
     */
    private function generateMetaDescription(string $title, string $country): string
    {
        return mb_substr(
            "Comparatif complet : {$title} en {$country}. Tableaux, scores, avantages/inconvénients pour faire le meilleur choix.",
            0,
            160
        );
    }

    /**
     * Calculer coût total
     */
    private function calculateTotalCost(): float
    {
        return round($this->stats['total_cost'], 4);
    }

    /**
     * Obtenir statistiques
     */
    public function getStats(): array
    {
        return $this->stats;
    }

    /**
     * Traduire automatiquement le type de service dans la langue cible
     * 
     * Utilise GPT pour traduire le service_type de n'importe quelle langue
     * vers la langue de l'article. Permet de maintenir la cohérence linguistique
     * dans les titres même si l'utilisateur tape le service en français.
     * 
     * @param string $serviceType Service à traduire (ex: "Traducteurs", "Développeurs web")
     * @param string $languageCode Code langue cible (ex: "en", "pt", "de")
     * @return string Service traduit (ex: "Translators", "Desenvolvedores web")
     */
    private function translateServiceType(string $serviceType, string $languageCode): string
    {
        // Si déjà en français et on veut du français, pas de traduction
        if ($languageCode === 'fr') {
            return $serviceType;
        }

        // Mapping des noms de langues
        $languageNames = [
            'en' => 'English',
            'fr' => 'French',
            'de' => 'German',
            'es' => 'Spanish',
            'pt' => 'Portuguese',
            'ru' => 'Russian',
            'zh' => 'Chinese (Simplified)',
            'ar' => 'Arabic',
            'hi' => 'Hindi',
        ];

        $targetLanguage = $languageNames[$languageCode] ?? 'English';

        $prompt = "Translate this service type to {$targetLanguage}: \"{$serviceType}\"

IMPORTANT:
- Only respond with the translated service name
- Keep it natural and professional
- Use the most common term for this profession
- Do not add any explanation or punctuation

Example:
Input: \"Développeurs web\" to English
Output: Web developers";

        try {
            $response = $this->gpt->chat([
                'model' => GptService::MODEL_GPT4O_MINI,
                'messages' => [
                    ['role' => 'system', 'content' => 'You are a professional translator. Respond only with the translation, nothing else.'],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'temperature' => 0.1,
                'max_tokens' => 30,
            ]);

            $this->stats['gpt_calls']++;
            $this->stats['total_cost'] += $response['cost'] ?? 0;

            $translated = trim($response['content']);

            // Sécurité : si la traduction est vide ou trop longue, garder l'original
            if (empty($translated) || strlen($translated) > 100) {
                Log::warning('Translation failed or invalid, using original', [
                    'original' => $serviceType,
                    'translated' => $translated,
                ]);
                return $serviceType;
            }

            return $translated;

        } catch (\Exception $e) {
            Log::error('Service type translation failed', [
                'service_type' => $serviceType,
                'language' => $languageCode,
                'error' => $e->getMessage(),
            ]);
            
            // En cas d'erreur, garder le service original
            return $serviceType;
        }
    }
}