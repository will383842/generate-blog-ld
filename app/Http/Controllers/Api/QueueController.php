<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GenerationQueue;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * QueueController - Gestion de la queue de génération
 */
class QueueController extends Controller
{
    /**
     * Statistiques de la queue
     * 
     * GET /api/queue/stats
     */
    public function stats(): JsonResponse
    {
        try {
            $stats = [
                'pending' => GenerationQueue::where('status', 'pending')->count(),
                'processing' => GenerationQueue::where('status', 'processing')->count(),
                'completed' => GenerationQueue::where('status', 'completed')->count(),
                'failed' => GenerationQueue::where('status', 'failed')->count(),
                'cancelled' => GenerationQueue::where('status', 'cancelled')->count(),
            ];

            $stats['total'] = array_sum($stats);

            // Stats des 24 dernières heures
            $last24h = GenerationQueue::where('created_at', '>=', now()->subDay())->count();
            
            // Stats par type
            $byType = GenerationQueue::select('type', DB::raw('count(*) as count'))
                ->groupBy('type')
                ->get()
                ->pluck('count', 'type')
                ->toArray();

            return response()->json([
                'success' => true,
                'data' => [
                    'by_status' => $stats,
                    'last_24h' => $last24h,
                    'by_type' => $byType,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Prioriser un élément de la queue
     * 
     * POST /api/queue/{id}/prioritize
     */
    public function prioritize(int $id): JsonResponse
    {
        try {
            $item = GenerationQueue::findOrFail($id);

            if ($item->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Seuls les éléments en attente peuvent être priorisés',
                    'current_status' => $item->status,
                ], 400);
            }

            $item->update(['priority' => 'high']);

            return response()->json([
                'success' => true,
                'message' => 'Élément priorisé avec succès',
                'data' => [
                    'id' => $id,
                    'priority' => 'high',
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la priorisation',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Annuler un élément de la queue
     * 
     * POST /api/queue/{id}/cancel
     */
    public function cancel(int $id): JsonResponse
    {
        try {
            $item = GenerationQueue::findOrFail($id);

            if (!in_array($item->status, ['pending', 'processing'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cet élément ne peut pas être annulé',
                    'current_status' => $item->status,
                ], 400);
            }

            $item->update(['status' => 'cancelled']);

            return response()->json([
                'success' => true,
                'message' => 'Élément annulé avec succès',
                'data' => [
                    'id' => $id,
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

    /**
     * Relancer un élément échoué
     * 
     * POST /api/queue/{id}/retry
     */
    public function retry(int $id): JsonResponse
    {
        try {
            $item = GenerationQueue::findOrFail($id);

            if ($item->status !== 'failed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Seuls les éléments échoués peuvent être relancés',
                    'current_status' => $item->status,
                ], 400);
            }

            $item->update([
                'status' => 'pending',
                'error_message' => null,
            ]);

            // Re-dispatcher le job selon le type
            // TODO: Implémenter la logique de re-dispatch

            return response()->json([
                'success' => true,
                'message' => 'Élément relancé avec succès',
                'data' => [
                    'id' => $id,
                    'status' => 'pending',
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du relancement',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Liste des éléments de la queue
     * 
     * GET /api/queue
     */
    public function index(Request $request): JsonResponse
    {
        $query = GenerationQueue::query();

        // Filtres
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        // Tri
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir);

        $perPage = min($request->get('per_page', 15), 100);
        $items = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $items->items(),
            'meta' => [
                'total' => $items->total(),
                'per_page' => $items->perPage(),
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
            ],
        ]);
    }
}
