<?php

namespace App\Services\Press;

use App\Models\Platform;
use App\Models\PressDossier;
use App\Models\DossierMedia;
use App\Models\DossierSection;
use App\Models\ContentTemplate;
use App\Services\AI\GptService;
use App\Services\AI\CostTracker;
use App\Services\UnsplashService;
use App\Services\Content\TemplateManager;
use App\Services\Content\Traits\UseContentTemplates;
use App\Services\Content\PlatformKnowledgeService;
use App\Services\Seo\SeoOptimizationService;
use App\Jobs\TranslatePressDossier;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * PressDossierGenerator - Génération de dossiers de presse professionnels
 *
 * Pipeline de génération (12 étapes) :
 * 1. Validation des paramètres
 * 2. Sélection du template et génération de la structure
 * 3. Génération du contenu de chaque section (GPT-4)
 * 4. Génération de la section FAQ
 * 5. Attachement des médias (Unsplash)
 * 6. Finalisation et calcul des coûts
 * 7. Application SEO complet (meta < 60/160 chars)
 * 8. Génération slug multilingue
 * 9. Dispatch traductions multi-langues (si languages[] fourni)
 * 10. Auto-publication si paramètre activé
 *
 * Templates disponibles :
 * - press_kit_entreprise : Kit de presse entreprise (6-8 pages)
 * - rapport_annuel : Rapport annuel (8-12 pages)
 * - etude_barometre : Étude baromètre (10-15 pages)
 * - case_study : Étude de cas (4-6 pages)
 * - position_paper : Position paper (6-10 pages)
 *
 * @package App\Services\Press
 */
class PressDossierGenerator
{
    use UseContentTemplates;

    protected GptService $gptService;
    protected CostTracker $costTracker;
    protected PlatformKnowledgeService $knowledgeService;
    protected ?UnsplashService $unsplash = null;
    protected float $totalCost = 0;

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
     * Générer un dossier de presse complet
     *
     * @param array $params Paramètres de génération
     * @return PressDossier
     * @throws \Exception
     */
    public function generate(array $params): PressDossier
    {
        $startTime = microtime(true);

        try {
            DB::beginTransaction();

            // Validation des paramètres
            $this->validateParams($params);

            // Charger le ContentTemplate si disponible
            $languageCode = $params['language_code'] ?? 'fr';
            $contentTemplateSlug = $params['content_template_slug'] ?? null;
            $this->loadTemplate('press_dossier', $languageCode, $contentTemplateSlug);

            if ($this->hasActiveTemplate()) {
                Log::info('PressDossierGenerator: ContentTemplate chargé', [
                    'template_slug' => $this->getActiveTemplateSlug(),
                ]);
            }

            // Créer le dossier
            $dossier = $this->createDossier($params);

            // Générer la structure des sections (inclut maintenant les FAQ)
            $structure = $this->generateStructure($params['template_type']);
            
            // Générer le contenu de chaque section
            foreach ($structure as $index => $sectionData) {
                $this->generateSection($dossier, $sectionData, $index, $params);
            }

            // Ajouter une image Unsplash si demandé
            $this->addFeaturedImage($dossier, $params);

            // Calculer le nombre total de pages
            $dossier->update([
                'total_pages' => count($structure),
                'generation_cost' => $this->totalCost,
                'generation_time_seconds' => (int) (microtime(true) - $startTime),
                'status' => 'review',
            ]);

            DB::commit();

            // ========== ÉTAPE 7: SEO COMPLET ==========
            $this->applyFullSeo($dossier, $params);

            // ========== ÉTAPE 8: GÉNÉRATION SLUG ==========
            $this->generateSlug($dossier);

            // ========== ÉTAPE 9: DISPATCH TRADUCTIONS ==========
            $this->dispatchTranslations($dossier, $params);

            // ========== ÉTAPE 10: AUTO-PUBLICATION ==========
            $this->handleAutoPublish($dossier, $params);

            Log::info('Dossier généré avec succès', [
                'dossier_id' => $dossier->id,
                'template' => $params['template_type'],
                'sections' => count($structure),
                'cost' => $this->totalCost,
                'time' => (microtime(true) - $startTime),
            ]);

            return $dossier->fresh(['sections', 'media']);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Erreur génération dossier', [
                'error' => $e->getMessage(),
                'params' => $params,
            ]);

            if (isset($dossier)) {
                $dossier->markAsFailed($e->getMessage());
            }

            throw $e;
        }
    }

    /**
     * Valider les paramètres de génération
     *
     * @param array $params
     * @throws \InvalidArgumentException
     */
    protected function validateParams(array $params): void
    {
        $required = ['platform_id', 'template_type', 'title', 'language_code'];
        
        foreach ($required as $field) {
            if (!isset($params[$field])) {
                throw new \InvalidArgumentException("Paramètre requis manquant : {$field}");
            }
        }

        // Vérifier que le template existe
        $validTemplates = [
            'press_kit_entreprise',
            'rapport_annuel',
            'etude_barometre',
            'case_study',
            'position_paper',
        ];

        if (!in_array($params['template_type'], $validTemplates)) {
            throw new \InvalidArgumentException("Template invalide : {$params['template_type']}");
        }

        // Vérifier que la langue est supportée
        $validLanguages = ['fr', 'en', 'es', 'de', 'it', 'pt', 'ar', 'zh', 'hi'];
        if (!in_array($params['language_code'], $validLanguages)) {
            throw new \InvalidArgumentException("Langue non supportée : {$params['language_code']}");
        }
    }

    /**
     * Créer le dossier en base de données
     *
     * @param array $params
     * @return PressDossier
     */
    protected function createDossier(array $params): PressDossier
    {
        return PressDossier::create([
            'platform_id' => $params['platform_id'],
            'template_type' => $params['template_type'],
            'title' => $params['title'],
            'subtitle' => $params['subtitle'] ?? null,
            'language_code' => $params['language_code'],
            'metadata' => $params['metadata'] ?? [],
            'status' => 'generating',
        ]);
    }

    /**
     * Générer la structure du dossier selon le template
     * ✅ MODIFIÉ : Ajout de sections FAQ dans chaque template
     *
     * @param string $templateType
     * @return array Structure des sections
     */
    public function generateStructure(string $templateType): array
    {
        $structures = [
            'press_kit_entreprise' => [
                ['type' => 'cover', 'title' => 'Page de Couverture', 'words' => 0],
                ['type' => 'intro', 'title' => 'À propos', 'words' => 400],
                ['type' => 'chapter', 'title' => 'Notre Équipe', 'words' => 500],
                ['type' => 'chapter', 'title' => 'Nos Services', 'words' => 600],
                ['type' => 'chapter', 'title' => 'Nos Réalisations', 'words' => 500],
                ['type' => 'chapter', 'title' => 'Chiffres Clés', 'words' => 300],
                ['type' => 'faq', 'title' => 'Questions Fréquentes', 'words' => 400, 'faq_count' => 6], // ← AJOUTÉ
                ['type' => 'chapter', 'title' => 'Contacts Presse', 'words' => 200],
            ],

            'rapport_annuel' => [
                ['type' => 'cover', 'title' => 'Couverture', 'words' => 0],
                ['type' => 'intro', 'title' => 'Message du Président', 'words' => 500],
                ['type' => 'chapter', 'title' => 'Faits Marquants', 'words' => 600],
                ['type' => 'chapter', 'title' => 'Résultats Financiers', 'words' => 800],
                ['type' => 'chapter', 'title' => 'Activités et Réalisations', 'words' => 700],
                ['type' => 'chapter', 'title' => 'Perspectives', 'words' => 600],
                ['type' => 'chapter', 'title' => 'Responsabilité Sociale', 'words' => 500],
                ['type' => 'faq', 'title' => 'Questions Fréquentes', 'words' => 500, 'faq_count' => 8], // ← AJOUTÉ
                ['type' => 'conclusion', 'title' => 'Conclusion', 'words' => 400],
            ],

            'etude_barometre' => [
                ['type' => 'cover', 'title' => 'Couverture', 'words' => 0],
                ['type' => 'intro', 'title' => 'Résumé Exécutif', 'words' => 500],
                ['type' => 'methodology', 'title' => 'Méthodologie', 'words' => 600],
                ['type' => 'chapter', 'title' => 'Contexte et Enjeux', 'words' => 800],
                ['type' => 'chapter', 'title' => 'Résultats Principaux', 'words' => 1000],
                ['type' => 'chapter', 'title' => 'Analyse Détaillée', 'words' => 1200],
                ['type' => 'chapter', 'title' => 'Tendances et Évolutions', 'words' => 800],
                ['type' => 'faq', 'title' => 'Questions Fréquentes', 'words' => 600, 'faq_count' => 10], // ← AJOUTÉ
                ['type' => 'conclusion', 'title' => 'Conclusions et Recommandations', 'words' => 600],
                ['type' => 'appendix', 'title' => 'Annexes', 'words' => 400],
            ],

            'case_study' => [
                ['type' => 'cover', 'title' => 'Couverture', 'words' => 0],
                ['type' => 'intro', 'title' => 'Présentation du Cas', 'words' => 400],
                ['type' => 'chapter', 'title' => 'Contexte et Problématique', 'words' => 600],
                ['type' => 'chapter', 'title' => 'Solution Mise en Place', 'words' => 800],
                ['type' => 'chapter', 'title' => 'Résultats et Impact', 'words' => 700],
                ['type' => 'faq', 'title' => 'Questions Fréquentes', 'words' => 400, 'faq_count' => 6], // ← AJOUTÉ
                ['type' => 'conclusion', 'title' => 'Leçons Apprises', 'words' => 500],
            ],

            'position_paper' => [
                ['type' => 'cover', 'title' => 'Couverture', 'words' => 0],
                ['type' => 'intro', 'title' => 'Résumé', 'words' => 400],
                ['type' => 'chapter', 'title' => 'Contexte et Enjeux', 'words' => 800],
                ['type' => 'chapter', 'title' => 'Analyse de la Situation', 'words' => 900],
                ['type' => 'chapter', 'title' => 'Notre Position', 'words' => 1000],
                ['type' => 'chapter', 'title' => 'Arguments et Justifications', 'words' => 1200],
                ['type' => 'chapter', 'title' => 'Recommandations', 'words' => 800],
                ['type' => 'faq', 'title' => 'Questions Fréquentes', 'words' => 500, 'faq_count' => 8], // ← AJOUTÉ
                ['type' => 'conclusion', 'title' => 'Conclusion', 'words' => 400],
            ],
        ];

        return $structures[$templateType] ?? $structures['press_kit_entreprise'];
    }

    /**
     * Générer le contenu d'une section
     * ✅ MODIFIÉ : Gestion du type 'faq'
     *
     * @param PressDossier $dossier
     * @param array $sectionData
     * @param int $index
     * @param array $context
     * @return DossierSection
     */
    protected function generateSection(
        PressDossier $dossier,
        array $sectionData,
        int $index,
        array $context
    ): DossierSection {
        // Pour la couverture, pas de génération de contenu
        if ($sectionData['type'] === 'cover') {
            return DossierSection::create([
                'dossier_id' => $dossier->id,
                'section_type' => 'cover',
                'title' => $context['title'],
                'content' => null,
                'page_number' => 1,
                'order_index' => $index,
            ]);
        }

        // ═══════════════════════════════════════════════════════════════════
        // NOUVEAU : Génération spéciale pour les FAQ
        // ═══════════════════════════════════════════════════════════════════
        if ($sectionData['type'] === 'faq') {
            $faqCount = $sectionData['faq_count'] ?? 6;
            $content = $this->generateFaqSection($dossier, $context, $faqCount);
            
            return DossierSection::create([
                'dossier_id' => $dossier->id,
                'section_type' => 'faq',
                'title' => $sectionData['title'],
                'content' => $content,
                'page_number' => $index + 1,
                'order_index' => $index,
                'show_in_toc' => true,
            ]);
        }

        // Générer le contenu avec GPT-4
        $content = $this->generateSectionContent(
            $dossier,
            $sectionData,
            $context
        );

        return DossierSection::create([
            'dossier_id' => $dossier->id,
            'section_type' => $sectionData['type'],
            'title' => $sectionData['title'],
            'content' => $content,
            'page_number' => $index + 1,
            'order_index' => $index,
            'show_in_toc' => $sectionData['type'] !== 'cover',
        ]);
    }

    /**
     * Générer le contenu d'une section avec GPT-4
     *
     * @param PressDossier $dossier
     * @param array $sectionData
     * @param array $context
     * @return string HTML content
     */
    protected function generateSectionContent(
        PressDossier $dossier,
        array $sectionData,
        array $context
    ): string {
        $platform = $dossier->platform;
        $targetWords = $sectionData['words'];

        $prompt = $this->buildPrompt($platform, $sectionData, $context, $targetWords);

        // Appel GPT-4 avec la bonne méthode chat()
        $response = $this->gptService->chat([
            'model' => GptService::MODEL_GPT4O,
            'messages' => [
                ['role' => 'system', 'content' => 'Tu es un expert en rédaction de dossiers de presse professionnels.'],
                ['role' => 'user', 'content' => $prompt],
            ],
            'max_tokens' => (int) ($targetWords * 2), // Marge de sécurité
            'temperature' => 0.7,
        ]);

        // Calculer le coût (retourné par chat())
        $cost = $response['cost'] ?? 0;
        $this->totalCost += $cost;

        // Enregistrer dans le CostTracker
        $this->costTracker->recordCost('dossier_section', $cost, [
            'dossier_id' => $dossier->id,
            'section_type' => $sectionData['type'],
            'section_title' => $sectionData['title'],
            'model' => $response['model'] ?? 'gpt-4o',
            'usage' => $response['usage'] ?? [],
        ]);

        return $response['content'];
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * NOUVEAU : Générer la section FAQ du dossier de presse
     * ═══════════════════════════════════════════════════════════════════════════
     */
    protected function generateFaqSection(PressDossier $dossier, array $context, int $faqCount): string
    {
        $platform = $dossier->platform;
        $languageCode = $context['language_code'] ?? 'fr';

        // Adapter le prompt selon la langue
        $languageInstruction = $this->getLanguageInstruction($languageCode);

        // Récupérer le contexte knowledge
        $knowledgeSection = '';
        $knowledgeContext = $this->knowledgeService->getKnowledgeContext(
            $platform,
            $languageCode,
            'dossiers'
        );

        if (!empty($knowledgeContext)) {
            $knowledgeSection = "\n\n## CONTEXTE MARQUE (à respecter strictement) ##\n{$knowledgeContext}\n";
        }

        $prompt = <<<PROMPT
# CONTEXTE

Plateforme : {$platform->name}
Type de dossier : {$context['template_type']}
Titre du dossier : {$context['title']}
Langue : {$languageCode}

# INSTRUCTIONS

Génère {$faqCount} questions-réponses FAQ professionnelles pour ce dossier de presse.

Règles strictes :
1. Questions que les JOURNALISTES et MÉDIAS posent réellement
2. Questions sur l'entreprise, ses services, son positionnement
3. Questions sur les chiffres clés et résultats
4. Questions sur la vision et les perspectives
5. Questions sur les différenciateurs par rapport à la concurrence
6. Réponses concises mais complètes : 60-100 mots
7. Ton corporate et professionnel
8. Inclure au moins 1 question sur la stratégie future
9. Inclure au moins 1 question sur l'impact social/environnemental

{$languageInstruction}
{$knowledgeSection}

Format de sortie (JSON strict) :
{{
  "faqs": [
    {{"question": "...", "answer": "..."}},
    {{"question": "...", "answer": "..."}}
  ]
}}

Réponds UNIQUEMENT avec le JSON, rien d'autre.
PROMPT;

        $response = $this->gptService->chat([
            'model' => GptService::MODEL_GPT4O,
            'messages' => [
                ['role' => 'system', 'content' => 'Tu es un expert en relations presse et communication corporate. Tu génères des FAQ professionnelles pour les dossiers de presse.'],
                ['role' => 'user', 'content' => $prompt],
            ],
            'max_tokens' => 2500,
            'temperature' => 0.7,
        ]);

        $cost = $response['cost'] ?? 0;
        $this->totalCost += $cost;

        // Enregistrer le coût
        $this->costTracker->recordCost('dossier_faq', $cost, [
            'dossier_id' => $dossier->id,
            'faq_count' => $faqCount,
            'model' => $response['model'] ?? 'gpt-4o',
        ]);

        // Parser la réponse JSON
        $faqs = $this->parseFaqResponse($response['content']);

        // Générer le HTML avec Schema.org
        return $this->buildFaqHtml($faqs, $languageCode);
    }

    /**
     * Parser la réponse JSON des FAQs
     */
    protected function parseFaqResponse(string $content): array
    {
        try {
            // Nettoyer les backticks markdown si présents
            $cleaned = preg_replace('/```(?:json)?\s*|\s*```/', '', $content);
            $cleaned = trim($cleaned);
            
            $parsed = json_decode($cleaned, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::warning('PressDossierGenerator: Échec parsing FAQs JSON', [
                    'error' => json_last_error_msg(),
                    'content' => substr($content, 0, 500),
                ]);
                return [];
            }
            
            return $parsed['faqs'] ?? [];
        } catch (\Exception $e) {
            Log::warning('PressDossierGenerator: Exception parsing FAQs', [
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    /**
     * Construire le HTML des FAQs avec Schema.org
     */
    protected function buildFaqHtml(array $faqs, string $languageCode): string
    {
        if (empty($faqs)) {
            return '<div class="faq-section"><p>FAQ non disponibles.</p></div>';
        }

        $html = '<div class="faq-section" itemscope itemtype="https://schema.org/FAQPage">' . "\n";
        
        foreach ($faqs as $index => $faq) {
            $questionNumber = $index + 1;
            $question = htmlspecialchars($faq['question'] ?? '');
            $answer = htmlspecialchars($faq['answer'] ?? '');
            
            $html .= '<div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">' . "\n";
            $html .= '  <h3 class="faq-question" itemprop="name">' . $questionNumber . '. ' . $question . '</h3>' . "\n";
            $html .= '  <div class="faq-answer" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">' . "\n";
            $html .= '    <div itemprop="text"><p>' . $answer . '</p></div>' . "\n";
            $html .= '  </div>' . "\n";
            $html .= '</div>' . "\n";
        }
        
        $html .= '</div>';

        return $html;
    }

    /**
     * Obtenir l'instruction de langue pour le prompt
     */
    protected function getLanguageInstruction(string $languageCode): string
    {
        $instructions = [
            'fr' => 'Rédige toutes les questions et réponses en français professionnel.',
            'en' => 'Write all questions and answers in professional English.',
            'es' => 'Escribe todas las preguntas y respuestas en español profesional.',
            'de' => 'Schreibe alle Fragen und Antworten in professionellem Deutsch.',
            'pt' => 'Escreva todas as perguntas e respostas em português profissional.',
            'ar' => 'اكتب جميع الأسئلة والإجابات باللغة العربية المهنية.',
            'zh' => '用专业中文撰写所有问题和答案。',
            'hi' => 'सभी प्रश्न और उत्तर पेशेवर हिंदी में लिखें।',
            'ru' => 'Напишите все вопросы и ответы на профессиональном русском языке.',
        ];

        return $instructions[$languageCode] ?? $instructions['fr'];
    }

    /**
     * Construire le prompt pour la génération
     *
     * @param Platform $platform
     * @param array $sectionData
     * @param array $context
     * @param int $targetWords
     * @return string
     */
    protected function buildPrompt(
        Platform $platform,
        array $sectionData,
        array $context,
        int $targetWords
    ): string {
        // Récupérer le contexte knowledge
        $knowledgeSection = '';
        if (isset($context['language_code'])) {
            $knowledgeContext = $this->knowledgeService->getKnowledgeContext(
                $platform,
                $context['language_code'],
                'dossiers'
            );

            if (!empty($knowledgeContext)) {
                $knowledgeSection = "\n\n## CONTEXTE MARQUE (à respecter strictement) ##\n{$knowledgeContext}\n";
            }
        }

        $prompt = "# CONTEXTE\n\n";
        $prompt .= "Plateforme : {$platform->name}\n";
        $prompt .= "Type de dossier : {$context['template_type']}\n";
        $prompt .= "Titre du dossier : {$context['title']}\n";
        $prompt .= "Langue : {$context['language_code']}\n\n";

        $prompt .= "# SECTION À RÉDIGER\n\n";
        $prompt .= "Titre de la section : {$sectionData['title']}\n";
        $prompt .= "Type : {$sectionData['type']}\n";
        $prompt .= "Longueur cible : {$targetWords} mots\n\n";

        $prompt .= "# INSTRUCTIONS\n\n";
        $prompt .= "Rédige le contenu de cette section en HTML professionnel.\n";
        $prompt .= "- Utilise des balises HTML appropriées (<h3>, <p>, <ul>, etc.)\n";
        $prompt .= "- Ton professionnel et factuel\n";
        $prompt .= "- Structure claire avec des paragraphes aérés\n";
        $prompt .= "- Si applicable, inclus des listes à puces pour plus de clarté\n";
        $prompt .= "- Respecte la longueur cible de {$targetWords} mots (±10%)\n\n";

        // Ajouter des données de contexte si disponibles
        if (isset($context['metadata']) && !empty($context['metadata'])) {
            $prompt .= "# DONNÉES CONTEXTUELLES\n\n";
            $prompt .= json_encode($context['metadata'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            $prompt .= "\n\n";
        }

        $prompt .= "{$knowledgeSection}\n";
        $prompt .= "Génère maintenant le contenu HTML de la section.";

        return $prompt;
    }

    /**
     * Ajouter une image Unsplash au dossier
     */
    protected function addFeaturedImage(PressDossier $dossier, array $params): void
    {
        if (!$this->unsplash || !($params['add_image'] ?? false)) {
            return;
        }
        
        try {
            $image = $this->unsplash->findContextualImage([
                'keywords' => [
                    $dossier->title,
                    $params['company_name'] ?? '',
                    $params['industry'] ?? 'business',
                    $params['template_type'] ?? '',
                ],
            ]);
            
            if ($image) {
                DossierMedia::create([
                    'dossier_id' => $dossier->id,
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
            Log::warning('Dossier image failed', [
                'error' => $e->getMessage(),
                'dossier_id' => $dossier->id,
            ]);
        }
    }

    /**
     * Attacher des médias au dossier
     *
     * @param PressDossier $dossier
     * @param array $mediaArray
     * @return void
     */
    public function attachMedia(PressDossier $dossier, array $mediaArray): void
    {
        foreach ($mediaArray as $index => $mediaData) {
            $dossier->media()->create(array_merge($mediaData, [
                'order_index' => $index,
            ]));
        }
    }

    // =========================================================================
    // SEO ET POST-GÉNÉRATION
    // =========================================================================

    /**
     * Applique le SEO complet (meta optimisés)
     */
    protected function applyFullSeo(PressDossier $dossier, array $params): void
    {
        if (!($params['enable_full_seo'] ?? true)) {
            return;
        }

        try {
            $seoService = app(SeoOptimizationService::class);
            $lang = $params['language_code'] ?? 'fr';

            // Contexte SEO
            $context = [
                'platform' => $dossier->platform?->name ?? 'SOS-Expat',
                'year' => date('Y'),
                'template_type' => $params['template_type'] ?? 'press_dossier',
            ];

            // Générer meta title optimisé (< 60 caractères)
            $metaTitle = $seoService->generateMetaTitle(
                $dossier->title,
                'press_dossier',
                $lang,
                $context
            );

            // Générer meta description optimisée (< 160 caractères)
            $metaDescription = $seoService->generateMetaDescription(
                $dossier->title,
                'press_dossier',
                $lang,
                $context
            );

            // Mettre à jour le dossier
            $dossier->update([
                'meta_title' => $metaTitle,
                'meta_description' => $metaDescription,
            ]);

            Log::debug('SEO complet appliqué (press dossier)', [
                'dossier_id' => $dossier->id,
                'meta_title_length' => mb_strlen($metaTitle),
                'meta_description_length' => mb_strlen($metaDescription),
            ]);

        } catch (\Exception $e) {
            Log::warning('Erreur application SEO (press dossier)', [
                'dossier_id' => $dossier->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Génère le slug du dossier
     */
    protected function generateSlug(PressDossier $dossier): void
    {
        try {
            $slug = Str::slug($dossier->title);

            $dossier->update(['slug' => $slug]);

            Log::debug('Slug généré (press dossier)', [
                'dossier_id' => $dossier->id,
                'slug' => $slug,
            ]);

        } catch (\Exception $e) {
            Log::warning('Erreur génération slug (press dossier)', [
                'dossier_id' => $dossier->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Dispatch les traductions multi-langues si languages[] fourni
     */
    protected function dispatchTranslations(PressDossier $dossier, array $params): void
    {
        $targetLanguages = $params['languages'] ?? [];
        $autoTranslate = $params['auto_translate'] ?? config('content.auto_translate', false);

        // Langues supportées
        $supportedLanguages = ['fr', 'en', 'de', 'es', 'pt', 'ru', 'zh', 'ar', 'hi'];

        // Langue source
        $sourceLanguage = $params['language_code'] ?? 'fr';

        // Si auto_translate, traduire vers toutes les langues
        if ($autoTranslate && empty($targetLanguages)) {
            $targetLanguages = array_diff($supportedLanguages, [$sourceLanguage]);
        }

        // Filtrer les langues valides (exclure la langue source)
        $targetLanguages = array_filter($targetLanguages, fn($lang) =>
            in_array($lang, $supportedLanguages) && $lang !== $sourceLanguage
        );

        if (empty($targetLanguages)) {
            return;
        }

        // Dispatcher les traductions avec délai progressif (plus long pour dossiers)
        $delay = 0;
        foreach ($targetLanguages as $lang) {
            TranslatePressDossier::dispatch($dossier->id, $lang)
                ->delay(now()->addSeconds($delay));

            $delay += 30; // 30 secondes entre chaque traduction (dossiers plus longs)
        }

        Log::info('Traductions dossier presse dispatchées', [
            'dossier_id' => $dossier->id,
            'languages' => array_values($targetLanguages),
            'count' => count($targetLanguages),
        ]);
    }

    /**
     * Gère l'auto-publication si configurée
     */
    protected function handleAutoPublish(PressDossier $dossier, array $params): void
    {
        $autoPublish = $params['auto_publish'] ?? config('content.auto_publish', false);

        if (!$autoPublish) {
            return;
        }

        $dossier->update([
            'status' => 'published',
            'published_at' => now(),
        ]);

        Log::info('Dossier presse auto-publié', [
            'dossier_id' => $dossier->id,
        ]);
    }
}