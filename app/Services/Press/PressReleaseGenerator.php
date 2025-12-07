<?php

namespace App\Services\Press;

use App\Models\Platform;
use App\Models\Language;
use App\Models\PressRelease;
use App\Models\PressReleaseMedia;
use App\Models\PressReleaseTemplate;
use App\Models\ContentTemplate;
use App\Services\AI\GptService;
use App\Services\AI\CostTracker;
use App\Services\UnsplashService;
use App\Services\Content\TemplateManager;
use App\Services\Content\Traits\UseContentTemplates;
use App\Services\Content\MultiLanguageGenerationService;
use App\Services\Content\PlatformKnowledgeService;
use App\Services\Seo\SeoOptimizationService;
use App\Jobs\TranslatePressRelease;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * PressReleaseGenerator - Générateur de communiqués de presse multilingues
 *
 * Pipeline Press Release (15 étapes) :
 * 1. Validation paramètres
 * 2. Génération headline percutant (50-70 chars)
 * 3. Génération lead avec 5W (Who, What, When, Where, Why)
 * 4. Génération corps 300-500 mots en 2-3 sections
 * 5. Génération citation CEO/Directeur
 * 6. Génération boilerplate "À propos" automatique
 * 7. Génération coordonnées contact
 * 8. Génération meta SEO optimisés (title < 60, description < 160)
 * 9. Génération slug multilingue
 * 10. Assemblage complet + sauvegarde
 * 11. Application SEO complet (meta, images)
 * 12. Dispatch traductions multi-langues (si languages[] fourni)
 * 13. Auto-publication si score OK
 *
 * Support 9 langues avec templates spécifiques.
 *
 * @package App\Services\Press
 */
class PressReleaseGenerator
{
    use UseContentTemplates;

    protected GptService $gptService;
    protected CostTracker $costTracker;
    protected PlatformKnowledgeService $knowledgeService;
    protected ?UnsplashService $unsplash = null;

    // Types de communiqués
    const TYPE_PRODUCT_LAUNCH = 'lancement_produit';
    const TYPE_PARTNERSHIP = 'partenariat';
    const TYPE_MILESTONE = 'resultats_milestone';
    const TYPE_EVENT = 'evenement';
    const TYPE_APPOINTMENT = 'nomination';

    // Langues supportées
    const SUPPORTED_LANGUAGES = ['fr', 'en', 'de', 'es', 'pt', 'ru', 'zh', 'ar', 'hi'];

    public function __construct(
        GptService $gptService,
        CostTracker $costTracker,
        PlatformKnowledgeService $knowledgeService,
        TemplateManager $templateManager,
        UnsplashService $unsplash = null
    )
    {
        $this->gptService = $gptService;
        $this->costTracker = $costTracker;
        $this->knowledgeService = $knowledgeService;
        $this->setTemplateManager($templateManager);
        $this->unsplash = $unsplash;
    }

    /**
     * Générer un communiqué de presse complet
     *
     * @param array $params {
     *   platform_id: int,
     *   template_type: string,
     *   language_code: string,
     *   context: array
     * }
     * @return PressRelease
     */
    public function generate(array $params): PressRelease
    {
        $this->validateParams($params);

        $platformId = $params['platform_id'];
        $templateType = $params['template_type'];
        $languageCode = $params['language_code'];
        $context = $params['context'] ?? [];

        // Charger le ContentTemplate si disponible
        $contentTemplateSlug = $params['content_template_slug'] ?? null;
        $this->loadTemplate('press_release', $languageCode, $contentTemplateSlug);

        if ($this->hasActiveTemplate()) {
            Log::info('PressReleaseGenerator: ContentTemplate chargé', [
                'template_slug' => $this->getActiveTemplateSlug(),
            ]);
        }

        // Récupérer le template PressRelease (ancien système)
        $template = PressReleaseTemplate::getByTypeAndLanguage($templateType, $languageCode);
        
        if (!$template) {
            throw new \Exception("Template non trouvé pour type '{$templateType}' et langue '{$languageCode}'");
        }
        
        // Récupérer la plateforme
        $platform = Platform::findOrFail($platformId);
        
        // Générer les sections
        $title = $this->generateHeadline($template, $context, $platform, $languageCode);
        $lead = $this->generateLead($template, $context, $platform, $languageCode);
        $body = $this->generateBody($template, $context, $platform, $languageCode);
        $quote = $this->generateQuote($template, $context, $platform, $languageCode);
        $boilerplate = $this->generateBoilerplate($platform, $languageCode);
        
        // Séparer le body en sections
        $bodySections = $this->splitBodySections($body);
        
        // Créer le communiqué
        $pressRelease = PressRelease::create([
            'uuid' => (string) Str::uuid(),
            'platform_id' => $platformId,
            'template_type' => $templateType,
            'title' => $title,
            'lead' => $lead,
            'body1' => $bodySections['body1'],
            'body2' => $bodySections['body2'] ?? null,
            'body3' => $bodySections['body3'] ?? null,
            'quote' => $quote,
            'boilerplate' => $boilerplate,
            'contact' => $this->generateContact($platform, $context),
            'language_code' => $languageCode,
            'status' => 'draft',
            'generation_cost' => $this->costTracker->getSessionCost(),
        ]);
        
        // Ajouter une image si demandé
        $this->addFeaturedImage($pressRelease, $context);

        // ========== ÉTAPE 11: SEO COMPLET ==========
        $this->applyFullSeo($pressRelease, $params);

        // ========== ÉTAPE 12: DISPATCH TRADUCTIONS MULTI-LANGUES ==========
        $this->dispatchTranslations($pressRelease, $params);

        // ========== ÉTAPE 13: AUTO-PUBLICATION ==========
        $this->handleAutoPublish($pressRelease, $params);

        return $pressRelease;
    }

    /**
     * Applique le SEO complet (meta optimisés)
     */
    protected function applyFullSeo(PressRelease $pressRelease, array $params): void
    {
        if (!($params['enable_full_seo'] ?? true)) {
            return;
        }

        try {
            $seoService = app(SeoOptimizationService::class);
            $lang = $params['language_code'] ?? 'fr';

            // Contexte SEO
            $context = [
                'platform' => $pressRelease->platform?->name ?? 'SOS-Expat',
                'year' => date('Y'),
                'template_type' => $params['template_type'] ?? 'press_release',
            ];

            // Générer meta title optimisé (< 60 caractères)
            $metaTitle = $seoService->generateMetaTitle(
                $pressRelease->title,
                'press_release',
                $lang,
                $context
            );

            // Générer meta description optimisée (< 160 caractères)
            $metaDescription = $seoService->generateMetaDescription(
                $pressRelease->title,
                'press_release',
                $lang,
                $context
            );

            // Générer slug
            $slug = Str::slug($pressRelease->title);

            // Mettre à jour le communiqué
            $pressRelease->update([
                'meta_title' => $metaTitle,
                'meta_description' => $metaDescription,
                'slug' => $slug,
            ]);

            Log::debug('SEO complet appliqué (press release)', [
                'press_release_id' => $pressRelease->id,
                'meta_title_length' => mb_strlen($metaTitle),
                'meta_description_length' => mb_strlen($metaDescription),
            ]);

        } catch (\Exception $e) {
            Log::warning('Erreur application SEO (press release)', [
                'press_release_id' => $pressRelease->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Dispatch les traductions multi-langues si languages[] fourni
     */
    protected function dispatchTranslations(PressRelease $pressRelease, array $params): void
    {
        $targetLanguages = $params['languages'] ?? [];
        $autoTranslate = $params['auto_translate'] ?? config('content.auto_translate', false);

        // Langue source
        $sourceLanguage = $params['language_code'] ?? 'fr';

        // Si auto_translate, traduire vers toutes les langues
        if ($autoTranslate && empty($targetLanguages)) {
            $targetLanguages = array_diff(self::SUPPORTED_LANGUAGES, [$sourceLanguage]);
        }

        // Filtrer les langues valides (exclure la langue source)
        $targetLanguages = array_filter($targetLanguages, fn($lang) =>
            in_array($lang, self::SUPPORTED_LANGUAGES) && $lang !== $sourceLanguage
        );

        if (empty($targetLanguages)) {
            return;
        }

        // Dispatcher les traductions avec délai progressif
        $delay = 0;
        foreach ($targetLanguages as $lang) {
            TranslatePressRelease::dispatch($pressRelease->id, $lang)
                ->delay(now()->addSeconds($delay));

            $delay += 15; // 15 secondes entre chaque traduction
        }

        Log::info('Traductions press release dispatchées', [
            'press_release_id' => $pressRelease->id,
            'languages' => array_values($targetLanguages),
            'count' => count($targetLanguages),
        ]);
    }

    /**
     * Gère l'auto-publication si configurée
     */
    protected function handleAutoPublish(PressRelease $pressRelease, array $params): void
    {
        $autoPublish = $params['auto_publish'] ?? config('content.auto_publish', false);

        if (!$autoPublish) {
            return;
        }

        $pressRelease->update([
            'status' => 'published',
            'published_at' => now(),
        ]);

        Log::info('Press release auto-publié', [
            'press_release_id' => $pressRelease->id,
        ]);
    }

    /**
     * Générer un titre percutant (50-70 caractères)
     */
    public function generateHeadline(
        PressReleaseTemplate $template,
        array $context,
        Platform $platform,
        string $languageCode
    ): string {
        $pattern = $template->getPattern('headline_pattern');

        // Récupérer le contexte knowledge
        $knowledgeSection = '';
        $knowledgeContext = $this->knowledgeService->getKnowledgeContext(
            $platform,
            $languageCode,
            'press_releases'
        );

        if (!empty($knowledgeContext)) {
            $knowledgeSection = "\n\n## CONTEXTE MARQUE (à respecter strictement) ##\n{$knowledgeContext}\n";
        }

        $prompt = "Génère un titre de communiqué de presse percutant et professionnel.\n\n";
        $prompt .= "CONTRAINTES:\n";
        $prompt .= "- 50-70 caractères maximum\n";
        $prompt .= "- Action-oriented\n";
        $prompt .= "- Inclut le nom de la plateforme: {$platform->name}\n";
        $prompt .= "- Clair et direct\n";
        $prompt .= "- Sans point final\n\n";

        if ($pattern) {
            $prompt .= "PATTERN: {$pattern}\n\n";
        }

        $prompt .= "CONTEXTE:\n" . json_encode($context, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";
        $prompt .= "LANGUE: {$languageCode}\n";
        $prompt .= "{$knowledgeSection}\n";
        $prompt .= "Rédige uniquement le titre, sans commentaire.";
        
        $response = $this->gptService->generateText($prompt, [
            'max_tokens' => 100,
            'temperature' => 0.7,
        ]);
        
        return trim($response, " \t\n\r\0\x0B.");
    }

    /**
     * Générer le lead (5W en 2-3 phrases)
     */
    public function generateLead(
        PressReleaseTemplate $template,
        array $context,
        Platform $platform,
        string $languageCode
    ): string {
        $pattern = $template->getPattern('lead_pattern');

        // Récupérer le contexte knowledge
        $knowledgeSection = '';
        $knowledgeContext = $this->knowledgeService->getKnowledgeContext(
            $platform,
            $languageCode,
            'press_releases'
        );

        if (!empty($knowledgeContext)) {
            $knowledgeSection = "\n\n## CONTEXTE MARQUE (à respecter strictement) ##\n{$knowledgeContext}\n";
        }

        $prompt = "Rédige le paragraphe d'introduction (lead) du communiqué de presse.\n\n";
        $prompt .= "CONTRAINTES:\n";
        $prompt .= "- Répond aux 5W : Who, What, When, Where, Why\n";
        $prompt .= "- 2-3 phrases maximum\n";
        $prompt .= "- Résume l'essentiel de l'annonce\n";
        $prompt .= "- Ton professionnel et factuel\n\n";

        if ($pattern) {
            $prompt .= "PATTERN: {$pattern}\n\n";
        }

        $prompt .= "PLATEFORME: {$platform->name}\n";
        $prompt .= "CONTEXTE:\n" . json_encode($context, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";
        $prompt .= "LANGUE: {$languageCode}\n";
        $prompt .= "{$knowledgeSection}\n";
        $prompt .= "Rédige uniquement le lead, sans commentaire.";
        
        $response = $this->gptService->generateText($prompt, [
            'max_tokens' => 200,
            'temperature' => 0.6,
        ]);
        
        return trim($response);
    }

    /**
     * Générer le corps (300-500 mots)
     */
    public function generateBody(
        PressReleaseTemplate $template,
        array $context,
        Platform $platform,
        string $languageCode
    ): string {
        $structure = $template->structure;

        // Récupérer le contexte knowledge
        $knowledgeSection = '';
        $knowledgeContext = $this->knowledgeService->getKnowledgeContext(
            $platform,
            $languageCode,
            'press_releases'
        );

        if (!empty($knowledgeContext)) {
            $knowledgeSection = "\n\n## CONTEXTE MARQUE (à respecter strictement) ##\n{$knowledgeContext}\n";
        }

        $prompt = "Rédige le corps principal du communiqué de presse.\n\n";
        $prompt .= "CONTRAINTES:\n";
        $prompt .= "- 300-500 mots au total\n";
        $prompt .= "- Divisé en 3 sections distinctes (sépare par double saut de ligne)\n";
        $prompt .= "- Section 1: Contexte et problème résolu\n";
        $prompt .= "- Section 2: Fonctionnalités clés ou détails importants\n";
        $prompt .= "- Section 3: Disponibilité, pricing ou informations pratiques\n";
        $prompt .= "- Détails concrets et mesurables\n";
        $prompt .= "- Bénéfices clairs pour les utilisateurs\n";
        $prompt .= "- Ton professionnel mais accessible\n\n";

        $prompt .= "PLATEFORME: {$platform->name}\n";
        $prompt .= "CONTEXTE:\n" . json_encode($context, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";
        $prompt .= "LANGUE: {$languageCode}\n";
        $prompt .= "{$knowledgeSection}\n";
        $prompt .= "Rédige les 3 sections du corps, sans commentaire.";
        
        $response = $this->gptService->generateText($prompt, [
            'max_tokens' => 800,
            'temperature' => 0.7,
        ]);
        
        return trim($response);
    }

    /**
     * Générer une citation
     */
    public function generateQuote(
        PressReleaseTemplate $template,
        array $context,
        Platform $platform,
        string $languageCode
    ): string {
        $pattern = $template->getPattern('quote_pattern');
        
        $speaker = $context['speaker'] ?? [
            'name' => 'Williams Jullin',
            'title' => 'CEO & Founder',
        ];
        
        $prompt = "Génère une citation professionnelle pour le communiqué de presse.\n\n";
        $prompt .= "CONTRAINTES:\n";
        $prompt .= "- 2-3 phrases\n";
        $prompt .= "- Vision ou bénéfice clé\n";
        $prompt .= "- Ton personnel mais professionnel\n";
        $prompt .= "- Sans guillemets (seront ajoutés automatiquement)\n\n";
        
        if ($pattern) {
            $prompt .= "PATTERN: {$pattern}\n\n";
        }
        
        $prompt .= "PERSONNE QUI PARLE: {$speaker['name']}, {$speaker['title']}\n";
        $prompt .= "PLATEFORME: {$platform->name}\n";
        $prompt .= "CONTEXTE:\n" . json_encode($context, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";
        $prompt .= "LANGUE: {$languageCode}\n";
        $prompt .= "Rédige uniquement la citation, sans commentaire.";
        
        $response = $this->gptService->generateText($prompt, [
            'max_tokens' => 150,
            'temperature' => 0.7,
        ]);
        
        $quote = trim($response, " \t\n\r\0\x0B\"'");
        
        // Ajouter l'attribution
        $attribution = "— {$speaker['name']}, {$speaker['title']}";
        
        return $quote . "\n\n" . $attribution;
    }

    /**
     * Générer le boilerplate "À propos de..."
     */
    public function generateBoilerplate(Platform $platform, string $languageCode): string
    {
        // Boilerplates préenregistrés
        $boilerplates = [
            'SOS-Expat.com' => [
                'fr' => "SOS-Expat.com est la première plateforme d'assistance d'urgence pour expatriés, offrant des consultations téléphoniques avec des experts en moins de 5 minutes. Active dans 197 pays et disponible en 9 langues, SOS-Expat connecte 304 millions d'expatriés à un réseau mondial de professionnels qualifiés pour résoudre leurs urgences administratives, juridiques et médicales.",
                'en' => "SOS-Expat.com is the leading emergency assistance platform for expatriates, providing phone consultations with experts in under 5 minutes. Operating in 197 countries and available in 9 languages, SOS-Expat connects 304 million expats with a global network of qualified professionals to resolve their administrative, legal, and medical emergencies.",
            ],
            'Ulixai.com' => [
                'fr' => "Ulixai.com est le marketplace international de référence pour les expatriés, connectant plus de 304 millions d'utilisateurs avec des prestataires de services qualifiés dans 197 pays. Disponible en 9 langues, Ulixai facilite l'accès à tous les services essentiels pour une expatriation réussie.",
                'en' => "Ulixai.com is the leading international marketplace for expatriates, connecting over 304 million users with qualified service providers in 197 countries. Available in 9 languages, Ulixai facilitates access to all essential services for successful expatriation.",
            ],
        ];
        
        $platformName = $platform->name;
        
        if (isset($boilerplates[$platformName][$languageCode])) {
            return $boilerplates[$platformName][$languageCode];
        }
        
        // Fallback : anglais ou générer
        if (isset($boilerplates[$platformName]['en'])) {
            return $boilerplates[$platformName]['en'];
        }
        
        // Générer via IA
        $prompt = "Rédige un paragraphe 'À propos' professionnel pour {$platformName} en {$languageCode}. ";
        $prompt .= "2-3 phrases décrivant la mission, la couverture géographique et les services. ";
        $prompt .= "Ton corporatif et factuel.";
        
        return $this->gptService->generateText($prompt, [
            'max_tokens' => 200,
            'temperature' => 0.5,
        ]);
    }

    /**
     * Générer les informations de contact
     */
    protected function generateContact(Platform $platform, array $context): array
    {
        return [
            'name' => $context['contact_name'] ?? 'Relations Presse',
            'email' => $context['contact_email'] ?? 'press@' . ($platform->domain ?? 'example.com'),
            'phone' => $context['contact_phone'] ?? null,
        ];
    }

    /**
     * Diviser le body en sections
     */
    protected function splitBodySections(string $body): array
    {
        $paragraphs = array_filter(
            explode("\n\n", $body),
            fn($p) => !empty(trim($p))
        );
        
        return [
            'body1' => $paragraphs[0] ?? '',
            'body2' => $paragraphs[1] ?? null,
            'body3' => $paragraphs[2] ?? null,
        ];
    }

    /**
     * Ajouter une image Unsplash au communiqué
     */
    protected function addFeaturedImage(PressRelease $pressRelease, array $context): void
    {
        if (!$this->unsplash || !($context['add_image'] ?? false)) {
            return;
        }
        
        try {
            $image = $this->unsplash->findContextualImage([
                'keywords' => [
                    $pressRelease->title,
                    $context['company_name'] ?? '',
                    $context['industry'] ?? 'business',
                ],
            ]);
            
            if ($image) {
                PressReleaseMedia::create([
                    'press_release_id' => $pressRelease->id,
                    'media_type' => 'photo',
                    'file_path' => $image['url'],
                    'source_type' => 'unsplash',
                    'caption' => $image['alt_description'],
                    'photographer' => $image['photographer'],
                    'photographer_url' => $image['photographer_url'],
                    'attribution_html' => $image['attribution_html'],
                    'width' => $image['width'],
                    'height' => $image['height'],
                    'source_id' => $image['id'],
                    'order_index' => 0,
                ]);
            }
        } catch (\Exception $e) {
            Log::warning('Press release image failed', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Valider les paramètres
     */
    protected function validateParams(array $params): void
    {
        if (empty($params['platform_id'])) {
            throw new \Exception('platform_id est requis');
        }
        
        if (empty($params['template_type'])) {
            throw new \Exception('template_type est requis');
        }
        
        if (empty($params['language_code'])) {
            throw new \Exception('language_code est requis');
        }
        
        if (!in_array($params['language_code'], self::SUPPORTED_LANGUAGES)) {
            throw new \Exception('Langue non supportée : ' . $params['language_code']);
        }
    }
}