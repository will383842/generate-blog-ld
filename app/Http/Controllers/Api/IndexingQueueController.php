<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\IndexingQueue;
use App\Models\Article;
use App\Jobs\RequestIndexing;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * IndexingQueueController - Gestion de la queue d'indexation SEO
 */
class IndexingQueueController extends Controller
{
    /**
     * Liste des demandes d'indexation
     *
     * GET /api/indexing-queue
     */
    public function index(Request $request): JsonResponse
    {
        $query = IndexingQueue::with(['article:id,title,slug,status']);

        // Filtres
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Tri
        $query->orderBy('created_at', 'desc');

        $perPage = min($request->get('per_page', 20), 100);
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

    /**
     * Statistiques d'indexation
     *
     * GET /api/indexing-queue/stats
     */
    public function stats(): JsonResponse
    {
        try {
            $stats = [
                'pending' => IndexingQueue::where('status', 'pending')->count(),
                'processing' => IndexingQueue::where('status', 'processing')->count(),
                'completed' => IndexingQueue::where('status', 'completed')->count(),
                'failed' => IndexingQueue::where('status', 'failed')->count(),
            ];

            $stats['total'] = array_sum($stats);

            // Indexations des dernières 24h
            $last24h = IndexingQueue::where('processed_at', '>=', now()->subDay())
                ->where('status', 'completed')
                ->count();

            // Taux de succès
            $totalProcessed = IndexingQueue::whereIn('status', ['completed', 'failed'])->count();
            $successRate = $totalProcessed > 0
                ? round(($stats['completed'] / $totalProcessed) * 100, 1)
                : 0;

            // Stats par type (Google, IndexNow)
            $byType = IndexingQueue::select('type', DB::raw('count(*) as count'))
                ->groupBy('type')
                ->get()
                ->pluck('count', 'type')
                ->toArray();

            // Dernières erreurs
            $recentErrors = IndexingQueue::where('status', 'failed')
                ->orderBy('updated_at', 'desc')
                ->limit(5)
                ->with('article:id,title')
                ->get(['id', 'article_id', 'error_message', 'updated_at']);

            return response()->json([
                'success' => true,
                'data' => [
                    'by_status' => $stats,
                    'last_24h' => $last24h,
                    'success_rate' => $successRate,
                    'by_type' => $byType,
                    'recent_errors' => $recentErrors,
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
     * Soumettre un article à l'indexation
     *
     * POST /api/indexing-queue/submit
     */
    public function submit(Request $request): JsonResponse
    {
        $request->validate([
            'article_id' => 'required|exists:articles,id',
            'action' => 'nullable|in:URL_UPDATED,URL_DELETED',
        ]);

        try {
            $article = Article::findOrFail($request->article_id);

            // Vérifier que l'article est publié
            if ($article->status !== Article::STATUS_PUBLISHED) {
                return response()->json([
                    'success' => false,
                    'message' => 'Seuls les articles publiés peuvent être soumis à l\'indexation',
                ], 400);
            }

            // Vérifier si déjà en queue
            $existing = IndexingQueue::where('article_id', $article->id)
                ->whereIn('status', ['pending', 'processing'])
                ->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cet article est déjà en queue d\'indexation',
                    'data' => $existing,
                ], 400);
            }

            // Dispatcher le job
            RequestIndexing::dispatch(
                $article->id,
                $request->get('action', 'URL_UPDATED')
            )->onQueue('indexing');

            return response()->json([
                'success' => true,
                'message' => 'Demande d\'indexation soumise',
                'data' => [
                    'article_id' => $article->id,
                    'action' => $request->get('action', 'URL_UPDATED'),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la soumission',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Soumettre plusieurs articles à l'indexation
     *
     * POST /api/indexing-queue/bulk-submit
     */
    public function bulkSubmit(Request $request): JsonResponse
    {
        $request->validate([
            'article_ids' => 'required|array|max:100',
            'article_ids.*' => 'exists:articles,id',
            'action' => 'nullable|in:URL_UPDATED,URL_DELETED',
        ]);

        try {
            $action = $request->get('action', 'URL_UPDATED');
            $submitted = 0;
            $skipped = 0;

            foreach ($request->article_ids as $articleId) {
                $article = Article::find($articleId);

                // Vérifier si publié
                if ($article->status !== Article::STATUS_PUBLISHED) {
                    $skipped++;
                    continue;
                }

                // Vérifier si déjà en queue
                $existing = IndexingQueue::where('article_id', $articleId)
                    ->whereIn('status', ['pending', 'processing'])
                    ->exists();

                if ($existing) {
                    $skipped++;
                    continue;
                }

                RequestIndexing::dispatch($articleId, $action)
                    ->onQueue('indexing')
                    ->delay(now()->addSeconds($submitted * 2)); // Étalement

                $submitted++;
            }

            return response()->json([
                'success' => true,
                'message' => "Indexation lancée pour {$submitted} article(s)",
                'data' => [
                    'submitted' => $submitted,
                    'skipped' => $skipped,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la soumission en masse',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Relancer une indexation échouée
     *
     * POST /api/indexing-queue/{id}/retry
     */
    public function retry(int $id): JsonResponse
    {
        try {
            $item = IndexingQueue::findOrFail($id);

            if ($item->status !== 'failed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Seules les indexations échouées peuvent être relancées',
                    'current_status' => $item->status,
                ], 400);
            }

            $item->update([
                'status' => 'pending',
                'attempts' => 0,
                'error_message' => null,
            ]);

            RequestIndexing::dispatch($item->article_id, $item->action ?? 'URL_UPDATED')
                ->onQueue('indexing');

            return response()->json([
                'success' => true,
                'message' => 'Indexation relancée',
                'data' => ['id' => $id, 'status' => 'pending'],
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
     * Annuler une demande d'indexation
     *
     * DELETE /api/indexing-queue/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $item = IndexingQueue::findOrFail($id);

            if ($item->status === 'processing') {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer une indexation en cours',
                ], 400);
            }

            $item->delete();

            return response()->json([
                'success' => true,
                'message' => 'Demande d\'indexation supprimée',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Vider les éléments traités
     *
     * POST /api/indexing-queue/clear-completed
     */
    public function clearCompleted(): JsonResponse
    {
        try {
            $deleted = IndexingQueue::where('status', 'completed')
                ->where('processed_at', '<', now()->subDays(7))
                ->delete();

            return response()->json([
                'success' => true,
                'message' => "{$deleted} entrée(s) supprimée(s)",
                'data' => ['deleted' => $deleted],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du nettoyage',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
