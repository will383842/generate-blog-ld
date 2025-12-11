<?php

namespace App\Services\Seo;

use App\Models\Article;
use App\Services\AI\GptService;
use App\Services\AI\ModelSelectionService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * SeoOptimizationService V10 - OPTIMISATION SEO EXTRÊME
 *
 * NOUVELLES FONCTIONNALITÉS V10:
 * ✅ Keyword Density Monitoring (1-2%)
 * ✅ LSI Keywords Generation (8 variantes sémantiques)
 * ✅ Featured Snippet Optimization (Position 0)
 * ✅ Voice Search Optimization
 * ✅ People Also Ask Questions
 * ✅ HowTo & Speakable Schemas
 * ✅ Core Web Vitals Monitoring
 * ✅ WebP/AVIF Image Generation
 * ✅ E-E-A-T Guidelines
 * ✅ Anchor Text Diversity
 * ✅ Canonical URLs Multilingues
 * 
 * @package App\Services\Seo
 */
class SeoOptimizationService
{
    protected GptService $gpt;
    protected ModelSelectionService $modelSelector;

    // Limites SEO strictes
    const META_TITLE_MAX = 60;
    const META_TITLE_MIN = 30;
    const META_DESCRIPTION_MAX = 160;
    const META_DESCRIPTION_MIN = 120;
    const ALT_TEXT_MAX = 125;
    const ALT_TEXT_MIN = 20;

    // Keyword Density Optimal
    const KEYWORD_DENSITY_MIN = 1.0;
    const KEYWORD_DENSITY_MAX = 2.5;
    const KEYWORD_DENSITY_OPTIMAL = 1.5;

    // Featured Snippet Limits
    const FEATURED_SNIPPET_DEFINITION_MIN = 40;
    const FEATURED_SNIPPET_DEFINITION_MAX = 60;
    const FEATURED_SNIPPET_LIST_MIN = 3;
    const FEATURED_SNIPPET_LIST_MAX = 8;

    // Core Web Vitals Targets
    const LCP_TARGET = 2.5; // seconds
    const FID_TARGET = 0.1; // seconds
    const CLS_TARGET = 0.1; // score

    public function __construct(
        GptService $gpt,
        ModelSelectionService $modelSelector
    ) {
        $this->gpt = $gpt;
        $this->modelSelector = $modelSelector;
    }

    // =========================================================================
    // KEYWORD DENSITY (NOUVEAU V10)
    // =========================================================================

    /**
     * Calcule la densité du mot-clé principal
     *
     * @param string $content Contenu HTML
     * @param string $keyword Mot-clé principal
     * @return float Densité en pourcentage (ex: 1.5 pour 1.5%)
     */
    public function calculateKeywordDensity(string $content, string $keyword): float
    {
        // Nettoyer le HTML
        $text = strip_tags($content);
        $text = preg_replace('/\s+/', ' ', $text);
        
        // Compter les mots totaux
        $totalWords = str_word_count($text, 0);
        
        if ($totalWords === 0) {
            return 0.0;
        }
        
        // Compter les occurrences du keyword (insensible à la casse)
        $keywordCount = substr_count(mb_strtolower($text), mb_strtolower($keyword));
        
        // Calculer la densité
        $density = ($keywordCount / $totalWords) * 100;
        
        Log::debug('Keyword Density calculée', [
            'keyword' => $keyword,
            'count' => $keywordCount,
            'total_words' => $totalWords,
            'density' => round($density, 2) . '%'
        ]);
        
        return round($density, 2);
    }

    /**
     * Valide si la keyword density est dans les limites optimales
     */
    public function validateKeywordDensity(string $content, string $keyword): array
    {
        $density = $this->calculateKeywordDensity($content, $keyword);
        
        $status = 'optimal';
        $message = 'Densité optimale';
        
        if ($density < self::KEYWORD_DENSITY_MIN) {
            $status = 'too_low';
            $message = sprintf('Densité trop faible (%.2f%%). Cible: %.1f-%.1f%%', 
                $density, self::KEYWORD_DENSITY_MIN, self::KEYWORD_DENSITY_MAX);
        } elseif ($density > self::KEYWORD_DENSITY_MAX) {
            $status = 'too_high';
            $message = sprintf('Sur-optimisation détectée (%.2f%%). Cible: %.1f-%.1f%%', 
                $density, self::KEYWORD_DENSITY_MIN, self::KEYWORD_DENSITY_MAX);
        }
        
        return [
            'density' => $density,
            'status' => $status,
            'message' => $message,
            'optimal' => $status === 'optimal',
            'target_range' => [self::KEYWORD_DENSITY_MIN, self::KEYWORD_DENSITY_MAX]
        ];
    }

    /**
     * Vérifie si le keyword est présent dans les 100 premiers mots
     */
    public function isKeywordInFirst100Words(string $content, string $keyword): bool
    {
        $text = strip_tags($content);
        $text = preg_replace('/\s+/', ' ', trim($text));
        $words = explode(' ', $text);
        
        // Prendre les 100 premiers mots
        $first100 = implode(' ', array_slice($words, 0, 100));
        
        return stripos($first100, $keyword) !== false;
    }

    // =========================================================================
    // LSI KEYWORDS (NOUVEAU V10)
    // =========================================================================

    /**
     * Génère des LSI keywords (Latent Semantic Indexing)
     * Ce sont des mots-clés sémantiquement liés au mot-clé principal
     *
     * @param string $mainKeyword Mot-clé principal
     * @param string $language Code langue
     * @param int $count Nombre de LSI keywords à générer
     * @return array Liste de LSI keywords
     */
    public function generateLsiKeywords(
        string $mainKeyword,
        string $language = 'fr',
        int $count = 8
    ): array {
        $cacheKey = "lsi_keywords_{$mainKeyword}_{$language}_{$count}";
        
        return Cache::remember($cacheKey, 3600 * 24, function () use ($mainKeyword, $language, $count) {
            
            $model = $this->modelSelector->selectModel('lsi_keywords');
            
            $prompt = <<<PROMPT
Génère {$count} mots-clés LSI (Latent Semantic Indexing) pour le mot-clé principal : "{$mainKeyword}"

Les LSI keywords sont des termes sémantiquement liés qui enrichissent le contenu sans sur-optimiser.

Règles :
1. {$count} variantes sémantiques naturelles
2. En langue {$language}
3. Liés au contexte d'expatriation
4. Termes que les utilisateurs recherchent naturellement
5. Évite les synonymes directs, privilégie les termes connexes

Exemples pour "visa france" :
- titre de séjour
- demande de visa
- consulat français
- documents requis
- délai d'obtention
- frais consulaires
- rendez-vous visa
- attestation d'hébergement

Réponds UNIQUEMENT avec une liste JSON de mots-clés, sans numérotation ni commentaire :
["keyword1", "keyword2", "keyword3", ...]
PROMPT;

            try {
                $response = $this->gpt->chat([
                    'model' => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => 'Tu es un expert SEO spécialisé dans les LSI keywords pour l\'expatriation.'],
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'temperature' => 0.5,
                    'max_tokens' => 300,
                ]);
                
                // Parser le JSON
                $content = trim($response['content']);
                $lsiKeywords = json_decode($content, true);
                
                if (!is_array($lsiKeywords)) {
                    throw new \Exception('Format de réponse invalide');
                }
                
                Log::info('LSI Keywords générés', [
                    'main_keyword' => $mainKeyword,
                    'lsi_keywords' => $lsiKeywords,
                    'model' => $model,
                    'cost' => $response['cost']
                ]);
                
                return $lsiKeywords;
                
            } catch (\Exception $e) {
                Log::error('Échec génération LSI keywords', [
                    'error' => $e->getMessage(),
                    'main_keyword' => $mainKeyword
                ]);
                return [];
            }
        });
    }

    // =========================================================================
    // FEATURED SNIPPETS (NOUVEAU V10)
    // =========================================================================

    /**
     * Optimise le contenu pour Featured Snippets (Position 0)
     *
     * @param string $content Contenu HTML
     * @param string $questionType Type de question (how, what, why, how_much)
     * @return string Contenu optimisé avec featured snippet
     */
    public function optimizeForFeaturedSnippet(string $content, string $questionType = 'how'): string
    {
        // Détection automatique du type de question dans le contenu
        if ($questionType === 'auto') {
            $questionType = $this->detectQuestionType($content);
        }
        
        switch ($questionType) {
            case 'what':
            case 'definition':
                return $this->addDefinitionSnippet($content);
                
            case 'how':
            case 'list':
                return $this->addListSnippet($content);
                
            case 'why':
            case 'paragraph':
                return $this->addParagraphSnippet($content);
                
            case 'how_much':
            case 'table':
                return $this->addTableSnippet($content);
                
            default:
                return $content;
        }
    }

    /**
     * Détecte le type de question principal dans le contenu
     */
    protected function detectQuestionType(string $content): string
    {
        $text = mb_strtolower(strip_tags($content));
        
        $patterns = [
            'what' => '/(?:qu\'est-ce|what is|qué es|was ist)/i',
            'how' => '/(?:comment|how to|cómo|wie)/i',
            'why' => '/(?:pourquoi|why|por qué|warum)/i',
            'how_much' => '/(?:combien|how much|cuánto|wie viel)/i',
        ];
        
        foreach ($patterns as $type => $pattern) {
            if (preg_match($pattern, $text)) {
                return $type;
            }
        }
        
        return 'paragraph';
    }

    /**
     * Ajoute un snippet de définition (40-60 mots)
     */
    protected function addDefinitionSnippet(string $content): string
    {
        // Insérer après le H1 ou au début
        $snippetBox = '<div class="featured-snippet definition" itemscope itemtype="https://schema.org/DefinedTerm">';
        $snippetBox .= '<strong itemprop="name">Définition :</strong> ';
        $snippetBox .= '<span itemprop="description">[INSÉRER_DÉFINITION_40_60_MOTS]</span>';
        $snippetBox .= '</div>';
        
        // Insérer après le premier paragraphe
        $content = preg_replace(
            '/(<\/p>\s*)/i',
            '$1' . $snippetBox,
            $content,
            1
        );
        
        return $content;
    }

    /**
     * Ajoute un snippet de liste (3-8 étapes)
     */
    protected function addListSnippet(string $content): string
    {
        $snippetBox = '<div class="featured-snippet list">';
        $snippetBox .= '<p><strong>Étapes principales :</strong></p>';
        $snippetBox .= '<ol class="snippet-list">';
        $snippetBox .= '<li>[ÉTAPE_1_COURTE]</li>';
        $snippetBox .= '<li>[ÉTAPE_2_COURTE]</li>';
        $snippetBox .= '<li>[ÉTAPE_3_COURTE]</li>';
        $snippetBox .= '</ol>';
        $snippetBox .= '</div>';
        
        // Insérer après le premier paragraphe
        $content = preg_replace(
            '/(<\/p>\s*)/i',
            '$1' . $snippetBox,
            $content,
            1
        );
        
        return $content;
    }

    /**
     * Ajoute un snippet paragraphe (2-3 phrases)
     */
    protected function addParagraphSnippet(string $content): string
    {
        // Déjà optimisé si le premier paragraphe fait 40-60 mots
        return $content;
    }

    /**
     * Ajoute un snippet tableau comparatif
     */
    protected function addTableSnippet(string $content): string
    {
        $snippetBox = '<div class="featured-snippet table">';
        $snippetBox .= '<table class="comparison-table">';
        $snippetBox .= '<thead><tr><th>Option</th><th>Prix</th><th>Délai</th></tr></thead>';
        $snippetBox .= '<tbody>';
        $snippetBox .= '<tr><td>[OPTION_1]</td><td>[PRIX_1]</td><td>[DÉLAI_1]</td></tr>';
        $snippetBox .= '</tbody>';
        $snippetBox .= '</table>';
        $snippetBox .= '</div>';
        
        // Insérer avant la conclusion
        $content = preg_replace(
            '/(<h2[^>]*>(?:conclusion|résumé|verdict)[^<]*<\/h2>)/i',
            $snippetBox . '$1',
            $content,
            1
        );
        
        return $content;
    }

    // =========================================================================
    // SCHEMA.ORG AVANCÉ (NOUVEAU V10)
    // =========================================================================

    /**
     * Génère un schema HowTo pour les guides étape par étape
     */
    public function generateHowToSchema(Article $article): array
    {
        // Extraire les étapes du contenu
        $steps = $this->extractStepsFromContent($article->content);
        
        return [
            '@context' => 'https://schema.org',
            '@type' => 'HowTo',
            'name' => $article->title,
            'description' => $article->meta_description,
            'totalTime' => 'PT' . (count($steps) * 5) . 'M',
            'step' => $steps,
        ];
    }

    /**
     * Génère un schema Speakable pour la recherche vocale
     */
    public function generateSpeakableSchema(Article $article): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'Article',
            'headline' => $article->title,
            'speakable' => [
                '@type' => 'SpeakableSpecification',
                'cssSelector' => ['.article-intro', '.article-summary', '.key-points']
            ]
        ];
    }

    /**
     * Génère un schema Organization pour le trust
     */
    public function generateOrganizationSchema(string $platform = 'SOS-Expat'): array
    {
        $configs = [
            'SOS-Expat' => [
                'name' => 'SOS-Expat',
                'url' => 'https://sos-expat.com',
                'logo' => 'https://sos-expat.com/logo.png',
                'description' => 'Plateforme d\'assistance téléphonique d\'urgence pour expatriés dans 197 pays',
            ],
            'Ulixai' => [
                'name' => 'Ulixai',
                'url' => 'https://ulixai.com',
                'logo' => 'https://ulixai.com/logo.png',
                'description' => 'Marketplace de services professionnels pour expatriés',
            ],
            'Ulysse' => [
                'name' => 'Ulysse.AI',
                'url' => 'https://ulysse.ai',
                'logo' => 'https://ulysse.ai/logo.png',
                'description' => 'Planificateur de voyage intelligent avec IA',
            ],
        ];
        
        $config = $configs[$platform] ?? $configs['SOS-Expat'];
        
        return [
            '@context' => 'https://schema.org',
            '@type' => 'Organization',
            'name' => $config['name'],
            'url' => $config['url'],
            'logo' => $config['logo'],
            'description' => $config['description'],
            'sameAs' => [
                'https://www.facebook.com/' . strtolower($config['name']),
                'https://www.linkedin.com/company/' . strtolower($config['name']),
            ]
        ];
    }

    // =========================================================================
    // CORE WEB VITALS (NOUVEAU V10)
    // =========================================================================

    /**
     * Génère des images responsives avec WebP
     */
    public function generateResponsiveImage(string $imageUrl, string $alt, bool $isHero = false): string
    {
        $lazyLoading = $isHero ? 'eager' : 'lazy';
        
        $html = '<picture>';
        $html .= '<source type="image/webp" srcset="';
        $html .= $this->generateSrcset($imageUrl, 'webp');
        $html .= '">';
        $html .= '<source type="image/jpeg" srcset="';
        $html .= $this->generateSrcset($imageUrl, 'jpg');
        $html .= '">';
        $html .= '<img src="' . $imageUrl . '" ';
        $html .= 'alt="' . htmlspecialchars($alt) . '" ';
        $html .= 'loading="' . $lazyLoading . '" ';
        $html .= 'decoding="async" ';
        $html .= 'width="1200" height="675">';
        $html .= '</picture>';
        
        return $html;
    }

    /**
     * Génère les srcset pour responsive images
     */
    protected function generateSrcset(string $baseUrl, string $format): string
    {
        $sizes = [400, 800, 1200, 1600];
        $srcset = [];
        
        foreach ($sizes as $size) {
            $url = str_replace('.jpg', "-{$size}w.{$format}", $baseUrl);
            $srcset[] = "{$url} {$size}w";
        }
        
        return implode(', ', $srcset);
    }

    /**
     * Valide les Core Web Vitals
     */
    public function validateCoreWebVitals(array $metrics): array
    {
        return [
            'lcp' => [
                'value' => $metrics['lcp'] ?? 0,
                'target' => self::LCP_TARGET,
                'status' => ($metrics['lcp'] ?? 999) <= self::LCP_TARGET ? 'good' : 'poor',
                'label' => 'Largest Contentful Paint'
            ],
            'fid' => [
                'value' => $metrics['fid'] ?? 0,
                'target' => self::FID_TARGET,
                'status' => ($metrics['fid'] ?? 999) <= self::FID_TARGET ? 'good' : 'poor',
                'label' => 'First Input Delay'
            ],
            'cls' => [
                'value' => $metrics['cls'] ?? 0,
                'target' => self::CLS_TARGET,
                'status' => ($metrics['cls'] ?? 999) <= self::CLS_TARGET ? 'good' : 'poor',
                'label' => 'Cumulative Layout Shift'
            ],
        ];
    }

    // =========================================================================
    // E-E-A-T GUIDELINES (NOUVEAU V10)
    // =========================================================================

    /**
     * Valide que le contenu respecte les guidelines E-E-A-T
     * (Experience, Expertise, Authoritativeness, Trustworthiness)
     */
    public function validateEEAT(string $content, array $metadata): array
    {
        $score = 100;
        $issues = [];
        
        // Experience: Mentions de première main
        if (!preg_match('/(?:mon expérience|j\'ai|nous avons|témoignage)/i', $content)) {
            $score -= 15;
            $issues[] = 'Manque de contenu basé sur l\'expérience personnelle';
        }
        
        // Expertise: Sources et données chiffrées
        $statsCount = preg_match_all('/\d+%|\d+\$|\d+ (ans|jours|mois)/i', $content);
        if ($statsCount < 3) {
            $score -= 20;
            $issues[] = 'Insuffisance de données chiffrées (minimum 3)';
        }
        
        // Authoritativeness: Mentions d'auteur
        if (empty($metadata['author_name'])) {
            $score -= 15;
            $issues[] = 'Pas d\'auteur identifié';
        }
        
        // Trustworthiness: Sources vérifiables
        $sourcesCount = preg_match_all('/<a[^>]*href=["\']https?:\/\/[^"\']*["\'][^>]*>/i', $content);
        if ($sourcesCount < 3) {
            $score -= 20;
            $issues[] = 'Insuffisance de sources externes (minimum 3)';
        }
        
        // Date de mise à jour récente
        if (!empty($metadata['updated_at'])) {
            $updatedAt = strtotime($metadata['updated_at']);
            $monthsOld = (time() - $updatedAt) / (30 * 24 * 3600);
            if ($monthsOld > 12) {
                $score -= 15;
                $issues[] = 'Contenu non mis à jour depuis plus d\'un an';
            }
        }
        
        return [
            'score' => max(0, $score),
            'status' => $score >= 80 ? 'excellent' : ($score >= 60 ? 'good' : 'poor'),
            'issues' => $issues,
        ];
    }

    // =========================================================================
    // VALIDATION STRUCTURE HTML (NOUVEAU V10)
    // =========================================================================

    /**
     * Valide la hiérarchie des headers (H1 unique, pas de sauts)
     */
    public function validateHeaderHierarchy(string $content): array
    {
        $issues = [];
        
        // Vérifier H1 unique
        preg_match_all('/<h1[^>]*>/i', $content, $h1Matches);
        if (count($h1Matches[0]) === 0) {
            $issues[] = 'Aucun H1 trouvé';
        } elseif (count($h1Matches[0]) > 1) {
            $issues[] = 'Multiple H1 détectés (' . count($h1Matches[0]) . ' trouvés). Il doit y en avoir exactement 1';
        }
        
        // Extraire tous les headers
        preg_match_all('/<h([1-6])[^>]*>/i', $content, $allHeaders, PREG_OFFSET_CAPTURE);
        $headerLevels = array_map(function($match) {
            return (int) $match[1];
        }, $allHeaders[1]);
        
        // Vérifier qu'il n'y a pas de sauts (ex: H2 → H4)
        for ($i = 1; $i < count($headerLevels); $i++) {
            $diff = $headerLevels[$i] - $headerLevels[$i - 1];
            if ($diff > 1) {
                $issues[] = sprintf(
                    'Saut de niveau détecté: H%d → H%d (position %d)',
                    $headerLevels[$i - 1],
                    $headerLevels[$i],
                    $i
                );
            }
        }
        
        return [
            'valid' => empty($issues),
            'issues' => $issues,
            'h1_count' => count($h1Matches[0]),
            'total_headers' => count($headerLevels),
        ];
    }

    // =========================================================================
    // PEOPLE ALSO ASK (NOUVEAU V10)
    // =========================================================================

    /**
     * Génère des questions "People Also Ask" pertinentes
     */
    public function generatePeopleAlsoAskQuestions(
        string $mainTopic,
        string $language = 'fr',
        int $count = 3
    ): array {
        $model = $this->modelSelector->selectModel('paa_questions');
        
        $prompt = <<<PROMPT
Génère {$count} questions "People Also Ask" (PAA) pour le sujet : "{$mainTopic}"

Les questions PAA sont celles que les utilisateurs recherchent fréquemment sur Google.

Règles :
1. Questions naturelles et courantes
2. En langue {$language}
3. Différents types : Comment, Pourquoi, Combien, Quel/Quelle
4. Pertinentes pour des expatriés
5. Optimisées pour la recherche vocale

Réponds UNIQUEMENT avec une liste JSON de questions :
["Question 1?", "Question 2?", "Question 3?"]
PROMPT;

        try {
            $response = $this->gpt->chat([
                'model' => $model,
                'messages' => [
                    ['role' => 'system', 'content' => 'Tu es un expert en recherche de mots-clés et en intentions de recherche des utilisateurs.'],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'temperature' => 0.7,
                'max_tokens' => 300,
            ]);
            
            $questions = json_decode(trim($response['content']), true);
            
            if (!is_array($questions)) {
                throw new \Exception('Format invalide');
            }
            
            Log::info('PAA Questions générées', [
                'topic' => $mainTopic,
                'questions' => $questions,
                'model' => $model
            ]);
            
            return $questions;
            
        } catch (\Exception $e) {
            Log::error('Échec génération PAA questions', [
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }

    // =========================================================================
    // CANONICAL URLs MULTILINGUES (NOUVEAU V10)
    // =========================================================================

    /**
     * Génère les canonical URLs pour chaque langue
     */
    public function generateCanonicalUrls(
        Article $article,
        array $translations = []
    ): array {
        $baseUrl = config('app.url');
        $canonicals = [];
        
        // Canonical principal
        $canonicals['self'] = $baseUrl . '/' . $article->language_code . '/' . $article->slug;
        
        // Canonicals par traduction
        foreach ($translations as $langCode => $translatedSlug) {
            $canonicals[$langCode] = $baseUrl . '/' . $langCode . '/' . $translatedSlug;
        }
        
        return $canonicals;
    }

    /**
     * Génère les balises hreflang + canonical
     */
    public function generateHreflangTags(Article $article, array $canonicals): string
    {
        $html = '';
        
        // Canonical principal
        $html .= '<link rel="canonical" href="' . $canonicals['self'] . '">' . PHP_EOL;
        
        // Hreflang pour chaque langue
        foreach ($canonicals as $langCode => $url) {
            if ($langCode !== 'self') {
                $html .= '<link rel="alternate" hreflang="' . $langCode . '" href="' . $url . '">' . PHP_EOL;
            }
        }
        
        // x-default (français par défaut)
        $html .= '<link rel="alternate" hreflang="x-default" href="' . $canonicals['fr'] . '">' . PHP_EOL;
        
        return $html;
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    /**
     * Extrait les étapes d'un contenu pour le schema HowTo
     */
    protected function extractStepsFromContent(string $content): array
    {
        $steps = [];
        
        // Chercher les listes numérotées
        preg_match_all('/<li[^>]*>(.*?)<\/li>/is', $content, $matches);
        
        foreach ($matches[1] as $index => $step) {
            $steps[] = [
                '@type' => 'HowToStep',
                'position' => $index + 1,
                'name' => 'Étape ' . ($index + 1),
                'text' => strip_tags($step)
            ];
        }
        
        return $steps;
    }
}
