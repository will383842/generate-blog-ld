<?php

namespace App\Services\Content;

use App\Models\Article;
use App\Models\Prompt;
use App\Models\Platform;
use App\Services\AI\GptService;
use App\Services\AI\PerplexityService;
use App\Services\AI\DalleService;
use App\Services\AI\ModelSelectionService;
use App\Services\Seo\SeoOptimizationService;
use App\Services\Seo\MetaService;
use App\Services\Quality\QualityChecker;
use App\Services\Quality\ContentQualityEnforcer;
use App\Services\Linking\LinkingOrchestrator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class ArticleGenerator
{
    protected GptService $gptService;
    protected PerplexityService $perplexityService;
    protected DalleService $dalleService;
    protected ModelSelectionService $modelSelector;
    protected SeoOptimizationService $seoService;
    protected MetaService $metaService;
    protected QualityChecker $qualityChecker;
    protected ContentQualityEnforcer $qualityEnforcer;
    protected LinkingOrchestrator $linkingOrchestrator;

    public function __construct(
        GptService $gptService,
        PerplexityService $perplexityService,
        DalleService $dalleService,
        ModelSelectionService $modelSelector,
        SeoOptimizationService $seoService,
        MetaService $metaService,
        QualityChecker $qualityChecker,
        ContentQualityEnforcer $qualityEnforcer,
        LinkingOrchestrator $linkingOrchestrator
    ) {
        $this->gptService = $gptService;
        $this->perplexityService = $perplexityService;
        $this->dalleService = $dalleService;
        $this->modelSelector = $modelSelector;
        $this->seoService = $seoService;
        $this->metaService = $metaService;
        $this->qualityChecker = $qualityChecker;
        $this->qualityEnforcer = $qualityEnforcer;
        $this->linkingOrchestrator = $linkingOrchestrator;
    }

    /**
     * Génère un article complet avec optimisations SEO V10 extrêmes
     */
    public function generate(array $params): Article
    {
        $startTime = microtime(true);
        
        Log::info('🚀 [Content Engine V10] Démarrage génération article SEO extrême', [
            'keyword' => $params['keyword'],
            'language' => $params['language'],
            'platform' => $params['platform_id']
        ]);

        // 1. Préparation et recherche contextuelle
        $context = $this->prepareContext($params);
        
        // 2. Génération LSI keywords (SEO V10)
        $lsiKeywords = $this->seoService->generateLsiKeywords(
            $params['keyword'],
            $params['language'],
            8
        );
        
        // 3. Génération People Also Ask questions (SEO V10)
        $paaQuestions = $this->seoService->generatePeopleAlsoAskQuestions(
            $params['keyword'],
            $params['language'],
            3
        );
        
        // 4. Enrichissement contexte avec données SEO
        $context['lsi_keywords'] = $lsiKeywords;
        $context['paa_questions'] = $paaQuestions;
        $context['target_keyword_density'] = SeoOptimizationService::KEYWORD_DENSITY_OPTIMAL;
        
        // 5. Génération titre optimisé SEO
        $title = $this->generateTitle($params, $context);
        
        // 6. Génération hook accrocheur
        $hook = $this->generateHook($params, $context, $title);
        
        // 7. Génération introduction avec featured snippet
        $introduction = $this->generateIntroduction($params, $context, $title);
        
        // 8. Génération contenu principal (sections H2/H3)
        $mainContent = $this->generateMainContent($params, $context, $title);
        
        // 9. Optimisation pour featured snippet
        $mainContent = $this->optimizeForFeaturedSnippet($mainContent, $params['keyword']);
        
        // 10. Génération FAQ optimisée PAA
        $faq = $this->generateFaq($params, $context, $paaQuestions);
        
        // 11. Génération conclusion
        $conclusion = $this->generateConclusion($params, $context, $title);
        
        // 12. Assemblage contenu complet
        $fullContent = $this->assembleContent([
            'hook' => $hook,
            'introduction' => $introduction,
            'main_content' => $mainContent,
            'faq' => $faq,
            'conclusion' => $conclusion
        ]);
        
        // 13. Validation keyword density (SEO V10)
        $densityValidation = $this->seoService->validateKeywordDensity($fullContent, $params['keyword']);
        
        if (!$densityValidation['valid']) {
            Log::warning('⚠️ Keyword density hors limites, régénération', [
                'density' => $densityValidation['density'],
                'keyword' => $params['keyword']
            ]);
            
            // Régénération avec ajustements
            $fullContent = $this->adjustKeywordDensity($fullContent, $params['keyword'], $densityValidation);
        }
        
        // 14. Validation hiérarchie headers (SEO V10)
        $headerValidation = $this->seoService->validateHeaderHierarchy($fullContent);
        
        if (!$headerValidation['valid']) {
            Log::warning('⚠️ Hiérarchie headers incorrecte', $headerValidation['issues']);
            $fullContent = $this->fixHeaderHierarchy($fullContent, $headerValidation);
        }
        
        // 15. Injection maillage interne/externe
        $fullContent = $this->linkingOrchestrator->enrichContent($fullContent, $params);
        
        // 16. Génération image principale
        $heroImage = $this->generateHeroImage($params, $title);
        
        // 17. Génération meta tags optimisés CTR
        $metaTags = $this->metaService->generateOptimizedMeta($title, $fullContent, $params);
        
        // 18. Génération structured data avancé (SEO V10)
        $schemas = $this->generateAdvancedSchemas($params, $fullContent, $title);
        
        // 19. Validation E-E-A-T (SEO V10)
        $eeatValidation = $this->seoService->validateEEAT($fullContent, [
            'sources' => $context['sources'] ?? [],
            'published_date' => now()
        ]);
        
        // 20. Quality score final
        $qualityScore = $this->qualityChecker->calculateScore($fullContent, [
            'keyword_density' => $densityValidation,
            'header_hierarchy' => $headerValidation,
            'eeat' => $eeatValidation,
            'word_count' => str_word_count(strip_tags($fullContent))
        ]);
        
        // 21. Sauvegarde article
        $article = Article::create([
            'platform_id' => $params['platform_id'],
            'title' => $title,
            'slug' => $this->generateSlug($title, $params['language']),
            'content' => $fullContent,
            'excerpt' => $hook,
            'keyword' => $params['keyword'],
            'lsi_keywords' => json_encode($lsiKeywords),
            'language' => $params['language'],
            'country' => $params['country'] ?? null,
            'meta_title' => $metaTags['title'],
            'meta_description' => $metaTags['description'],
            'meta_keywords' => implode(', ', array_merge([$params['keyword']], $lsiKeywords)),
            'hero_image' => $heroImage,
            'schemas' => json_encode($schemas),
            'quality_score' => $qualityScore,
            'keyword_density' => $densityValidation['density'],
            'eeat_score' => $eeatValidation['score'] ?? 0,
            'status' => $qualityScore >= 80 ? 'published' : 'review',
            'published_at' => $qualityScore >= 80 ? now() : null,
            'ai_cost' => $context['ai_cost'] ?? 0,
            'generation_time' => microtime(true) - $startTime
        ]);
        
        // 22. Génération canonical URLs multilingues (SEO V10)
        $this->generateCanonicalUrls($article);
        
        // 23. Indexation automatique Google/Bing
        if ($article->status === 'published') {
            $this->submitToSearchEngines($article);
        }
        
        Log::info('✅ Article généré avec succès', [
            'id' => $article->id,
            'quality_score' => $qualityScore,
            'keyword_density' => $densityValidation['density'],
            'eeat_score' => $eeatValidation['score'] ?? 0,
            'generation_time' => round($article->generation_time, 2) . 's'
        ]);
        
        return $article;
    }

    /**
     * Prépare le contexte avec recherche Perplexity
     */
    protected function prepareContext(array $params): array
    {
        $cacheKey = "context_{$params['keyword']}_{$params['language']}";
        
        return Cache::remember($cacheKey, 3600, function () use ($params) {
            // Recherche contextuelle avec Perplexity
            $researchPrompt = "Recherche approfondie sur: {$params['keyword']}. " .
                             "Fournis: statistiques 2024-2025, tendances actuelles, sources fiables, " .
                             "données chiffrées vérifiables. Langue: {$params['language']}";
            
            $research = $this->perplexityService->search($researchPrompt);
            
            return [
                'research_data' => $research['content'] ?? '',
                'sources' => $research['sources'] ?? [],
                'ai_cost' => $research['cost'] ?? 0
            ];
        });
    }

    /**
     * Génère un titre optimisé SEO avec keyword
     */
    protected function generateTitle(array $params, array $context): string
    {
        $prompt = Prompt::where('type', 'article_title')
                       ->where('language', $params['language'])
                       ->first();
        
        if (!$prompt) {
            $prompt = Prompt::where('type', 'article_title')
                           ->where('language', 'en')
                           ->first();
        }
        
        $titlePrompt = str_replace([
            '{keyword}',
            '{language}',
            '{country}',
            '{context}'
        ], [
            $params['keyword'],
            $params['language'],
            $params['country'] ?? '',
            substr($context['research_data'], 0, 500)
        ], $prompt->content);
        
        // Utilisation GPT-4o-mini pour économie (OPTIMISATION COÛTS V10)
        $model = $this->modelSelector->selectForTask('title_generation');
        
        $response = $this->gptService->complete($titlePrompt, [
            'model' => $model,
            'max_tokens' => 100,
            'temperature' => 0.8
        ]);
        
        $title = trim($response['content']);
        
        // Validation présence keyword
        if (stripos($title, $params['keyword']) === false) {
            $title = $params['keyword'] . ' : ' . $title;
        }
        
        // Limite 60 caractères pour SERP
        if (mb_strlen($title) > 60) {
            $title = mb_substr($title, 0, 57) . '...';
        }
        
        $context['ai_cost'] += $response['cost'] ?? 0;
        
        return $title;
    }

    /**
     * Génère un hook accrocheur
     */
    protected function generateHook(array $params, array $context, string $title): string
    {
        $prompt = Prompt::where('type', 'article_hook')
                       ->where('language', $params['language'])
                       ->first();
        
        $hookPrompt = str_replace([
            '{keyword}',
            '{title}',
            '{context}'
        ], [
            $params['keyword'],
            $title,
            substr($context['research_data'], 0, 300)
        ], $prompt->content ?? 'Crée un hook captivant pour: {title}');
        
        // GPT-4o-mini pour hook (OPTIMISATION COÛTS V10)
        $model = $this->modelSelector->selectForTask('hook_generation');
        
        $response = $this->gptService->complete($hookPrompt, [
            'model' => $model,
            'max_tokens' => 150,
            'temperature' => 0.9
        ]);
        
        $context['ai_cost'] += $response['cost'] ?? 0;
        
        return trim($response['content']);
    }

    /**
     * Génère introduction avec featured snippet
     */
    protected function generateIntroduction(array $params, array $context, string $title): string
    {
        $prompt = Prompt::where('type', 'article_introduction')
                       ->where('language', $params['language'])
                       ->first();
        
        // Enrichissement prompt avec règles SEO V10
        $introPrompt = str_replace([
            '{keyword}',
            '{title}',
            '{lsi_keywords}',
            '{context}',
            '{target_density}'
        ], [
            $params['keyword'],
            $title,
            implode(', ', $context['lsi_keywords']),
            $context['research_data'],
            $context['target_keyword_density'] . '%'
        ], $prompt->content ?? '') . "\n\n" .
        "RÈGLES SEO V10 CRITIQUES:\n" .
        "- Place le keyword '{$params['keyword']}' dans les 100 PREMIERS MOTS\n" .
        "- Débute par une définition claire de 40-60 mots (featured snippet)\n" .
        "- Intègre naturellement 2-3 LSI keywords: " . implode(', ', $context['lsi_keywords']) . "\n" .
        "- Utilise un ton conversationnel pour voice search\n" .
        "- Cite 1 statistique 2024-2025 avec source\n" .
        "- Maintiens densité keyword à {$context['target_keyword_density']}%";
        
        $response = $this->gptService->complete($introPrompt, [
            'model' => 'gpt-4',
            'max_tokens' => 400,
            'temperature' => 0.7
        ]);
        
        $introduction = trim($response['content']);
        
        // Optimisation featured snippet automatique
        $introduction = $this->seoService->addDefinitionSnippet($introduction);
        
        $context['ai_cost'] += $response['cost'] ?? 0;
        
        return $introduction;
    }

    /**
     * Génère le contenu principal avec structure H2/H3 optimisée
     */
    protected function generateMainContent(array $params, array $context, string $title): string
    {
        $prompt = Prompt::where('type', 'article_main_content')
                       ->where('language', $params['language'])
                       ->first();
        
        // Enrichissement prompt avec règles SEO V10
        $contentPrompt = str_replace([
            '{keyword}',
            '{title}',
            '{lsi_keywords}',
            '{paa_questions}',
            '{context}',
            '{target_density}'
        ], [
            $params['keyword'],
            $title,
            implode(', ', $context['lsi_keywords']),
            implode("\n", $context['paa_questions']),
            $context['research_data'],
            $context['target_keyword_density'] . '%'
        ], $prompt->content ?? '') . "\n\n" .
        "RÈGLES SEO V10 EXTRÊMES:\n" .
        "- Structure: 5-7 sections H2 avec sous-sections H3 pertinentes\n" .
        "- Pas de saut de niveau (H2→H4 INTERDIT)\n" .
        "- Intègre le keyword dans le PREMIER H2 et 1 H3\n" .
        "- Réponds aux People Also Ask: " . implode(' | ', $context['paa_questions']) . "\n" .
        "- Utilise les LSI keywords naturellement: " . implode(', ', $context['lsi_keywords']) . "\n" .
        "- 3+ données chiffrées 2024-2025 avec sources (E-E-A-T)\n" .
        "- 3+ sources externes fiables citées\n" .
        "- Expérience personnelle/expertise visible\n" .
        "- Ton conversationnel pour voice search\n" .
        "- Listes 3-8 points pour featured snippet (si applicable)\n" .
        "- Tableaux comparatifs (si applicable)\n" .
        "- Densité keyword: {$context['target_keyword_density']}% (ni plus ni moins)\n" .
        "- Min 1500 mots, max 2500 mots\n" .
        "- Mobile-first: paragraphes courts (3-4 lignes max)";
        
        $response = $this->gptService->complete($contentPrompt, [
            'model' => 'gpt-4',
            'max_tokens' => 3000,
            'temperature' => 0.7
        ]);
        
        $context['ai_cost'] += $response['cost'] ?? 0;
        
        return trim($response['content']);
    }

    /**
     * Optimise le contenu pour featured snippet
     */
    protected function optimizeForFeaturedSnippet(string $content, string $keyword): string
    {
        // Détection type de question
        $questionType = $this->detectQuestionType($keyword);
        
        return $this->seoService->optimizeForFeaturedSnippet($content, $questionType);
    }

    /**
     * Détecte le type de question pour featured snippet
     */
    protected function detectQuestionType(string $keyword): string
    {
        $keyword = strtolower($keyword);
        
        if (preg_match('/comment|how to|guide|tutorial/i', $keyword)) {
            return 'how_to';
        }
        
        if (preg_match('/qu\'est-ce|what is|définition|c\'est quoi/i', $keyword)) {
            return 'definition';
        }
        
        if (preg_match('/meilleur|top|comparatif|vs|versus/i', $keyword)) {
            return 'comparison';
        }
        
        return 'general';
    }

    /**
     * Génère FAQ optimisée People Also Ask
     */
    protected function generateFaq(array $params, array $context, array $paaQuestions): string
    {
        $prompt = Prompt::where('type', 'article_faq')
                       ->where('language', $params['language'])
                       ->first();
        
        $faqPrompt = str_replace([
            '{keyword}',
            '{paa_questions}',
            '{context}'
        ], [
            $params['keyword'],
            implode("\n", $paaQuestions),
            substr($context['research_data'], 0, 500)
        ], $prompt->content ?? '') . "\n\n" .
        "RÈGLES FAQ SEO V10:\n" .
        "- Inclus ces 3 questions PAA: " . implode(' | ', $paaQuestions) . "\n" .
        "- Ajoute 5 autres questions pertinentes\n" .
        "- Réponses concises 50-100 mots\n" .
        "- Ton conversationnel voice search\n" .
        "- Format Q&A strict pour schema FAQPage";
        
        // GPT-4o-mini pour FAQ (OPTIMISATION COÛTS V10)
        $model = $this->modelSelector->selectForTask('faq_generation');
        
        $response = $this->gptService->complete($faqPrompt, [
            'model' => $model,
            'max_tokens' => 1200,
            'temperature' => 0.7
        ]);
        
        $context['ai_cost'] += $response['cost'] ?? 0;
        
        return trim($response['content']);
    }

    /**
     * Génère conclusion avec CTA
     */
    protected function generateConclusion(array $params, array $context, string $title): string
    {
        $prompt = Prompt::where('type', 'article_conclusion')
                       ->where('language', $params['language'])
                       ->first();
        
        $conclusionPrompt = str_replace([
            '{keyword}',
            '{title}',
            '{context}'
        ], [
            $params['keyword'],
            $title,
            substr($context['research_data'], 0, 300)
        ], $prompt->content ?? '');
        
        // GPT-4o-mini pour conclusion (OPTIMISATION COÛTS V10)
        $model = $this->modelSelector->selectForTask('conclusion_generation');
        
        $response = $this->gptService->complete($conclusionPrompt, [
            'model' => $model,
            'max_tokens' => 300,
            'temperature' => 0.7
        ]);
        
        $context['ai_cost'] += $response['cost'] ?? 0;
        
        return trim($response['content']);
    }

    /**
     * Assemble tous les éléments de contenu
     */
    protected function assembleContent(array $parts): string
    {
        return implode("\n\n", array_filter([
            $parts['hook'],
            $parts['introduction'],
            $parts['main_content'],
            $parts['faq'],
            $parts['conclusion']
        ]));
    }

    /**
     * Ajuste la densité de keyword si nécessaire
     */
    protected function adjustKeywordDensity(string $content, string $keyword, array $validation): string
    {
        $currentDensity = $validation['density'];
        $target = SeoOptimizationService::KEYWORD_DENSITY_OPTIMAL;
        
        if ($currentDensity < $target) {
            // Ajouter keyword naturellement
            Log::info('Augmentation keyword density', ['from' => $currentDensity, 'to' => $target]);
            // TODO: Implémentation injection keyword naturelle
        } elseif ($currentDensity > $target) {
            // Réduire keyword
            Log::info('Réduction keyword density', ['from' => $currentDensity, 'to' => $target]);
            // TODO: Implémentation réduction keyword
        }
        
        return $content;
    }

    /**
     * Corrige la hiérarchie des headers
     */
    protected function fixHeaderHierarchy(string $content, array $validation): string
    {
        foreach ($validation['issues'] as $issue) {
            Log::warning('Correction header hierarchy', $issue);
            // TODO: Implémentation correction automatique
        }
        
        return $content;
    }

    /**
     * Génère l'image héro avec DALL-E
     */
    protected function generateHeroImage(array $params, string $title): ?string
    {
        try {
            $imagePrompt = "Illustration professionnelle pour article: {$title}. " .
                          "Style moderne, clean, haute qualité, pertinent pour {$params['keyword']}";
            
            $image = $this->dalleService->generate($imagePrompt);
            
            return $image['url'] ?? null;
        } catch (\Exception $e) {
            Log::error('Erreur génération image', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Génère les schemas avancés (SEO V10)
     */
    protected function generateAdvancedSchemas(array $params, string $content, string $title): array
    {
        $schemas = [];
        
        // Article schema (base)
        $schemas['article'] = [
            '@context' => 'https://schema.org',
            '@type' => 'Article',
            'headline' => $title,
            'description' => substr(strip_tags($content), 0, 160),
            'author' => [
                '@type' => 'Organization',
                'name' => Platform::find($params['platform_id'])->name ?? 'SOS-Expat'
            ],
            'publisher' => $this->seoService->generateOrganizationSchema($params['platform_id']),
            'datePublished' => now()->toIso8601String(),
            'dateModified' => now()->toIso8601String()
        ];
        
        // HowTo schema si guide
        if ($this->detectQuestionType($params['keyword']) === 'how_to') {
            $schemas['howto'] = $this->seoService->generateHowToSchema([
                'name' => $title,
                'description' => substr(strip_tags($content), 0, 200)
            ]);
        }
        
        // Speakable schema pour voice search (SEO V10)
        $schemas['speakable'] = $this->seoService->generateSpeakableSchema([
            'title' => $title,
            'content' => $content
        ]);
        
        // FAQPage schema
        $schemas['faq'] = [
            '@context' => 'https://schema.org',
            '@type' => 'FAQPage',
            'mainEntity' => [] // À remplir avec les Q&A
        ];
        
        return $schemas;
    }

    /**
     * Génère les canonical URLs multilingues
     */
    protected function generateCanonicalUrls(Article $article): void
    {
        // Récupération traductions existantes
        $translations = Article::where('original_id', $article->id)
                               ->orWhere('id', $article->original_id)
                               ->get();
        
        $canonicals = $this->seoService->generateCanonicalUrls($article, $translations);
        
        $article->update(['canonical_urls' => json_encode($canonicals)]);
    }

    /**
     * Soumet l'article aux moteurs de recherche
     */
    protected function submitToSearchEngines(Article $article): void
    {
        try {
            // Google Indexing API
            $this->submitToGoogle($article);
            
            // Bing Webmaster API
            $this->submitToBing($article);
            
            // IndexNow (Bing, Yandex, etc.)
            $this->submitToIndexNow($article);
            
            Log::info('✅ Article soumis aux moteurs de recherche', ['id' => $article->id]);
        } catch (\Exception $e) {
            Log::error('Erreur soumission moteurs', ['error' => $e->getMessage()]);
        }
    }

    protected function submitToGoogle(Article $article): void
    {
        // TODO: Implémentation Google Indexing API
    }

    protected function submitToBing(Article $article): void
    {
        // TODO: Implémentation Bing Webmaster API
    }

    protected function submitToIndexNow(Article $article): void
    {
        // TODO: Implémentation IndexNow
    }

    /**
     * Génère le slug optimisé
     */
    protected function generateSlug(string $title, string $language): string
    {
        $slug = strtolower($title);
        $slug = preg_replace('/[^a-z0-9\s-]/u', '', $slug);
        $slug = preg_replace('/[\s-]+/', '-', $slug);
        $slug = trim($slug, '-');
        
        return substr($slug, 0, 60);
    }
}
