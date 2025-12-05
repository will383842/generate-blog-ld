<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\Content\PlatformKnowledgeService;
use App\Services\Export\UniversalExportService;
use App\Services\Export\WordExportService;
use App\Services\AI\ModelSelectionService;
use App\Services\AI\PromptOptimizerService;
use App\Services\Monitoring\CostMonitoringService;
use App\Services\Monitoring\PerformanceMonitoringService;
use App\Models\Article;
use App\Models\PressRelease;
use App\Models\PressDossier;
use App\Observers\ArticleObserver;
use App\Observers\PressReleaseObserver;
use App\Observers\PressDossierObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // =====================================================================
        // PHASE 4 : CONTENT GENERATION SERVICES
        // =====================================================================
        $this->app->singleton(\App\Services\Content\ArticleGenerator::class);
        $this->app->singleton(\App\Services\Content\TitleService::class);
        $this->app->singleton(\App\Services\Content\QualityChecker::class);
        $this->app->singleton(\App\Services\Content\LinkService::class);
        $this->app->singleton(PlatformKnowledgeService::class);
        
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
        // OBSERVERS - AUTOMATIC HOOKS
        // =====================================================================
        Article::observe(ArticleObserver::class);
        PressRelease::observe(PressReleaseObserver::class);
        PressDossier::observe(PressDossierObserver::class);
    }
}

/*
|--------------------------------------------------------------------------
| SERVICES ENREGISTRÉS
|--------------------------------------------------------------------------
|
| PHASE 4 : Content Generation (5 services)
| - ArticleGenerator : Génération articles IA
| - TitleService : Génération titres optimisés SEO
| - QualityChecker : Vérification qualité contenu
| - LinkService : Gestion liens internes/externes
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