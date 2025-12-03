<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\PillarSchedule;
use App\Models\PillarResearchSource;
use App\Models\PillarStatistic;
use App\Services\Content\PillarArticleGenerator;
use App\Services\Content\PillarSchedulerService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

/**
 * PillarController - API pour gestion articles piliers
 * 
 * Routes :
 * - GET    /api/pillars/schedule          : Calendrier planification
 * - POST   /api/pillars/generate-manual   : Génération manuelle
 * - GET    /api/pillars/{id}/sources      : Sources recherche
 * - GET    /api/pillars/{id}/statistics   : Statistiques article
 * - GET    /api/pillars/stats             : Statistiques globales
 */
class PillarController extends Controller
{
    protected PillarSchedulerService $schedulerService;
    protected PillarArticleGenerator $pillarGenerator;

    public function __construct(
        PillarSchedulerService $schedulerService,
        PillarArticleGenerator $pillarGenerator
    ) {
        $this->schedulerService = $schedulerService;
        $this->pillarGenerator = $pillarGenerator;
    }

    /**
     * ═════════════════════════════════════════════════════════════════════════
     * GET /api/pillars/schedule - Calendrier planification
     * ═════════════════════════════════════════════════════════════════════════
     */
    public function schedule(Request $request): JsonResponse
    {
        try {
            $days = $request->input('days', 30);
            $days = max(1, min(90, $days)); // Limite 1-90 jours

            $calendar = $this->schedulerService->getCalendar($days);

            return response()->json([
                'success' => true,
                'data' => [
                    'calendar' => $calendar,
                    'days' => $days,
                    'generated_at' => now()->toIso8601String(),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur récupération calendrier',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ═════════════════════════════════════════════════════════════════════════
     * POST /api/pillars/generate-manual - Génération manuelle
     * ═════════════════════════════════════════════════════════════════════════
     */
    public function generateManual(Request $request): JsonResponse
    {
        try {
            // Validation
            $validator = Validator::make($request->all(), [
                'platform_id' => 'required|exists:platforms,id',
                'country_id' => 'required|exists:countries,id',
                'theme_id' => 'required|exists:themes,id',
                'language_id' => 'required|exists:languages,id',
                'template_type' => 'required|in:guide_ultime,analyse_marche,whitepaper,dossier_thematique,mega_guide_pays',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation échouée',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Générer l'article
            $article = $this->pillarGenerator->generate($validator->validated());

            return response()->json([
                'success' => true,
                'message' => 'Article pilier généré avec succès',
                'data' => [
                    'article' => [
                        'id' => $article->id,
                        'uuid' => $article->uuid,
                        'title' => $article->title,
                        'slug' => $article->slug,
                        'word_count' => $article->word_count,
                        'reading_time' => $article->reading_time,
                        'quality_score' => $article->quality_score,
                        'status' => $article->status,
                        'published_at' => $article->published_at,
                        'url' => route('articles.show', [$article->platform->slug, $article->slug]),
                    ],
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur génération article pilier',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ═════════════════════════════════════════════════════════════════════════
     * GET /api/pillars/{id}/sources - Sources recherche
     * ═════════════════════════════════════════════════════════════════════════
     */
    public function sources(int $id): JsonResponse
    {
        try {
            $article = Article::findOrFail($id);

            $sources = PillarResearchSource::where('article_id', $id)
                ->orderedByRelevance()
                ->get()
                ->map(function ($source) {
                    return [
                        'id' => $source->id,
                        'type' => $source->source_type,
                        'title' => $source->source_title,
                        'url' => $source->source_url,
                        'date' => $source->source_date,
                        'relevance_score' => $source->relevance_score,
                        'excerpt' => $source->getShortExcerpt(),
                        'is_relevant' => $source->isRelevant(),
                        'is_highly_relevant' => $source->isHighlyRelevant(),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'article_id' => $article->id,
                    'article_title' => $article->title,
                    'sources' => $sources,
                    'total' => $sources->count(),
                    'highly_relevant' => $sources->where('is_highly_relevant', true)->count(),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur récupération sources',
                'error' => $e->getMessage(),
            ], $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException ? 404 : 500);
        }
    }

    /**
     * ═════════════════════════════════════════════════════════════════════════
     * GET /api/pillars/{id}/statistics - Statistiques article
     * ═════════════════════════════════════════════════════════════════════════
     */
    public function statistics(int $id): JsonResponse
    {
        try {
            $article = Article::findOrFail($id);

            $statistics = PillarStatistic::where('article_id', $id)
                ->get()
                ->map(function ($stat) {
                    return [
                        'id' => $stat->id,
                        'key' => $stat->stat_key,
                        'key_formatted' => $stat->getFormattedKey(),
                        'value' => $stat->stat_value,
                        'unit' => $stat->stat_unit,
                        'formatted_value' => $stat->getFormattedValue(),
                        'source_url' => $stat->source_url,
                        'verified' => $stat->verified,
                        'has_source' => $stat->hasSource(),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'article_id' => $article->id,
                    'article_title' => $article->title,
                    'statistics' => $statistics,
                    'total' => $statistics->count(),
                    'verified' => $statistics->where('verified', true)->count(),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur récupération statistiques',
                'error' => $e->getMessage(),
            ], $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException ? 404 : 500);
        }
    }

    /**
     * ═════════════════════════════════════════════════════════════════════════
     * GET /api/pillars/stats - Statistiques globales
     * ═════════════════════════════════════════════════════════════════════════
     */
    public function stats(): JsonResponse
    {
        try {
            // Stats planning
            $scheduleStats = $this->schedulerService->getScheduleStats();

            // Stats articles piliers
            $totalPillars = Article::where('type', 'pillar')->count();
            $publishedPillars = Article::where('type', 'pillar')
                ->where('status', Article::STATUS_PUBLISHED)
                ->count();
            
            $avgWordCount = Article::where('type', 'pillar')
                ->avg('word_count');
            
            $avgQualityScore = Article::where('type', 'pillar')
                ->avg('quality_score');

            // Stats par plateforme
            $byPlatform = Article::where('type', 'pillar')
                ->selectRaw('platform_id, COUNT(*) as count')
                ->groupBy('platform_id')
                ->with('platform:id,name')
                ->get()
                ->map(function ($item) {
                    return [
                        'platform' => $item->platform->name ?? 'Unknown',
                        'count' => $item->count,
                    ];
                });

            // Articles récents
            $recentPillars = Article::where('type', 'pillar')
                ->where('status', Article::STATUS_PUBLISHED)
                ->orderBy('published_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($article) {
                    return [
                        'id' => $article->id,
                        'title' => $article->title,
                        'platform' => $article->platform->name ?? 'N/A',
                        'country' => $article->country->name ?? 'N/A',
                        'word_count' => $article->word_count,
                        'quality_score' => $article->quality_score,
                        'published_at' => $article->published_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'schedule' => $scheduleStats,
                    'articles' => [
                        'total' => $totalPillars,
                        'published' => $publishedPillars,
                        'avg_word_count' => round($avgWordCount),
                        'avg_quality_score' => round($avgQualityScore, 1),
                    ],
                    'by_platform' => $byPlatform,
                    'recent_pillars' => $recentPillars,
                    'generated_at' => now()->toIso8601String(),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur récupération statistiques',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ═════════════════════════════════════════════════════════════════════════
     * GET /api/pillars/{id} - Détails article pilier
     * ═════════════════════════════════════════════════════════════════════════
     */
    public function show(int $id): JsonResponse
    {
        try {
            $article = Article::with(['platform', 'country', 'theme', 'language'])
                ->where('type', 'pillar')
                ->findOrFail($id);

            $sourcesCount = PillarResearchSource::where('article_id', $id)->count();
            $statisticsCount = PillarStatistic::where('article_id', $id)->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'article' => [
                        'id' => $article->id,
                        'uuid' => $article->uuid,
                        'title' => $article->title,
                        'slug' => $article->slug,
                        'excerpt' => $article->excerpt,
                        'word_count' => $article->word_count,
                        'reading_time' => $article->reading_time,
                        'quality_score' => $article->quality_score,
                        'status' => $article->status,
                        'published_at' => $article->published_at,
                        'generation_cost' => $article->generation_cost,
                        'platform' => $article->platform->name,
                        'country' => $article->country->name,
                        'theme' => $article->theme->name,
                        'language' => $article->language->code,
                        'image_url' => $article->image_url,
                        'url' => route('articles.show', [$article->platform->slug, $article->slug]),
                    ],
                    'research' => [
                        'sources_count' => $sourcesCount,
                        'statistics_count' => $statisticsCount,
                    ],
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Article pilier non trouvé',
                'error' => $e->getMessage(),
            ], 404);
        }
    }
}
