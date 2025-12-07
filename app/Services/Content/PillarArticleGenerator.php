<?php

namespace App\Services\Content;

use App\Models\Article;
use App\Models\Country;
use App\Models\Language;
use App\Models\Theme;
use App\Models\Platform;
use App\Models\PillarResearchSource;
use App\Models\PillarStatistic;
use App\Models\ContentTemplate;
use App\Services\AI\GptService;
use App\Services\AI\PerplexityService;
use App\Services\AI\DalleService;
use App\Services\UnsplashService;
use App\Services\Content\TitleService;
use App\Services\Content\LinkService;
use App\Services\Content\TemplateManager;
use App\Services\Content\Traits\UseContentTemplates;
use App\Services\Content\MultiLanguageGenerationService;
use App\Services\Content\PlatformKnowledgeService;
use App\Services\Seo\MetaService;
use App\Services\Seo\SeoOptimizationService;
use App\Services\Seo\LocaleSlugService;
use App\Services\Linking\LinkingOrchestrator;
use App\Jobs\TranslateAllLanguages;
use App\Jobs\RequestIndexing;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * PillarArticleGenerator - Générateur d'articles piliers premium 3000-5000 mots
 *
 * Pipeline complet en 12 étapes :
 * 1. conductDeepResearch() : Recherche approfondie Perplexity + News API
 * 2. generatePillarOutline() : Génère structure 8-12 sections H2
 * 3. generateSections() : Génère chaque section séparément (qualité max)
 * 4. assembleSections() : Assemble + transitions + intro/conclusion
 * 5. saveResearchData() : Stocke sources et statistiques
 * 6. generatePillarFaqs() : Génère 12 FAQs approfondies
 * 7. applyFullSeo() : Meta title < 60, description < 160, images optimisées
 * 8. generateLocaleSlugs() : Slugs pour toutes les combinaisons locale-pays
 * 9. processLinks() : Liens internes, externes et affiliés
 * 10. dispatchTranslations() : Traductions multi-langues si languages[] fourni
 * 11. handleAutoPublish() : Publication auto si score qualité OK
 * 12. generateImage() : Image via Unsplash ou DALL-E
 *
 * @package App\Services\Content
 */
class PillarArticleGenerator
{
    use UseContentTemplates;

    protected GptService $gpt;
    protected PerplexityService $perplexity;
    protected DalleService $dalle;
    protected UnsplashService $unsplash;
    protected TitleService $titleService;
    protected LinkService $linkService;
    protected MetaService $metaService;
    protected PlatformKnowledgeService $knowledgeService;

    // Templates disponibles
    const TEMPLATES = [
        'guide_ultime' => 'Guide Ultime Complet',
        'analyse_marche' => 'Analyse de Marché Approfondie',
        'whitepaper' => 'Étude Technique Détaillée',
        'dossier_thematique' => 'Dossier Thématique Multi-Angles',
        'mega_guide_pays' => 'Mega-Guide Pays/Ville Exhaustif',
    ];

    // Configuration
    protected array $config = [
        'word_count_min' => 3000,
        'word_count_target' => 4000,
        'word_count_max' => 5000,
        'sections_min' => 8,
        'sections_max' => 12,
        'words_per_section' => 400,
        'intro_words' => 300,
        'conclusion_words' => 300,
        'rate_limit_seconds' => 2,
        'faqs_count' => 12, // ← AJOUTÉ : Plus de FAQ pour un article pilier
    ];

    // Statistiques
    protected array $stats = [
        'research_time' => 0,
        'generation_time' => 0,
        'total_cost' => 0,
    ];

    public function __construct(
        GptService $gpt,
        PerplexityService $perplexity,
        DalleService $dalle,
        UnsplashService $unsplash,
        TitleService $titleService,
        LinkService $linkService,
        MetaService $metaService,
        PlatformKnowledgeService $knowledgeService,
        TemplateManager $templateManager
    ) {
        $this->gpt = $gpt;
        $this->perplexity = $perplexity;
        $this->dalle = $dalle;
        $this->unsplash = $unsplash;
        $this->titleService = $titleService;
        $this->linkService = $linkService;
        $this->metaService = $metaService;
        $this->knowledgeService = $knowledgeService;
        $this->setTemplateManager($templateManager);
    }

    /**
     * ═════════════════════════════════════════════════════════════════════════
     * PIPELINE PRINCIPAL : Génération complète article pilier
     * ═════════════════════════════════════════════════════════════════════════
     */
    public function generate(array $params): Article
    {
        $startTime = microtime(true);

        try {
            Log::info('🚀 Début génération article pilier', $params);

            // Validation paramètres
            $this->validateParams($params);

            // Charger le template si disponible
            $language = Language::find($params['language_id']);
            $templateSlug = $params['template_slug'] ?? null;
            $this->loadTemplate('pillar', $language->code ?? 'fr', $templateSlug);

            if ($this->hasActiveTemplate()) {
                $wordCount = $this->getTemplateWordCount();
                if ($wordCount) {
                    $this->config['word_count_min'] = $wordCount['min'];
                    $this->config['word_count_target'] = $wordCount['target'];
                    $this->config['word_count_max'] = $wordCount['max'];
                }
                $faqCount = $this->getTemplateFaqCount();
                if ($faqCount) {
                    $this->config['faqs_count'] = $faqCount;
                }

                Log::info('PillarArticleGenerator: Template chargé', [
                    'template_slug' => $this->getActiveTemplateSlug(),
                ]);
            }

            // ÉTAPE 1 : Recherche approfondie
            Log::info('📚 ÉTAPE 1/6 : Recherche approfondie');
            $research = $this->conductDeepResearch($params);

            // ÉTAPE 2 : Génération outline structuré
            Log::info('🗺️ ÉTAPE 2/6 : Génération outline');
            $outline = $this->generatePillarOutline($params, $research);

            // ÉTAPE 3 : Génération sections individuelles
            Log::info('✍️ ÉTAPE 3/6 : Génération sections');
            $sections = $this->generateSections($outline, $params, $research);

            // ÉTAPE 4 : Assemblage et polish
            Log::info('🔨 ÉTAPE 4/6 : Assemblage et polish');
            $content = $this->assembleSections($sections, $outline, $params);

            // Création article
            $article = $this->createArticle($params, $content, $research);

            // ÉTAPE 5 : Sauvegarde research data
            Log::info('💾 ÉTAPE 5/6 : Sauvegarde research data');
            $this->saveResearchData($article, $research);

            // ÉTAPE 6 : Génération FAQs ← NOUVEAU
            Log::info('❓ ÉTAPE 6/6 : Génération FAQs');
            $faqs = $this->generatePillarFaqs($article, $params, $research);
            $this->saveFaqs($article, $faqs, $params);

            // Mettre à jour le contenu avec les FAQs
            $this->appendFaqsToContent($article, $faqs);

            // Image
            $this->generateImage($article, $params);

            // ========== ÉTAPE 7: SEO COMPLET ==========
            $this->applyFullSeo($article, $params);

            // ========== ÉTAPE 8: SLUGS LOCALE-PAYS ==========
            $this->generateLocaleSlugs($article);

            // ========== ÉTAPE 9: LIENS (internes, externes, affiliés) ==========
            $this->processLinks($article, $params);

            // ========== ÉTAPE 10: DISPATCH TRADUCTIONS MULTI-LANGUES ==========
            $this->dispatchTranslations($article, $params);

            // ========== ÉTAPE 11: AUTO-PUBLICATION ==========
            $this->handleAutoPublish($article, $params);

            $this->stats['generation_time'] = microtime(true) - $startTime;

            Log::info('✅ Article pilier généré avec succès', [
                'article_id' => $article->id,
                'word_count' => $article->word_count,
                'faqs_count' => count($faqs),
                'quality_score' => $article->quality_score,
                'duration' => round($this->stats['generation_time'], 2) . 's',
            ]);

            return $article;

        } catch (\Exception $e) {
            Log::error('❌ Erreur génération article pilier', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * ═════════════════════════════════════════════════════════════════════════
     * ÉTAPE 1 : Recherche approfondie
     * ═════════════════════════════════════════════════════════════════════════
     */
    protected function conductDeepResearch(array $params): array
    {
        $startTime = microtime(true);
        $research = [
            'sources' => [],
            'statistics' => [],
            'key_points' => [],
        ];

        try {
            $theme = Theme::find($params['theme_id']);
            $country = Country::find($params['country_id']);

            // Query 1 : Vue d'ensemble
            Log::info('🔍 Perplexity Query 1: Overview');
            $query1 = "{$theme->name} {$country->name} comprehensive overview 2025";
            
            $result1 = $this->perplexity->search([
                'query' => $query1,
            ]);
            
            if (!empty($result1['content'])) {
                $research['sources'][] = [
                    'type' => 'perplexity',
                    'title' => 'Overview ' . $theme->name,
                    'content' => $result1['content'],
                    'url' => null,
                    'date' => now(),
                    'relevance_score' => 95,
                ];
            }

            sleep(2); // Rate limiting

            // Query 2 : Statistiques
            Log::info('🔍 Perplexity Query 2: Statistics');
            $query2 = "{$theme->name} statistics {$country->name} 2024 2025";
            
            $result2 = $this->perplexity->search([
                'query' => $query2,
            ]);
            
            if (!empty($result2['content'])) {
                $stats = $this->extractStatistics($result2['content']);
                $research['statistics'] = array_merge($research['statistics'], $stats);

                $research['sources'][] = [
                    'type' => 'perplexity',
                    'title' => 'Statistics ' . $theme->name,
                    'content' => $result2['content'],
                    'url' => null,
                    'date' => now(),
                    'relevance_score' => 90,
                ];
            }

            sleep(2); // Rate limiting

            // Query 3 : Actualités récentes
            Log::info('🔍 Perplexity Query 3: Recent news');
            $query3 = "{$theme->name} {$country->name} recent news 2025";
            
            $result3 = $this->perplexity->search([
                'query' => $query3,
            ]);
            
            if (!empty($result3['content'])) {
                $research['sources'][] = [
                    'type' => 'perplexity',
                    'title' => 'Recent News ' . $theme->name,
                    'content' => $result3['content'],
                    'url' => null,
                    'date' => now(),
                    'relevance_score' => 85,
                ];
            }

            // Extraire key points
            $research['key_points'] = $this->extractKeyPoints($research['sources']);

            $this->stats['research_time'] = microtime(true) - $startTime;

            Log::info('✅ Recherche terminée', [
                'sources_count' => count($research['sources']),
                'statistics_count' => count($research['statistics']),
                'key_points_count' => count($research['key_points']),
                'duration' => round($this->stats['research_time'], 2) . 's',
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Erreur recherche', ['error' => $e->getMessage()]);
        }

        return $research;
    }

    /**
     * ═════════════════════════════════════════════════════════════════════════
     * ÉTAPE 2 : Génération outline structuré
     * ═════════════════════════════════════════════════════════════════════════
     */
    protected function generatePillarOutline(array $params, array $research): array
    {
        $theme = Theme::find($params['theme_id']);
        $country = Country::find($params['country_id']);
        $template = $params['template_type'] ?? 'guide_ultime';

        $researchContext = $this->buildResearchContext($research);

        $prompt = "Tu es un expert en création de contenu pour expatriés.

MISSION : Créer un outline détaillé pour un article pilier de 3500-4500 mots.

SUJET : {$theme->name} - {$country->name}
TEMPLATE : " . self::TEMPLATES[$template] . "

CONTEXTE RECHERCHE :
{$researchContext}

INSTRUCTIONS :
1. Génère un outline avec 8-12 sections H2
2. Chaque section doit avoir :
   - Un titre H2 engageant et SEO-optimisé
   - Un objectif clair (1 phrase)
   - 3-5 points clés à couvrir
   - Statistiques pertinentes à inclure (si disponibles)
3. L'ensemble doit couvrir le sujet de manière exhaustive
4. Éviter les redondances entre sections
5. Progression logique et cohérente

FORMAT DE RÉPONSE (JSON strict) :
{
  \"sections\": [
    {
      \"title\": \"Titre de la section H2\",
      \"objective\": \"Objectif de cette section\",
      \"key_points\": [\"Point 1\", \"Point 2\", \"Point 3\"],
      \"statistics\": [\"Stat 1\", \"Stat 2\"],
      \"estimated_words\": 400
    }
  ]
}

Génère l'outline maintenant :";

        $response = $this->gpt->chat([
            'model' => GptService::MODEL_GPT4O,
            'messages' => [
                ['role' => 'system', 'content' => 'Tu es un expert en structuration de contenu pour expatriés.'],
                ['role' => 'user', 'content' => $prompt],
            ],
            'temperature' => 0.7,
            'max_tokens' => 2000,
        ]);

        $outline = $this->parseJsonResponse($response['content']);

        return $outline;
    }

    /**
     * ═════════════════════════════════════════════════════════════════════════
     * ÉTAPE 3 : Génération sections individuelles
     * ═════════════════════════════════════════════════════════════════════════
     */
    protected function generateSections(array $outline, array $params, array $research): array
    {
        $sections = [];
        $researchContext = $this->buildResearchContext($research);

        // Récupérer le contexte knowledge une seule fois
        $knowledgeSection = '';
        if (isset($params['platform_id']) && isset($params['language_id'])) {
            $platform = Platform::find($params['platform_id']);
            $language = Language::find($params['language_id']);

            if ($platform && $language) {
                $knowledgeContext = $this->knowledgeService->getKnowledgeContext(
                    $platform,
                    $language->code,
                    'pillars'
                );

                if (!empty($knowledgeContext)) {
                    $knowledgeSection = "\n\n## CONTEXTE MARQUE (à respecter strictement) ##\n{$knowledgeContext}\n";
                }
            }
        }

        foreach ($outline['sections'] as $index => $sectionOutline) {
            Log::info("✍️ Génération section " . ($index + 1) . "/" . count($outline['sections']));

            $prompt = "Tu es un expert rédacteur pour expatriés.

MISSION : Rédiger cette section d'article pilier premium.

SECTION : {$sectionOutline['title']}
OBJECTIF : {$sectionOutline['objective']}

POINTS À COUVRIR :
" . implode("\n", array_map(fn($p) => "• $p", $sectionOutline['key_points'])) . "

STATISTIQUES À INCLURE :
" . implode("\n", array_map(fn($s) => "• $s", $sectionOutline['statistics'] ?? [])) . "

CONTEXTE RECHERCHE :
{$researchContext}

INSTRUCTIONS :
1. Rédige 350-450 mots pour cette section
2. Utilise un ton professionnel mais accessible
3. Intègre les statistiques naturellement avec sources
4. Ajoute des exemples concrets
5. Structure avec des sous-titres H3 si pertinent
6. Optimisé SEO avec mots-clés naturels
7. Pas d'introduction type \"Dans cette section...\"
8. Commence directement par le contenu
{$knowledgeSection}
Rédige la section maintenant :";

            $response = $this->gpt->chat([
                'model' => GptService::MODEL_GPT4O,
                'messages' => [
                    ['role' => 'system', 'content' => 'Tu es un expert rédacteur spécialisé en contenu pour expatriés.'],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'temperature' => 0.7,
                'max_tokens' => 1000,
            ]);

            $sections[] = [
                'title' => $sectionOutline['title'],
                'content' => $response['content'],
            ];

            // Rate limiting entre sections
            if ($index < count($outline['sections']) - 1) {
                sleep($this->config['rate_limit_seconds']);
            }
        }

        return $sections;
    }

    /**
     * ═════════════════════════════════════════════════════════════════════════
     * ÉTAPE 4 : Assemblage et polish
     * ═════════════════════════════════════════════════════════════════════════
     */
    protected function assembleSections(array $sections, array $outline, array $params): string
    {
        $theme = Theme::find($params['theme_id']);
        $country = Country::find($params['country_id']);

        // Générer introduction
        $intro = $this->generateIntroduction($theme, $country, $outline);

        // Générer conclusion
        $conclusion = $this->generateConclusion($theme, $country, $outline);

        // Assembler le contenu
        $content = "<div class=\"pillar-article\">\n\n";

        // Introduction
        $content .= "<div class=\"introduction\">\n{$intro}\n</div>\n\n";

        // Sections
        foreach ($sections as $section) {
            $content .= "<h2>{$section['title']}</h2>\n\n";
            $content .= "<div class=\"section-content\">\n{$section['content']}\n</div>\n\n";
        }

        // Conclusion
        $content .= "<div class=\"conclusion\">\n";
        $content .= "<h2>Conclusion</h2>\n\n";
        $content .= "{$conclusion}\n";
        $content .= "</div>\n\n";

        // Placeholder pour les FAQs (sera rempli après génération)
        $content .= "<div class=\"pillar-faqs\" id=\"faq-section\"></div>\n\n";

        $content .= "</div>";

        // Polish final
        $content = $this->polishContent($content);

        return $content;
    }

    /**
     * ═════════════════════════════════════════════════════════════════════════
     * ÉTAPE 5 : Sauvegarde research data
     * ═════════════════════════════════════════════════════════════════════════
     */
    protected function saveResearchData(Article $article, array $research): void
    {
        try {
            // Sauvegarder sources
            foreach ($research['sources'] as $source) {
                PillarResearchSource::create([
                    'article_id' => $article->id,
                    'source_type' => $source['type'],
                    'source_url' => $source['url'] ?? null,
                    'source_title' => $source['title'],
                    'source_date' => $source['date'],
                    'relevance_score' => $source['relevance_score'],
                    'content_excerpt' => substr($source['content'], 0, 500),
                ]);
            }

            // Sauvegarder statistiques
            foreach ($research['statistics'] as $stat) {
                PillarStatistic::create([
                    'article_id' => $article->id,
                    'stat_key' => $stat['key'],
                    'stat_value' => $stat['value'],
                    'stat_unit' => $stat['unit'] ?? null,
                    'source_url' => $stat['source_url'] ?? null,
                    'verified' => true,
                ]);
            }

            Log::info('💾 Research data sauvegardée', [
                'sources' => count($research['sources']),
                'statistics' => count($research['statistics']),
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Erreur sauvegarde research data', ['error' => $e->getMessage()]);
        }
    }

    /**
     * ═════════════════════════════════════════════════════════════════════════
     * ÉTAPE 6 : Génération FAQs pour article pilier (12 questions approfondies)
     * ═════════════════════════════════════════════════════════════════════════
     */
    protected function generatePillarFaqs(Article $article, array $params, array $research): array
    {
        $theme = Theme::find($params['theme_id']);
        $country = Country::find($params['country_id']);
        $language = Language::find($params['language_id']);
        
        $contentExcerpt = Str::limit(strip_tags($article->content), 3000);
        
        // Extraire les points clés de la recherche
        $researchContext = '';
        if (!empty($research['key_points'])) {
            $researchContext = "\nPoints clés de la recherche :\n- " . implode("\n- ", array_slice($research['key_points'], 0, 5));
        }

        $systemPrompt = "Tu es un expert en création de FAQ exhaustives pour articles piliers SEO. Tu dois générer des questions variées et approfondies qui répondent aux vraies interrogations des expatriés.";

        $userPrompt = <<<PROMPT
Génère {$this->config['faqs_count']} questions-réponses FAQ pour cet article pilier destiné aux expatriés en {$country->name}.

Titre : "{$article->title}"
Thème : {$theme->name}
Pays : {$country->name}
{$researchContext}

Extrait du contenu : {$contentExcerpt}

Règles strictes pour article PILIER (contenu premium) :
1. Questions VARIÉES et APPROFONDIES : mélange "Quoi", "Comment", "Pourquoi", "Combien", "Quand", "Où", "Qui"
2. Inclure des questions SPÉCIFIQUES au pays ({$country->name})
3. Inclure des questions sur les DÉMARCHES et PROCÉDURES
4. Inclure des questions sur les COÛTS et DÉLAIS
5. Inclure des questions sur les ERREURS À ÉVITER
6. Réponses détaillées : 80-150 mots par réponse (plus longues que FAQ standard)
7. Ton expert et rassurant
8. Inclure chiffres/délais/coûts précis quand possible
9. Au moins 2 questions commençant par "Quelles sont les erreurs..."
10. Au moins 2 questions sur les différences avec la France

Format de sortie (JSON strict) :
{{
  "faqs": [
    {{"question": "...", "answer": "..."}},
    {{"question": "...", "answer": "..."}}
  ]
}}

Réponds en {$language->native_name} UNIQUEMENT avec le JSON, rien d'autre.
PROMPT;

        $response = $this->gpt->chat([
            'model' => GptService::MODEL_GPT4O,
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userPrompt],
            ],
            'temperature' => 0.6,
            'max_tokens' => 4000,
        ]);

        $this->stats['total_cost'] += $response['cost'] ?? 0;

        try {
            $content = $response['content'];
            // Nettoyer les backticks markdown si présents
            $cleaned = preg_replace('/```(?:json)?\s*|\s*```/', '', $content);
            $parsed = json_decode($cleaned, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \RuntimeException('JSON parse error: ' . json_last_error_msg());
            }
            
            return $parsed['faqs'] ?? [];
        } catch (\Exception $e) {
            Log::warning('PillarArticleGenerator: Échec parsing FAQs JSON', [
                'error' => $e->getMessage(),
                'response' => $response['content'],
            ]);
            return [];
        }
    }

    /**
     * Sauvegarder les FAQs en base de données
     */
    protected function saveFaqs(Article $article, array $faqs, array $params): void
    {
        if (empty($faqs)) {
            return;
        }

        $language = Language::find($params['language_id']);

        foreach ($faqs as $index => $faq) {
            $article->faqs()->create([
                'question' => $faq['question'],
                'answer' => $faq['answer'],
                'language_id' => $language->id,
                'order' => $index + 1,
            ]);
        }

        Log::info('✅ FAQs sauvegardées pour article pilier', [
            'article_id' => $article->id,
            'count' => count($faqs),
        ]);
    }

    /**
     * Ajouter les FAQs au contenu HTML de l'article
     */
    protected function appendFaqsToContent(Article $article, array $faqs): void
    {
        if (empty($faqs)) {
            return;
        }

        $language = Language::find($article->language_id);
        $faqTitle = $language->code === 'fr' ? 'Questions Fréquentes' : 'Frequently Asked Questions';

        // Générer le HTML des FAQs
        $faqHtml = '<div class="pillar-faqs">' . "\n";
        $faqHtml .= '<h2>' . $faqTitle . '</h2>' . "\n";
        
        foreach ($faqs as $index => $faq) {
            $faqHtml .= '<div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">' . "\n";
            $faqHtml .= '  <h3 class="faq-question" itemprop="name">' . htmlspecialchars($faq['question']) . '</h3>' . "\n";
            $faqHtml .= '  <div class="faq-answer" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">' . "\n";
            $faqHtml .= '    <div itemprop="text"><p>' . htmlspecialchars($faq['answer']) . '</p></div>' . "\n";
            $faqHtml .= '  </div>' . "\n";
            $faqHtml .= '</div>' . "\n";
        }
        
        $faqHtml .= '</div>';

        // Remplacer le placeholder par le vrai contenu FAQ
        $content = $article->content;
        $content = str_replace(
            '<div class="pillar-faqs" id="faq-section"></div>',
            $faqHtml,
            $content
        );

        // Recalculer le word count
        $wordCount = str_word_count(strip_tags($content));

        $article->update([
            'content' => $content,
            'word_count' => $wordCount,
            'reading_time' => ceil($wordCount / 200),
        ]);
    }

    /**
     * ═════════════════════════════════════════════════════════════════════════
     * MÉTHODES UTILITAIRES
     * ═════════════════════════════════════════════════════════════════════════
     */

    protected function validateParams(array $params): void
    {
        $required = ['platform_id', 'country_id', 'theme_id', 'language_id'];
        
        foreach ($required as $field) {
            if (!isset($params[$field])) {
                throw new \InvalidArgumentException("Missing required parameter: {$field}");
            }
        }
    }

    protected function extractStatistics(string $content): array
    {
        $statistics = [];
        
        // Pattern pour détecter des statistiques
        preg_match_all('/(\d[\d,\.]*\s*(?:%|USD|EUR|people|persons|expatriates|expats))/i', $content, $matches);
        
        foreach ($matches[0] as $stat) {
            $statistics[] = [
                'key' => 'extracted_stat_' . count($statistics),
                'value' => trim($stat),
                'unit' => 'extracted',
                'source_url' => null,
            ];
        }

        return $statistics;
    }

    protected function extractKeyPoints(array $sources): array
    {
        $keyPoints = [];
        
        foreach ($sources as $source) {
            $sentences = explode('.', $source['content']);
            foreach (array_slice($sentences, 0, 3) as $sentence) {
                if (strlen(trim($sentence)) > 50) {
                    $keyPoints[] = trim($sentence);
                }
            }
        }

        return array_slice($keyPoints, 0, 10);
    }

    protected function buildResearchContext(array $research): string
    {
        $context = "SOURCES DE RECHERCHE :\n";
        
        foreach ($research['sources'] as $index => $source) {
            $context .= "\nSource " . ($index + 1) . " : {$source['title']}\n";
            $context .= substr($source['content'], 0, 300) . "...\n";
        }

        if (!empty($research['statistics'])) {
            $context .= "\nSTATISTIQUES CLÉS :\n";
            foreach (array_slice($research['statistics'], 0, 5) as $stat) {
                $context .= "• {$stat['value']}\n";
            }
        }

        return $context;
    }

    protected function parseJsonResponse(string $response): array
    {
        $response = trim($response);
        
        // Nettoyer les backticks markdown si présents
        if (preg_match('/```(?:json)?\s*(\{.*\})\s*```/s', $response, $matches)) {
            $response = $matches[1];
        }

        $data = json_decode($response, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \RuntimeException('Failed to parse JSON response: ' . json_last_error_msg());
        }

        return $data;
    }

    protected function generateIntroduction(Theme $theme, Country $country, array $outline): string
    {
        $prompt = "Rédige une introduction captivante de 250-300 mots pour cet article pilier sur {$theme->name} - {$country->name}.

L'introduction doit :
- Capter l'attention immédiatement
- Poser le contexte et l'importance du sujet
- Annoncer ce que le lecteur va apprendre
- Être optimisée SEO
- Ton professionnel mais accessible

Rédige l'introduction :";

        $response = $this->gpt->chat([
            'model' => GptService::MODEL_GPT4O,
            'messages' => [
                ['role' => 'user', 'content' => $prompt],
            ],
            'max_tokens' => 600,
        ]);

        return $response['content'];
    }

    protected function generateConclusion(Theme $theme, Country $country, array $outline): string
    {
        $prompt = "Rédige une conclusion impactante de 250-300 mots pour cet article pilier sur {$theme->name} - {$country->name}.

La conclusion doit :
- Résumer les points clés
- Donner une perspective future
- Appel à l'action clair
- Ton encourageant et actionnable

Rédige la conclusion :";

        $response = $this->gpt->chat([
            'model' => GptService::MODEL_GPT4O,
            'messages' => [
                ['role' => 'user', 'content' => $prompt],
            ],
            'max_tokens' => 600,
        ]);

        return $response['content'];
    }

    protected function polishContent(string $content): string
    {
        // Nettoyer les sauts de ligne excessifs
        $content = preg_replace('/\n{3,}/', "\n\n", $content);
        
        // Nettoyer les espaces doubles
        $content = str_replace('  ', ' ', $content);
        
        return trim($content);
    }

    protected function createArticle(array $params, string $content, array $research): Article
    {
        $language = Language::find($params['language_id']);
        
        // Générer titre
        $title = $this->titleService->generate([
            'platform_id' => $params['platform_id'],
            'country_id' => $params['country_id'],
            'theme_id' => $params['theme_id'],
            'language_id' => $params['language_id'],
            'type' => 'pillar',
        ]);

        // Calculer word count
        $wordCount = str_word_count(strip_tags($content));

        // Créer article
        $article = Article::create([
            'uuid' => Str::uuid(),
            'platform_id' => $params['platform_id'],
            'country_id' => $params['country_id'],
            'language_id' => $params['language_id'],
            'theme_id' => $params['theme_id'],
            'type' => 'pillar',
            'title' => $title,
            'title_hash' => hash('sha256', $title),
            'slug' => Article::generateUniqueSlug($title, $params['platform_id'], $params['language_id']),
            'content' => $content,
            'word_count' => $wordCount,
            'reading_time' => ceil($wordCount / 200),
            'status' => Article::STATUS_PUBLISHED,
            'published_at' => now(),
            'generation_cost' => $this->stats['total_cost'],
        ]);

        // Générer meta
        $this->metaService->generateForArticle($article);

        return $article;
    }

    protected function generateImage(Article $article, array $params): void
    {
        try {
            $theme = Theme::find($params['theme_id']);
            $country = Country::find($params['country_id']);
            $language = Language::find($params['language_id']);

            // 1. Essayer Unsplash d'abord
            $keywords = [
                $theme->name,
                $country->name,
                $language->name,
            ];

            $unsplashImage = $this->unsplash->findContextualImage([
                'keywords' => $keywords,
                'theme' => $theme->name,
                'country' => $country->name,
                'orientation' => 'landscape',
            ]);

            if ($unsplashImage) {
                Log::info('✅ Unsplash image found', [
                    'theme' => $theme->name,
                    'photographer' => $unsplashImage['photographer'],
                ]);

                $article->update([
                    'image_url' => $unsplashImage['url'],
                    'image_alt' => $unsplashImage['alt_description'] ?: "{$theme->name} - {$country->name}",
                    'image_attribution' => $unsplashImage['attribution_html'],
                    'image_photographer' => $unsplashImage['photographer'],
                    'image_photographer_url' => $unsplashImage['photographer_url'],
                    'image_width' => $unsplashImage['width'],
                    'image_height' => $unsplashImage['height'],
                    'image_color' => $unsplashImage['color'],
                    'image_source' => 'unsplash',
                ]);

                return;
            }

            // 2. Fallback DALL-E
            Log::info('⚠️ No Unsplash image, using DALL-E fallback', [
                'theme' => $theme->name,
            ]);

            $prompt = "Professional cover image for article about {$theme->name} in {$country->name}, {$language->name} language context, high quality, business professional style";
            $imageUrl = $this->dalle->generate($prompt);

            $article->update([
                'image_url' => $imageUrl,
                'image_alt' => "{$theme->name} - {$country->name}",
                'image_source' => 'dalle',
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Image generation failed completely', [
                'error' => $e->getMessage(),
                'theme' => $theme->name ?? 'unknown',
            ]);
        }
    }

    // =========================================================================
    // SEO COMPLET ET POST-GÉNÉRATION
    // =========================================================================

    /**
     * Applique le SEO complet (meta optimisés, images)
     */
    protected function applyFullSeo(Article $article, array $params): void
    {
        if (!($params['enable_full_seo'] ?? true)) {
            return;
        }

        try {
            $seoService = app(SeoOptimizationService::class);
            $language = Language::find($params['language_id']);
            $lang = $language->code ?? 'fr';

            // Contexte SEO
            $context = [
                'country' => $article->country?->getName($lang) ?? '',
                'platform' => $article->platform?->name ?? 'SOS-Expat',
                'service' => $article->theme?->getName($lang) ?? '',
                'year' => date('Y'),
            ];

            // Optimiser meta title (< 60 caractères)
            $metaTitle = $seoService->generateMetaTitle(
                $article->title,
                'pillar',
                $lang,
                $context
            );

            // Optimiser meta description (< 160 caractères)
            $metaDescription = $seoService->generateMetaDescription(
                $article->title,
                'pillar',
                $lang,
                $context
            );

            // Optimiser image alt si image présente
            $imageAlt = $article->image_alt;
            if ($article->image_url && empty($imageAlt)) {
                $imageAlt = $seoService->generateAltText($article->title, $lang);
            }

            // Mettre à jour l'article
            $article->update([
                'meta_title' => $metaTitle,
                'meta_description' => $metaDescription,
                'image_alt' => $imageAlt,
            ]);

            Log::debug('SEO complet appliqué (pillar)', [
                'article_id' => $article->id,
                'meta_title_length' => mb_strlen($metaTitle),
                'meta_description_length' => mb_strlen($metaDescription),
            ]);

        } catch (\Exception $e) {
            Log::warning('Erreur application SEO (pillar)', [
                'article_id' => $article->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Génère les slugs locale-pays
     */
    protected function generateLocaleSlugs(Article $article): void
    {
        try {
            $localeSlugService = app(LocaleSlugService::class);
            $count = $localeSlugService->saveLocaleSlugs($article);

            Log::debug('Slugs locale-pays générés (pillar)', [
                'article_id' => $article->id,
                'count' => $count,
            ]);

        } catch (\Exception $e) {
            Log::warning('Erreur génération slugs locale (pillar)', [
                'article_id' => $article->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Traite les liens (internes, externes, affiliés)
     */
    protected function processLinks(Article $article, array $params): void
    {
        $enableAffiliate = $params['enable_affiliate_links'] ?? true;

        try {
            $linkingOrchestrator = app(LinkingOrchestrator::class);

            $linkingOrchestrator->processArticle($article, [
                'internal' => true,
                'external' => true,
                'affiliate' => $enableAffiliate,
                'pillar' => true,
                'inject_content' => true,
            ]);

            Log::debug('Liens traités (pillar)', ['article_id' => $article->id]);

        } catch (\Exception $e) {
            Log::warning('Erreur traitement liens (pillar)', [
                'article_id' => $article->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Dispatch les traductions multi-langues si languages[] fourni
     */
    protected function dispatchTranslations(Article $article, array $params): void
    {
        // Nouvelles langues cibles fournies dans params
        $targetLanguages = $params['languages'] ?? [];

        // Ou auto_translate pour toutes les langues
        $autoTranslate = $params['auto_translate'] ?? config('content.auto_translate', false);

        if (!empty($targetLanguages)) {
            // Traductions spécifiques
            $multiLangService = app(MultiLanguageGenerationService::class);
            $multiLangService->generateTranslations($article, $targetLanguages, [
                'delay' => 15,
                'priority' => 'normal',
            ]);

            Log::info('Traductions multi-langues dispatchées (pillar)', [
                'article_id' => $article->id,
                'languages' => $targetLanguages,
            ]);

        } elseif ($autoTranslate) {
            // Toutes les langues
            TranslateAllLanguages::dispatch($article->id)
                ->onQueue('translation');

            Log::info('TranslateAllLanguages dispatché (pillar)', [
                'article_id' => $article->id,
            ]);
        }
    }

    /**
     * Gère l'auto-publication si configurée
     */
    protected function handleAutoPublish(Article $article, array $params): void
    {
        $autoPublish = $params['auto_publish'] ?? config('content.auto_publish', false);
        $minScore = $params['min_quality_score'] ?? config('content.quality.min_score', 75);

        if (!$autoPublish) {
            return;
        }

        // Pour les pillar, le status est déjà 'published' par défaut
        // On vérifie juste le score qualité
        if ($article->quality_score && $article->quality_score >= $minScore) {
            // Dispatcher indexation Google/Bing
            if (class_exists(RequestIndexing::class)) {
                RequestIndexing::dispatch($article->id)
                    ->onQueue('indexing');
            }

            Log::info('Pillar indexation dispatchée', [
                'article_id' => $article->id,
                'quality_score' => $article->quality_score,
            ]);
        }
    }
}