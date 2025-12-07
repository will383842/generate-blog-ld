<?php

namespace App\Jobs;

use App\Models\Article;
use App\Services\Linking\InternalLinkingService;
use App\Services\Linking\PageRankService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateInternalLinks implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Article cible
     */
    protected int $articleId;

    /**
     * Forcer la régénération même si liens existent
     */
    protected bool $force;

    /**
     * Nombre de tentatives
     */
    public int $tries = 3;

    /**
     * Timeout en secondes
     */
    public int $timeout = 120;

    /**
     * Délai entre les tentatives (secondes)
     */
    public array $backoff = [30, 60, 120];

    /**
     * Create a new job instance.
     */
    public function __construct(int $articleId, bool $force = false)
    {
        $this->articleId = $articleId;
        $this->force = $force;
        $this->onQueue('linking');
    }

    /**
     * Execute the job.
     */
    public function handle(
        InternalLinkingService $linkingService,
        PageRankService $pageRankService
    ): void {
        $article = Article::find($this->articleId);

        if (!$article) {
            Log::error("GenerateInternalLinks: Article {$this->articleId} not found");
            return;
        }

        if ($article->status !== 'published' && $article->status !== 'draft') {
            Log::info("GenerateInternalLinks: Article {$this->articleId} status is {$article->status}, skipping");
            return;
        }

        $startTime = microtime(true);

        try {
            Log::info("GenerateInternalLinks: Starting for article {$article->id}", [
                'title' => $article->title,
                'force' => $this->force,
                'attempt' => $this->attempts()
            ]);

            // Générer les liens internes
            $result = $linkingService->generateInternalLinks($article);

            $duration = round(microtime(true) - $startTime, 2);

            Log::info("GenerateInternalLinks: Completed for article {$article->id}", [
                'links_created' => $result['created'] ?? 0,
                'links_deleted' => $result['deleted'] ?? 0,
                'duration_seconds' => $duration
            ]);

            // Invalider le cache PageRank
            $pageRankService->invalidateCache($article->platform_id);

        } catch (\Exception $e) {
            Log::error("GenerateInternalLinks: Failed for article {$article->id}", [
                'error' => $e->getMessage(),
                'attempt' => $this->attempts(),
                'trace' => $e->getTraceAsString()
            ]);

            throw $e; // Re-throw pour retry
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::critical("GenerateInternalLinks: All attempts failed for article {$this->articleId}", [
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts()
        ]);

        // Optionnel: Notifier l'admin
        // Notification::send(Admin::first(), new LinkingJobFailed($this->articleId, $exception));
    }

    /**
     * Get the tags that should be assigned to the job.
     */
    public function tags(): array
    {
        return [
            'linking',
            'internal-links',
            "article:{$this->articleId}"
        ];
    }

    /**
     * Determine the unique ID for the job.
     */
    public function uniqueId(): string
    {
        return "internal_links_{$this->articleId}";
    }

    /**
     * Get the middleware the job should pass through.
     */
    public function middleware(): array
    {
        return [
            // RateLimiter pour éviter de surcharger l'API
            // new RateLimited('linking')
        ];
    }
}
