<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ResearchCache;
use App\Models\ResearchQuery;
use App\Models\ResearchSource;
use App\Services\Research\ResearchAggregatorService;
use App\Services\Research\FactCheckingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ResearchController extends Controller
{
    protected ResearchAggregatorService $researchService;
    protected FactCheckingService $factCheckingService;

    public function __construct(
        ResearchAggregatorService $researchService,
        FactCheckingService $factCheckingService
    ) {
        $this->researchService = $researchService;
        $this->factCheckingService = $factCheckingService;
    }

    // =========================================================================
    // RECHERCHE MULTI-SOURCES
    // =========================================================================

    /**
     * POST /api/research/search
     * Recherche manuelle multi-sources
     */
    public function search(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'query' => 'required|string|min:3|max:500',
            'language' => 'required|string|size:2',
            'sources' => 'array',
            'sources.*' => 'in:perplexity,news_api',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $query = $request->input('query');
        $language = $request->input('language', 'fr');
        $sources = $request->input('sources', ['perplexity', 'news_api']);

        try {
            $results = $this->researchService->search($query, $language, $sources);

            return response()->json([
                'success' => true,
                'data' => [
                    'query' => $query,
                    'language' => $language,
                    'sources_used' => $sources,
                    'results_count' => count($results),
                    'results' => $results,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Research failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    // =========================================================================
    // SOURCES DISPONIBLES
    // =========================================================================

    /**
     * GET /api/research/sources
     * Liste des sources disponibles avec rate limits
     */
    public function sources(): JsonResponse
    {
        try {
            $sources = ResearchSource::getSourcesStats();

            return response()->json([
                'success' => true,
                'data' => $sources,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch sources: ' . $e->getMessage(),
            ], 500);
        }
    }

    // =========================================================================
    // FACT-CHECKING
    // =========================================================================

    /**
     * POST /api/research/fact-check
     * Vérifier un fait
     */
    public function factCheck(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'claim' => 'required|string|min:10|max:1000',
            'language' => 'required|string|size:2',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $claim = $request->input('claim');
        $language = $request->input('language', 'fr');

        try {
            $result = $this->factCheckingService->checkFact($claim, $language);

            return response()->json([
                'success' => true,
                'data' => $result,
                'warning' => 'Le fact-checking assisté par IA peut contenir des erreurs. Une vérification humaine est recommandée.',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Fact-check failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    // =========================================================================
    // STATISTIQUES CACHE
    // =========================================================================

    /**
     * GET /api/research/cache-stats
     * Statistiques du cache
     */
    public function cacheStats(): JsonResponse
    {
        try {
            $stats = ResearchCache::getCacheStats();
            $popular = ResearchCache::getMostPopular(10);
            $languageDistribution = ResearchCache::getLanguageDistribution();
            $queryStats = ResearchQuery::getLanguageStats(30);
            $cacheHitRate = ResearchQuery::getCacheHitRate(30);

            return response()->json([
                'success' => true,
                'data' => [
                    'cache' => $stats,
                    'most_popular_queries' => $popular,
                    'language_distribution' => $languageDistribution,
                    'query_stats_30_days' => $queryStats,
                    'cache_hit_rate_30_days' => $cacheHitRate . '%',
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch cache stats: ' . $e->getMessage(),
            ], 500);
        }
    }

    // =========================================================================
    // GESTION CACHE
    // =========================================================================

    /**
     * DELETE /api/research/cache
     * Vider le cache (admin uniquement)
     */
    public function clearCache(Request $request): JsonResponse
    {
        // Vérifier les permissions admin
        // (À adapter selon votre système d'authentification)
        
        try {
            $action = $request->input('action', 'clear_expired');

            if ($action === 'clear_all') {
                $deleted = ResearchCache::query()->delete();
                $message = "Tout le cache a été vidé ($deleted entrées supprimées)";
            } else {
                $deleted = ResearchCache::cleanExpired();
                $message = "Les entrées expirées ont été supprimées ($deleted entrées)";
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'deleted_count' => $deleted,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear cache: ' . $e->getMessage(),
            ], 500);
        }
    }

    // =========================================================================
    // EXTRACTION DE CLAIMS
    // =========================================================================

    /**
     * POST /api/research/extract-claims
     * Extraire les affirmations factuelles d'un contenu
     */
    public function extractClaims(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'content' => 'required|string|min:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $content = $request->input('content');
            $claims = $this->factCheckingService->extractClaimsFromContent($content);

            return response()->json([
                'success' => true,
                'data' => [
                    'claims_count' => count($claims),
                    'claims' => $claims,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to extract claims: ' . $e->getMessage(),
            ], 500);
        }
    }

    // =========================================================================
    // VÉRIFICATION MULTIPLE
    // =========================================================================

    /**
     * POST /api/research/verify-multiple
     * Vérifier plusieurs affirmations
     */
    public function verifyMultiple(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'claims' => 'required|array|min:1|max:10',
            'claims.*' => 'string|min:10',
            'language' => 'required|string|size:2',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $claims = $request->input('claims');
            $language = $request->input('language', 'fr');

            $results = $this->factCheckingService->verifyClaims($claims, $language);

            // Statistiques globales
            $verified = count(array_filter($results, fn($r) => $r['verification_status'] === 'verified'));
            $disputed = count(array_filter($results, fn($r) => $r['verification_status'] === 'disputed'));
            $unknown = count(array_filter($results, fn($r) => $r['verification_status'] === 'unknown'));

            return response()->json([
                'success' => true,
                'data' => [
                    'total_claims' => count($claims),
                    'verified' => $verified,
                    'disputed' => $disputed,
                    'unknown' => $unknown,
                    'results' => $results,
                ],
                'warning' => 'Le fact-checking assisté par IA peut contenir des erreurs. Une vérification humaine est recommandée.',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Verification failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}