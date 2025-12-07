<?php

namespace App\Jobs;

use App\Models\ExternalLink;
use App\Models\Platform;
use App\Services\Linking\LinkVerificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class VerifyExternalLinks implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected ?int $platformId;
    protected bool $onlyUnverified;
    protected ?int $limit;

    public int $tries = 2;
    public int $timeout = 3600; // 1 heure

    /**
     * Create a new job instance.
     */
    public function __construct(
        ?int $platformId = null, 
        bool $onlyUnverified = false,
        ?int $limit = null
    ) {
        $this->platformId = $platformId;
        $this->onlyUnverified = $onlyUnverified;
        $this->limit = $limit;
        $this->onQueue('linking-verification');
    }

    /**
     * Execute the job.
     */
    public function handle(LinkVerificationService $service): void
    {
        $startTime = microtime(true);

        Log::info("VerifyExternalLinks: Starting verification", [
            'platform_id' => $this->platformId,
            'only_unverified' => $this->onlyUnverified,
            'limit' => $this->limit
        ]);

        try {
            if ($this->platformId) {
                // Vérifier une plateforme spécifique
                $result = $service->verifyPlatformLinks($this->platformId, $this->onlyUnverified);
            } else {
                // Vérifier toutes les plateformes
                $result = $this->verifyAllPlatforms($service);
            }

            $duration = round(microtime(true) - $startTime, 2);

            Log::info("VerifyExternalLinks: Completed", [
                'total' => $result['total'] ?? 0,
                'valid' => $result['valid'] ?? 0,
                'broken' => $result['broken'] ?? 0,
                'duration_seconds' => $duration
            ]);

            // Alerter si trop de liens cassés
            if ($this->platformId) {
                $service->checkAndAlert($this->platformId);
            }

            // Stocker le rapport
            $this->storeReport($result, $duration);

        } catch (\Exception $e) {
            Log::error("VerifyExternalLinks: Failed", [
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Vérifie toutes les plateformes
     */
    protected function verifyAllPlatforms(LinkVerificationService $service): array
    {
        $totalResult = [
            'total' => 0,
            'valid' => 0,
            'broken' => 0,
            'platforms' => []
        ];

        Platform::all()->each(function ($platform) use ($service, &$totalResult) {
            $result = $service->verifyPlatformLinks($platform->id, $this->onlyUnverified);
            
            $totalResult['total'] += $result['total'];
            $totalResult['valid'] += $result['valid'];
            $totalResult['broken'] += $result['broken'];
            $totalResult['platforms'][$platform->id] = [
                'name' => $platform->name,
                'broken' => $result['broken']
            ];

            // Alerter par plateforme
            $service->checkAndAlert($platform->id);
        });

        return $totalResult;
    }

    /**
     * Stocke le rapport de vérification
     */
    protected function storeReport(array $result, float $duration): void
    {
        $reportKey = "link_verification_" . now()->format('Y-m-d_H-i-s');
        
        $report = [
            'platform_id' => $this->platformId,
            'only_unverified' => $this->onlyUnverified,
            'completed_at' => now()->toIso8601String(),
            'duration_seconds' => $duration,
            'results' => $result
        ];

        cache()->put($reportKey, $report, now()->addDays(30));
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::critical("VerifyExternalLinks: Job failed", [
            'platform_id' => $this->platformId,
            'error' => $exception->getMessage()
        ]);
    }

    /**
     * Get the tags that should be assigned to the job.
     */
    public function tags(): array
    {
        $tags = ['linking', 'verification'];
        
        if ($this->platformId) {
            $tags[] = "platform:{$this->platformId}";
        }

        return $tags;
    }
}
