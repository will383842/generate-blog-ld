<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Country;
use App\Models\Language;
use App\Models\Platform;
use App\Models\Theme;
use App\Models\ApiCost;
use App\Models\GenerationLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

/**
 * CoverageController - Statistiques de couverture géographique et linguistique
 */
class CoverageController extends Controller
{
    /**
     * Couverture par plateforme
     * 
     * GET /api/coverage/by-platform
     */
    public function byPlatform(Request $request): JsonResponse
    {
        $platformId = $request->get('platform_id');
        $cacheKey = 'coverage.by_platform.' . ($platformId ?? 'all');

        return Cache::remember($cacheKey, 600, function () use ($platformId) {
            try {
                $query = Article::query();
                
                if ($platformId) {
                    $query->where('platform_id', $platformId);
                }

                $stats = $query->select([
                        'platform_id',
                        DB::raw('COUNT(DISTINCT country_id) as countries_covered'),
                        DB::raw('COUNT(DISTINCT language_id) as languages_covered'),
                        DB::raw('COUNT(*) as total_articles'),
                        DB::raw('COUNT(CASE WHEN status = "published" THEN 1 END) as published_articles'),
                    ])
                    ->groupBy('platform_id')
                    ->get();

                $totalCountries = Country::count();
                $totalLanguages = Language::count();

                $results = $stats->map(function ($stat) use ($totalCountries, $totalLanguages) {
                    $platform = Platform::find($stat->platform_id);
                    
                    return [
                        'platform' => [
                            'id' => $platform->id,
                            'name' => $platform->name,
                            'slug' => $platform->slug,
                        ],
                        'coverage' => [
                            'countries' => [
                                'covered' => $stat->countries_covered,
                                'total' => $totalCountries,
                                'percentage' => round(($stat->countries_covered / $totalCountries) * 100, 2),
                            ],
                            'languages' => [
                                'covered' => $stat->languages_covered,
                                'total' => $totalLanguages,
                                'percentage' => round(($stat->languages_covered / $totalLanguages) * 100, 2),
                            ],
                        ],
                        'articles' => [
                            'total' => $stat->total_articles,
                            'published' => $stat->published_articles,
                            'draft' => $stat->total_articles - $stat->published_articles,
                        ],
                    ];
                });

                return response()->json([
                    'success' => true,
                    'data' => $results,
                ]);

            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de la récupération de la couverture',
                    'error' => $e->getMessage(),
                ], 500);
            }
        });
    }

    /**
     * Couverture par pays
     * 
     * GET /api/coverage/by-country
     */
    public function byCountry(Request $request): JsonResponse
    {
        $platformId = $request->get('platform_id');
        $cacheKey = 'coverage.by_country.' . ($platformId ?? 'all');

        return Cache::remember($cacheKey, 600, function () use ($platformId) {
            try {
                $query = Article::select([
                        'country_id',
                        DB::raw('COUNT(*) as total_articles'),
                        DB::raw('COUNT(DISTINCT language_id) as languages_count'),
                        DB::raw('COUNT(DISTINCT type) as content_types_count'),
                    ])
                    ->groupBy('country_id');

                if ($platformId) {
                    $query->where('platform_id', $platformId);
                }

                $stats = $query->get();

                $results = $stats->map(function ($stat) {
                    $country = Country::find($stat->country_id);
                    
                    return [
                        'country' => [
                            'id' => $country->id,
                            'name' => $country->name,
                            'code' => $country->iso2,
                        ],
                        'articles_count' => $stat->total_articles,
                        'languages_count' => $stat->languages_count,
                        'content_types_count' => $stat->content_types_count,
                    ];
                });

                return response()->json([
                    'success' => true,
                    'data' => $results,
                    'meta' => [
                        'total_countries' => $results->count(),
                        'total_articles' => $results->sum('articles_count'),
                    ],
                ]);

            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de la récupération',
                    'error' => $e->getMessage(),
                ], 500);
            }
        });
    }

    /**
     * Couverture par thème
     * 
     * GET /api/coverage/by-theme
     */
    public function byTheme(Request $request): JsonResponse
    {
        try {
            $platformId = $request->get('platform_id');

            $query = Article::select([
                    'theme_id',
                    DB::raw('COUNT(*) as total_articles'),
                    DB::raw('COUNT(DISTINCT country_id) as countries_count'),
                    DB::raw('COUNT(DISTINCT language_id) as languages_count'),
                ])
                ->whereNotNull('theme_id')
                ->groupBy('theme_id');

            if ($platformId) {
                $query->where('platform_id', $platformId);
            }

            $stats = $query->get();

            $results = $stats->map(function ($stat) {
                $theme = Theme::find($stat->theme_id);
                
                return [
                    'theme' => [
                        'id' => $theme->id,
                        'name' => $theme->name,
                        'slug' => $theme->slug,
                    ],
                    'articles_count' => $stat->total_articles,
                    'countries_count' => $stat->countries_count,
                    'languages_count' => $stat->languages_count,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $results,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Identifier les gaps de couverture
     * 
     * GET /api/coverage/gaps
     */
    public function gaps(Request $request): JsonResponse
    {
        $platformId = $request->get('platform_id', 1);
        $languageCode = $request->get('language_code', 'fr');
        $cacheKey = "coverage.gaps.{$platformId}.{$languageCode}";

        return Cache::remember($cacheKey, 300, function () use ($platformId, $languageCode) {
            try {
                // Pays sans aucun contenu
                $countriesWithoutContent = Country::whereNotExists(function ($query) use ($platformId, $languageCode) {
                    $query->select(DB::raw(1))
                        ->from('articles')
                        ->whereColumn('articles.country_id', 'countries.id')
                        ->where('articles.platform_id', $platformId)
                        ->whereHas('language', fn($q) => $q->where('code', $languageCode));
                })->get(['id', 'name', 'iso2']);

                // Thèmes avec peu de contenu
                $themesLowCoverage = Theme::select([
                        'themes.id',
                        'themes.name',
                        DB::raw('COUNT(articles.id) as articles_count'),
                    ])
                    ->leftJoin('articles', function ($join) use ($platformId) {
                        $join->on('articles.theme_id', '=', 'themes.id')
                            ->where('articles.platform_id', $platformId);
                    })
                    ->groupBy('themes.id', 'themes.name')
                    ->having('articles_count', '<', 10)
                    ->get();

                return response()->json([
                    'success' => true,
                    'data' => [
                        'countries_without_content' => $countriesWithoutContent->map(fn($c) => [
                            'id' => $c->id,
                            'name' => $c->name,
                            'code' => $c->iso2,
                        ]),
                        'themes_low_coverage' => $themesLowCoverage,
                        'summary' => [
                            'countries_without_content' => $countriesWithoutContent->count(),
                            'themes_needing_content' => $themesLowCoverage->count(),
                        ],
                    ],
                ]);

            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de l\'analyse des gaps',
                    'error' => $e->getMessage(),
                ], 500);
            }
        });
    }

    /**
     * Heatmap de couverture
     * 
     * GET /api/coverage/heatmap
     */
    public function heatmap(Request $request): JsonResponse
    {
        $platformId = $request->get('platform_id', 1);
        $cacheKey = "coverage.heatmap.{$platformId}";

        return Cache::remember($cacheKey, 3600, function () use ($platformId) {
            try {
                $data = Article::select([
                        'country_id',
                        'language_id',
                        DB::raw('COUNT(*) as count'),
                    ])
                    ->where('platform_id', $platformId)
                    ->groupBy('country_id', 'language_id')
                    ->get();

                $heatmap = [];
                foreach ($data as $item) {
                    $country = Country::find($item->country_id);
                    $language = Language::find($item->language_id);
                    
                    $heatmap[] = [
                        'country' => $country->iso2 ?? null,
                        'language' => $language->code ?? null,
                        'count' => $item->count,
                    ];
                }

                return response()->json([
                    'success' => true,
                    'data' => $heatmap,
                ]);

            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de la génération de la heatmap',
                    'error' => $e->getMessage(),
                ], 500);
            }
        });
    }
}