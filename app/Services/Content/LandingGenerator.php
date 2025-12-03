<?php

namespace App\Services\Content;

use App\Models\Article;
use App\Models\ArticleFaq;
use App\Models\Country;
use App\Models\Language;
use App\Models\Platform;
use App\Services\Quality\ContentQualityEnforcer;
use App\Services\Quality\GoldenExamplesService;
use App\Services\AI\GptService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Service de génération de landing pages
 * 
 * Génère des landing pages optimisées pour la conversion avec sections personnalisables
 * 
 * Sections disponibles :
 * - Hero (obligatoire)
 * - Problème
 * - Solution  
 * - Avantages
 * - Comment ça marche
 * - Preuves sociales (désactivé par défaut)
 * - Tarifs (désactivé par défaut)
 * - FAQ
 * - CTA Final (obligatoire)
 * 
 * Support : 197 pays × 9 langues (fr, en, de, es, pt, ru, zh, ar, hi)
 */
class LandingGenerator
{
    protected GptService $gptService;
    protected LandingSectionManager $sectionManager;
    protected TestimonialService $testimonialService;

    public function __construct(
        GptService $gptService,
        LandingSectionManager $sectionManager,
        TestimonialService $testimonialService
    ) {
        $this->gptService = $gptService;
        $this->sectionManager = $sectionManager;
        $this->testimonialService = $testimonialService;
    }

    /**
     * Génère une landing page complète
     * 
     * @param array $params {
     *     @type int    $platform_id      ID de la plateforme
     *     @type int    $country_id       ID du pays (197 pays supportés)
     *     @type int    $language_id      ID de la langue (9 langues supportées)
     *     @type string $service          Service ou thème principal
     *     @type string $target_audience  Audience cible (optionnel)
     *     @type array  $keywords         Mots-clés SEO (optionnel)
     *     @type array  $sections_enabled Sections à inclure (optionnel)
     * }
     * @return Article
     */
    public function generate(array $params): Article
    {
        // Validation des paramètres
        $this->validateParams($params);

        // Récupération des entités
        $platform = Platform::findOrFail($params['platform_id']);
        $country = Country::findOrFail($params['country_id']);
        $language = Language::findOrFail($params['language_id']);

        // Construction du contexte
        $context = $this->buildContext($params, $platform, $country, $language);

        // Récupération des sections activées
        $enabledSections = $params['sections_enabled'] 
            ?? $this->sectionManager->getEnabledSections($params['platform_id']);

        Log::info('Génération landing page', [
            'platform' => $platform->name,
            'country' => $country->name,
            'language' => $language->code,
            'service' => $params['service'],
            'sections' => array_keys($enabledSections),
        ]);

        DB::beginTransaction();
        
        try {
            // Génération des sections
            $sections = [];

            // 1. Hero (obligatoire)
            $sections['hero'] = $this->generateHero($context);

            // 2. Problème
            if ($enabledSections['problem'] ?? true) {
                $sections['problem'] = $this->generateProblem($context);
            }

            // 3. Solution
            if ($enabledSections['solution'] ?? true) {
                $sections['solution'] = $this->generateSolution($context);
            }

            // 4. Avantages
            if ($enabledSections['advantages'] ?? true) {
                $sections['advantages'] = $this->generateAdvantages($context);
            }

            // 5. Comment ça marche
            if ($enabledSections['how_it_works'] ?? true) {
                $sections['how_it_works'] = $this->generateHowItWorks($context);
            }

            // 6. Preuves sociales (désactivé par défaut)
            if ($enabledSections['testimonials'] ?? false) {
                $sections['testimonials'] = $this->generateTestimonials(
                    $params['platform_id'],
                    $country->code,
                    $params['service'] ?? null
                );
            }

            // 7. Tarifs (désactivé par défaut)
            if ($enabledSections['pricing'] ?? false) {
                $sections['pricing'] = $this->generatePricing($params['platform_id']);
            }

            // 8. FAQ
            if ($enabledSections['faq'] ?? true) {
                $sections['faq'] = $this->generateFaq($context);
            }

            // 9. CTA Final (obligatoire)
            $sections['final_cta'] = $this->generateFinalCta($context);

            // Assemblage du contenu HTML
            $content = $this->assembleContent($sections, $context);

            // Création de l'article
            $article = Article::create([
                'uuid' => (string) Str::uuid(),
                'platform_id' => $params['platform_id'],
                'country_id' => $params['country_id'],
                'language_id' => $params['language_id'],
                'type' => Article::TYPE_LANDING,
                'title' => $sections['hero']['title'],
                'slug' => $this->generateSlug($sections['hero']['title'], $platform, $country, $language),
                'excerpt' => $sections['hero']['subtitle'],
                'content' => $content,
                'word_count' => str_word_count(strip_tags($content)),
                'reading_time' => max(1, (int) ceil(str_word_count(strip_tags($content)) / 200)),
                'meta_title' => $this->generateMetaTitle($sections['hero']['title']),
                'meta_description' => $this->generateMetaDescription($sections['hero']['subtitle']),
                'json_ld' => $this->generateJsonLd($sections, $context),
                'status' => Article::STATUS_DRAFT,
                'quality_score' => 0,
                'theme_type' => 'service',
                'theme_id' => $params['service_id'] ?? null,
            ]);

            // Sauvegarde des FAQs
            if (isset($sections['faq'])) {
                $this->saveFaqs($article, $sections['faq']);
            }

            DB::commit();

            Log::info('Landing page générée avec succès', [
                'article_id' => $article->id,
                'uuid' => $article->uuid,
                'word_count' => $article->word_count,
            ]);

            return $article->fresh(['country', 'language', 'platform', 'faqs']);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Erreur génération landing page', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'params' => $params,
            ]);
            
            throw $e;
        }
    }

    /**
     * Génère la section Hero
     */
    public function generateHero(array $context): array
    {
        $prompt = $this->buildHeroPrompt($context);
        
        $response = $this->gptService->chat([
            'model' => GptService::MODEL_GPT4O,
            'messages' => [
                ['role' => 'user', 'content' => $prompt]
            ],
            'temperature' => 0.7,
            'max_tokens' => 500,
        ]);

        $data = $this->parseJsonResponse($response['content']);

        return [
            'title' => $data['title'] ?? $this->generateDefaultTitle($context),
            'subtitle' => $data['subtitle'] ?? '',
            'cta_text' => $data['cta_text'] ?? $this->getDefaultCtaText($context['language_code']),
            'badges' => $data['badges'] ?? [],
        ];
    }

    /**
     * Génère la section Problème
     */
    public function generateProblem(array $context, int $points = 4): array
    {
        $prompt = $this->buildProblemPrompt($context, $points);
        
        $response = $this->gptService->chat([
            'model' => GptService::MODEL_GPT4O,
            'messages' => [
                ['role' => 'user', 'content' => $prompt]
            ],
            'temperature' => 0.8,
            'max_tokens' => 800,
        ]);

        $data = $this->parseJsonResponse($response['content']);

        $problems = [];
        foreach ($data['problems'] ?? [] as $problem) {
            $problems[] = [
                'icon' => $problem['icon'] ?? '❌',
                'title' => $problem['title'] ?? '',
                'description' => $problem['description'] ?? '',
            ];
        }

        return $problems;
    }

    /**
     * Génère la section Solution
     */
    public function generateSolution(array $context): string
    {
        $prompt = $this->buildSolutionPrompt($context);
        
        $response = $this->gptService->chat([
            'model' => GptService::MODEL_GPT4O,
            'messages' => [
                ['role' => 'user', 'content' => $prompt]
            ],
            'temperature' => 0.7,
            'max_tokens' => 600,
        ]);

        return $response['content'];
    }

    /**
     * Génère la section Avantages
     */
    public function generateAdvantages(array $context, int $count = 6): array
    {
        $prompt = $this->buildAdvantagesPrompt($context, $count);
        
        $response = $this->gptService->chat([
            'model' => GptService::MODEL_GPT4O,
            'messages' => [
                ['role' => 'user', 'content' => $prompt]
            ],
            'temperature' => 0.8,
            'max_tokens' => 1200,
        ]);

        $data = $this->parseJsonResponse($response['content']);

        $advantages = [];
        foreach ($data['advantages'] ?? [] as $advantage) {
            $advantages[] = [
                'icon' => $advantage['icon'] ?? '✓',
                'title' => $advantage['title'] ?? '',
                'description' => $advantage['description'] ?? '',
            ];
        }

        return $advantages;
    }

    /**
     * Génère la section Comment ça marche
     */
    public function generateHowItWorks(array $context, int $steps = 4): array
    {
        $prompt = $this->buildHowItWorksPrompt($context, $steps);
        
        $response = $this->gptService->chat([
            'model' => GptService::MODEL_GPT4O,
            'messages' => [
                ['role' => 'user', 'content' => $prompt]
            ],
            'temperature' => 0.7,
            'max_tokens' => 1000,
        ]);

        $data = $this->parseJsonResponse($response['content']);

        $steps = [];
        $stepNumber = 1;
        foreach ($data['steps'] ?? [] as $step) {
            $steps[] = [
                'number' => $stepNumber++,
                'title' => $step['title'] ?? '',
                'description' => $step['description'] ?? '',
            ];
        }

        return $steps;
    }

    /**
     * Génère la section Preuves sociales (témoignages)
     */
    public function generateTestimonials(int $platformId, string $countryCode, ?string $service, int $count = 3): array
    {
        return $this->testimonialService->getForLanding($platformId, $countryCode, $service, $count);
    }

    /**
     * Génère la section Tarifs
     */
    public function generatePricing(int $platformId): ?array
    {
        // Cette méthode sera appelée uniquement si la section tarifs est activée
        // Les tarifs doivent être configurés manuellement dans une table pricing_plans
        
        Log::info('Section tarifs demandée mais non configurée', [
            'platform_id' => $platformId,
        ]);

        return null;
    }

    /**
     * Génère la section FAQ
     */
    public function generateFaq(array $context, int $count = 6): array
    {
        $prompt = $this->buildFaqPrompt($context, $count);
        
        $response = $this->gptService->chat([
            'model' => GptService::MODEL_GPT4O,
            'messages' => [
                ['role' => 'user', 'content' => $prompt]
            ],
            'temperature' => 0.7,
            'max_tokens' => 1500,
        ]);

        $data = $this->parseJsonResponse($response['content']);

        $faqs = [];
        foreach ($data['faqs'] ?? [] as $faq) {
            $faqs[] = [
                'question' => $faq['question'] ?? '',
                'answer' => $faq['answer'] ?? '',
            ];
        }

        return $faqs;
    }

    /**
     * Génère le CTA Final
     */
    public function generateFinalCta(array $context): array
    {
        $prompt = $this->buildFinalCtaPrompt($context);
        
        $response = $this->gptService->chat([
            'model' => GptService::MODEL_GPT4O,
            'messages' => [
                ['role' => 'user', 'content' => $prompt]
            ],
            'temperature' => 0.7,
            'max_tokens' => 300,
        ]);

        $data = $this->parseJsonResponse($response['content']);

        return [
            'title' => $data['title'] ?? '',
            'subtitle' => $data['subtitle'] ?? '',
            'cta_text' => $data['cta_text'] ?? $this->getDefaultCtaText($context['language_code']),
        ];
    }

    // =========================================================================
    // MÉTHODES PRIVÉES - CONSTRUCTION DU CONTEXTE
    // =========================================================================

    protected function validateParams(array $params): void
    {
        $required = ['platform_id', 'country_id', 'language_id', 'service'];
        
        foreach ($required as $key) {
            if (!isset($params[$key])) {
                throw new \InvalidArgumentException("Le paramètre '{$key}' est requis");
            }
        }
    }

    protected function buildContext(array $params, Platform $platform, Country $country, Language $language): array
    {
        // Récupérer le nom du pays dans la langue cible
        $countryNameColumn = 'name_' . $language->code;
        $countryName = $country->$countryNameColumn ?? $country->name;

        return [
            'platform_name' => $platform->name,
            'platform_slug' => $platform->slug,
            'country_name' => $countryName,
            'country_code' => $country->code,
            'language_code' => $language->code,
            'language_name' => $language->name,
            'service' => $params['service'],
            'target_audience' => $params['target_audience'] ?? 'expatriés',
            'keywords' => $params['keywords'] ?? [],
            'tone' => $this->determineTone($language->code),
        ];
    }

    protected function determineTone(string $languageCode): string
    {
        // Adapte le ton selon la langue
        return match ($languageCode) {
            'fr' => 'professionnel et chaleureux',
            'en' => 'professional and friendly',
            'de' => 'professionell und freundlich',
            'es' => 'profesional y amigable',
            'pt' => 'profissional e amigável',
            'ru' => 'профессиональный и дружелюбный',
            'zh' => '专业而友好',
            'ar' => 'محترف وودود',
            'hi' => 'पेशेवर और मित्रवत',
            default => 'professional and friendly',
        };
    }

    // =========================================================================
    // MÉTHODES PRIVÉES - CONSTRUCTION DES PROMPTS
    // =========================================================================

    protected function buildHeroPrompt(array $context): string
    {
        return <<<PROMPT
Tu es un expert en copywriting pour landing pages à haute conversion.

Génère un hero section pour une landing page dans le contexte suivant :
- Plateforme : {$context['platform_name']}
- Pays : {$context['country_name']}
- Service : {$context['service']}
- Audience : {$context['target_audience']}
- Langue : {$context['language_code']}
- Ton : {$context['tone']}

Le hero doit être percutant et orienté conversion avec :
- Un titre (H1) de 8-12 mots maximum qui présente le bénéfice principal
- Un sous-titre de 15-25 mots qui développe la proposition de valeur
- Un texte de CTA accrocheur (3-5 mots)
- 2-3 badges de confiance (optionnel)

Réponds UNIQUEMENT avec un JSON valide, sans texte avant ni après, sans balises markdown :
{
    "title": "Titre percutant H1",
    "subtitle": "Sous-titre développant la proposition de valeur",
    "cta_text": "Texte du CTA",
    "badges": ["Badge 1", "Badge 2", "Badge 3"]
}
PROMPT;
    }

    protected function buildProblemPrompt(array $context, int $points): string
    {
        return <<<PROMPT
Tu es un expert en copywriting pour landing pages à haute conversion.

Génère la section "Problème" qui identifie les pain points de l'audience.

Contexte :
- Service : {$context['service']}
- Audience : {$context['target_audience']}
- Pays : {$context['country_name']}
- Langue : {$context['language_code']}
- Ton : {$context['tone']}

Identifie {$points} problèmes majeurs que rencontre l'audience cible. Chaque problème doit :
- Avoir un emoji pertinent comme icône
- Un titre court et impactant (5-8 mots)
- Une description de 20-30 mots expliquant l'impact du problème

Réponds UNIQUEMENT avec un JSON valide, sans balises markdown :
{
    "problems": [
        {
            "icon": "❌",
            "title": "Titre du problème",
            "description": "Description détaillée du problème et son impact"
        }
    ]
}
PROMPT;
    }

    protected function buildSolutionPrompt(array $context): string
    {
        return <<<PROMPT
Tu es un expert en copywriting pour landing pages à haute conversion.

Génère la section "Solution" qui présente comment {$context['platform_name']} résout les problèmes.

Contexte :
- Service : {$context['service']}
- Plateforme : {$context['platform_name']}
- Pays : {$context['country_name']}
- Langue : {$context['language_code']}
- Ton : {$context['tone']}

Écris 2-3 paragraphes (150-250 mots total) présentant :
- La solution apportée par la plateforme
- Comment elle résout spécifiquement les problèmes évoqués
- La proposition de valeur unique

Format : HTML simple avec <p> tags. Ton : {$context['tone']}.
PROMPT;
    }

    protected function buildAdvantagesPrompt(array $context, int $count): string
    {
        return <<<PROMPT
Tu es un expert en copywriting pour landing pages à haute conversion.

Génère {$count} avantages clés du service.

Contexte :
- Service : {$context['service']}
- Plateforme : {$context['platform_name']}
- Pays : {$context['country_name']}
- Langue : {$context['language_code']}
- Ton : {$context['tone']}

Chaque avantage doit :
- Avoir un emoji pertinent comme icône
- Un titre court et percutant (4-7 mots)
- Une description de 20-35 mots expliquant le bénéfice concret

Réponds UNIQUEMENT avec un JSON valide, sans balises markdown :
{
    "advantages": [
        {
            "icon": "✓",
            "title": "Titre de l'avantage",
            "description": "Description détaillée du bénéfice pour l'utilisateur"
        }
    ]
}
PROMPT;
    }

    protected function buildHowItWorksPrompt(array $context, int $steps): string
    {
        return <<<PROMPT
Tu es un expert en copywriting pour landing pages à haute conversion.

Génère {$steps} étapes expliquant comment utiliser le service.

Contexte :
- Service : {$context['service']}
- Plateforme : {$context['platform_name']}
- Pays : {$context['country_name']}
- Langue : {$context['language_code']}
- Ton : {$context['tone']}

Chaque étape doit :
- Avoir un titre clair (4-8 mots)
- Une description de 25-40 mots expliquant l'action à réaliser
- Être numérotée de 1 à {$steps}

Réponds UNIQUEMENT avec un JSON valide, sans balises markdown :
{
    "steps": [
        {
            "title": "Titre de l'étape",
            "description": "Description détaillée de ce qu'il faut faire"
        }
    ]
}
PROMPT;
    }

    protected function buildFaqPrompt(array $context, int $count): string
    {
        return <<<PROMPT
Tu es un expert en copywriting pour landing pages à haute conversion.

Génère {$count} questions-réponses (FAQ) orientées conversion.

Contexte :
- Service : {$context['service']}
- Plateforme : {$context['platform_name']}
- Pays : {$context['country_name']}
- Langue : {$context['language_code']}
- Ton : {$context['tone']}

Les FAQs doivent :
- Anticiper les objections et questions courantes
- Rassurer et convaincre
- Être orientées conversion
- Questions : 8-15 mots
- Réponses : 40-80 mots

Réponds UNIQUEMENT avec un JSON valide, sans balises markdown :
{
    "faqs": [
        {
            "question": "Question claire et directe ?",
            "answer": "Réponse détaillée et rassurante qui lève les objections"
        }
    ]
}
PROMPT;
    }

    protected function buildFinalCtaPrompt(array $context): string
    {
        return <<<PROMPT
Tu es un expert en copywriting pour landing pages à haute conversion.

Génère un CTA final puissant pour conclure la landing page.

Contexte :
- Service : {$context['service']}
- Plateforme : {$context['platform_name']}
- Langue : {$context['language_code']}
- Ton : {$context['tone']}

Le CTA final doit :
- Titre : 6-10 mots, créer urgence ou FOMO
- Sous-titre : 15-25 mots, rappeler le bénéfice principal
- Texte CTA : 3-5 mots, action claire

Réponds UNIQUEMENT avec un JSON valide, sans balises markdown :
{
    "title": "Titre créant urgence ou FOMO",
    "subtitle": "Rappel du bénéfice principal",
    "cta_text": "Action claire"
}
PROMPT;
    }

    // =========================================================================
    // MÉTHODES PRIVÉES - ASSEMBLAGE ET FORMATAGE
    // =========================================================================

    protected function assembleContent(array $sections, array $context): string
    {
        $html = '';

        // Hero Section
        $html .= $this->formatHeroSection($sections['hero']);

        // Problem Section
        if (isset($sections['problem'])) {
            $html .= $this->formatProblemSection($sections['problem']);
        }

        // Solution Section
        if (isset($sections['solution'])) {
            $html .= $this->formatSolutionSection($sections['solution']);
        }

        // Advantages Section
        if (isset($sections['advantages'])) {
            $html .= $this->formatAdvantagesSection($sections['advantages']);
        }

        // How It Works Section
        if (isset($sections['how_it_works'])) {
            $html .= $this->formatHowItWorksSection($sections['how_it_works']);
        }

        // Testimonials Section
        if (isset($sections['testimonials']) && !empty($sections['testimonials'])) {
            $html .= $this->formatTestimonialsSection($sections['testimonials']);
        }

        // Pricing Section
        if (isset($sections['pricing']) && !empty($sections['pricing'])) {
            $html .= $this->formatPricingSection($sections['pricing']);
        }

        // FAQ Section
        if (isset($sections['faq'])) {
            $html .= $this->formatFaqSection($sections['faq']);
        }

        // Final CTA Section
        $html .= $this->formatFinalCtaSection($sections['final_cta']);

        return $html;
    }

    protected function formatHeroSection(array $hero): string
    {
        $html = '<section class="hero-section landing-section">';
        $html .= '<div class="hero-content">';
        $html .= '<h1 class="hero-title">' . htmlspecialchars($hero['title']) . '</h1>';
        $html .= '<p class="hero-subtitle">' . htmlspecialchars($hero['subtitle']) . '</p>';
        
        if (!empty($hero['badges'])) {
            $html .= '<div class="hero-badges">';
            foreach ($hero['badges'] as $badge) {
                $html .= '<span class="badge">' . htmlspecialchars($badge) . '</span>';
            }
            $html .= '</div>';
        }
        
        $html .= '<div class="hero-cta">';
        $html .= '<a href="#contact" class="cta-button primary">' . htmlspecialchars($hero['cta_text']) . '</a>';
        $html .= '</div>';
        $html .= '</div>';
        $html .= '</section>';
        
        return $html;
    }

    protected function formatProblemSection(array $problems): string
    {
        $html = '<section class="problem-section landing-section">';
        $html .= '<h2 class="section-title">Les Défis que Vous Rencontrez</h2>';
        $html .= '<div class="problems-grid">';
        
        foreach ($problems as $problem) {
            $html .= '<div class="problem-card">';
            $html .= '<div class="problem-icon">' . $problem['icon'] . '</div>';
            $html .= '<h3 class="problem-title">' . htmlspecialchars($problem['title']) . '</h3>';
            $html .= '<p class="problem-description">' . htmlspecialchars($problem['description']) . '</p>';
            $html .= '</div>';
        }
        
        $html .= '</div>';
        $html .= '</section>';
        
        return $html;
    }

    protected function formatSolutionSection(string $solution): string
    {
        $html = '<section class="solution-section landing-section">';
        $html .= '<h2 class="section-title">Notre Solution</h2>';
        $html .= '<div class="solution-content">';
        $html .= $solution;
        $html .= '</div>';
        $html .= '</section>';
        
        return $html;
    }

    protected function formatAdvantagesSection(array $advantages): string
    {
        $html = '<section class="advantages-section landing-section">';
        $html .= '<h2 class="section-title">Les Avantages de Notre Service</h2>';
        $html .= '<div class="advantages-grid">';
        
        foreach ($advantages as $advantage) {
            $html .= '<div class="advantage-card">';
            $html .= '<div class="advantage-icon">' . $advantage['icon'] . '</div>';
            $html .= '<h3 class="advantage-title">' . htmlspecialchars($advantage['title']) . '</h3>';
            $html .= '<p class="advantage-description">' . htmlspecialchars($advantage['description']) . '</p>';
            $html .= '</div>';
        }
        
        $html .= '</div>';
        $html .= '</section>';
        
        return $html;
    }

    protected function formatHowItWorksSection(array $steps): string
    {
        $html = '<section class="how-it-works-section landing-section">';
        $html .= '<h2 class="section-title">Comment Ça Marche ?</h2>';
        $html .= '<div class="steps-container">';
        
        foreach ($steps as $step) {
            $html .= '<div class="step-card">';
            $html .= '<div class="step-number">' . $step['number'] . '</div>';
            $html .= '<h3 class="step-title">' . htmlspecialchars($step['title']) . '</h3>';
            $html .= '<p class="step-description">' . htmlspecialchars($step['description']) . '</p>';
            $html .= '</div>';
        }
        
        $html .= '</div>';
        $html .= '</section>';
        
        return $html;
    }

    protected function formatTestimonialsSection(array $testimonials): string
    {
        $html = '<section class="testimonials-section landing-section">';
        $html .= '<h2 class="section-title">Ce Que Nos Clients Disent</h2>';
        $html .= '<div class="testimonials-grid">';
        
        foreach ($testimonials as $testimonial) {
            $html .= '<div class="testimonial-card">';
            
            if (!empty($testimonial['photo_url'])) {
                $html .= '<img src="' . htmlspecialchars($testimonial['photo_url']) . '" alt="' . htmlspecialchars($testimonial['name']) . '" class="testimonial-photo">';
            }
            
            $html .= '<div class="testimonial-content">';
            $html .= '<p class="testimonial-quote">"' . htmlspecialchars($testimonial['quote']) . '"</p>';
            $html .= '<div class="testimonial-author">';
            $html .= '<p class="author-name">' . htmlspecialchars($testimonial['name']) . '</p>';
            $html .= '<p class="author-location">' . htmlspecialchars($testimonial['location']) . '</p>';
            
            if (!empty($testimonial['rating'])) {
                $html .= '<div class="author-rating">' . $testimonial['rating_stars'] . '</div>';
            }
            
            $html .= '</div>';
            $html .= '</div>';
            $html .= '</div>';
        }
        
        $html .= '</div>';
        $html .= '</section>';
        
        return $html;
    }

    protected function formatPricingSection(array $pricing): string
    {
        // Implémentation future pour les tarifs
        return '';
    }

    protected function formatFaqSection(array $faqs): string
    {
        $html = '<section class="faq-section landing-section">';
        $html .= '<h2 class="section-title">Questions Fréquentes</h2>';
        $html .= '<div class="faq-container">';
        
        foreach ($faqs as $index => $faq) {
            $html .= '<div class="faq-item">';
            $html .= '<h3 class="faq-question">' . htmlspecialchars($faq['question']) . '</h3>';
            $html .= '<div class="faq-answer">';
            $html .= '<p>' . htmlspecialchars($faq['answer']) . '</p>';
            $html .= '</div>';
            $html .= '</div>';
        }
        
        $html .= '</div>';
        $html .= '</section>';
        
        return $html;
    }

    protected function formatFinalCtaSection(array $cta): string
    {
        $html = '<section class="final-cta-section landing-section">';
        $html .= '<div class="final-cta-content">';
        $html .= '<h2 class="final-cta-title">' . htmlspecialchars($cta['title']) . '</h2>';
        $html .= '<p class="final-cta-subtitle">' . htmlspecialchars($cta['subtitle']) . '</p>';
        $html .= '<div class="final-cta-button">';
        $html .= '<a href="#contact" class="cta-button primary large">' . htmlspecialchars($cta['cta_text']) . '</a>';
        $html .= '</div>';
        $html .= '</div>';
        $html .= '</section>';
        
        return $html;
    }

    // =========================================================================
    // MÉTHODES PRIVÉES - HELPERS
    // =========================================================================

    protected function generateSlug(string $title, Platform $platform, Country $country, Language $language): string
    {
        $baseSlug = Str::slug($title);
        $slug = $baseSlug;
        $counter = 1;

        // Vérifier l'unicité du slug
        while (Article::where('slug', $slug)
            ->where('platform_id', $platform->id)
            ->where('country_id', $country->id)
            ->where('language_id', $language->id)
            ->exists()) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    protected function generateDefaultTitle(array $context): string
    {
        return match ($context['language_code']) {
            'fr' => $context['service'] . ' en ' . $context['country_name'],
            'en' => $context['service'] . ' in ' . $context['country_name'],
            'de' => $context['service'] . ' in ' . $context['country_name'],
            'es' => $context['service'] . ' en ' . $context['country_name'],
            'pt' => $context['service'] . ' em ' . $context['country_name'],
            default => $context['service'] . ' - ' . $context['country_name'],
        };
    }

    protected function getDefaultCtaText(string $languageCode): string
    {
        return match ($languageCode) {
            'fr' => 'Commencer maintenant',
            'en' => 'Get Started Now',
            'de' => 'Jetzt beginnen',
            'es' => 'Empezar ahora',
            'pt' => 'Começar agora',
            'ru' => 'Начать сейчас',
            'zh' => '立即开始',
            'ar' => 'ابدأ الآن',
            'hi' => 'अभी शुरू करें',
            default => 'Get Started',
        };
    }

    protected function generateMetaTitle(string $title): string
    {
        return mb_strlen($title) <= 60 ? $title : mb_substr($title, 0, 57) . '...';
    }

    protected function generateMetaDescription(string $subtitle): string
    {
        return mb_strlen($subtitle) <= 160 ? $subtitle : mb_substr($subtitle, 0, 157) . '...';
    }

    protected function generateJsonLd(array $sections, array $context): array
    {
        $jsonLd = [
            '@context' => 'https://schema.org',
            '@type' => 'WebPage',
            'name' => $sections['hero']['title'],
            'description' => $sections['hero']['subtitle'],
            'provider' => [
                '@type' => 'Organization',
                'name' => $context['platform_name'],
            ],
        ];

        // Ajouter FAQPage si des FAQs sont présentes
        if (isset($sections['faq']) && !empty($sections['faq'])) {
            $faqSchema = [
                '@context' => 'https://schema.org',
                '@type' => 'FAQPage',
                'mainEntity' => [],
            ];

            foreach ($sections['faq'] as $faq) {
                $faqSchema['mainEntity'][] = [
                    '@type' => 'Question',
                    'name' => $faq['question'],
                    'acceptedAnswer' => [
                        '@type' => 'Answer',
                        'text' => $faq['answer'],
                    ],
                ];
            }

            $jsonLd['about'] = $faqSchema;
        }

        return $jsonLd;
    }

    protected function saveFaqs(Article $article, array $faqs): void
    {
        foreach ($faqs as $faq) {
            ArticleFaq::create([
                'article_id' => $article->id,
                'question' => $faq['question'],
                'answer' => $faq['answer'],
            ]);
        }
    }

    /**
     * Parse une réponse JSON de GPT en retirant les balises markdown
     */
    protected function parseJsonResponse(string $content): array
    {
        // Retirer les balises markdown si présentes
        $content = preg_replace('/```json\s*/', '', $content);
        $content = preg_replace('/```\s*/', '', $content);
        $content = trim($content);

        $data = json_decode($content, true);

        if ($data === null) {
            Log::warning('Réponse GPT non-JSON valide', [
                'content' => $content,
            ]);
            return [];
        }

        return $data;
    }
}