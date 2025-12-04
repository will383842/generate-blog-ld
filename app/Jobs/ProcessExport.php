<?php

namespace App\Jobs;

use App\Models\ExportQueue;
use App\Models\Article;
use App\Models\PressRelease;
use App\Models\PressDossier;
use App\Services\Export\UniversalExportService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessExport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 300; // 5 minutes
    public $tries = 3;

    protected $exportQueueId;

    /**
     * Create a new job instance.
     */
    public function __construct(int $exportQueueId)
    {
        $this->exportQueueId = $exportQueueId;
        $this->onQueue('exports');
    }

    /**
     * Execute the job.
     */
    public function handle(UniversalExportService $exportService): void
    {
        $exportItem = ExportQueue::find($this->exportQueueId);

        if (!$exportItem || $exportItem->status === 'completed') {
            return;
        }

        try {
            // Marquer comme en cours
            $exportItem->update(['status' => 'processing']);

            // Charger le contenu
            $content = $this->loadContent($exportItem->content_type, $exportItem->content_id);

            if (!$content) {
                throw new \Exception("Content not found: {$exportItem->content_type} #{$exportItem->content_id}");
            }

            // Exporter selon format
            $filePath = match ($exportItem->export_format) {
                'pdf' => $exportService->exportToPdf($content, $exportItem->language_code),
                'word' => $exportService->exportToWord($content, $exportItem->language_code),
                default => throw new \Exception("Unknown export format: {$exportItem->export_format}")
            };

            // Mettre à jour avec succès
            $exportItem->update([
                'status' => 'completed',
                'file_path' => $filePath,
                'completed_at' => now(),
                'error_message' => null
            ]);

            Log::info('Export completed', [
                'id' => $exportItem->id,
                'content_type' => $exportItem->content_type,
                'content_id' => $exportItem->content_id,
                'format' => $exportItem->export_format,
                'language' => $exportItem->language_code,
                'file_path' => $filePath
            ]);

        } catch (\Exception $e) {
            // Logger l'erreur
            Log::error('Export failed', [
                'id' => $exportItem->id,
                'content_type' => $exportItem->content_type,
                'content_id' => $exportItem->content_id,
                'format' => $exportItem->export_format,
                'language' => $exportItem->language_code,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Marquer comme échoué
            $exportItem->update([
                'status' => 'failed',
                'error_message' => $e->getMessage()
            ]);

            // Relancer si pas au dernier essai
            if ($this->attempts() < $this->tries) {
                $this->release(60); // Réessayer après 1 minute
            }
        }
    }

    /**
     * Load content model
     */
    private function loadContent(string $contentType, int $contentId)
    {
        return match ($contentType) {
            'Article' => Article::find($contentId),
            'PressRelease' => PressRelease::find($contentId),
            'PressDossier' => PressDossier::find($contentId),
            default => null
        };
    }

    /**
     * Handle job failure
     */
    public function failed(\Throwable $exception): void
    {
        $exportItem = ExportQueue::find($this->exportQueueId);

        if ($exportItem) {
            $exportItem->update([
                'status' => 'failed',
                'error_message' => $exception->getMessage()
            ]);
        }

        Log::error('Export job permanently failed', [
            'export_queue_id' => $this->exportQueueId,
            'error' => $exception->getMessage()
        ]);
    }
}