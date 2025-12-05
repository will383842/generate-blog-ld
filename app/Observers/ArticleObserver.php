<?php

namespace App\Observers;

use App\Models\Article;
use Illuminate\Support\Facades\Cache;

class ArticleObserver
{
    public function created(Article $article): void
    {
        $this->clearCaches();
    }

    public function updated(Article $article): void
    {
        $this->clearCaches();
    }

    public function deleted(Article $article): void
    {
        $this->clearCaches();
    }

    private function clearCaches(): void
    {
        Cache::forget('stats.dashboard');
        Cache::forget('stats.production');
        Cache::forget('coverage.by_platform');
        Cache::forget('coverage.by_country');
        // Ajouter autres keys selon besoin
    }
}