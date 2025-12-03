<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\Content\PlatformKnowledgeService;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Services de génération de contenu (Phase 4)
        $this->app->singleton(\App\Services\Content\ArticleGenerator::class);
        $this->app->singleton(\App\Services\Content\TitleService::class);
        $this->app->singleton(\App\Services\Content\QualityChecker::class);
        $this->app->singleton(\App\Services\Content\LinkService::class);
        $this->app->singleton(PlatformKnowledgeService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}