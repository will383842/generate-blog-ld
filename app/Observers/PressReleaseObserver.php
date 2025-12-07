<?php

namespace App\Observers;

use App\Models\PressRelease;
use App\Services\Cache\CacheKeyManager;

class PressReleaseObserver
{
    public function created(PressRelease $pressRelease): void
    {
        $this->clearCaches();
    }

    public function updated(PressRelease $pressRelease): void
    {
        $this->clearCaches();
    }

    public function deleted(PressRelease $pressRelease): void
    {
        $this->clearCaches();
    }

    private function clearCaches(): void
    {
        CacheKeyManager::invalidateGroup('press_release');
    }
}