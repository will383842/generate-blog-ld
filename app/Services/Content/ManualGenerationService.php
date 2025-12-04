<?php

namespace App\Services\Content;

use App\Models\ManualTitle;
use App\Models\GenerationRequest;
use App\Models\Article;
use App\Models\Country;
use App\Models\Platform;
use App\Models\Theme;
use App\Models\ProviderType;
use App\Models\LawyerSpecialty;
use App\Models\ExpatDomain;
use App\Models\UlixaiService;
use Illuminate\Support\Facades\Log;
use Exception;

class ManualGenerationService
{
    protected TemplateDetectorService $templateDetector;

    public function __construct(TemplateDetectorService $templateDetector)
    {
        $this->templateDetector = $templateDetector;
    }

    /**
     * Traite un titre manuel et génère l'article
     *
     * @param ManualTitle $manualTitle
     * @return Article
     * @throws Exception
     */
    public function processManualTitle(ManualTitle $manualTitle): Article
    {
        // Créer la requête de génération
        $request = GenerationRequest::create([
            'manual_title_id' => $manualTitle->id,
            'status' => GenerationRequest::STATUS_PENDING,
        ]);

        try {
            // Marquer le titre comme en traitement
            $manualTitle->markAsProcessing();
            $request->start();

            // 1. Détection du template si pas déjà défini
            $templateCode = $this->detectTemplate($manualTitle);

            // 2. Construction du contexte complet
            $context = $this->buildContext($manualTitle, $templateCode);

            // 3. Sélection du générateur approprié
            $generator = $this->getGenerator($templateCode);

            // 4. Génération de l'article
            $article = $generator->generate($context);

            // 5. Calcul du coût (depuis les API logs)
            $cost = $this->calculateGenerationCost($article);

            // 6. Finalisation succès
            $request->complete($article, $cost);
            $manualTitle->markAsCompleted();

            Log::info("Article généré avec succès depuis titre manuel", [
                'manual_title_id' => $manualTitle->id,
                'article_id' => $article->id,
                'template' => $templateCode,
                'cost' => $cost,
            ]);

            return $article;

        } catch (Exception $e) {
            // Gestion erreur
            $request->fail($e->getMessage());
            $manualTitle->markAsFailed();

            Log::error("Échec génération depuis titre manuel", [
                'manual_title_id' => $manualTitle->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }

    /**
     * Traite la queue de requêtes pending
     *
     * @param int $limit Nombre maximum de requêtes à traiter
     * @return int Nombre de requêtes traitées
     */
    public function processQueue(int $limit = 10): int
    {
        $manualTitles = ManualTitle::pending()
            ->orWhere('status', ManualTitle::STATUS_QUEUED)
            ->limit($limit)
            ->get();

        $processed = 0;

        foreach ($manualTitles as $manualTitle) {
            try {
                $this->processManualTitle($manualTitle);
                $processed++;
            } catch (Exception $e) {
                // Continue avec le suivant
                Log::warning("Échec traitement titre manuel dans queue", [
                    'manual_title_id' => $manualTitle->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $processed;
    }

    /**
     * Détecte le template optimal
     *
     * @param ManualTitle $manualTitle
     * @return string Code du template
     */
    protected function detectTemplate(ManualTitle $manualTitle): string
    {
        // Si template déjà suggéré, l'utiliser
        if ($manualTitle->hasSuggestedTemplate()) {
            $template = $manualTitle->getTemplateCode();
            
            // Vérifier que le template existe
            if ($this->templateDetector->templateExists($template)) {
                return $template;
            }
        }

        // Sinon, détection automatique
        $template = $this->templateDetector->detectOptimalTemplate(
            $manualTitle->title,
            $manualTitle->description
        );

        // Sauvegarder le template détecté
        $manualTitle->update(['suggested_template' => $template]);

        return $template;
    }

    /**
     * Construit le contexte complet pour la génération
     *
     * @param ManualTitle $manualTitle
     * @param string $templateCode
     * @return array
     */
    protected function buildContext(ManualTitle $manualTitle, string $templateCode): array
    {
        $context = [
            // Informations de base
            'title' => $manualTitle->title,
            'description' => $manualTitle->description,
            'template' => $templateCode,
            
            // Relations
            'platform_id' => $manualTitle->platform_id,
            'country_id' => $manualTitle->country_id,
            'language_code' => $manualTitle->language_code,
            
            // Objets chargés
            'platform' => $manualTitle->platform,
            'country' => $manualTitle->country,
        ];

        // Ajouter le contexte custom du JSON si disponible
        $customContext = $manualTitle->context ?? [];
        
        // Résolution du contexte thématique
        if (isset($customContext['theme_type']) && isset($customContext['theme_id'])) {
            $context['theme_type'] = $customContext['theme_type'];
            $context['theme_id'] = $customContext['theme_id'];
            
            // Charger l'objet thématique selon le type
            $context['theme'] = $this->resolveTheme(
                $customContext['theme_type'],
                $customContext['theme_id']
            );
        }

        // Ajouter author_id si disponible
        if (isset($customContext['author_id'])) {
            $context['author_id'] = $customContext['author_id'];
        }

        // Configuration du template
        $context['template_config'] = $this->templateDetector->getTemplateConfig($templateCode);

        return $context;
    }

    /**
     * Résout un thème selon son type
     *
     * @param string $themeType
     * @param int $themeId
     * @return mixed
     */
    protected function resolveTheme(string $themeType, int $themeId)
    {
        return match ($themeType) {
            'theme' => Theme::find($themeId),
            'provider_type' => ProviderType::find($themeId),
            'lawyer_specialty' => LawyerSpecialty::find($themeId),
            'expat_domain' => ExpatDomain::find($themeId),
            'ulixai_service' => UlixaiService::find($themeId),
            default => null,
        };
    }

    /**
     * Obtient le générateur approprié selon le template
     *
     * @param string $templateCode
     * @return mixed Instance du générateur
     * @throws Exception
     */
    protected function getGenerator(string $templateCode)
    {
        $generatorClass = $this->templateDetector->getGeneratorClass($templateCode);

        // Résolution du générateur selon le nom de classe
        return match ($generatorClass) {
            'PillarArticleGenerator' => app(PillarArticleGenerator::class),
            'ComparativeGenerator' => app(ComparativeGenerator::class),
            'ArticleGenerator' => app(ArticleGenerator::class),
            default => throw new Exception("Générateur inconnu: {$generatorClass}"),
        };
    }

    /**
     * Calcule le coût de génération (approximatif depuis les logs API)
     *
     * @param Article $article
     * @return float Coût en dollars
     */
    protected function calculateGenerationCost(Article $article): float
    {
        // Récupérer le coût depuis l'article si disponible
        if ($article->generation_cost > 0) {
            return $article->generation_cost;
        }

        // Sinon, estimation basée sur le template et le nombre de mots
        $templateConfig = $this->templateDetector->getTemplateConfig($article->type ?? 'guide_pratique');
        
        return $templateConfig['estimated_cost'] ?? 0.05;
    }
}