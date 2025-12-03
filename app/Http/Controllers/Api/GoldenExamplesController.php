<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GoldenExample;
use App\Services\Quality\GoldenExamplesService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * =============================================================================
 * PHASE 13 - GoldenExamplesController
 * =============================================================================
 * 
 * ROUTES :
 * - GET    /api/golden-examples
 * - POST   /api/golden-examples/{id}/mark
 * - POST   /api/golden-examples/{id}/toggle
 * - DELETE /api/golden-examples/{id}
 * - GET    /api/golden-examples/export
 * - GET    /api/golden-examples/stats
 * - GET    /api/golden-examples/impact
 * - GET    /api/golden-examples/top-used
 * - POST   /api/golden-examples/auto-mark
 * 
 * =============================================================================
 */

class GoldenExamplesController extends Controller
{
    protected GoldenExamplesService $goldenService;

    public function __construct(GoldenExamplesService $goldenService)
    {
        $this->goldenService = $goldenService;
    }

    /**
     * GET /api/golden-examples
     * Liste golden examples avec filtres
     * 
     * Query params:
     * - platform_id: Filtrer par plateforme
     * - language_code: Filtrer par langue
     * - example_type: intro/conclusion/section/list/hook
     * - active: true/false (use_in_prompts)
     * - min_quality: Score minimum
     * - category: Filtrer par catégorie
     * - page: Pagination
     */
    public function index(Request $request): JsonResponse
    {
        $query = GoldenExample::with(['article', 'platform']);

        // Filtre plateforme
        if ($request->has('platform_id')) {
            $query->where('platform_id', $request->platform_id);
        }

        // Filtre langue
        if ($request->has('language_code')) {
            $query->where('language_code', $request->language_code);
        }

        // Filtre type
        if ($request->has('example_type')) {
            $query->where('example_type', $request->example_type);
        }

        // Filtre actif
        if ($request->has('active')) {
            $query->where('use_in_prompts', $request->boolean('active'));
        }

        // Filtre score minimum
        if ($request->has('min_quality')) {
            $query->where('quality_score', '>=', $request->min_quality);
        }

        // Filtre catégorie
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        // Tri par qualité décroissant
        $examples = $query->orderBy('quality_score', 'desc')->paginate(20);

        return response()->json([
            'success' => true,
            'examples' => $examples,
        ]);
    }

    /**
     * POST /api/golden-examples/{id}/mark
     * Marquer manuellement comme golden (ou activer)
     */
    public function mark(int $id, Request $request): JsonResponse
    {
        $example = GoldenExample::findOrFail($id);

        $example->update([
            'use_in_prompts' => true,
            'marked_by' => 'manual',
            'marked_by_user' => $request->user()->email ?? 'admin',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Exemple marqué comme golden',
            'example' => $example,
        ]);
    }

    /**
     * POST /api/golden-examples/{id}/toggle
     * Activer/désactiver un golden example
     */
    public function toggle(int $id): JsonResponse
    {
        $example = GoldenExample::findOrFail($id);

        $example->update([
            'use_in_prompts' => !$example->use_in_prompts,
        ]);

        return response()->json([
            'success' => true,
            'message' => $example->use_in_prompts ? 'Exemple activé' : 'Exemple désactivé',
            'example' => $example,
        ]);
    }

    /**
     * DELETE /api/golden-examples/{id}
     * Archiver un golden example (soft delete)
     */
    public function destroy(int $id): JsonResponse
    {
        $example = GoldenExample::findOrFail($id);
        $example->delete(); // Soft delete

        return response()->json([
            'success' => true,
            'message' => 'Exemple archivé avec succès',
        ]);
    }

    /**
     * GET /api/golden-examples/export
     * Export JSONL pour fine-tuning OpenAI
     */
    public function export(): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $filename = $this->goldenService->exportForTraining('jsonl');

        return response()->download($filename, basename($filename), [
            'Content-Type' => 'application/x-ndjson',
        ])->deleteFileAfterSend(false);
    }

    /**
     * GET /api/golden-examples/stats
     * Statistiques utilisation golden examples
     * 
     * Query params:
     * - days: Période analyse (défaut 30)
     */
    public function stats(Request $request): JsonResponse
    {
        $days = $request->get('days', 30);

        $stats = $this->goldenService->getUsageStats($days);

        return response()->json([
            'success' => true,
            'period_days' => $days,
            'stats' => $stats,
        ]);
    }

    /**
     * GET /api/golden-examples/impact
     * Mesurer impact golden examples sur qualité
     * 
     * Query params:
     * - days: Période analyse (défaut 30)
     */
    public function impact(Request $request): JsonResponse
    {
        $days = $request->get('days', 30);

        $impact = $this->goldenService->measureImpact($days);

        return response()->json([
            'success' => true,
            'period_days' => $days,
            'impact' => $impact,
        ]);
    }

    /**
     * GET /api/golden-examples/top-used
     * Top 10 exemples les plus utilisés
     */
    public function topUsed(): JsonResponse
    {
        $topExamples = GoldenExample::getTopUsed(10);

        return response()->json([
            'success' => true,
            'top_examples' => $topExamples,
        ]);
    }

    /**
     * POST /api/golden-examples/auto-mark
     * Lancer auto-marking manuellement
     * 
     * Body:
     * - days: Nombre de jours à analyser (défaut 7)
     */
    public function autoMark(Request $request): JsonResponse
    {
        $days = $request->get('days', 7);

        $marked = $this->goldenService->autoMarkGoldenExamples($days);

        return response()->json([
            'success' => true,
            'message' => "{$marked} articles marqués comme golden examples",
            'marked_count' => $marked,
        ]);
    }
}

/*
|--------------------------------------------------------------------------
| EXEMPLES UTILISATION API
|--------------------------------------------------------------------------
|
| # Liste golden examples actifs
| curl "http://localhost:8000/api/golden-examples?active=true&platform_id=1"
|
| # Marquer manuellement
| curl -X POST http://localhost:8000/api/golden-examples/45/mark
|
| # Activer/désactiver
| curl -X POST http://localhost:8000/api/golden-examples/45/toggle
|
| # Archiver
| curl -X DELETE http://localhost:8000/api/golden-examples/45
|
| # Export training
| curl http://localhost:8000/api/golden-examples/export -o golden_examples.jsonl
|
| # Stats utilisation
| curl "http://localhost:8000/api/golden-examples/stats?days=30"
|
| # Impact sur qualité
| curl "http://localhost:8000/api/golden-examples/impact?days=30"
|
| # Top 10 utilisés
| curl http://localhost:8000/api/golden-examples/top-used
|
| # Auto-marking manuel
| curl -X POST http://localhost:8000/api/golden-examples/auto-mark -d '{"days":7}'
|
*/