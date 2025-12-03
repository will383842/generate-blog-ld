<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GenerationQueue;
use App\Jobs\ProcessBatch;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * BatchController - Gestion des lots de génération
 */
class BatchController extends Controller
{
    /**
     * Créer un batch de génération
     * 
     * POST /api/batches
     */
    public function create(Request $request): JsonResponse
    {
        $request->validate([
            'type' => 'required|in:article,landing,comparative',
            'platform_id' => 'required|integer|exists:platforms,id',
            'country_ids' => 'required|array|min:1',
            'country_ids.*' => 'integer|exists:countries,id',
            'language_codes' => 'required|array|min:1',
            'language_codes.*' => 'string|size:2|exists:languages,code',
            'theme_ids' => 'nullable|array',
            'priority' => 'nullable|in:low,default,high',
        ]);

        try {
            DB::beginTransaction();

            $countries = $request->country_ids;
            $languages = $request->language_codes;
            $themes = $request->get('theme_ids', [1]);
            
            $totalJobs = count($countries) * count($languages) * count($themes);

            $batch = GenerationQueue::create([
                'type' => 'batch',
                'status' => 'pending',
                'priority' => $request->get('priority', 'default'),
                'total_items' => $totalJobs,
                'completed_items' => 0,
                'failed_items' => 0,
                'metadata' => [
                    'content_type' => $request->type,
                    'platform_id' => $request->platform_id,
                    'countries' => $countries,
                    'languages' => $languages,
                    'themes' => $themes,
                    'created_by' => auth()->id() ?? null,
                ],
            ]);

            ProcessBatch::dispatch($batch->id);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Batch créé avec succès',
                'data' => [
                    'batch_id' => $batch->id,
                    'total_items' => $totalJobs,
                    'status' => 'pending',
                    'estimated_duration_minutes' => ceil($totalJobs * 2),
                ],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur création batch', [
                'error' => $e->getMessage(),
                'params' => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du batch',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Statut d'un batch
     * 
     * GET /api/batches/{id}
     */
    public function status(int $id): JsonResponse
    {
        try {
            $batch = GenerationQueue::findOrFail($id);

            $progress = $batch->total_items > 0 
                ? round(($batch->completed_items / $batch->total_items) * 100, 2)
                : 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $batch->id,
                    'status' => $batch->status,
                    'progress' => $progress,
                    'total_items' => $batch->total_items,
                    'completed_items' => $batch->completed_items,
                    'failed_items' => $batch->failed_items,
                    'pending_items' => $batch->total_items - $batch->completed_items - $batch->failed_items,
                    'created_at' => $batch->created_at->toIso8601String(),
                    'updated_at' => $batch->updated_at->toIso8601String(),
                    'metadata' => $batch->metadata,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Batch non trouvé',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Liste des batches
     * 
     * GET /api/batches
     */
    public function index(Request $request): JsonResponse
    {
        $query = GenerationQueue::where('type', 'batch')
            ->orderBy('created_at', 'desc');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $perPage = min($request->get('per_page', 15), 100);
        $batches = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $batches->items(),
            'meta' => [
                'total' => $batches->total(),
                'per_page' => $batches->perPage(),
                'current_page' => $batches->currentPage(),
                'last_page' => $batches->lastPage(),
            ],
        ]);
    }

    /**
     * Annuler un batch
     * 
     * POST /api/batches/{id}/cancel
     */
    public function cancel(int $id): JsonResponse
    {
        try {
            $batch = GenerationQueue::findOrFail($id);

            if (in_array($batch->status, ['completed', 'cancelled'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le batch ne peut pas être annulé',
                    'current_status' => $batch->status,
                ], 400);
            }

            $batch->update(['status' => 'cancelled']);

            return response()->json([
                'success' => true,
                'message' => 'Batch annulé avec succès',
                'data' => [
                    'batch_id' => $id,
                    'status' => 'cancelled',
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'annulation',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
