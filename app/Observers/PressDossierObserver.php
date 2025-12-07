<?php

namespace App\Observers;

use App\Models\PressDossier;
use App\Services\Cache\CacheKeyManager;

class PressDossierObserver
{
    public function created(PressDossier $pressDossier): void
    {
        $this->clearCaches();
    }

    public function updated(PressDossier $pressDossier): void
    {
        $this->clearCaches();
    }

    public function deleted(PressDossier $pressDossier): void
    {
        $this->clearCaches();
    }

    private function clearCaches(): void
    {
        CacheKeyManager::invalidateGroup('press_dossier');
    }
}