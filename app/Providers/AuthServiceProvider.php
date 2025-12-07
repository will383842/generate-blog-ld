<?php

namespace App\Providers;

use App\Models\Article;
use App\Models\PressRelease;
use App\Models\Program;
use App\Policies\ArticlePolicy;
use App\Policies\PressReleasePolicy;
use App\Policies\ProgramPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Article::class => ArticlePolicy::class,
        PressRelease::class => PressReleasePolicy::class,
        Program::class => ProgramPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();
    }
}
