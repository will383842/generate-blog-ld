<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\AI\GptService;
use App\Services\AI\PerplexityService;
use App\Services\AI\DalleService;
use App\Services\AI\CostTracker;

class AIServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Enregistrer les services comme singletons
        $this->app->singleton(GptService::class, function ($app) {
            return new GptService();
        });

        $this->app->singleton(PerplexityService::class, function ($app) {
            return new PerplexityService();
        });

        $this->app->singleton(DalleService::class, function ($app) {
            return new DalleService();
        });

        $this->app->singleton(CostTracker::class, function ($app) {
            return new CostTracker();
        });

        // Aliases pour accès plus simple
        $this->app->alias(GptService::class, 'ai.gpt');
        $this->app->alias(PerplexityService::class, 'ai.perplexity');
        $this->app->alias(DalleService::class, 'ai.dalle');
        $this->app->alias(CostTracker::class, 'ai.costs');
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Publier la configuration
        $this->publishes([
            __DIR__ . '/../../config/ai.php' => config_path('ai.php'),
        ], 'ai-config');

        // Créer le canal de log personnalisé pour l'IA
        $this->configureLogging();
    }

    /**
     * Configurer le logging pour les services IA
     */
    protected function configureLogging(): void
    {
        $this->app['config']->set('logging.channels.ai', [
            'driver' => 'daily',
            'path' => storage_path('logs/ai.log'),
            'level' => 'debug',
            'days' => 30,
        ]);
    }
}