<?php

namespace App\Observers;

use App\Models\PressDossier;
use Illuminate\Support\Facades\Cache;

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
        Cache::forget('stats.dashboard');
        Cache::forget('stats.production');
        Cache::forget('stats.costs');
        Cache::forget('stats.quality');
        Cache::forget('coverage.by_platform');
        Cache::forget('coverage.by_country');
    }
}