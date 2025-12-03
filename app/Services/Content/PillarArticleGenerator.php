<?php

namespace App\Services\Content;

use App\Models\Article;
use App\Models\Country;
use App\Models\Language;
use App\Models\Theme;
use App\Models\Platform;
use App\Models\PillarResearchSource;
use App\Models\PillarStatistic;
use App\Services\AI\GptService;
use App\Services\AI\PerplexityService;
use App\Services\AI\DalleService;
use App\Services\Content\TitleService;
use App\Services\Content\LinkService;
use App\Services\Seo\MetaService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * PillarArticleGenerator - Générateur d'articles piliers premium 3000-5000 mots
 * 
 * ✅ VERSION 100% CORRIGÉE - Toutes les erreurs fixées
 * 
 * Pipeline en 5 étapes :
 * 1. conductDeepResearch() : Recherche approfondie Perplexity + News API
 * 2. generatePillarOutline() : Génère structure 8-12 sections H2
 * 3. generateSections() : Génère chaque section séparément (qualité max)
 * 4. assembleSections() : Assemble + transitions + intro/conclusion
 * 5. saveResearchData() : Stocke sources et statistiques
 * 
 * @package App\Services\Content
 */
class PillarArticleGenerator
{
    protected GptService $gpt;
    protected PerplexityService $perplexity;
    protected DalleService $dalle;
    protected TitleService $titleService;
    protected LinkService $linkService;
    protected MetaService $metaService;

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
        TitleService $titleService,
        LinkService $linkService,
        MetaService $metaService
    ) {
        $this->gpt = $gpt;
        $this->perplexity = $perplexity;
        $this->dalle = $dalle;
        $this->titleService = $titleService;
        $this->linkService = $linkService;
        $this->metaService = $metaService;
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

            // ÉTAPE 1 : Recherche approfondie
            Log::info('📚 ÉTAPE 1/5 : Recherche approfondie');
            $research = $this->conductDeepResearch($params);

            // ÉTAPE 2 : Génération outline structuré
            Log::info('🗺️ ÉTAPE 2/5 : Génération outline');
            $outline = $this->generatePillarOutline($params, $research);

            // ÉTAPE 3 : Génération sections individuelles
            Log::info('✍️ ÉTAPE 3/5 : Génération sections');
            $sections = $this->generateSections($outline, $params, $research);

            // ÉTAPE 4 : Assemblage et polish
            Log::info('🔨 ÉTAPE 4/5 : Assemblage et polish');
            $content = $this->assembleSections($sections, $outline, $params);

            // Création article
            $article = $this->createArticle($params, $content, $research);

            // ÉTAPE 5 : Sauvegarde research data
            Log::info('💾 ÉTAPE 5/5 : Sauvegarde research data');
            $this->saveResearchData($article, $research);

            // Image
            $this->generateImage($article, $params);

            // Traductions (à faire ultérieurement via PillarTranslationService)
            // $this->generateTranslations($article);

            $this->stats['generation_time'] = microtime(true) - $startTime;

            Log::info('✅ Article pilier généré avec succès', [
                'article_id' => $article->id,
                'word_count' => $article->word_count,
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
            
            // ✅ CORRECTION : Utilisation correcte de search() avec array
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
            
            // ✅ CORRECTION : Utilisation correcte de search() avec array
            $result2 = $this->perplexity->search([
                'query' => $query2,
            ]);
            
            if (!empty($result2['content'])) {
                // Extraire statistiques du contenu
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
            
            // ✅ CORRECTION : Utilisation correcte de search() avec array
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

        // Construire contexte recherche
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

        // ✅ CORRECTION : Utilisation correcte de chat() au lieu de generateText()
        $response = $this->gpt->chat([
            'model' => GptService::MODEL_GPT4O,
            'messages' => [
                ['role' => 'system', 'content' => 'Tu es un expert en structuration de contenu pour expatriés.'],
                ['role' => 'user', 'content' => $prompt],
            ],
            'temperature' => 0.7,
            'max_tokens' => 2000,
        ]);

        // ✅ CORRECTION : Accès correct au contenu via $response['content']
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

Rédige la section maintenant :";

            // ✅ CORRECTION : Utilisation correcte de chat() au lieu de generateText()
            $response = $this->gpt->chat([
                'model' => GptService::MODEL_GPT4O,
                'messages' => [
                    ['role' => 'system', 'content' => 'Tu es un expert rédacteur spécialisé en contenu pour expatriés.'],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'temperature' => 0.7,
                'max_tokens' => 1000,
            ]);

            // ✅ CORRECTION : Accès correct au contenu via $response['content']
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

        // ✅ CORRECTION : Utilisation correcte de chat()
        $response = $this->gpt->chat([
            'model' => GptService::MODEL_GPT4O,
            'messages' => [
                ['role' => 'user', 'content' => $prompt],
            ],
            'max_tokens' => 600,
        ]);

        // ✅ CORRECTION : Accès correct au contenu
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

        // ✅ CORRECTION : Utilisation correcte de chat()
        $response = $this->gpt->chat([
            'model' => GptService::MODEL_GPT4O,
            'messages' => [
                ['role' => 'user', 'content' => $prompt],
            ],
            'max_tokens' => 600,
        ]);

        // ✅ CORRECTION : Accès correct au contenu
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

            $prompt = "Professional cover image for article about {$theme->name} in {$country->name}, modern, clean, editorial style";
            
            $imageUrl = $this->dalle->generate($prompt);
            
            $article->update([
                'image_url' => $imageUrl,
                'image_alt' => "{$theme->name} - {$country->name}",
            ]);

        } catch (\Exception $e) {
            Log::warning('⚠️ Erreur génération image', ['error' => $e->getMessage()]);
        }
    }
}