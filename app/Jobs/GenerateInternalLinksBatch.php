<?php

namespace App\Jobs;

use App\Models\Article;
use App\Models\Platform;
use App\Services\Linking\InternalLinkingService;
use App\Services\Linking\PageRankService;
use Illuminate\Bus\Batchable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Log;

class GenerateInternalLinksBatch implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels, Batchable;

    /**
     * Platform ID cible
     */
    protected ?int $platformId;

    /**
     * Langue spécifique (optionnel)
     */
    protected ?string $languageCode;

    /**
     * Forcer la régénération
     */
    protected bool $force;

    /**
     * Taille des chunks
     */
    protected int $chunkSize;

    /**
     * Nombre de tentatives
     */
    public int $tries = 2;

    /**
     * Timeout en secondes
     */
    public int $timeout = 3600; // 1 heure

    /**
     * Create a new job instance.
     */
    public function __construct(
        ?int $platformId = null,
        ?string $languageCode = null,
        bool $force = false,
        int $chunkSize = 100
    ) {
        $this->platformId = $platformId;
        $this->languageCode = $languageCode;
        $this->force = $force;
        $this->chunkSize = $chunkSize;
        $this->onQueue('linking-batch');
    }

    /**
     * Execute the job.
     */
    public function handle(
        InternalLinkingService $linkingService,
        PageRankService $pageRankService
    ): void {
        $startTime = microtime(true);

        // Construire la requête
        $query = Article::where('status', 'published');

        if ($this->platformId) {
            $query->where('platform_id', $this->platformId);
        }

        if ($this->languageCode) {
            $query->where('language_code', $this->languageCode);
        }

        $totalArticles = $query->count();

        Log::info("GenerateInternalLinksBatch: Starting batch processing", [
            'platform_id' => $this->platformId,
            'language_code' => $this->languageCode,
            'total_articles' => $totalArticles,
            'force' => $this->force
        ]);

        if ($totalArticles === 0) {
            Log::info("GenerateInternalLinksBatch: No articles to process");
            return;
        }

        // Statistiques
        $stats = [
            'processed' => 0,
            'success' => 0,
            'failed' => 0,
            'skipped' => 0,
            'links_created' => 0,
            'errors' => []
        ];

        // Traiter par chunks
        $query->orderBy('id')
            ->chunk($this->chunkSize, function ($articles) use ($linkingService, &$stats) {
                foreach ($articles as $article) {
                    try {
                        // Vérifier si on doit skip
                        if (!$this->force && $this->hasRecentLinks($article)) {
                            $stats['skipped']++;
                            continue;
                        }

                        $result = $linkingService->generateInternalLinks($article);
                        
                        $stats['processed']++;
                        $stats['success']++;
                        $stats['links_created'] += $result['created'] ?? 0;

                        Log::debug("GenerateInternalLinksBatch: Processed article {$article->id}", [
                            'links_created' => $result['created'] ?? 0
                        ]);

                    } catch (\Exception $e) {
                        $stats['processed']++;
                        $stats['failed']++;
                        $stats['errors'][] = [
                            'article_id' => $article->id,
                            'error' => $e->getMessage()
                        ];

                        Log::warning("GenerateInternalLinksBatch: Failed for article {$article->id}", [
                            'error' => $e->getMessage()
                        ]);
                    }

                    // Pause légère pour ne pas surcharger
                    usleep(100000); // 100ms
                }

                // Log de progression
                Log::info("GenerateInternalLinksBatch: Progress", [
                    'processed' => $stats['processed'],
                    'success' => $stats['success'],
                    'failed' => $stats['failed']
                ]);
            });

        // Invalider le cache PageRank
        if ($this->platformId) {
            $pageRankService->invalidateCache($this->platformId);
        } else {
            // Invalider pour toutes les plateformes
            Platform::all()->each(function ($platform) use ($pageRankService) {
                $pageRankService->invalidateCache($platform->id);
            });
        }

        $duration = round(microtime(true) - $startTime, 2);

        Log::info("GenerateInternalLinksBatch: Completed", [
            'duration_seconds' => $duration,
            'stats' => $stats
        ]);

        // Stocker le rapport (optionnel)
        $this->storeReport($stats, $duration);
    }

    /**
     * Vérifie si l'article a des liens récents (moins de 24h)
     */
    protected function hasRecentLinks(Article $article): bool
    {
        return $article->internalLinksAsSource()
            ->where('is_automatic', true)
            ->where('created_at', '>', now()->subDay())
            ->exists();
    }

    /**
     * Stocke le rapport de batch
     */
    protected function storeReport(array $stats, float $duration): void
    {
        $reportKey = "linking_batch_report_" . now()->format('Y-m-d_H-i-s');
        
        $report = [
            'platform_id' => $this->platformId,
            'language_code' => $this->languageCode,
            'force' => $this->force,
            'started_at' => now()->subSeconds((int)$duration)->toIso8601String(),
            'completed_at' => now()->toIso8601String(),
            'duration_seconds' => $duration,
            'stats' => $stats
        ];

        // Stocker dans le cache pour 7 jours
        cache()->put($reportKey, $report, now()->addDays(7));

        Log::info("GenerateInternalLinksBatch: Report stored", [
            'report_key' => $reportKey
        ]);
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::critical("GenerateInternalLinksBatch: Batch job failed", [
            'platform_id' => $this->platformId,
            'error' => $exception->getMessage()
        ]);
    }

    /**
     * Get the tags that should be assigned to the job.
     */
    public function tags(): array
    {
        $tags = ['linking', 'batch'];
        
        if ($this->platformId) {
            $tags[] = "platform:{$this->platformId}";
        }
        
        if ($this->languageCode) {
            $tags[] = "language:{$this->languageCode}";
        }

        return $tags;
    }

    /**
     * Dispatch as individual jobs (alternative approach)
     */
    public static function dispatchAsIndividualJobs(
        ?int $platformId = null,
        ?string $languageCode = null,
        bool $force = false
    ): \Illuminate\Bus\Batch {
        $query = Article::where('status', 'published');

        if ($platformId) {
            $query->where('platform_id', $platformId);
        }

        if ($languageCode) {
            $query->where('language_code', $languageCode);
        }

        $jobs = $query->pluck('id')->map(function ($articleId) use ($force) {
            return new GenerateInternalLinks($articleId, $force);
        })->toArray();

        return Bus::batch($jobs)
            ->name('Generate Internal Links Batch')
            ->allowFailures()
            ->onQueue('linking-batch')
            ->dispatch();
    }

    /**
     * Get progress from batch
     */
    public static function getBatchProgress(string $batchId): ?array
    {
        $batch = Bus::findBatch($batchId);

        if (!$batch) {
            return null;
        }

        return [
            'id' => $batch->id,
            'name' => $batch->name,
            'total_jobs' => $batch->totalJobs,
            'pending_jobs' => $batch->pendingJobs,
            'failed_jobs' => $batch->failedJobs,
            'processed_jobs' => $batch->processedJobs(),
            'progress' => $batch->progress(),
            'finished' => $batch->finished(),
            'cancelled' => $batch->cancelled(),
            'created_at' => $batch->createdAt->toIso8601String(),
            'finished_at' => $batch->finishedAt?->toIso8601String()
        ];
    }
}
