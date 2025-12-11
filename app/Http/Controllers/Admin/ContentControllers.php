<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GenerationRequest;
use App\Models\ContentCategory;
use App\Models\Platform;
use App\Models\Country;
use App\Models\Language;
use App\Jobs\ProcessBatchGeneration;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BatchGenerationController extends Controller
{
    /**
     * Affiche le dashboard de génération
     */
    public function index()
    {
        $requests = GenerationRequest::with('category')
            ->latest()
            ->paginate(20);

        $categories = ContentCategory::active()->get();
        $platforms = Platform::where('enabled', true)->get();

        return view('admin.batch-generation.index', compact('requests', 'categories', 'platforms'));
    }

    /**
     * Affiche le formulaire de création
     */
    public function create()
    {
        $categories = ContentCategory::active()->get();
        $platforms = Platform::where('enabled', true)->get();
        $languages = Language::where('is_active', true)->get();
        $countries = Country::where('is_active', true)->orderBy('name')->get();

        return view('admin.batch-generation.create', compact(
            'categories',
            'platforms',
            'languages',
            'countries'
        ));
    }

    /**
     * Crée une nouvelle génération batch
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'platform_ids' => 'required|array',
            'platform_ids.*' => 'exists:platforms,id',
            'country_ids' => 'required|array',
            'country_ids.*' => 'exists:countries,id',
            'language_codes' => 'required|array',
            'language_codes.*' => 'exists:languages,code',
            'service_ids' => 'nullable|array',
            'category_id' => 'nullable|exists:content_categories,id',
            'strategy' => 'required|in:single,variations',
            'template_config' => 'nullable|array',
            'auto_start' => 'boolean'
        ]);

        $generationRequest = GenerationRequest::create($validated);

        // Lancer immédiatement si auto_start
        if ($request->boolean('auto_start', true)) {
            ProcessBatchGeneration::dispatch($generationRequest)
                ->onQueue('generation');
        }

        return response()->json([
            'success' => true,
            'message' => 'Génération batch créée',
            'data' => $generationRequest
        ], 201);
    }

    /**
     * Affiche les détails d'une génération
     */
    public function show($id): JsonResponse
    {
        $request = GenerationRequest::with([
            'category',
            'generatedArticles.article'
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $request
        ]);
    }

    /**
     * Lance une génération en attente
     */
    public function start($id): JsonResponse
    {
        $request = GenerationRequest::findOrFail($id);

        if ($request->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => "La génération ne peut pas être lancée (status: {$request->status})"
            ], 400);
        }

        ProcessBatchGeneration::dispatch($request)->onQueue('generation');

        return response()->json([
            'success' => true,
            'message' => 'Génération lancée'
        ]);
    }

    /**
     * Annule une génération
     */
    public function cancel($id): JsonResponse
    {
        $request = GenerationRequest::findOrFail($id);

        if (!in_array($request->status, ['pending', 'processing'])) {
            return response()->json([
                'success' => false,
                'message' => 'La génération ne peut pas être annulée'
            ], 400);
        }

        $request->update([
            'status' => 'cancelled',
            'completed_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Génération annulée'
        ]);
    }

    /**
     * Supprime une génération
     */
    public function destroy($id)
    {
        $request = GenerationRequest::findOrFail($id);
        $request->delete();

        return response()->json([
            'success' => true,
            'message' => 'Génération supprimée'
        ]);
    }

    /**
     * Stats génération batch
     */
    public function stats(): JsonResponse
    {
        $stats = [
            'total_requests' => GenerationRequest::count(),
            'pending' => GenerationRequest::where('status', 'pending')->count(),
            'processing' => GenerationRequest::where('status', 'processing')->count(),
            'completed' => GenerationRequest::where('status', 'completed')->count(),
            'failed' => GenerationRequest::where('status', 'failed')->count(),
            'total_articles_generated' => GenerationRequest::sum('articles_generated'),
            'recent_requests' => GenerationRequest::with('category')
                ->latest()
                ->limit(5)
                ->get(),
            'by_category' => GenerationRequest::selectRaw('category_id, COUNT(*) as count, SUM(articles_generated) as total_articles')
                ->groupBy('category_id')
                ->with('category')
                ->get()
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}

// ============================================================================
// BULK UPDATE CONTROLLER
// ============================================================================

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BulkUpdateLog;
use App\Services\Content\BulkUpdateService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BulkUpdateController extends Controller
{
    protected BulkUpdateService $bulkUpdateService;

    public function __construct(BulkUpdateService $bulkUpdateService)
    {
        $this->bulkUpdateService = $bulkUpdateService;
    }

    /**
     * Liste des bulk updates
     */
    public function index()
    {
        $bulkUpdates = BulkUpdateLog::latest()->paginate(20);

        return view('admin.bulk-updates.index', compact('bulkUpdates'));
    }

    /**
     * Détails d'un bulk update
     */
    public function show($id): JsonResponse
    {
        $bulkUpdate = BulkUpdateLog::with('details')->findOrFail($id);
        $stats = $this->bulkUpdateService->getUpdateStats($bulkUpdate);

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Retry les échecs
     */
    public function retry($id): JsonResponse
    {
        $bulkUpdate = BulkUpdateLog::findOrFail($id);

        $count = $this->bulkUpdateService->retryFailed($bulkUpdate);

        return response()->json([
            'success' => true,
            'message' => "{$count} article(s) remis en file d'attente",
            'count' => $count
        ]);
    }

    /**
     * Annule un bulk update
     */
    public function cancel($id): JsonResponse
    {
        $bulkUpdate = BulkUpdateLog::findOrFail($id);

        $cancelled = $this->bulkUpdateService->cancel($bulkUpdate);

        if (!$cancelled) {
            return response()->json([
                'success' => false,
                'message' => 'Le bulk update ne peut pas être annulé'
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'Bulk update annulé'
        ]);
    }

    /**
     * Stats globales
     */
    public function stats(): JsonResponse
    {
        $stats = [
            'total_updates' => BulkUpdateLog::count(),
            'pending' => BulkUpdateLog::where('status', 'pending')->count(),
            'processing' => BulkUpdateLog::where('status', 'processing')->count(),
            'completed' => BulkUpdateLog::where('status', 'completed')->count(),
            'failed' => BulkUpdateLog::where('status', 'failed')->count(),
            'total_articles_updated' => BulkUpdateLog::sum('articles_updated'),
            'recent_updates' => BulkUpdateLog::latest()->limit(5)->get()
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}
