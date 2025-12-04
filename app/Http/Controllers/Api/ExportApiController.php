<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExportQueue;
use App\Models\Article;
use App\Models\PressRelease;
use App\Models\PressDossier;
use App\Services\Export\UniversalExportService;
use App\Jobs\ProcessExport;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class ExportApiController extends Controller
{
    protected $exportService;

    public function __construct(UniversalExportService $exportService)
    {
        $this->exportService = $exportService;
    }

    /**
     * Export content to PDF
     */
    public function exportPdf(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'content_type' => 'required|in:Article,PressRelease,PressDossier',
            'content_id' => 'required|integer',
            'language_code' => 'required|string|size:2'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $content = $this->loadContent($request->content_type, $request->content_id);

            if (!$content) {
                return response()->json(['error' => 'Content not found'], 404);
            }

            // Queue export
            $exportQueue = ExportQueue::create([
                'content_type' => $request->content_type,
                'content_id' => $request->content_id,
                'export_format' => 'pdf',
                'language_code' => $request->language_code,
                'status' => 'pending'
            ]);

            // Dispatch job
            ProcessExport::dispatch($exportQueue->id);

            return response()->json([
                'message' => 'PDF export queued successfully',
                'export_id' => $exportQueue->id,
                'status' => 'pending'
            ], 202);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Export content to Word
     */
    public function exportWord(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'content_type' => 'required|in:Article,PressRelease,PressDossier',
            'content_id' => 'required|integer',
            'language_code' => 'required|string|size:2'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $content = $this->loadContent($request->content_type, $request->content_id);

            if (!$content) {
                return response()->json(['error' => 'Content not found'], 404);
            }

            // Queue export
            $exportQueue = ExportQueue::create([
                'content_type' => $request->content_type,
                'content_id' => $request->content_id,
                'export_format' => 'word',
                'language_code' => $request->language_code,
                'status' => 'pending'
            ]);

            // Dispatch job
            ProcessExport::dispatch($exportQueue->id);

            return response()->json([
                'message' => 'Word export queued successfully',
                'export_id' => $exportQueue->id,
                'status' => 'pending'
            ], 202);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Bulk export - multiple contents at once
     */
    public function bulkExport(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'exports' => 'required|array',
            'exports.*.content_type' => 'required|in:Article,PressRelease,PressDossier',
            'exports.*.content_id' => 'required|integer',
            'exports.*.format' => 'required|in:pdf,word',
            'exports.*.language_code' => 'required|string|size:2'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $exportIds = [];

            foreach ($request->exports as $exportData) {
                $content = $this->loadContent($exportData['content_type'], $exportData['content_id']);

                if (!$content) {
                    continue;
                }

                $exportQueue = ExportQueue::create([
                    'content_type' => $exportData['content_type'],
                    'content_id' => $exportData['content_id'],
                    'export_format' => $exportData['format'],
                    'language_code' => $exportData['language_code'],
                    'status' => 'pending'
                ]);

                ProcessExport::dispatch($exportQueue->id);
                $exportIds[] = $exportQueue->id;
            }

            return response()->json([
                'message' => count($exportIds) . ' exports queued successfully',
                'export_ids' => $exportIds
            ], 202);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get export queue status
     */
    public function queue(Request $request): JsonResponse
    {
        $query = ExportQueue::query();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('content_type')) {
            $query->where('content_type', $request->content_type);
        }

        if ($request->has('language_code')) {
            $query->where('language_code', $request->language_code);
        }

        $exports = $query->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json($exports);
    }

    /**
     * Get single export status
     */
    public function status(int $exportId): JsonResponse
    {
        $export = ExportQueue::find($exportId);

        if (!$export) {
            return response()->json(['error' => 'Export not found'], 404);
        }

        $response = [
            'id' => $export->id,
            'content_type' => $export->content_type,
            'content_id' => $export->content_id,
            'format' => $export->export_format,
            'language_code' => $export->language_code,
            'status' => $export->status,
            'created_at' => $export->created_at,
            'completed_at' => $export->completed_at,
            'error_message' => $export->error_message
        ];

        if ($export->status === 'completed' && $export->file_path) {
            $response['download_url'] = route('api.export.download', $export->id);
        }

        return response()->json($response);
    }

    /**
     * Download completed export
     */
    public function download(int $exportId)
    {
        $export = ExportQueue::find($exportId);

        if (!$export) {
            return response()->json(['error' => 'Export not found'], 404);
        }

        if ($export->status !== 'completed' || !$export->file_path) {
            return response()->json(['error' => 'Export not ready'], 400);
        }

        if (!file_exists($export->file_path)) {
            return response()->json(['error' => 'File not found'], 404);
        }

        $extension = $export->export_format === 'pdf' ? 'pdf' : 'docx';
        $fileName = "export_{$export->content_type}_{$export->content_id}_{$export->language_code}.{$extension}";

        return response()->download($export->file_path, $fileName);
    }

    /**
     * Cancel pending export
     */
    public function cancel(int $exportId): JsonResponse
    {
        $export = ExportQueue::find($exportId);

        if (!$export) {
            return response()->json(['error' => 'Export not found'], 404);
        }

        if ($export->status !== 'pending') {
            return response()->json(['error' => 'Can only cancel pending exports'], 400);
        }

        $export->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Export cancelled successfully']);
    }

    /**
     * Delete completed export
     */
    public function delete(int $exportId): JsonResponse
    {
        $export = ExportQueue::find($exportId);

        if (!$export) {
            return response()->json(['error' => 'Export not found'], 404);
        }

        // Supprimer fichier si existe
        if ($export->file_path && file_exists($export->file_path)) {
            @unlink($export->file_path);
        }

        $export->delete();

        return response()->json(['message' => 'Export deleted successfully']);
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
}