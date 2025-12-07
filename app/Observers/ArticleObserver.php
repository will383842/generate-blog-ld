<?php

namespace App\Observers;

use App\Models\Article;
use App\Services\Cache\CacheKeyManager;

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

    public function restored(Article $article): void
    {
        $this->clearCaches();
    }

    public function forceDeleted(Article $article): void
    {
        $this->clearCaches();
    }

    private function clearCaches(): void
    {
        CacheKeyManager::invalidateGroup('article');
    }
}