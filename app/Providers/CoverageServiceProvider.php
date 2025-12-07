<?php

namespace App\Providers;

use App\Services\Coverage\CoverageAnalysisService;
use Illuminate\Support\ServiceProvider;

class CoverageServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Enregistrer le service comme singleton
        $this->app->singleton(CoverageAnalysisService::class, function ($app) {
            return new CoverageAnalysisService();
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
