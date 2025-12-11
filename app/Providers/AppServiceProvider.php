<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Log;
use App\Services\Content\PlatformKnowledgeService;
use App\Services\Content\BrandValidationService;
use App\Services\Export\UniversalExportService;
use App\Services\Export\WordExportService;
use App\Services\AI\ModelSelectionService;
use App\Services\AI\PromptOptimizerService;
use App\Services\Monitoring\CostMonitoringService;
use App\Services\Monitoring\PerformanceMonitoringService;
use App\Services\Quality\ContentQualityEnforcer;
use App\Services\Quality\GoldenExamplesService;
use App\Services\UnsplashService;
use App\Services\Content\TemplateManager;
use App\Models\Article;
use App\Models\PressRelease;
use App\Models\PressDossier;
use App\Observers\ArticleObserver;
use App\Observers\PressReleaseObserver;
use App\Observers\PressDossierObserver;
use App\Exceptions\MissingApiKeyException;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Clés API requises pour le fonctionnement de l'application
     * Format: 'env_key' => ['config_path', 'description', 'required']
     */
    private array $requiredApiKeys = [
        'OPENAI_API_KEY' => [
            'config' => 'ai.openai.api_key',
            'description' => 'OpenAI API (GPT-4, DALL-E)',
            'required' => true,
        ],
        'PERPLEXITY_API_KEY' => [
            'config' => 'ai.perplexity.api_key',
            'description' => 'Perplexity API (Research)',
            'required' => false, // Optionnel, fallback sur OpenAI
        ],
        'UNSPLASH_ACCESS_KEY' => [
            'config' => 'services.unsplash.access_key',
            'description' => 'Unsplash API (Images stock)',
            'required' => false,
        ],
    ];

    /**
     * Register any application services.
     */
    public function register(): void
    {
        // =====================================================================
        // PHASE 4 : CONTENT GENERATION SERVICES
        // =====================================================================
        $this->app->singleton(TemplateManager::class);
        $this->app->singleton(\App\Services\Content\ArticleGenerator::class);
        $this->app->singleton(\App\Services\Content\TitleService::class);
        $this->app->singleton(\App\Services\Content\QualityChecker::class);
        $this->app->singleton(\App\Services\Content\LinkService::class);
        $this->app->singleton(\App\Services\Content\KeywordIntegrationService::class);
        $this->app->singleton(PlatformKnowledgeService::class);
        $this->app->singleton(BrandValidationService::class);

        // =====================================================================
        // PHASE 5 : QUALITY & MEDIA SERVICES
        // =====================================================================
        $this->app->singleton(ContentQualityEnforcer::class);
        $this->app->singleton(GoldenExamplesService::class);
        $this->app->singleton(UnsplashService::class);
        
        // =====================================================================
        // PHASE 18 : EXPORT PDF/WORD MULTI-LANGUES ✨
        // =====================================================================
        $this->app->singleton(UniversalExportService::class);
        $this->app->singleton(WordExportService::class);
        
        // =====================================================================
        // PHASE 20 : MONITORING & COST OPTIMIZATION ✨
        // =====================================================================
        $this->app->singleton(ModelSelectionService::class);
        $this->app->singleton(PromptOptimizerService::class);
        $this->app->singleton(CostMonitoringService::class);
        $this->app->singleton(PerformanceMonitoringService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // =====================================================================
        // VALIDATION CLÉS API AU DÉMARRAGE
        // =====================================================================
        $this->validateApiKeys();

        // =====================================================================
        // OBSERVERS - AUTOMATIC HOOKS
        // =====================================================================
        Article::observe(ArticleObserver::class);
        PressRelease::observe(PressReleaseObserver::class);
        PressDossier::observe(PressDossierObserver::class);
    }

    /**
     * Valide la présence des clés API critiques au démarrage
     *
     * @throws MissingApiKeyException Si une clé requise est manquante en production
     */
    private function validateApiKeys(): void
    {
        // Skip validation pour les commandes de configuration
        if ($this->app->runningInConsole() && $this->isConfigCommand()) {
            return;
        }

        $missingRequired = [];
        $missingOptional = [];

        foreach ($this->requiredApiKeys as $envKey => $config) {
            $value = config($config['config']) ?? env($envKey);

            if (empty($value)) {
                if ($config['required']) {
                    $missingRequired[] = [
                        'key' => $envKey,
                        'description' => $config['description'],
                    ];
                } else {
                    $missingOptional[] = [
                        'key' => $envKey,
                        'description' => $config['description'],
                    ];
                }
            }
        }

        // Log les clés optionnelles manquantes (warning)
        if (!empty($missingOptional)) {
            foreach ($missingOptional as $missing) {
                Log::warning("Clé API optionnelle manquante: {$missing['key']} ({$missing['description']})");
            }
        }

        // Erreur fatale en production si clés requises manquantes
        if (!empty($missingRequired)) {
            $keyList = implode(', ', array_column($missingRequired, 'key'));

            Log::critical("Clés API requises manquantes: {$keyList}");

            // En production, lever une exception
            if ($this->app->environment('production')) {
                throw new MissingApiKeyException(
                    "Clés API critiques manquantes: {$keyList}. " .
                    "L'application ne peut pas démarrer sans ces clés."
                );
            }

            // En développement, log un warning visible
            if ($this->app->environment('local', 'development')) {
                foreach ($missingRequired as $missing) {
                    Log::error(
                        "[STARTUP] Clé API requise manquante: {$missing['key']} - {$missing['description']}. " .
                        "Ajoutez-la dans votre fichier .env"
                    );
                }
            }
        }
    }

    /**
     * Vérifie si on exécute une commande de configuration
     * (pour éviter de bloquer php artisan config:cache, etc.)
     */
    private function isConfigCommand(): bool
    {
        $argv = $_SERVER['argv'] ?? [];

        $configCommands = [
            'config:cache',
            'config:clear',
            'cache:clear',
            'key:generate',
            'migrate',
            'migrate:fresh',
            'migrate:install',
            'db:seed',
            'optimize',
            'optimize:clear',
            'package:discover',
            'vendor:publish',
        ];

        foreach ($argv as $arg) {
            foreach ($configCommands as $cmd) {
                if (str_contains($arg, $cmd)) {
                    return true;
                }
            }
        }

        return false;
    }
}

/*
|--------------------------------------------------------------------------
| SERVICES ENREGISTRÉS
|--------------------------------------------------------------------------
|
| PHASE 4 : Content Generation (6 services)
| - ArticleGenerator : Génération articles IA
| - TitleService : Génération titres optimisés SEO
| - QualityChecker : Vérification qualité contenu
| - LinkService : Gestion liens internes/externes
| - KeywordIntegrationService : Intégration mots-clés SEO ✨
| - PlatformKnowledgeService : Connaissance plateformes
|
| PHASE 18 : Export PDF/WORD (2 services)
| - UniversalExportService : Export universel tous contenus
| - WordExportService : Export spécialisé Word (.docx)
|
| PHASE 20 : Monitoring & Cost Optimization (4 services) ✨
| - ModelSelectionService : Sélection automatique modèles IA
| - PromptOptimizerService : Optimisation prompts (-10-20% tokens)
| - CostMonitoringService : Monitoring coûts API temps réel
| - PerformanceMonitoringService : Monitoring performance système
|
|--------------------------------------------------------------------------
| OBSERVERS ENREGISTRÉS
|--------------------------------------------------------------------------
|
| ArticleObserver :
| - creating : Génère UUID, slug, meta tags
| - updating : Met à jour slug si titre modifié
| - deleted : Supprime traductions associées
|
| PressReleaseObserver :
| - creating : Génère UUID, slug, template_type par défaut
| - updating : Met à jour slug si titre modifié
| - deleted : Supprime traductions et médias associés
|
| PressDossierObserver :
| - creating : Génère UUID, slug, calcul pages
| - updating : Recalcule page_count si sections modifiées
| - deleted : Supprime traductions, sections et médias associés
|
|--------------------------------------------------------------------------
| SINGLETON PATTERN
|--------------------------------------------------------------------------
|
| Tous ces services sont enregistrés en Singleton pour :
| 1. Réutilisation instances (performance)
| 2. État partagé entre requêtes
| 3. Économie mémoire
| 4. Cache interne services
|
|--------------------------------------------------------------------------
| UTILISATION
|--------------------------------------------------------------------------
|
| Dans Controllers :
| 
| public function __construct(
|     protected ModelSelectionService $modelService,
|     protected CostMonitoringService $costService
| ) {}
|
| Dans Services :
|
| $modelService = app(ModelSelectionService::class);
| $costs = app(CostMonitoringService::class)->getDailyCosts();
|
| Dans Commands :
|
| $this->costService = app(CostMonitoringService::class);
|
|--------------------------------------------------------------------------
| VÉRIFICATION
|--------------------------------------------------------------------------
|
| Tester services enregistrés :
|
| php artisan tinker
| >>> app(\App\Services\Content\KeywordIntegrationService::class)
| >>> app(\App\Services\AI\ModelSelectionService::class)
| >>> app(\App\Services\Monitoring\CostMonitoringService::class)
|
| Tous doivent retourner une instance sans erreur.
|
| Tester observers :
|
| php artisan tinker
| >>> $article = Article::create([...])
| >>> // UUID et slug doivent être générés automatiquement
| >>> $article->uuid // Doit avoir une valeur
| >>> $article->slug // Doit avoir une valeur
|
|--------------------------------------------------------------------------
*/
