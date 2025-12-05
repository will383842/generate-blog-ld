<?php

namespace App\Observers;

use App\Models\PressRelease;
use Illuminate\Support\Facades\Cache;

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
        Cache::forget('stats.dashboard');
        Cache::forget('stats.production');
        Cache::forget('stats.costs');
        Cache::forget('stats.quality');
        Cache::forget('coverage.by_platform');
        Cache::forget('coverage.by_country');
    }
}