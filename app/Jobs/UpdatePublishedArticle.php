<?php

namespace App\Jobs;

use App\Models\ArticlePublication;
use App\Services\Content\BulkUpdateService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class UpdatePublishedArticle implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $backoff = [60, 300, 900]; // 1min, 5min, 15min
    public $timeout = 120;

    protected ArticlePublication $publication;
    protected int $bulkUpdateId;

    public function __construct(ArticlePublication $publication, int $bulkUpdateId)
    {
        $this->publication = $publication;
        $this->bulkUpdateId = $bulkUpdateId;
    }

    public function handle(BulkUpdateService $bulkUpdateService): void
    {
        Log::info('Début update article publié', [
            'article_id' => $this->publication->article_id,
            'platform_id' => $this->publication->platform_id,
            'bulk_update_id' => $this->bulkUpdateId
        ]);

        $bulkUpdateService->updateSingleArticle($this->publication, $this->bulkUpdateId);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('Job UpdatePublishedArticle failed', [
            'article_id' => $this->publication->article_id,
            'bulk_update_id' => $this->bulkUpdateId,
            'error' => $exception->getMessage()
        ]);
    }
}
