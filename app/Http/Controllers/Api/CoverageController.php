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
 * 
 * OPTIMISÉ: Suppression des requêtes N+1
 * - Préchargement des entités en amont
 * - Utilisation de keyBy() pour indexation rapide
 * - Cache augmenté pour réduire la charge DB
 */
class CoverageController extends Controller
{
    /**
     * Couverture par plateforme
     * 
     * GET /api/coverage/by-platform
     * 
     * OPTIMISÉ: Préchargement des plateformes
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

                // ✅ OPTIMISÉ: Précharger TOUTES les plateformes en une seule requête
                $platformIds = $stats->pluck('platform_id')->unique()->filter();
                $platforms = Platform::whereIn('id', $platformIds)->get()->keyBy('id');

                $results = $stats->map(function ($stat) use ($totalCountries, $totalLanguages, $platforms) {
                    // ✅ OPTIMISÉ: Accès O(1) au lieu de requête SQL
                    $platform = $platforms->get($stat->platform_id);
                    
                    if (!$platform) {
                        return null;
                    }
                    
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
                                'percentage' => $totalCountries > 0 
                                    ? round(($stat->countries_covered / $totalCountries) * 100, 2)
                                    : 0,
                            ],
                            'languages' => [
                                'covered' => $stat->languages_covered,
                                'total' => $totalLanguages,
                                'percentage' => $totalLanguages > 0
                                    ? round(($stat->languages_covered / $totalLanguages) * 100, 2)
                                    : 0,
                            ],
                        ],
                        'articles' => [
                            'total' => $stat->total_articles,
                            'published' => $stat->published_articles,
                            'draft' => $stat->total_articles - $stat->published_articles,
                        ],
                    ];
                })->filter()->values();

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
     * 
     * OPTIMISÉ: Préchargement des pays
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

                // ✅ OPTIMISÉ: Précharger TOUS les pays en une seule requête
                $countryIds = $stats->pluck('country_id')->unique()->filter();
                $countries = Country::whereIn('id', $countryIds)->get()->keyBy('id');

                $results = $stats->map(function ($stat) use ($countries) {
                    // ✅ OPTIMISÉ: Accès O(1) au lieu de requête SQL
                    $country = $countries->get($stat->country_id);
                    
                    if (!$country) {
                        return null;
                    }
                    
                    return [
                        'country' => [
                            'id' => $country->id,
                            'name' => $country->name,
                            'code' => $country->code,
                        ],
                        'articles_count' => $stat->total_articles,
                        'languages_count' => $stat->languages_count,
                        'content_types_count' => $stat->content_types_count,
                    ];
                })->filter()->values();

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
     * 
     * OPTIMISÉ: Préchargement des thèmes
     */
    public function byTheme(Request $request): JsonResponse
    {
        $platformId = $request->get('platform_id');
        $cacheKey = 'coverage.by_theme.' . ($platformId ?? 'all');

        return Cache::remember($cacheKey, 600, function () use ($platformId) {
            try {
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

                // ✅ OPTIMISÉ: Précharger TOUS les thèmes en une seule requête
                $themeIds = $stats->pluck('theme_id')->unique()->filter();
                $themes = Theme::whereIn('id', $themeIds)->get()->keyBy('id');

                $results = $stats->map(function ($stat) use ($themes) {
                    // ✅ OPTIMISÉ: Accès O(1) au lieu de requête SQL
                    $theme = $themes->get($stat->theme_id);
                    
                    if (!$theme) {
                        return null;
                    }
                    
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
                })->filter()->values();

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
        });
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
                $languageId = Language::where('code', $languageCode)->value('id');
                $countriesWithoutContent = Country::whereNotExists(function ($query) use ($platformId, $languageId) {
                    $query->select(DB::raw(1))
                        ->from('articles')
                        ->whereColumn('articles.country_id', 'countries.id')
                        ->where('articles.platform_id', $platformId)
                        ->where('articles.language_id', $languageId);
                })->get(['id', 'name_fr as name', 'code']);

                // Thèmes avec peu de contenu
                $themesLowCoverage = Theme::select([
                        'themes.id',
                        'themes.name_fr as name',
                        'themes.slug',
                        DB::raw('COUNT(articles.id) as articles_count'),
                    ])
                    ->leftJoin('articles', function ($join) use ($platformId) {
                        $join->on('articles.theme_id', '=', 'themes.id')
                            ->where('articles.platform_id', $platformId);
                    })
                    ->groupBy('themes.id', 'themes.name_fr', 'themes.slug')
                    ->having('articles_count', '<', 10)
                    ->get();

                return response()->json([
                    'success' => true,
                    'data' => [
                        'countries_without_content' => $countriesWithoutContent->map(fn($c) => [
                            'id' => $c->id,
                            'name' => $c->name,
                            'code' => $c->code,
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
     * 
     * OPTIMISÉ: Préchargement des pays et langues
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

                // ✅ OPTIMISÉ: Précharger TOUS les pays et langues en 2 requêtes seulement
                $countryIds = $data->pluck('country_id')->unique()->filter();
                $languageIds = $data->pluck('language_id')->unique()->filter();
                
                $countries = Country::whereIn('id', $countryIds)->get()->keyBy('id');
                $languages = Language::whereIn('id', $languageIds)->get()->keyBy('id');

                $heatmap = $data->map(function ($item) use ($countries, $languages) {
                    // ✅ OPTIMISÉ: Accès O(1) au lieu de requêtes SQL
                    $country = $countries->get($item->country_id);
                    $language = $languages->get($item->language_id);
                    
                    return [
                        'country' => $country->code ?? null,
                        'country_name' => $country->name ?? null,
                        'language' => $language->code ?? null,
                        'language_name' => $language->name ?? null,
                        'count' => $item->count,
                    ];
                })->filter(fn($item) => $item['country'] && $item['language'])->values();

                return response()->json([
                    'success' => true,
                    'data' => $heatmap,
                    'meta' => [
                        'total_combinations' => $heatmap->count(),
                        'total_articles' => $heatmap->sum('count'),
                    ],
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