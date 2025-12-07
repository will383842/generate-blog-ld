<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PublicationQueue;
use App\Models\Article;
use App\Jobs\ProcessPublicationJob;
use App\Services\Publishing\PublicationScheduler;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * PublicationQueueController - Gestion de la queue de publication
 */
class PublicationQueueController extends Controller
{
    public function __construct(
        protected PublicationScheduler $scheduler
    ) {}

    /**
     * Liste des publications en queue
     *
     * GET /api/publication-queue
     */
    public function index(Request $request): JsonResponse
    {
        $query = PublicationQueue::with(['article:id,title,slug,status', 'platform:id,name,slug']);

        // Filtres
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('platform_id')) {
            $query->where('platform_id', $request->platform_id);
        }

        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        // Tri par priorité puis date
        $query->orderByRaw("FIELD(priority, 'high', 'default', 'low')")
              ->orderBy('scheduled_at', 'asc');

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
     * Statistiques de la queue de publication
     *
     * GET /api/publication-queue/stats
     */
    public function stats(): JsonResponse
    {
        try {
            $stats = [
                'pending' => PublicationQueue::where('status', 'pending')->count(),
                'scheduled' => PublicationQueue::where('status', 'scheduled')->count(),
                'publishing' => PublicationQueue::where('status', 'publishing')->count(),
                'published' => PublicationQueue::where('status', 'published')->count(),
                'failed' => PublicationQueue::where('status', 'failed')->count(),
                'cancelled' => PublicationQueue::where('status', 'cancelled')->count(),
            ];

            $stats['total'] = array_sum($stats);

            // Publications des dernières 24h
            $last24h = PublicationQueue::where('published_at', '>=', now()->subDay())
                ->where('status', 'published')
                ->count();

            // Prochaines publications planifiées
            $upcoming = PublicationQueue::where('status', 'scheduled')
                ->where('scheduled_at', '>', now())
                ->orderBy('scheduled_at')
                ->limit(5)
                ->with(['article:id,title', 'platform:id,name'])
                ->get();

            // Stats par plateforme
            $byPlatform = PublicationQueue::select('platform_id', DB::raw('count(*) as count'))
                ->where('status', 'published')
                ->groupBy('platform_id')
                ->with('platform:id,name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'by_status' => $stats,
                    'last_24h' => $last24h,
                    'upcoming' => $upcoming,
                    'by_platform' => $byPlatform,
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
     * Planifier une publication
     *
     * POST /api/publication-queue/schedule
     */
    public function schedule(Request $request): JsonResponse
    {
        $request->validate([
            'article_id' => 'required|exists:articles,id',
            'platform_id' => 'required|exists:platforms,id',
            'scheduled_at' => 'nullable|date|after:now',
            'priority' => 'nullable|in:low,default,high',
        ]);

        try {
            $article = Article::findOrFail($request->article_id);

            // Vérifier que l'article n'est pas déjà publié
            if ($article->status === Article::STATUS_PUBLISHED) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cet article est déjà publié',
                ], 400);
            }

            // Créer l'entrée dans la queue
            $queueItem = PublicationQueue::create([
                'article_id' => $request->article_id,
                'platform_id' => $request->platform_id,
                'priority' => $request->get('priority', 'default'),
                'status' => $request->scheduled_at ? 'scheduled' : 'pending',
                'scheduled_at' => $request->scheduled_at ?? now(),
                'max_attempts' => 3,
            ]);

            // Si publication immédiate, dispatcher le job
            if (!$request->scheduled_at) {
                ProcessPublicationJob::dispatch($queueItem->id);
            }

            return response()->json([
                'success' => true,
                'message' => $request->scheduled_at
                    ? 'Publication planifiée avec succès'
                    : 'Publication en cours',
                'data' => $queueItem->load(['article:id,title', 'platform:id,name']),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la planification',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Publier immédiatement
     *
     * POST /api/publication-queue/{id}/publish-now
     */
    public function publishNow(int $id): JsonResponse
    {
        try {
            $item = PublicationQueue::findOrFail($id);

            if (!in_array($item->status, ['pending', 'scheduled'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cet élément ne peut pas être publié maintenant',
                    'current_status' => $item->status,
                ], 400);
            }

            $item->update([
                'status' => 'pending',
                'scheduled_at' => now(),
            ]);

            ProcessPublicationJob::dispatch($item->id);

            return response()->json([
                'success' => true,
                'message' => 'Publication lancée',
                'data' => ['id' => $id, 'status' => 'pending'],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du lancement de la publication',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Annuler une publication planifiée
     *
     * POST /api/publication-queue/{id}/cancel
     */
    public function cancel(int $id): JsonResponse
    {
        try {
            $item = PublicationQueue::findOrFail($id);

            if (!in_array($item->status, ['pending', 'scheduled'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cet élément ne peut pas être annulé',
                    'current_status' => $item->status,
                ], 400);
            }

            $item->markAsCancelled();

            return response()->json([
                'success' => true,
                'message' => 'Publication annulée',
                'data' => ['id' => $id, 'status' => 'cancelled'],
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
     * Relancer une publication échouée
     *
     * POST /api/publication-queue/{id}/retry
     */
    public function retry(int $id): JsonResponse
    {
        try {
            $item = PublicationQueue::findOrFail($id);

            if ($item->status !== 'failed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Seules les publications échouées peuvent être relancées',
                    'current_status' => $item->status,
                ], 400);
            }

            $item->update([
                'status' => 'pending',
                'attempts' => 0,
                'error_message' => null,
            ]);

            ProcessPublicationJob::dispatch($item->id);

            return response()->json([
                'success' => true,
                'message' => 'Publication relancée',
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
     * Changer la priorité
     *
     * POST /api/publication-queue/{id}/prioritize
     */
    public function prioritize(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'priority' => 'required|in:low,default,high',
        ]);

        try {
            $item = PublicationQueue::findOrFail($id);

            if (!in_array($item->status, ['pending', 'scheduled'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'La priorité ne peut être changée que pour les éléments en attente',
                ], 400);
            }

            $item->setPriority($request->priority);

            return response()->json([
                'success' => true,
                'message' => 'Priorité mise à jour',
                'data' => ['id' => $id, 'priority' => $request->priority],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de priorité',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Replanifier une publication
     *
     * POST /api/publication-queue/{id}/reschedule
     */
    public function reschedule(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'scheduled_at' => 'required|date|after:now',
        ]);

        try {
            $item = PublicationQueue::findOrFail($id);

            if (!in_array($item->status, ['pending', 'scheduled', 'failed'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cet élément ne peut pas être replanifié',
                ], 400);
            }

            $item->markAsScheduled(new \Carbon\Carbon($request->scheduled_at));

            return response()->json([
                'success' => true,
                'message' => 'Publication replanifiée',
                'data' => [
                    'id' => $id,
                    'scheduled_at' => $item->scheduled_at,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la replanification',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
