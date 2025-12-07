<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QualityCheck;
use App\Models\Article;
use App\Models\PressRelease;
use App\Models\PressDossier;
use App\Services\Quality\ContentQualityEnforcer;
use App\Services\Content\QualityChecker;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

/**
 * =============================================================================
 * PHASE 13 - QualityController (CORRIGÉ v2)
 * =============================================================================
 * 
 * CORRECTIONS APPLIQUÉES:
 * - dashboard() retourne la structure attendue par le frontend
 * - trends() retourne overall_score au lieu de avg_score
 * - Structure compatible avec QualityDashboardStats et QualityTrend types
 */

class QualityController extends Controller
{
    protected ContentQualityEnforcer $qualityEnforcer;
    protected QualityChecker $qualityChecker;

    public function __construct(
        ContentQualityEnforcer $qualityEnforcer,
        QualityChecker $qualityChecker
    ) {
        $this->qualityEnforcer = $qualityEnforcer;
        $this->qualityChecker = $qualityChecker;
    }

    /**
     * POST /api/quality/check
     */
    public function check(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'content_type' => 'required|in:Article,PillarArticle,PressRelease,PressDossier',
                'content_id' => 'required|integer|min:1',
            ]);

            $content = $this->loadContent($request->content_type, $request->content_id);
            
            if (!$content) {
                return response()->json([
                    'success' => false,
                    'error' => 'Content not found'
                ], 404);
            }

            $qualityCheck = match ($request->content_type) {
                'Article', 'PillarArticle' => $this->qualityEnforcer->validateArticle($content),
                'PressRelease' => $this->qualityChecker->checkPressRelease($content),
                'PressDossier' => $this->qualityChecker->checkDossier($content),
                default => throw new \Exception('Unsupported content type')
            };

            return response()->json([
                'success' => true,
                'data' => [
                    'quality_check' => $qualityCheck,
                    'score' => $qualityCheck->overall_score ?? $qualityCheck->score ?? 0,
                    'passed' => ($qualityCheck->overall_score ?? $qualityCheck->score ?? 0) >= 70,
                    'issues' => $qualityCheck->errors ?? $qualityCheck->issues ?? [],
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Quality check failed', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Quality check failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

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

    /**
     * GET /api/admin/quality/dashboard
     * 
     * CORRIGÉ: Retourne la structure attendue par QualityDashboardStats
     */
    public function dashboard(Request $request): JsonResponse
    {
        $platformId = $request->get('platform_id');
        
        $query = QualityCheck::query();
        if ($platformId) {
            $query->where('platform_id', $platformId);
        }
        
        $totalChecks = $query->count();
        
        // Si aucune donnée, retourner structure vide valide
        if ($totalChecks === 0) {
            return response()->json([
                'success' => true,
                'data' => $this->getEmptyDashboardStats(),
            ]);
        }
        
        $passedCount = (clone $query)->where('status', 'passed')->count();
        $warningCount = (clone $query)->where('status', 'warning')->count();
        $failedCount = (clone $query)->where('status', 'failed')->count();
        
        $averageScore = round((clone $query)->avg('overall_score') ?? 0, 1);
        
        // Scores par critère
        $criteriaStats = (clone $query)->selectRaw('
            ROUND(AVG(readability_score), 1) as readability,
            ROUND(AVG(seo_score), 1) as seo,
            ROUND(AVG(brand_score), 1) as brand,
            ROUND(AVG(knowledge_score), 1) as knowledge,
            ROUND(AVG(structure_score), 1) as engagement,
            ROUND(AVG(originality_score), 1) as accuracy
        ')->first();
        
        // Distribution
        $excellent = (clone $query)->where('overall_score', '>=', 90)->count();
        $good = (clone $query)->whereBetween('overall_score', [70, 89.99])->count();
        $average = (clone $query)->whereBetween('overall_score', [50, 69.99])->count();
        $poor = (clone $query)->where('overall_score', '<', 50)->count();
        
        // Trend (comparaison 7 jours)
        $currentAvg = (clone $query)->where('checked_at', '>=', now()->subDays(7))->avg('overall_score') ?? 0;
        $previousAvg = (clone $query)->whereBetween('checked_at', [now()->subDays(14), now()->subDays(7)])->avg('overall_score') ?? 0;
        $change = $previousAvg > 0 ? round((($currentAvg - $previousAvg) / $previousAvg) * 100, 1) : 0;
        
        // Recent checks
        $recentChecks = (clone $query)
            ->with(['checkable:id,title,slug'])
            ->orderBy('checked_at', 'desc')
            ->limit(10)
            ->get()
            ->map(fn($check) => [
                'id' => $check->id,
                'article_id' => $check->checkable_id,
                'article_title' => $check->checkable?->title ?? 'N/A',
                'article_slug' => $check->checkable?->slug ?? '',
                'content_type' => $check->content_type,
                'platform_id' => $check->platform_id,
                'language_code' => $check->language_code ?? 'fr',
                'overall_score' => round($check->overall_score, 1),
                'readability_score' => round($check->readability_score ?? 0, 1),
                'seo_score' => round($check->seo_score ?? 0, 1),
                'brand_score' => round($check->brand_score ?? 0, 1),
                'knowledge_score' => round($check->knowledge_score ?? 0, 1),
                'engagement_score' => round($check->structure_score ?? 0, 1),
                'accuracy_score' => round($check->originality_score ?? 0, 1),
                'status' => $check->status,
                'suggestions' => $check->suggestions ?? [],
                'criteria_details' => $check->validation_details ?? [],
                'word_count' => 0,
                'reading_time' => 0,
                'created_at' => $check->checked_at?->toISOString() ?? now()->toISOString(),
                'updated_at' => $check->updated_at?->toISOString() ?? now()->toISOString(),
            ]);
        
        // Low score alerts
        $lowScoreAlerts = (clone $query)
            ->where('overall_score', '<', 60)
            ->with(['checkable:id,title,slug'])
            ->orderBy('overall_score', 'asc')
            ->limit(10)
            ->get()
            ->map(fn($check) => [
                'id' => $check->id,
                'article_id' => $check->checkable_id,
                'article_title' => $check->checkable?->title ?? 'N/A',
                'article_slug' => $check->checkable?->slug ?? '',
                'content_type' => $check->content_type,
                'platform_id' => $check->platform_id,
                'language_code' => $check->language_code ?? 'fr',
                'overall_score' => round($check->overall_score, 1),
                'readability_score' => round($check->readability_score ?? 0, 1),
                'seo_score' => round($check->seo_score ?? 0, 1),
                'brand_score' => round($check->brand_score ?? 0, 1),
                'knowledge_score' => round($check->knowledge_score ?? 0, 1),
                'engagement_score' => round($check->structure_score ?? 0, 1),
                'accuracy_score' => round($check->originality_score ?? 0, 1),
                'status' => $check->status,
                'suggestions' => $check->suggestions ?? [],
                'criteria_details' => $check->validation_details ?? [],
                'word_count' => 0,
                'reading_time' => 0,
                'created_at' => $check->checked_at?->toISOString() ?? now()->toISOString(),
                'updated_at' => $check->updated_at?->toISOString() ?? now()->toISOString(),
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'total_checks' => $totalChecks,
                'average_score' => $averageScore,
                'passed_count' => $passedCount,
                'warning_count' => $warningCount,
                'failed_count' => $failedCount,
                'pending_count' => 0,
                'scores_by_criterion' => [
                    'readability' => (float) ($criteriaStats->readability ?? 0),
                    'seo' => (float) ($criteriaStats->seo ?? 0),
                    'brand' => (float) ($criteriaStats->brand ?? 0),
                    'knowledge' => (float) ($criteriaStats->knowledge ?? 0),
                    'engagement' => (float) ($criteriaStats->engagement ?? 0),
                    'accuracy' => (float) ($criteriaStats->accuracy ?? 0),
                ],
                'trend' => [
                    'direction' => $change > 0 ? 'up' : ($change < 0 ? 'down' : 'stable'),
                    'change' => abs($change),
                    'period' => '7 jours',
                ],
                'distribution' => [
                    'excellent' => $excellent,
                    'good' => $good,
                    'average' => $average,
                    'poor' => $poor,
                ],
                'recent_checks' => $recentChecks->toArray(),
                'low_score_alerts' => $lowScoreAlerts->toArray(),
            ],
        ]);
    }
    
    /**
     * Structure vide pour dashboard sans données
     */
    private function getEmptyDashboardStats(): array
    {
        return [
            'total_checks' => 0,
            'average_score' => 0,
            'passed_count' => 0,
            'warning_count' => 0,
            'failed_count' => 0,
            'pending_count' => 0,
            'scores_by_criterion' => [
                'readability' => 0,
                'seo' => 0,
                'brand' => 0,
                'knowledge' => 0,
                'engagement' => 0,
                'accuracy' => 0,
            ],
            'trend' => [
                'direction' => 'stable',
                'change' => 0,
                'period' => '7 jours',
            ],
            'distribution' => [
                'excellent' => 0,
                'good' => 0,
                'average' => 0,
                'poor' => 0,
            ],
            'recent_checks' => [],
            'low_score_alerts' => [],
        ];
    }

    /**
     * GET /api/admin/quality/checks
     */
    public function index(Request $request): JsonResponse
    {
        $query = QualityCheck::with(['checkable', 'platform']);

        if ($request->has('platform_id')) {
            $query->where('platform_id', $request->platform_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('min_score')) {
            $query->where('overall_score', '>=', $request->min_score);
        }

        if ($request->has('content_type')) {
            $query->where('content_type', $request->content_type);
        }

        if ($request->has('language_code')) {
            $query->where('language_code', $request->language_code);
        }

        $checks = $query->orderBy('checked_at', 'desc')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $checks,
        ]);
    }

    /**
     * POST /api/admin/quality/checks/{articleId}/revalidate
     */
    public function revalidate(int $articleId): JsonResponse
    {
        $article = Article::findOrFail($articleId);

        $qualityCheck = $this->qualityEnforcer->validateArticle($article);

        $article->quality_score = $qualityCheck->overall_score;
        $article->status = $qualityCheck->status === 'passed' ? 'draft' : 'review_needed';
        $article->save();

        return response()->json([
            'success' => true,
            'message' => 'Article re-validé avec succès',
            'data' => [
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
            ],
        ]);
    }

    /**
     * GET /api/admin/quality/trends
     * 
     * CORRIGÉ: Retourne la structure attendue par QualityTrend[]
     * - overall_score au lieu de avg_score
     * - checks_count au lieu de count
     * - Tous les scores par critère
     */
    public function trends(Request $request): JsonResponse
    {
        $platformId = $request->get('platform_id');
        $period = $request->get('period', '30d');
        
        // Convertir period en jours
        $daysMap = ['7d' => 7, '30d' => 30, '90d' => 90, '1y' => 365];
        $days = $daysMap[$period] ?? 30;
        
        $query = QualityCheck::where('checked_at', '>=', now()->subDays($days));
        
        if ($platformId) {
            $query->where('platform_id', $platformId);
        }
        
        $trends = $query->selectRaw('
            DATE(checked_at) as date,
            ROUND(AVG(overall_score), 2) as overall_score,
            ROUND(AVG(readability_score), 2) as readability_score,
            ROUND(AVG(seo_score), 2) as seo_score,
            ROUND(AVG(brand_score), 2) as brand_score,
            ROUND(AVG(knowledge_score), 2) as knowledge_score,
            ROUND(AVG(structure_score), 2) as engagement_score,
            ROUND(AVG(originality_score), 2) as accuracy_score,
            COUNT(*) as checks_count
        ')
        ->groupBy('date')
        ->orderBy('date')
        ->get()
        ->map(fn($row) => [
            'date' => $row->date,
            'overall_score' => (float) $row->overall_score,
            'readability_score' => (float) $row->readability_score,
            'seo_score' => (float) $row->seo_score,
            'brand_score' => (float) $row->brand_score,
            'knowledge_score' => (float) $row->knowledge_score,
            'engagement_score' => (float) $row->engagement_score,
            'accuracy_score' => (float) $row->accuracy_score,
            'checks_count' => (int) $row->checks_count,
        ])
        ->toArray();

        // Retourne directement le tableau (le frontend attend un array, pas un objet)
        return response()->json($trends);
    }

    /**
     * GET /api/admin/quality/criteria-stats
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
            'data' => [
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
            ],
        ]);
    }
}
