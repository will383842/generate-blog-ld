<?php

namespace App\Services\Press;

use App\Models\Platform;
use App\Models\PressDossier;
use App\Models\PressDossierMedia;
use App\Models\DossierSection;
use App\Services\AI\GptService;
use App\Services\AI\CostTracker;
use App\Services\Media\UnsplashService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * PressDossierGenerator - Génération de dossiers de presse professionnels
 * 
 * Pipeline de génération :
 * 1. Sélection du template et génération de la structure
 * 2. Génération du contenu de chaque section (GPT-4)
 * 3. Attachement des médias
 * 4. Finalisation et calcul des coûts
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
    protected GptService $gptService;
    protected CostTracker $costTracker;
    protected ?UnsplashService $unsplash = null;
    protected float $totalCost = 0;

    public function __construct(
        GptService $gptService,
        CostTracker $costTracker,
        UnsplashService $unsplash = null
    )
    {
        $this->gptService = $gptService;
        $this->costTracker = $costTracker;
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

            // Créer le dossier
            $dossier = $this->createDossier($params);
            
            // Générer la structure des sections
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
                ['type' => 'conclusion', 'title' => 'Conclusions et Recommandations', 'words' => 600],
                ['type' => 'appendix', 'title' => 'Annexes', 'words' => 400],
            ],

            'case_study' => [
                ['type' => 'cover', 'title' => 'Couverture', 'words' => 0],
                ['type' => 'intro', 'title' => 'Présentation du Cas', 'words' => 400],
                ['type' => 'chapter', 'title' => 'Contexte et Problématique', 'words' => 600],
                ['type' => 'chapter', 'title' => 'Solution Mise en Place', 'words' => 800],
                ['type' => 'chapter', 'title' => 'Résultats et Impact', 'words' => 700],
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
                ['type' => 'conclusion', 'title' => 'Conclusion', 'words' => 400],
            ],
        ];

        return $structures[$templateType] ?? $structures['press_kit_entreprise'];
    }

    /**
     * Générer le contenu d'une section
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
                PressDossierMedia::create([
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
}