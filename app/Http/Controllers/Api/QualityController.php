<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QualityCheck;
use App\Models\Article;
use App\Services\Quality\ContentQualityEnforcer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * =============================================================================
 * PHASE 13 - QualityController
 * =============================================================================
 * 
 * ROUTES :
 * - GET  /api/quality/dashboard
 * - GET  /api/quality/checks
 * - POST /api/quality/checks/{articleId}/revalidate
 * - GET  /api/quality/trends
 * - GET  /api/quality/criteria-stats
 * 
 * =============================================================================
 */

class QualityController extends Controller
{
    protected ContentQualityEnforcer $qualityEnforcer;

    public function __construct(ContentQualityEnforcer $qualityEnforcer)
    {
        $this->qualityEnforcer = $qualityEnforcer;
    }

    /**
     * GET /api/quality/dashboard
     * Statistiques globales qualité
     */
    public function dashboard(): JsonResponse
    {
        $stats = QualityCheck::getGlobalStats();

        return response()->json([
            'success' => true,
            'stats' => $stats,
        ]);
    }

    /**
     * GET /api/quality/checks
     * Liste quality checks avec filtres
     * 
     * Query params:
     * - platform_id: Filtrer par plateforme
     * - status: passed/warning/failed
     * - min_score: Score minimum
     * - content_type: article/landing/comparative
     * - language_code: Filtrer par langue
     * - page: Pagination
     */
    public function index(Request $request): JsonResponse
    {
        $query = QualityCheck::with(['checkable', 'platform']);

        // Filtre plateforme
        if ($request->has('platform_id')) {
            $query->where('platform_id', $request->platform_id);
        }

        // Filtre status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filtre score minimum
        if ($request->has('min_score')) {
            $query->where('overall_score', '>=', $request->min_score);
        }

        // Filtre type contenu
        if ($request->has('content_type')) {
            $query->where('content_type', $request->content_type);
        }

        // Filtre langue
        if ($request->has('language_code')) {
            $query->where('language_code', $request->language_code);
        }

        // Tri par date décroissant
        $checks = $query->orderBy('checked_at', 'desc')->paginate(20);

        return response()->json([
            'success' => true,
            'checks' => $checks,
        ]);
    }

    /**
     * POST /api/quality/checks/{articleId}/revalidate
     * Re-valider un article manuellement
     */
    public function revalidate(int $articleId): JsonResponse
    {
        $article = Article::findOrFail($articleId);

        // Re-validation complète
        $qualityCheck = $this->qualityEnforcer->validateArticle($article);

        // Mettre à jour article
        $article->quality_score = $qualityCheck->overall_score;
        $article->status = $qualityCheck->status === 'passed' ? 'draft' : 'review_needed';
        $article->save();

        return response()->json([
            'success' => true,
            'message' => 'Article re-validé avec succès',
            'quality_check' => [
                'id' => $qualityCheck->id,
                'overall_score' => $qualityCheck->overall_score,
                'status' => $qualityCheck->status,
                'knowledge_score' => $qualityCheck->knowledge_score,
                'brand_score' => $qualityCheck->brand_score,
                'seo_score' => $qualityCheck->seo_score,
                'readability_score' => $qualityCheck->readability_score,
                'structure_score' => $qualityCheck->structure_score,
                'originality_score' => $qualityCheck->originality_score,
                'errors' => $qualityCheck->errors,
                'warnings' => $qualityCheck->warnings,
                'suggestions' => $qualityCheck->suggestions,
            ],
            'article' => [
                'id' => $article->id,
                'title' => $article->title,
                'status' => $article->status,
                'quality_score' => $article->quality_score,
            ],
        ]);
    }

    /**
     * GET /api/quality/trends
     * Tendances qualité sur X jours (graphiques)
     * 
     * Query params:
     * - days: Nombre de jours (défaut 30)
     */
    public function trends(Request $request): JsonResponse
    {
        $days = $request->get('days', 30);

        $trends = QualityCheck::getQualityTrends($days);

        return response()->json([
            'success' => true,
            'period_days' => $days,
            'trends' => $trends,
        ]);
    }

    /**
     * GET /api/quality/criteria-stats
     * Statistiques détaillées par critère
     * 
     * Query params:
     * - days: Nombre de jours (défaut 30)
     * - platform_id: Filtrer par plateforme
     */
    public function criteriaStats(Request $request): JsonResponse
    {
        $days = $request->get('days', 30);
        $platformId = $request->get('platform_id');

        $query = QualityCheck::where('checked_at', '>=', now()->subDays($days));

        if ($platformId) {
            $query->where('platform_id', $platformId);
        }

        $stats = $query->selectRaw('
            AVG(knowledge_score) as avg_knowledge,
            AVG(brand_score) as avg_brand,
            AVG(seo_score) as avg_seo,
            AVG(readability_score) as avg_readability,
            AVG(structure_score) as avg_structure,
            AVG(originality_score) as avg_originality,
            AVG(overall_score) as avg_overall,
            COUNT(*) as total_checks
        ')->first();

        return response()->json([
            'success' => true,
            'period_days' => $days,
            'platform_id' => $platformId,
            'criteria_stats' => [
                'knowledge' => round($stats->avg_knowledge ?? 0, 2),
                'brand' => round($stats->avg_brand ?? 0, 2),
                'seo' => round($stats->avg_seo ?? 0, 2),
                'readability' => round($stats->avg_readability ?? 0, 2),
                'structure' => round($stats->avg_structure ?? 0, 2),
                'originality' => round($stats->avg_originality ?? 0, 2),
                'overall' => round($stats->avg_overall ?? 0, 2),
            ],
            'total_checks' => $stats->total_checks ?? 0,
        ]);
    }
}

/*
|--------------------------------------------------------------------------
| EXEMPLES UTILISATION API
|--------------------------------------------------------------------------
|
| # Dashboard global
| curl http://localhost:8000/api/quality/dashboard
|
| # Liste quality checks filtrés
| curl "http://localhost:8000/api/quality/checks?platform_id=1&status=failed&min_score=60"
|
| # Re-valider article
| curl -X POST http://localhost:8000/api/quality/checks/123/revalidate
|
| # Tendances 30 jours
| curl "http://localhost:8000/api/quality/trends?days=30"
|
| # Stats par critère
| curl "http://localhost:8000/api/quality/criteria-stats?days=7&platform_id=1"
|
*/