<?php

namespace App\Services\Content;

use App\Models\Article;
use App\Models\Country;
use App\Models\Language;
use App\Models\Theme;
use App\Models\Platform;
use App\Models\ProviderType;
use App\Models\LawyerSpecialty;
use App\Models\ExpatDomain;
use App\Models\InternalLink;
use App\Models\ExternalLink;
use App\Services\AI\GptService;
use App\Services\AI\PerplexityService;
use App\Services\AI\DalleService;
use App\Services\Content\PlatformKnowledgeService;
use App\Services\Content\BrandValidationService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * ArticleGenerator - Orchestrateur principal de génération de contenu
 * 
 * Coordonne tous les services (IA, titres, liens, qualité) pour créer
 * des articles complets et optimisés SEO pour expatriés.
 * 
 * Architecture :
 * - generate() : Point d'entrée principal, orchestration complète
 * - generateTitle() : Utilise TitleService avec anti-doublon SHA256
 * - generateHook() : Accroche 20-40 mots avec chiffre clé
 * - generateIntroduction() : Structure AIDA 100-150 mots
 * - generateContent() : 6-8 sections H2, réponses questions GEO
 * - generateFaqs() : 8 questions variées pour rich snippets
 * 
 * @package App\Services\Content
 */
class ArticleGenerator
{
    protected GptService $gpt;
    protected PerplexityService $perplexity;
    protected DalleService $dalle;
    protected TitleService $titleService;
    protected LinkService $linkService;
    protected QualityChecker $qualityChecker;
    protected PlatformKnowledgeService $knowledgeService;
    protected BrandValidationService $brandValidator;

    // Configuration génération
    protected array $config = [
        'word_count_min' => 1200,
        'word_count_target' => 1500,
        'word_count_max' => 2000,
        'sections_min' => 6,
        'sections_max' => 8,
        'faqs_count' => 8,
        'hook_words_min' => 20,
        'hook_words_max' => 40,
        'intro_words_min' => 100,
        'intro_words_max' => 150,
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
        PlatformKnowledgeService $knowledgeService,
        BrandValidationService $brandValidator
    ) {
        $this->gpt = $gpt;
        $this->perplexity = $perplexity;
        $this->dalle = $dalle;
        $this->titleService = $titleService;
        $this->linkService = $linkService;
        $this->qualityChecker = $qualityChecker;
        $this->knowledgeService = $knowledgeService;
        $this->brandValidator = $brandValidator;
    }

    /**
     * Générer un article complet
     * 
     * @param array $params Paramètres de génération :
     *   - platform_id (required) : ID plateforme (sos-expat, ulixai...)
     *   - country_id (required) : ID pays
     *   - language_code (required) : Code langue (fr, en, de...)
     *   - theme_id (required) : ID thème
     *   - provider_type_id (optional) : ID type prestataire
     *   - lawyer_specialty_id (optional) : ID spécialité avocat
     *   - expat_domain_id (optional) : ID domaine expat
     *   - word_count (optional) : Nombre de mots cible
     *   - generate_image (optional) : Générer image DALL-E (défaut: false)
     *   - use_perplexity (optional) : Utiliser Perplexity pour sources (défaut: true)
     * 
     * @return Article Article créé et sauvegardé en base
     * @throws \Exception Si paramètres invalides ou génération échoue
     */
    public function generate(array $params): Article
    {
        $this->stats['start_time'] = microtime(true);
        
        try {
            // 1. VALIDATION ET CHARGEMENT DES ENTITÉS
            $context = $this->validateAndLoadContext($params);
            
            Log::info('ArticleGenerator: Démarrage génération', [
                'platform' => $context['platform']->slug,
                'country' => $context['country']->name,
                'language' => $context['language']->code,
                'theme' => $context['theme']->name,
            ]);

            // 2. GÉNÉRATION DU TITRE (avec anti-doublon SHA256)
            $title = $this->generateTitle($context);
            $this->stats['gpt_calls']++;

            // 3. GÉNÉRATION DE L'ACCROCHE (hook)
            $hook = $this->generateHook($context, $title);
            $this->stats['gpt_calls']++;

            // 4. RECHERCHE DE SOURCES (Perplexity)
            $sources = null;
            if ($params['use_perplexity'] ?? true) {
                $sources = $this->fetchSources($context, $title);
                $this->stats['perplexity_calls']++;
            }

            // 5. GÉNÉRATION DE L'INTRODUCTION (AIDA)
            $introduction = $this->generateIntroduction($context, $title, $hook, $sources);
            $this->stats['gpt_calls']++;

            // 6. GÉNÉRATION DU CONTENU PRINCIPAL (6-8 sections H2)
            $content = $this->generateContent($context, $title, $sources);
            $this->stats['gpt_calls']++;

            // 7. GÉNÉRATION DES FAQs (8 questions)
            $faqs = $this->generateFaqs($context, $title, $content);
            $this->stats['gpt_calls']++;

            // 8. ASSEMBLAGE HTML COMPLET
            $fullContent = $this->assembleFullContent([
                'hook' => $hook,
                'introduction' => $introduction,
                'content' => $content,
                'faqs' => $faqs,
            ]);

            // 9. INSERTION DES LIENS (internes, externes, affiliés, CTA)
            $fullContent = $this->linkService->insertLinks($fullContent, $context);

            // 10. GÉNÉRATION DES META (SEO)
            $meta = $this->generateMeta($context, $title, $fullContent);
            $this->stats['gpt_calls']++;

            // 11. GÉNÉRATION DE L'IMAGE (optionnel)
            $imageId = null;
            if ($params['generate_image'] ?? false) {
                $imageId = $this->generateFeaturedImage($context, $title);
                $this->stats['dalle_calls']++;
            }

            // 12. CALCUL DU SCORE QUALITÉ
            $qualityScore = $this->qualityChecker->check([
                'title' => $title,
                'content' => $fullContent,
                'meta' => $meta,
                'faqs' => $faqs,
                'sources' => $sources,
            ]);

            // 13. CRÉATION DE L'ARTICLE EN BASE
            $article = $this->createArticle([
                'context' => $context,
                'title' => $title,
                'hook' => $hook,
                'introduction' => $introduction,
                'content' => $fullContent,
                'faqs' => $faqs,
                'meta' => $meta,
                'image_id' => $imageId,
                'quality_score' => $qualityScore,
                'sources' => $sources,
                'word_count' => $this->countWords($fullContent),
            ]);

            // 14. STATISTIQUES FINALES
            $this->recordStats($article);

            Log::info('ArticleGenerator: Génération terminée avec succès', [
                'article_id' => $article->id,
                'title' => $title,
                'quality_score' => $qualityScore,
                'duration_seconds' => $this->stats['duration_seconds'],
                'total_cost' => $this->stats['total_cost'],
            ]);

            return $article;

        } catch (\Exception $e) {
            Log::error('ArticleGenerator: Échec génération', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'params' => $params,
            ]);
            throw $e;
        }
    }

    /**
     * Valider les paramètres et charger le contexte
     */
    protected function validateAndLoadContext(array $params): array
    {
        // Validation paramètres obligatoires
        $required = ['platform_id', 'country_id', 'language_code', 'theme_id'];
        foreach ($required as $field) {
            if (empty($params[$field])) {
                throw new \InvalidArgumentException("Le champ '{$field}' est obligatoire");
            }
        }

        // Chargement des entités
        $platform = Platform::findOrFail($params['platform_id']);
        $country = Country::findOrFail($params['country_id']);
        $language = Language::where('code', $params['language_code'])->firstOrFail();
        $theme = Theme::findOrFail($params['theme_id']);

        // Entités optionnelles
        $providerType = isset($params['provider_type_id']) 
            ? ProviderType::find($params['provider_type_id']) 
            : null;
        
        $lawyerSpecialty = isset($params['lawyer_specialty_id']) 
            ? LawyerSpecialty::find($params['lawyer_specialty_id']) 
            : null;
        
        $expatDomain = isset($params['expat_domain_id']) 
            ? ExpatDomain::find($params['expat_domain_id']) 
            : null;

        return [
            'platform' => $platform,
            'country' => $country,
            'language' => $language,
            'theme' => $theme,
            'provider_type' => $providerType,
            'lawyer_specialty' => $lawyerSpecialty,
            'expatDomain' => $expatDomain,
            'word_count' => $params['word_count'] ?? $this->config['word_count_target'],
        ];
    }

    /**
     * ✅ CORRIGÉ : Générer le titre avec TitleService et remplacer les variables
     */
    protected function generateTitle(array $context): string
    {
        // 1. Générer le titre avec TitleService
        $rawTitle = $this->titleService->generate($context);
        
        // 2. Préparer les variables de remplacement
        $specialty = $context['lawyer_specialty']?->name ?? '';
        $specialtyLower = mb_strtolower($specialty);
        
        $domain = $context['expatDomain']?->name ?? '';
        $domainLower = mb_strtolower($domain);
        
        $providerType = $context['provider_type']?->name ?? '';
        $providerTypeLower = mb_strtolower($providerType);
        
        // 3. Remplacer les variables dans le titre
        $finalTitle = str_replace(
            ['{specialty}', '{specialty_lower}', '{domain}', '{domain_lower}', '{provider_type}', '{provider_type_lower}', '{country}'],
            [$specialty, $specialtyLower, $domain, $domainLower, $providerType, $providerTypeLower, $context['country']->name],
            $rawTitle
        );
        
        
        
        Log::info('Titre généré et post-traité', [
            'raw' => $rawTitle,
            'final' => $finalTitle
        ]);
        
        return $finalTitle;
    }

    /**
     * Générer l'accroche (hook) 20-40 mots avec chiffre clé
     */
    protected function generateHook(array $context, string $title): string
    {
        $systemPrompt = "Tu es un expert en copywriting pour expatriés. " .
            "Tu crées des accroches percutantes qui captivent l'attention.";

        $userPrompt = <<<PROMPT
Crée une accroche (hook) pour cet article destiné aux expatriés français en {$context['country']->name}.

Titre de l'article : "{$title}"
Thème : {$context['theme']->name}
Langue : {$context['language']->native_name}

Règles strictes :
1. Exactement 20-40 mots
2. DOIT inclure un chiffre clé ou statistique percutante
3. Ton émotionnel et engageant
4. Crée urgence ou curiosité
5. Parle directement au lecteur (tu/vous)

Exemples de chiffres clés :
- "Plus de 15 000 Français vivent en Thaïlande..."
- "90% des expatriés ignorent cette démarche..."
- "En seulement 72h, vous pouvez..."

Réponds UNIQUEMENT avec l'accroche, sans guillemets ni commentaire.
PROMPT;

        $response = $this->gpt->chat([
            'model' => 'gpt-4o-mini',
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userPrompt],
            ],
            'temperature' => 0.8,
            'max_tokens' => 150,
        ]);

        $this->stats['total_cost'] += $response['cost'];

        return trim($response['content']);
    }

    /**
     * Rechercher des sources officielles avec Perplexity
     */
    protected function fetchSources(array $context, string $title): array
    {
        try {
            $result = $this->perplexity->findSources([
                'topic' => $title,
                'country' => $context['country']->name,
                'language' => $context['language']->code,
                'max_sources' => 5,
            ]);

            $this->stats['total_cost'] += $result['cost'] ?? 0;

            return $result['sources'] ?? [];

        } catch (\Exception $e) {
            Log::warning('ArticleGenerator: Échec récupération sources Perplexity', [
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    /**
     * Générer l'introduction (structure AIDA : 100-150 mots)
     */
    protected function generateIntroduction(array $context, string $title, string $hook, ?array $sources): string
    {
        $sourcesContext = '';
        if (!empty($sources)) {
            $sourcesContext = "\n\nSources officielles à mentionner si pertinent :\n";
            foreach (array_slice($sources, 0, 3) as $source) {
                $sourcesContext .= "- {$source['title']}\n";
            }
        }

        $systemPrompt = "Tu es un expert en rédaction d'introductions engageantes selon la méthode AIDA " .
            "(Attention, Intérêt, Désir, Action) pour contenus d'expatriation.";

        $userPrompt = <<<PROMPT
Rédige l'introduction de cet article pour expatriés français en {$context['country']->name}.

Titre : "{$title}"
Accroche : "{$hook}"
Thème : {$context['theme']->name}
Langue : {$context['language']->native_name}
{$sourcesContext}

Structure AIDA obligatoire :
1. ATTENTION (1-2 phrases) : Reprendre/développer l'accroche, poser la problématique
2. INTÉRÊT (2-3 phrases) : Pourquoi c'est important pour les expats
3. DÉSIR (2-3 phrases) : Bénéfices concrets de lire l'article
4. ACTION (1 phrase) : "Dans cet article, nous allons..."

Règles :
- Exactement 100-150 mots
- Ton empathique et rassurant
- Éviter le jargon technique
- Inclure 1-2 mots-clés SEO naturellement
- Format HTML avec balises <p>

Réponds en {$context['language']->native_name}.
PROMPT;

        $response = $this->gpt->chat([
            'model' => 'gpt-4o',
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userPrompt],
            ],
            'temperature' => 0.7,
            'max_tokens' => 500,
        ]);

        $this->stats['total_cost'] += $response['cost'];

        return trim($response['content']);
    }

    /**
     * Générer le contenu principal (6-8 sections H2 avec réponses GEO)
     */
    protected function generateContent(array $context, string $title, ?array $sources): string
    {
        $sectionsCount = rand($this->config['sections_min'], $this->config['sections_max']);
        $wordCountPerSection = (int) ($context['word_count'] / $sectionsCount);

        $sourcesContext = '';
        if (!empty($sources)) {
            $sourcesContext = "\n\nSources officielles disponibles :\n";
            foreach ($sources as $source) {
                $sourcesContext .= "- {$source['title']} ({$source['url']})\n";
            }
            $sourcesContext .= "\nCite ces sources quand pertinent.";
        }

        $systemPrompt = $this->buildContentSystemPrompt($context);

        $userPrompt = <<<PROMPT
Rédige le contenu principal de cet article pour expatriés français en {$context['country']->name}.

Titre : "{$title}"
Thème : {$context['theme']->name}
Pays : {$context['country']->name}
Langue : {$context['language']->native_name}
{$sourcesContext}

Structure attendue : {$sectionsCount} sections H2

Pour chaque section :
- Titre H2 clair et descriptif (~5-8 mots)
- Contenu : environ {$wordCountPerSection} mots
- Sous-sections H3 si nécessaire
- Listes à puces pour clarté
- Exemples concrets
- Points d'attention / pièges à éviter

Objectif GEO (Generative Engine Optimization) :
- Répondre aux questions que les gens se posent VRAIMENT
- Format scannable (titres, listes, paragraphes courts)
- Informations actionnables et pratiques
- Exemples réels et chiffrés

Règles SEO :
- Mots-clés naturels (pas de bourrage)
- Balises HTML sémantiques (<h2>, <h3>, <p>, <ul>, <li>, <strong>)
- Liens vers sources si mentionnées : <a href="URL" target="_blank" rel="noopener">texte</a>

Réponds en {$context['language']->native_name} avec le HTML complet.
PROMPT;

        $response = $this->gpt->chat([
            'model' => 'gpt-4o',
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userPrompt],
            ],
            'temperature' => 0.7,
            'max_tokens' => 4000,
        ]);

        $this->stats['total_cost'] += $response['cost'];

        return trim($response['content']);
    }

    /**
     * Générer les FAQs (8 questions variées)
     */
    protected function generateFaqs(array $context, string $title, string $content): array
    {
        $contentExcerpt = Str::limit(strip_tags($content), 2000);

        $systemPrompt = "Tu es un expert en création de FAQ optimisées pour rich snippets Google.";

        $userPrompt = <<<PROMPT
Génère {$this->config['faqs_count']} questions-réponses FAQ pour cet article destiné aux expatriés français en {$context['country']->name}.

Titre : "{$title}"
Pays : {$context['country']->name}
Extrait du contenu : {$contentExcerpt}

Règles strictes :
1. Questions VARIÉES : mélange "Quoi", "Comment", "Pourquoi", "Combien", "Quand", "Où"
2. Questions que les gens posent RÉELLEMENT (langage naturel)
3. Réponses concises : 50-100 mots par réponse
4. Ton direct et pratique
5. Inclure chiffres/délais précis quand possible
6. Éviter les questions trop génériques

Format de sortie (JSON strict) :
{{
  "faqs": [
    {{"question": "...", "answer": "..."}},
    {{"question": "...", "answer": "..."}},
    ...
  ]
}}

Réponds en {$context['language']->native_name} UNIQUEMENT avec le JSON, rien d'autre.
PROMPT;

        $response = $this->gpt->chat([
            'model' => 'gpt-4o-mini',
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userPrompt],
            ],
            'temperature' => 0.6,
            'max_tokens' => 2000,
        ]);

        $this->stats['total_cost'] += $response['cost'];

        try {
            $parsed = $this->gpt->parseJsonResponse($response['content']);
            return $parsed['faqs'] ?? [];
        } catch (\Exception $e) {
            Log::warning('ArticleGenerator: Échec parsing FAQs JSON', [
                'error' => $e->getMessage(),
                'response' => $response['content'],
            ]);
            return [];
        }
    }

    /**
     * Assembler le contenu HTML complet
     */
    protected function assembleFullContent(array $parts): string
    {
        $html = '';

        // Accroche
        if (!empty($parts['hook'])) {
            $html .= '<div class="article-hook">' . $parts['hook'] . '</div>' . "\n\n";
        }

        // Introduction
        if (!empty($parts['introduction'])) {
            $html .= '<div class="article-introduction">' . "\n";
            $html .= $parts['introduction'] . "\n";
            $html .= '</div>' . "\n\n";
        }

        // Contenu principal
        if (!empty($parts['content'])) {
            $html .= '<div class="article-content">' . "\n";
            $html .= $parts['content'] . "\n";
            $html .= '</div>' . "\n\n";
        }

        // FAQs
        if (!empty($parts['faqs'])) {
            $html .= '<div class="article-faqs">' . "\n";
            $html .= '<h2>Questions Fréquentes</h2>' . "\n";
            foreach ($parts['faqs'] as $faq) {
                $html .= '<div class="faq-item">' . "\n";
                $html .= '  <h3 class="faq-question">' . htmlspecialchars($faq['question']) . '</h3>' . "\n";
                $html .= '  <div class="faq-answer">' . "\n";
                $html .= '    <p>' . htmlspecialchars($faq['answer']) . '</p>' . "\n";
                $html .= '  </div>' . "\n";
                $html .= '</div>' . "\n";
            }
            $html .= '</div>' . "\n";
        }

        return $html;
    }

    /**
     * Générer les meta tags SEO
     */
    protected function generateMeta(array $context, string $title, string $content): array
    {
        $contentExcerpt = Str::limit(strip_tags($content), 1000);

        $meta = $this->gpt->generateMeta([
            'title' => $title,
            'content' => $contentExcerpt,
            'language' => $context['language']->code,
            'country' => $context['country']->name,
        ]);

        $this->stats['total_cost'] += $this->gpt->getLastRequestCost();

        return $meta;
    }

    /**
     * Générer l'image à la une avec DALL-E
     */
    protected function generateFeaturedImage(array $context, string $title): ?int
    {
        try {
            $image = $this->dalle->generateForArticle([
                'title' => $title,
                'theme' => $context['theme']->name,
                'country' => $context['country']->name,
                'style' => 'professional photography',
            ]);

            $this->stats['total_cost'] += $image->generation_cost;

            return $image->id;

        } catch (\Exception $e) {
            Log::warning('ArticleGenerator: Échec génération image', [
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Créer l'article en base de données
     */
    protected function createArticle(array $data): Article
    {
        $context = $data['context'];

        DB::beginTransaction();
        
        try {
            // 1. Créer l'article
            $article = Article::create([
                'platform_id' => $context['platform']->id,
                'country_id' => $context['country']->id,
                'language_id' => $context['language']->id,
                'theme_id' => $context['theme']->id,
                'type' => 'blog',
                
                'title' => $data['title'],
                'slug' => Str::slug($data['title']),
                'title_hash' => hash('sha256', $data['title']),
                
                'content' => $data['content'],
                'word_count' => $data['word_count'],
                'reading_time' => (int) ceil($data['word_count'] / 200),
                
                'meta_title' => $data['meta']['meta_title'] ?? Str::limit($data['title'], 60),
                'meta_description' => $data['meta']['meta_description'] ?? '',
                
                'quality_score' => $data['quality_score'],
                
                'status' => 'draft',
                
                'generation_cost' => $this->stats['total_cost'],
            ]);

            // ========== VALIDATION DOUBLE (Knowledge + Brand) ==========
            $knowledgeValidation = $this->knowledgeService->validateContent(
                $article->content,
                $context['platform'],
                $context['language']->code
            );

            $brandValidation = $this->brandValidator->validateCompliance(
                $article->content,
                $context['platform'],
                $context['language']->code
            );

            // Score global = moyenne des 2 validations
            $globalScore = ($knowledgeValidation['score'] + $brandValidation['score']) / 2;

            // Stocker résultats validation
            $article->quality_score = round($globalScore);
            $article->validation_notes = json_encode([
                'knowledge' => $knowledgeValidation,
                'brand' => $brandValidation,
                'global_score' => $globalScore,
                'validated_at' => now()->toISOString(),
            ], JSON_PRETTY_PRINT);

            // Déterminer status selon conformité
            if ($globalScore < 70 || !$knowledgeValidation['valid'] || !$brandValidation['compliant']) {
                $article->status = 'review_needed';
                
                Log::warning("Article #{$article->id} nécessite review", [
                    'knowledge_score' => $knowledgeValidation['score'],
                    'brand_score' => $brandValidation['score'],
                    'global_score' => $globalScore,
                    'knowledge_errors' => count($knowledgeValidation['errors']),
                    'brand_errors' => count($brandValidation['errors']),
                ]);
            } else {
                // Article conforme, peut rester en status actuel
                Log::info("Article #{$article->id} conforme", [
                    'global_score' => $globalScore,
                ]);
            }
            // ========== FIN VALIDATION DOUBLE ==========

            // Sauvegarder l'article avec les validations
            $article->save();

            // 2. ✅ Créer les FAQs en base avec language_id
            if (!empty($data['faqs'])) {
                foreach ($data['faqs'] as $index => $faq) {
                    $article->faqs()->create([
                        'question' => $faq['question'],
                        'answer' => $faq['answer'],
                        'language_id' => $context['language']->id,
                        'order' => $index + 1,
                    ]);
                }
            }

            // 3. ✅ Créer TitleHistory avec country_id
            try {
                \App\Models\TitleHistory::create([
                    'article_id' => $article->id,
                    'country_id' => $context['country']->id,
                    'language_id' => $context['language']->id,
                    'title' => $data['title'],
                    'title_hash' => hash('sha256', $data['title']),
                ]);
                
                Log::info('TitleHistory créé', ['article_id' => $article->id]);
            } catch (\Exception $e) {
                Log::error('Erreur création TitleHistory', [
                    'article_id' => $article->id,
                    'error' => $e->getMessage()
                ]);
            }

            // 4. ✅ Extraire et créer les liens internes
            $this->extractAndSaveInternalLinks($article, $data['content']);

            // 5. ✅ Extraire et créer les liens externes
            $this->extractAndSaveExternalLinks($article, $data['content']);

            DB::commit();
            
            return $article;
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('ArticleGenerator: Erreur création article', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * ✅ CORRIGÉ : Extraire et sauvegarder les liens internes
     */
    protected function extractAndSaveInternalLinks(Article $article, string $content): void
    {
        try {
            // Pattern pour liens internes (vers d'autres articles)
            preg_match_all(
                '/<a[^>]+href=["\']\/(article|blog)\/([^"\']+)["\'][^>]*>([^<]*)<\/a>/',
                $content,
                $matches,
                PREG_SET_ORDER
            );

            $savedCount = 0;
            foreach ($matches as $match) {
                $slug = $match[2] ?? '';
                $anchorText = strip_tags($match[3] ?? '');
                
                if (empty($slug)) {
                    continue;
                }

                // Trouver l'article cible
                $targetArticle = Article::where('slug', $slug)->first();
                
                if ($targetArticle) {
                    InternalLink::create([
                        'article_id' => $article->id,
                        'target_article_id' => $targetArticle->id,
                        'anchor_text' => mb_substr($anchorText, 0, 255),
                    ]);
                    
                    $savedCount++;
                }
            }

            Log::info('Liens internes extraits', [
                'article_id' => $article->id,
                'count' => $savedCount
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur extraction liens internes', [
                'article_id' => $article->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * ✅ CORRIGÉ : Extraire et sauvegarder les liens externes
     */
    protected function extractAndSaveExternalLinks(Article $article, string $content): void
    {
        try {
            // Pattern pour extraire les liens externes (https://...)
            preg_match_all(
                '/<a[^>]+href=["\'](https?:\/\/[^"\']+)["\'][^>]*>([^<]*)<\/a>/',
                $content,
                $matches,
                PREG_SET_ORDER
            );

            $savedCount = 0;
            foreach ($matches as $match) {
                $url = $match[1] ?? '';
                $anchorText = strip_tags($match[2] ?? '');
                
                if (empty($url)) {
                    continue;
                }

                // Extraire le domaine
                $parsedUrl = parse_url($url);
                $domain = $parsedUrl['host'] ?? '';

                // Vérifier si c'est un lien affilié
                $isAffiliate = str_contains($url, '[AFFILIATE_ID]') 
                    || str_contains($url, 'utm_campaign=sos-expat')
                    || str_contains($match[0], 'affiliate-link');

                // Créer le lien externe
                ExternalLink::create([
                    'article_id' => $article->id,
                    'url' => mb_substr($url, 0, 255),
                    'anchor_text' => mb_substr($anchorText, 0, 255),
                    'source' => $domain,
                    'is_affiliate' => $isAffiliate,
                ]);
                
                $savedCount++;
            }

            Log::info('Liens externes extraits', [
                'article_id' => $article->id,
                'count' => $savedCount
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur extraction liens externes', [
                'article_id' => $article->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Construire le prompt système pour le contenu
     */
    protected function buildContentSystemPrompt(array $context): string
    {
        // Injection PLATFORM KNOWLEDGE (270 entrées dynamiques)
        $knowledgeContext = $this->knowledgeService->getKnowledgeContext(
            $context['platform'],
            $context['language']->code,
            'articles'
        );
        
        // Fallback si pas de knowledge disponible
        $platformContext = !empty($knowledgeContext) 
            ? $knowledgeContext 
            : "Tu écris pour {$context['platform']->name}, plateforme d'aide aux expatriés.";

        return <<<PROMPT
{$platformContext}

Tu es un expert en expatriation avec connaissance approfondie des démarches administratives, 
juridiques et pratiques pour Français vivant à l'étranger.

Principes de rédaction :
✓ Empathie : Tu comprends les difficultés des expatriés
✓ Clarté : Informations précises, vérifiables, actuelles
✓ Utilité : Conseils actionnables avec exemples concrets
✓ Accessibilité : Évite jargon technique (ou explique-le)
✓ Structure : Titres clairs, paragraphes courts, listes
✓ SEO : Mots-clés naturels, balises sémantiques
PROMPT;
    }

    /**
     * Enregistrer les statistiques de génération
     */
    protected function recordStats(Article $article): void
    {
        $this->stats['end_time'] = microtime(true);
        $this->stats['duration_seconds'] = round($this->stats['end_time'] - $this->stats['start_time'], 2);
    }

    /**
     * Compter les mots dans un texte HTML
     */
    protected function countWords(string $html): int
    {
        $text = strip_tags($html);
        $text = preg_replace('/\s+/', ' ', $text);
        return str_word_count($text);
    }

    /**
     * Obtenir les statistiques de la dernière génération
     */
    public function getStats(): array
    {
        return $this->stats;
    }
}