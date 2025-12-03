<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Country;
use App\Models\ApiCost;
use App\Models\GenerationLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * StatsController - Statistiques et analytics
 */
class StatsController extends Controller
{
    /**
     * Dashboard global
     * 
     * GET /api/stats/dashboard
     */
    public function dashboard(Request $request): JsonResponse
    {
        try {
            $platformId = $request->get('platform_id');

            // Stats articles
            $articlesQuery = Article::query();
            if ($platformId) {
                $articlesQuery->where('platform_id', $platformId);
            }

            $articlesStats = [
                'total' => $articlesQuery->count(),
                'published' => $articlesQuery->where('status', 'published')->count(),
                'draft' => $articlesQuery->where('status', 'draft')->count(),
                'pending' => $articlesQuery->where('status', 'pending')->count(),
                'by_type' => $articlesQuery->select('type', DB::raw('count(*) as count'))
                    ->groupBy('type')
                    ->pluck('count', 'type')
                    ->toArray(),
            ];

            // Stats génération (24h)
            $generationStats = GenerationLog::where('created_at', '>=', now()->subDay())
                ->select([
                    DB::raw('COUNT(*) as total'),
                    DB::raw('COUNT(CASE WHEN status = "success" THEN 1 END) as successful'),
                    DB::raw('COUNT(CASE WHEN status = "failed" THEN 1 END) as failed'),
                    DB::raw('AVG(duration_seconds) as avg_duration'),
                    DB::raw('SUM(cost) as total_cost'),
                ])
                ->first();

            // Stats coûts
            $costsToday = ApiCost::whereDate('date', today())->sum('cost');
            $costsMonth = ApiCost::whereMonth('date', now()->month)
                ->whereYear('date', now()->year)
                ->sum('cost');

            // Top pays
            $topCountries = Article::select([
                    'country_id',
                    DB::raw('COUNT(*) as count'),
                ])
                ->groupBy('country_id')
                ->orderBy('count', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($item) {
                    $country = Country::find($item->country_id);
                    return [
                        'country' => $country->name ?? 'Unknown',
                        'code' => $country->iso2 ?? null,
                        'count' => $item->count,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'articles' => $articlesStats,
                    'generation_24h' => [
                        'total' => $generationStats->total ?? 0,
                        'successful' => $generationStats->successful ?? 0,
                        'failed' => $generationStats->failed ?? 0,
                        'avg_duration_seconds' => round($generationStats->avg_duration ?? 0, 2),
                        'total_cost' => round($generationStats->total_cost ?? 0, 4),
                    ],
                    'costs' => [
                        'today' => round($costsToday, 2),
                        'month' => round($costsMonth, 2),
                    ],
                    'top_countries' => $topCountries,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du dashboard',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Statistiques des coûts API
     * 
     * GET /api/stats/costs
     */
    public function costs(Request $request): JsonResponse
    {
        try {
            $period = $request->get('period', 'month'); // day, week, month, year

            $dateFrom = match($period) {
                'day' => now()->startOfDay(),
                'week' => now()->startOfWeek(),
                'month' => now()->startOfMonth(),
                'year' => now()->startOfYear(),
                default => now()->startOfMonth(),
            };

            $costs = ApiCost::where('date', '>=', $dateFrom)
                ->select([
                    'date',
                    'service',
                    DB::raw('SUM(cost) as total_cost'),
                    DB::raw('SUM(requests) as total_requests'),
                ])
                ->groupBy('date', 'service')
                ->orderBy('date', 'asc')
                ->get();

            $byService = $costs->groupBy('service')->map(function ($items) {
                return [
                    'total_cost' => $items->sum('total_cost'),
                    'total_requests' => $items->sum('total_requests'),
                ];
            });

            $timeline = $costs->groupBy('date')->map(function ($items) {
                return [
                    'total_cost' => $items->sum('total_cost'),
                    'by_service' => $items->pluck('total_cost', 'service')->toArray(),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'period' => $period,
                    'by_service' => $byService,
                    'timeline' => $timeline,
                    'total_cost' => $costs->sum('total_cost'),
                    'total_requests' => $costs->sum('total_requests'),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des coûts',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Statistiques de production
     * 
     * GET /api/stats/production
     */
    public function production(Request $request): JsonResponse
    {
        try {
            $days = $request->get('days', 30);
            $dateFrom = now()->subDays($days);

            $daily = Article::where('created_at', '>=', $dateFrom)
                ->select([
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('COUNT(*) as count'),
                    DB::raw('SUM(word_count) as total_words'),
                ])
                ->groupBy('date')
                ->orderBy('date', 'asc')
                ->get();

            $totalArticles = $daily->sum('count');
            $avgPerDay = $totalArticles / $days;

            return response()->json([
                'success' => true,
                'data' => [
                    'period_days' => $days,
                    'total_articles' => $totalArticles,
                    'avg_per_day' => round($avgPerDay, 2),
                    'total_words' => $daily->sum('total_words'),
                    'daily_breakdown' => $daily,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des stats de production',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Statistiques de qualité
     * 
     * GET /api/stats/quality
     */
    public function quality(Request $request): JsonResponse
    {
        try {
            $stats = Article::select([
                    DB::raw('AVG(quality_score) as avg_quality_score'),
                    DB::raw('AVG(word_count) as avg_word_count'),
                    DB::raw('AVG(reading_time) as avg_reading_time'),
                    DB::raw('COUNT(CASE WHEN quality_score >= 80 THEN 1 END) as high_quality'),
                    DB::raw('COUNT(CASE WHEN quality_score BETWEEN 60 AND 79 THEN 1 END) as medium_quality'),
                    DB::raw('COUNT(CASE WHEN quality_score < 60 THEN 1 END) as low_quality'),
                ])
                ->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'averages' => [
                        'quality_score' => round($stats->avg_quality_score ?? 0, 2),
                        'word_count' => round($stats->avg_word_count ?? 0),
                        'reading_time' => round($stats->avg_reading_time ?? 0),
                    ],
                    'distribution' => [
                        'high_quality' => $stats->high_quality ?? 0,
                        'medium_quality' => $stats->medium_quality ?? 0,
                        'low_quality' => $stats->low_quality ?? 0,
                    ],
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des stats de qualité',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
