<?php

namespace App\Providers;

use App\Events\ArticleLinksGenerated;
use App\Listeners\LogLinkingMetrics;
use App\Listeners\UpdatePillarLinks;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class LinkingEventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        ArticleLinksGenerated::class => [
            LogLinkingMetrics::class,
            UpdatePillarLinks::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        parent::boot();
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
