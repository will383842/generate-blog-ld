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
use Illuminate\Support\Facades\Cache;

/**
 * StatsController - Statistiques et analytics
 * 
 * VERSION PRODUCTION - Sans données placeholder
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
            $cacheKey = 'stats.dashboard.' . ($platformId ?? 'all');

            $data = Cache::remember($cacheKey, 600, function () use ($platformId) {
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

                return [
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
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data,
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
            $cacheKey = 'stats.costs.' . $period;

            $data = Cache::remember($cacheKey, 600, function () use ($period) {
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

                return [
                    'period' => $period,
                    'by_service' => $byService,
                    'timeline' => $timeline,
                    'total_cost' => $costs->sum('total_cost'),
                    'total_requests' => $costs->sum('total_requests'),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data,
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
            $cacheKey = 'stats.production.' . $days;

            $data = Cache::remember($cacheKey, 600, function () use ($days) {
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

                return [
                    'period_days' => $days,
                    'total_articles' => $totalArticles,
                    'avg_per_day' => round($avgPerDay, 2),
                    'total_words' => $daily->sum('total_words'),
                    'daily_breakdown' => $daily,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data,
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
     * Statistiques par plateforme
     *
     * GET /api/admin/stats/platform
     */
    public function platform(Request $request): JsonResponse
    {
        try {
            $platformId = $request->get('platform_id');
            $evolutionDays = $request->get('evolution_days', 30);

            if (!$platformId) {
                return response()->json([
                    'success' => false,
                    'message' => 'platform_id requis',
                ], 400);
            }

            $cacheKey = "stats.platform.{$platformId}.{$evolutionDays}";

            $data = Cache::remember($cacheKey, 300, function () use ($platformId, $evolutionDays) {
                // Overview stats
                $articlesQuery = Article::where('platform_id', $platformId);
                $totalArticles = $articlesQuery->count();
                $totalCountries = $articlesQuery->distinct('country_id')->count('country_id');
                $totalLanguages = $articlesQuery->distinct('language_id')->count('language_id');

                $publishedCount = Article::where('platform_id', $platformId)
                    ->where('status', 'published')
                    ->count();

                $avgCoverage = $totalCountries > 0
                    ? min(100, round(($publishedCount / max(1, $totalCountries * 5)) * 100, 1))
                    : 0;

                // Country coverage
                $countryCoverage = Article::where('platform_id', $platformId)
                    ->select([
                        'country_id',
                        DB::raw('COUNT(*) as total_articles'),
                        DB::raw('COUNT(CASE WHEN status = "published" THEN 1 END) as published_articles'),
                        DB::raw('MAX(published_at) as last_published'),
                    ])
                    ->groupBy('country_id')
                    ->get()
                    ->map(function ($item) use ($platformId) {
                        $country = Country::find($item->country_id);
                        $languages = Article::where('platform_id', $platformId)
                            ->where('country_id', $item->country_id)
                            ->distinct('language_id')
                            ->pluck('language_id')
                            ->map(fn($id) => \App\Models\Language::find($id)?->code ?? 'fr')
                            ->toArray();

                        $coverage = $item->total_articles > 0
                            ? min(100, round(($item->published_articles / max(1, $item->total_articles)) * 100, 1))
                            : 0;

                        return [
                            'countryCode' => $country?->iso2 ?? 'XX',
                            'countryName' => $country?->name ?? 'Inconnu',
                            'flag' => $country?->flag ?? '',
                            'totalArticles' => $item->total_articles,
                            'publishedArticles' => $item->published_articles,
                            'coveragePercent' => $coverage,
                            'languages' => $languages,
                            'lastPublished' => $item->last_published,
                        ];
                    })
                    ->sortByDesc('totalArticles')
                    ->values();

                // Top countries (with REAL growth calculation)
                $topCountries = $countryCoverage->take(10)->map(function ($country) use ($platformId) {
                    // Calculer la vraie croissance : articles ce mois vs mois précédent
                    $countryModel = Country::where('iso2', $country['countryCode'])->first();
                    $countryId = $countryModel?->id;
                    
                    $currentMonthCount = 0;
                    $previousMonthCount = 0;
                    $growthPercent = 0;
                    
                    if ($countryId) {
                        $currentMonthCount = Article::where('platform_id', $platformId)
                            ->where('country_id', $countryId)
                            ->whereMonth('created_at', now()->month)
                            ->whereYear('created_at', now()->year)
                            ->count();
                        
                        $previousMonthCount = Article::where('platform_id', $platformId)
                            ->where('country_id', $countryId)
                            ->whereMonth('created_at', now()->subMonth()->month)
                            ->whereYear('created_at', now()->subMonth()->year)
                            ->count();
                        
                        // Calcul du pourcentage de croissance
                        if ($previousMonthCount > 0) {
                            $growthPercent = round((($currentMonthCount - $previousMonthCount) / $previousMonthCount) * 100, 1);
                        } elseif ($currentMonthCount > 0) {
                            $growthPercent = 100; // Nouvelle activité ce mois
                        }
                    }
                    
                    // Déterminer la tendance basée sur la croissance réelle
                    $trend = 'stable';
                    if ($growthPercent > 10) {
                        $trend = 'up';
                    } elseif ($growthPercent < -10) {
                        $trend = 'down';
                    }
                    
                    return [
                        'countryCode' => $country['countryCode'],
                        'countryName' => $country['countryName'],
                        'flag' => $country['flag'],
                        'articlesCount' => $country['totalArticles'],
                        'growthPercent' => $growthPercent,
                        'trend' => $trend,
                        'currentMonth' => $currentMonthCount,
                        'previousMonth' => $previousMonthCount,
                    ];
                })->values();

                // Content gaps (simplified)
                $gaps = collect();

                // Evolution (last N days) with REAL cost data
                $evolution = collect();
                $dateFrom = now()->subDays($evolutionDays);

                $dailyStats = Article::where('platform_id', $platformId)
                    ->where('created_at', '>=', $dateFrom)
                    ->select([
                        DB::raw('DATE(created_at) as date'),
                        DB::raw('COUNT(*) as articles'),
                        DB::raw('COUNT(CASE WHEN status = "published" THEN 1 END) as published'),
                    ])
                    ->groupBy('date')
                    ->orderBy('date', 'asc')
                    ->get();

                // Récupérer les coûts réels par jour depuis api_costs
                $dailyCosts = ApiCost::where('date', '>=', $dateFrom->toDateString())
                    ->select([
                        'date',
                        DB::raw('SUM(cost) as total_cost'),
                        DB::raw('SUM(requests) as total_requests'),
                    ])
                    ->groupBy('date')
                    ->pluck('total_cost', 'date')
                    ->toArray();

                // Récupérer le nombre de vues/traffic depuis generation_logs (comme proxy de l'activité)
                $dailyActivity = GenerationLog::where('created_at', '>=', $dateFrom)
                    ->select([
                        DB::raw('DATE(created_at) as date'),
                        DB::raw('COUNT(*) as activity_count'),
                    ])
                    ->groupBy('date')
                    ->pluck('activity_count', 'date')
                    ->toArray();

                foreach ($dailyStats as $day) {
                    $evolution->push([
                        'date' => $day->date,
                        'articles' => $day->articles,
                        'published' => $day->published,
                        'activity' => $dailyActivity[$day->date] ?? 0, // Activité réelle (générations)
                        'cost' => round($dailyCosts[$day->date] ?? 0, 2), // Coût réel depuis API
                    ]);
                }

                // Language distribution
                $languageDistribution = Article::where('platform_id', $platformId)
                    ->select([
                        'language_id',
                        DB::raw('COUNT(*) as count'),
                    ])
                    ->groupBy('language_id')
                    ->orderBy('count', 'desc')
                    ->get()
                    ->map(function ($item) use ($totalArticles) {
                        $language = \App\Models\Language::find($item->language_id);
                        return [
                            'language' => $language?->code ?? 'fr',
                            'languageName' => $language?->name ?? 'Français',
                            'flag' => $language?->flag ?? '',
                            'articlesCount' => $item->count,
                            'percent' => $totalArticles > 0
                                ? round(($item->count / $totalArticles) * 100, 1)
                                : 0,
                        ];
                    });

                return [
                    'overview' => [
                        'totalArticles' => $totalArticles,
                        'totalCountries' => $totalCountries,
                        'totalLanguages' => $totalLanguages,
                        'avgCoveragePercent' => $avgCoverage,
                    ],
                    'countryCoverage' => $countryCoverage->toArray(),
                    'topCountries' => $topCountries->toArray(),
                    'gaps' => $gaps->toArray(),
                    'evolution' => $evolution->toArray(),
                    'languageDistribution' => $languageDistribution->toArray(),
                    'lastUpdated' => now()->toIso8601String(),
                ];
            });

            return response()->json($data);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des stats plateforme',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Statistiques de qualité
     *
     * GET /api/admin/stats/quality
     */
    public function quality(Request $request): JsonResponse
    {
        try {
            $cacheKey = 'stats.quality';

            $data = Cache::remember($cacheKey, 600, function () {
                $stats = Article::select([
                        DB::raw('AVG(quality_score) as avg_quality_score'),
                        DB::raw('AVG(word_count) as avg_word_count'),
                        DB::raw('AVG(reading_time) as avg_reading_time'),
                        DB::raw('COUNT(CASE WHEN quality_score >= 80 THEN 1 END) as high_quality'),
                        DB::raw('COUNT(CASE WHEN quality_score BETWEEN 60 AND 79 THEN 1 END) as medium_quality'),
                        DB::raw('COUNT(CASE WHEN quality_score < 60 THEN 1 END) as low_quality'),
                    ])
                    ->first();

                return [
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
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data,
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