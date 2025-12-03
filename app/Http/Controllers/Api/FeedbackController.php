<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Quality\FeedbackLoopService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * =============================================================================
 * PHASE 13 - FeedbackController
 * =============================================================================
 * 
 * ROUTES :
 * - POST /api/feedback/analyze
 * - POST /api/feedback/apply
 * - GET  /api/feedback/weekly-report
 * - GET  /api/feedback/recommendations
 * - POST /api/feedback/clear-cache
 * 
 * =============================================================================
 */

class FeedbackController extends Controller
{
    protected FeedbackLoopService $feedbackService;

    public function __construct(FeedbackLoopService $feedbackService)
    {
        $this->feedbackService = $feedbackService;
    }

    /**
     * POST /api/feedback/analyze
     * Analyser patterns erreurs et générer recommandations
     * 
     * Body:
     * - days: Période analyse (défaut 30)
     */
    public function analyze(Request $request): JsonResponse
    {
        $days = $request->get('days', 30);

        $recommendations = $this->feedbackService->analyzeForImprovement($days);

        return response()->json([
            'success' => true,
            'period_days' => $days,
            'recommendations' => $recommendations,
            'summary' => [
                'total_recommendations' => count($recommendations['prompt_adjustments'] ?? []) 
                                         + count($recommendations['settings_changes'] ?? []) 
                                         + count($recommendations['training_needed'] ?? []),
                'prompt_adjustments' => count($recommendations['prompt_adjustments'] ?? []),
                'settings_changes' => count($recommendations['settings_changes'] ?? []),
                'training_needed' => count($recommendations['training_needed'] ?? []),
            ],
        ]);
    }

    /**
     * POST /api/feedback/apply
     * Appliquer recommandations (dry-run ou réel)
     * 
     * Body:
     * - recommendations: Array recommandations à appliquer
     * - dry_run: true/false (défaut true)
     */
    public function apply(Request $request): JsonResponse
    {
        $request->validate([
            'recommendations' => 'required|array',
            'dry_run' => 'boolean',
        ]);

        $recommendations = $request->input('recommendations');
        $dryRun = $request->boolean('dry_run', true);

        $result = $this->feedbackService->applyImprovements($recommendations, $dryRun);

        return response()->json([
            'success' => true,
            'dry_run' => $dryRun,
            'message' => $dryRun 
                ? 'Simulation terminée (aucun changement appliqué)' 
                : 'Améliorations appliquées avec succès',
            'result' => $result,
            'summary' => [
                'applied' => count($result['applied'] ?? []),
                'notifications' => count($result['notifications'] ?? []),
                'prompt_adjustments' => count($result['prompt_adjustments'] ?? []),
                'training_needed' => count($result['training_needed'] ?? []),
            ],
        ]);
    }

    /**
     * GET /api/feedback/weekly-report
     * Rapport qualité hebdomadaire complet
     */
    public function weeklyReport(): JsonResponse
    {
        $report = $this->feedbackService->generateWeeklyReport();

        return response()->json([
            'success' => true,
            'report' => $report,
        ]);
    }

    /**
     * GET /api/feedback/recommendations
     * Récupérer dernières recommandations (cache)
     */
    public function getRecommendations(): JsonResponse
    {
        // Récupérer depuis cache ou générer
        $recommendations = cache()->remember('feedback_recommendations', 3600, function() {
            return $this->feedbackService->analyzeForImprovement(7);
        });

        return response()->json([
            'success' => true,
            'recommendations' => $recommendations,
            'cached' => cache()->has('feedback_recommendations'),
        ]);
    }

    /**
     * POST /api/feedback/clear-cache
     * Vider cache recommandations
     */
    public function clearCache(): JsonResponse
    {
        cache()->forget('feedback_recommendations');

        return response()->json([
            'success' => true,
            'message' => 'Cache recommandations vidé',
        ]);
    }
}

/*
|--------------------------------------------------------------------------
| EXEMPLES UTILISATION API
|--------------------------------------------------------------------------
|
| # Analyser patterns 30 jours
| curl -X POST http://localhost:8000/api/feedback/analyze \
|   -H "Content-Type: application/json" \
|   -d '{"days": 30}'
|
| # Appliquer recommandations (dry-run)
| curl -X POST http://localhost:8000/api/feedback/apply \
|   -H "Content-Type: application/json" \
|   -d '{
|     "recommendations": {
|       "settings_changes": ["Réduire sentence_length_max 25 → 23"]
|     },
|     "dry_run": true
|   }'
|
| # Appliquer en production (dry_run: false)
| curl -X POST http://localhost:8000/api/feedback/apply \
|   -H "Content-Type: application/json" \
|   -d '{
|     "recommendations": {...},
|     "dry_run": false
|   }'
|
| # Rapport hebdomadaire
| curl http://localhost:8000/api/feedback/weekly-report
|
| # Récupérer recommandations (cache)
| curl http://localhost:8000/api/feedback/recommendations
|
| # Vider cache
| curl -X POST http://localhost:8000/api/feedback/clear-cache
|
*/