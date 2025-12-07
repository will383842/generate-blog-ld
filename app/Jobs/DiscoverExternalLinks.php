<?php

namespace App\Jobs;

use App\Models\Article;
use App\Services\Linking\ExternalLinkingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class DiscoverExternalLinks implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected int $articleId;
    protected bool $force;

    public int $tries = 3;
    public int $timeout = 180;
    public array $backoff = [60, 120, 300];

    /**
     * Create a new job instance.
     */
    public function __construct(int $articleId, bool $force = false)
    {
        $this->articleId = $articleId;
        $this->force = $force;
        $this->onQueue('linking-external');
    }

    /**
     * Execute the job.
     */
    public function handle(ExternalLinkingService $service): void
    {
        $article = Article::find($this->articleId);

        if (!$article) {
            Log::error("DiscoverExternalLinks: Article {$this->articleId} not found");
            return;
        }

        if ($article->status !== 'published' && $article->status !== 'draft') {
            Log::info("DiscoverExternalLinks: Article {$this->articleId} status is {$article->status}, skipping");
            return;
        }

        // Vérifier si des liens existent déjà et pas de force
        if (!$this->force && $article->externalLinks()->where('is_automatic', true)->exists()) {
            Log::info("DiscoverExternalLinks: Article {$this->articleId} already has external links, skipping");
            return;
        }

        $startTime = microtime(true);

        try {
            Log::info("DiscoverExternalLinks: Starting for article {$article->id}", [
                'title' => $article->title,
                'country' => $article->country_code,
                'language' => $article->language_code,
                'attempt' => $this->attempts()
            ]);

            $result = $service->generateExternalLinks($article);

            $duration = round(microtime(true) - $startTime, 2);

            Log::info("DiscoverExternalLinks: Completed for article {$article->id}", [
                'links_created' => $result['created'] ?? 0,
                'from_cache' => $result['cached'] ?? false,
                'sources' => $result['sources'] ?? [],
                'duration_seconds' => $duration
            ]);

        } catch (\Exception $e) {
            Log::error("DiscoverExternalLinks: Failed for article {$article->id}", [
                'error' => $e->getMessage(),
                'attempt' => $this->attempts()
            ]);

            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::critical("DiscoverExternalLinks: All attempts failed for article {$this->articleId}", [
            'error' => $exception->getMessage()
        ]);
    }

    /**
     * Get the tags that should be assigned to the job.
     */
    public function tags(): array
    {
        return [
            'linking',
            'external-links',
            "article:{$this->articleId}"
        ];
    }

    /**
     * Determine the unique ID for the job.
     */
    public function uniqueId(): string
    {
        return "external_links_{$this->articleId}";
    }
}
