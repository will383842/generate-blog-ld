<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Export\UniversalExportService;
use App\Models\ExportQueue;
use App\Models\Article;
use App\Models\PressRelease;
use App\Models\PressDossier;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

/**
 * ✅ PHASE 18: Export PDF/WORD multi-langues
 * ✅ CORRECTION BUG #2: Support PillarArticle
 */
class ExportApiController extends Controller
{
    protected UniversalExportService $exportService;

    public function __construct(UniversalExportService $exportService)
    {
        $this->exportService = $exportService;
    }

    /**
     * Export PDF
     * ✅ CORRECTION: content_type accepte PillarArticle
     */
    public function exportPdf(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'content_type' => 'required|in:Article,PillarArticle,PressRelease,PressDossier',
                'content_id' => 'required|integer|min:1',
                'language_code' => 'required|string|size:2',
            ]);

            $content = $this->loadContent($request->content_type, $request->content_id);

            if (!$content) {
                return response()->json([
                    'error' => 'Content not found'
                ], 404);
            }

            $export = ExportQueue::create([
                'content_type' => $request->content_type,
                'content_id' => $request->content_id,
                'format' => 'pdf',
                'language_code' => $request->language_code,
                'status' => 'pending',
                'priority' => $request->priority ?? 'normal',
            ]);

            \App\Jobs\ProcessExport::dispatch($export->id);

            return response()->json([
                'message' => 'PDF export queued successfully',
                'export_id' => $export->id,
                'status' => 'pending',
                'status_url' => route('api.export.status', $export->id),
            ], 202);

        } catch (\Exception $e) {
            Log::error('Export PDF failed', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'error' => 'Export failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export Word
     * ✅ CORRECTION: content_type accepte PillarArticle
     */
    public function exportWord(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'content_type' => 'required|in:Article,PillarArticle,PressRelease,PressDossier',
                'content_id' => 'required|integer|min:1',
                'language_code' => 'required|string|size:2',
            ]);

            $content = $this->loadContent($request->content_type, $request->content_id);

            if (!$content) {
                return response()->json([
                    'error' => 'Content not found'
                ], 404);
            }

            $export = ExportQueue::create([
                'content_type' => $request->content_type,
                'content_id' => $request->content_id,
                'format' => 'word',
                'language_code' => $request->language_code,
                'status' => 'pending',
                'priority' => $request->priority ?? 'normal',
            ]);

            \App\Jobs\ProcessExport::dispatch($export->id);

            return response()->json([
                'message' => 'Word export queued successfully',
                'export_id' => $export->id,
                'status' => 'pending',
                'status_url' => route('api.export.status', $export->id),
            ], 202);

        } catch (\Exception $e) {
            Log::error('Export Word failed', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'error' => 'Export failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk export
     * ✅ CORRECTION: content_type accepte PillarArticle
     */
    public function bulkExport(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'exports' => 'required|array|min:1|max:50',
                'exports.*.content_type' => 'required|in:Article,PillarArticle,PressRelease,PressDossier',
                'exports.*.content_id' => 'required|integer|min:1',
                'exports.*.format' => 'required|in:pdf,word',
                'exports.*.language_code' => 'required|string|size:2',
            ]);

            $exportIds = [];

            foreach ($request->exports as $exportData) {
                $content = $this->loadContent($exportData['content_type'], $exportData['content_id']);

                if (!$content) {
                    continue;
                }

                $export = ExportQueue::create([
                    'content_type' => $exportData['content_type'],
                    'content_id' => $exportData['content_id'],
                    'format' => $exportData['format'],
                    'language_code' => $exportData['language_code'],
                    'status' => 'pending',
                ]);

                \App\Jobs\ProcessExport::dispatch($export->id);
                $exportIds[] = $export->id;
            }

            return response()->json([
                'message' => count($exportIds) . ' exports queued successfully',
                'export_ids' => $exportIds,
            ], 202);

        } catch (\Exception $e) {
            Log::error('Bulk export failed', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'error' => 'Bulk export failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export queue status
     */
    public function queueStatus(Request $request): JsonResponse
    {
        $exports = ExportQueue::query()
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();

        return response()->json([
            'exports' => $exports,
            'total' => $exports->count(),
        ]);
    }

    /**
     * Export status by ID
     */
    public function status(int $exportId): JsonResponse
    {
        $export = ExportQueue::findOrFail($exportId);

        return response()->json([
            'export' => $export,
            'download_url' => $export->status === 'completed' 
                ? route('api.export.download', $export->id) 
                : null,
        ]);
    }

    /**
     * Download export
     */
    public function download(int $exportId)
    {
        $export = ExportQueue::findOrFail($exportId);

        if ($export->status !== 'completed') {
            return response()->json([
                'error' => 'Export not ready'
            ], 400);
        }

        if (!file_exists(storage_path('app/' . $export->file_path))) {
            return response()->json([
                'error' => 'File not found'
            ], 404);
        }

        return response()->download(
            storage_path('app/' . $export->file_path),
            $export->file_name,
            [
                'Content-Type' => $export->format === 'pdf' 
                    ? 'application/pdf' 
                    : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ]
        );
    }

    /**
     * Cancel export
     */
    public function cancel(int $exportId): JsonResponse
    {
        $export = ExportQueue::findOrFail($exportId);

        if (in_array($export->status, ['completed', 'failed'])) {
            return response()->json([
                'error' => 'Cannot cancel completed or failed export'
            ], 400);
        }

        $export->update(['status' => 'cancelled']);

        return response()->json([
            'message' => 'Export cancelled successfully',
            'export' => $export,
        ]);
    }

    /**
     * Charger contenu par type
     * ✅ CORRECTION: Case PillarArticle ajouté
     */
    protected function loadContent(string $contentType, int $contentId)
    {
        return match ($contentType) {
            'Article' => Article::where('type', 'article')->find($contentId),
            'PillarArticle' => Article::where('type', 'pillar')->find($contentId),
            'PressRelease' => PressRelease::find($contentId),
            'PressDossier' => PressDossier::find($contentId),
            default => null
        };
    }
}