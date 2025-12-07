<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Platform;
use App\Models\InternalLink;
use App\Models\ExternalLink;
use App\Services\Linking\LinkingOrchestrator;
use App\Services\Linking\LinkBalancerService;
use App\Services\Linking\PageRankService;
use App\Jobs\GenerateInternalLinks;
use App\Jobs\GenerateInternalLinksBatch;
use App\Jobs\DiscoverExternalLinks;
use App\Jobs\VerifyExternalLinks;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class LinkingController extends Controller
{
    protected LinkingOrchestrator $orchestrator;
    protected LinkBalancerService $balancer;
    protected PageRankService $pageRank;

    public function __construct(
        LinkingOrchestrator $orchestrator,
        LinkBalancerService $balancer,
        PageRankService $pageRank
    ) {
        $this->orchestrator = $orchestrator;
        $this->balancer = $balancer;
        $this->pageRank = $pageRank;
    }

    /**
     * Génère les liens pour un article
     *
     * POST /api/linking/articles/{article}/generate
     */
    public function generateForArticle(Request $request, Article $article): JsonResponse
    {
        $validated = $request->validate([
            'internal' => 'boolean',
            'external' => 'boolean',
            'affiliate' => 'boolean',
            'pillar' => 'boolean',
            'inject_content' => 'boolean',
            'force' => 'boolean',
            'async' => 'boolean',
        ]);

        // Mode asynchrone
        if ($validated['async'] ?? false) {
            GenerateInternalLinks::dispatch($article->id, $validated['force'] ?? false);
            DiscoverExternalLinks::dispatch($article->id, $validated['force'] ?? false);

            return response()->json([
                'success' => true,
                'message' => __('linking.jobs_dispatched'),
                'article_id' => $article->id
            ], 202);
        }

        // Mode synchrone
        $result = $this->orchestrator->processArticle($article, $validated);

        return response()->json([
            'success' => true,
            'data' => $result
        ]);
    }

    /**
     * Génère les liens pour une plateforme entière
     *
     * POST /api/linking/platforms/{platform}/generate
     */
    public function generateForPlatform(Request $request, Platform $platform): JsonResponse
    {
        $validated = $request->validate([
            'language' => 'nullable|string|size:2',
            'type' => 'nullable|in:pillar,standard,landing,comparative',
            'limit' => 'nullable|integer|min:1|max:1000',
            'async' => 'boolean',
        ]);

        $query = Article::where('platform_id', $platform->id)
            ->where('status', 'published');

        if (isset($validated['language'])) {
            $query->where('language_code', $validated['language']);
        }

        if (isset($validated['type'])) {
            $query->where('type', $validated['type']);
        }

        if (isset($validated['limit'])) {
            $query->limit($validated['limit']);
        }

        $articleIds = $query->pluck('id')->toArray();

        if (empty($articleIds)) {
            return response()->json([
                'success' => false,
                'message' => __('linking.no_articles_found')
            ], 404);
        }

        // Mode asynchrone (recommandé pour les gros volumes)
        if ($validated['async'] ?? true) {
            GenerateInternalLinksBatch::dispatch(
                $platform->id,
                $validated['language'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => __('linking.batch_job_dispatched'),
                'articles_count' => count($articleIds)
            ], 202);
        }

        // Mode synchrone
        $result = $this->orchestrator->processBatch($articleIds);

        return response()->json([
            'success' => true,
            'data' => $result
        ]);
    }

    /**
     * Analyse l'équilibre du maillage
     *
     * GET /api/linking/platforms/{platform}/analyze
     */
    public function analyzePlatform(Request $request, Platform $platform): JsonResponse
    {
        $validated = $request->validate([
            'language' => 'nullable|string|size:2',
        ]);

        $report = $this->balancer->generatePlatformReport(
            $platform->id,
            $validated['language'] ?? null
        );

        return response()->json([
            'success' => true,
            'data' => $report
        ]);
    }

    /**
     * Vérifie la santé des liens d'un article
     *
     * GET /api/linking/articles/{article}/health
     */
    public function articleHealth(Article $article): JsonResponse
    {
        $health = $this->orchestrator->checkArticleLinkHealth($article);

        return response()->json([
            'success' => true,
            'data' => $health
        ]);
    }

    /**
     * Récupère les statistiques de maillage
     *
     * GET /api/linking/platforms/{platform}/stats
     */
    public function stats(Platform $platform): JsonResponse
    {
        $stats = $this->orchestrator->getStats($platform->id);
        $pageRankStats = $this->pageRank->getPlatformStats($platform->id);

        return response()->json([
            'success' => true,
            'data' => [
                'linking' => $stats,
                'pagerank' => $pageRankStats
            ]
        ]);
    }

    /**
     * Identifie les articles orphelins
     *
     * GET /api/linking/platforms/{platform}/orphans
     */
    public function orphans(Request $request, Platform $platform): JsonResponse
    {
        $validated = $request->validate([
            'language' => 'nullable|string|size:2',
            'limit' => 'nullable|integer|min:1|max:100',
        ]);

        $orphans = $this->balancer->identifyOrphanArticles(
            $platform->id,
            $validated['language'] ?? null,
            $validated['limit'] ?? 50
        );

        return response()->json([
            'success' => true,
            'data' => $orphans
        ]);
    }

    /**
     * Identifie les culs-de-sac
     *
     * GET /api/linking/platforms/{platform}/dead-ends
     */
    public function deadEnds(Request $request, Platform $platform): JsonResponse
    {
        $validated = $request->validate([
            'language' => 'nullable|string|size:2',
            'limit' => 'nullable|integer|min:1|max:100',
        ]);

        $deadEnds = $this->balancer->identifyDeadEnds(
            $platform->id,
            $validated['language'] ?? null,
            $validated['limit'] ?? 50
        );

        return response()->json([
            'success' => true,
            'data' => $deadEnds
        ]);
    }

    /**
     * Récupère le PageRank des articles
     *
     * GET /api/linking/platforms/{platform}/pagerank
     */
    public function pageRank(Request $request, Platform $platform): JsonResponse
    {
        $validated = $request->validate([
            'top' => 'nullable|integer|min:1|max:100',
            'bottom' => 'nullable|integer|min:1|max:100',
        ]);

        $data = [];

        if ($validated['top'] ?? false) {
            $data['high_value'] = $this->pageRank->identifyHighValuePages(
                $platform->id,
                $validated['top']
            );
        }

        if ($validated['bottom'] ?? false) {
            $data['low_value'] = $this->pageRank->identifyLowValuePages(
                $platform->id,
                $validated['bottom']
            );
        }

        if (empty($data)) {
            $data = $this->pageRank->getPlatformStats($platform->id);
        }

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * Suggestions d'amélioration
     *
     * GET /api/linking/articles/{article}/suggestions
     */
    public function suggestions(Article $article): JsonResponse
    {
        $suggestions = $this->balancer->suggestLinkImprovements($article);

        return response()->json([
            'success' => true,
            'data' => $suggestions
        ]);
    }

    /**
     * Auto-répare l'équilibre du maillage
     *
     * POST /api/linking/platforms/{platform}/auto-repair
     */
    public function autoRepair(Request $request, Platform $platform): JsonResponse
    {
        $validated = $request->validate([
            'language' => 'nullable|string|size:2',
            'dry_run' => 'boolean',
        ]);

        $result = $this->balancer->autoRepairLinkBalance(
            $platform->id,
            $validated['language'] ?? null,
            $validated['dry_run'] ?? false
        );

        return response()->json([
            'success' => true,
            'data' => $result
        ]);
    }

    // =====================================================================
    // MÉTHODES ADDITIONNELLES POUR ROUTES linking.php
    // =====================================================================

    /**
     * Analyse un article pour le maillage
     *
     * GET /api/admin/linking/articles/{article}/analyze
     */
    public function analyzeArticle(Article $article): JsonResponse
    {
        $analysis = $this->orchestrator->analyzeArticle($article);
        $health = $this->orchestrator->checkArticleLinkHealth($article);
        $suggestions = $this->balancer->suggestLinkImprovements($article);

        return response()->json([
            'success' => true,
            'data' => [
                'article_id' => $article->id,
                'analysis' => $analysis,
                'health' => $health,
                'suggestions' => $suggestions,
                'internal_links_count' => $article->internalLinksFrom()->count(),
                'external_links_count' => $article->externalLinks()->count(),
            ]
        ]);
    }

    /**
     * Statistiques de maillage pour une plateforme
     *
     * GET /api/admin/linking/platforms/{platform}/stats
     */
    public function platformStats(Platform $platform): JsonResponse
    {
        $stats = $this->orchestrator->getStats($platform->id);
        $pageRankStats = $this->pageRank->getPlatformStats($platform->id);

        return response()->json([
            'success' => true,
            'data' => [
                'linking' => $stats,
                'pagerank' => $pageRankStats,
                'platform_id' => $platform->id,
            ]
        ]);
    }

    /**
     * Rapport complet de maillage pour une plateforme
     *
     * GET /api/admin/linking/platforms/{platform}/report
     */
    public function platformReport(Request $request, Platform $platform): JsonResponse
    {
        $validated = $request->validate([
            'language' => 'nullable|string|size:2',
        ]);

        $report = $this->balancer->generatePlatformReport(
            $platform->id,
            $validated['language'] ?? null
        );

        return response()->json([
            'success' => true,
            'data' => $report
        ]);
    }

    /**
     * Récupère les liens internes d'un article
     *
     * GET /api/admin/linking/articles/{article}/internal-links
     */
    public function getInternalLinks(Article $article): JsonResponse
    {
        $links = InternalLink::with(['toArticle:id,title,slug'])
            ->where('from_article_id', $article->id)
            ->orderBy('position')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $links
        ]);
    }

    /**
     * Récupère les liens externes d'un article
     *
     * GET /api/admin/linking/articles/{article}/external-links
     */
    public function getExternalLinks(Article $article): JsonResponse
    {
        $links = ExternalLink::where('article_id', $article->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $links
        ]);
    }

    /**
     * Récupère les stats PageRank d'une plateforme
     *
     * GET /api/admin/linking/platforms/{platform}/pagerank
     */
    public function getPageRankStats(Platform $platform): JsonResponse
    {
        $stats = $this->pageRank->getPlatformStats($platform->id);
        $topPages = $this->pageRank->identifyHighValuePages($platform->id, 20);
        $lowPages = $this->pageRank->identifyLowValuePages($platform->id, 20);

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => $stats,
                'high_value' => $topPages,
                'low_value' => $lowPages,
            ]
        ]);
    }

    /**
     * Génère les liens en batch pour une plateforme
     *
     * POST /api/admin/linking/platforms/{platform}/generate-batch
     */
    public function generateBatch(Request $request, Platform $platform): JsonResponse
    {
        $validated = $request->validate([
            'language' => 'nullable|string|size:2',
            'type' => 'nullable|in:pillar,standard,landing,comparative',
            'limit' => 'nullable|integer|min:1|max:1000',
            'force' => 'boolean',
        ]);

        GenerateInternalLinksBatch::dispatch(
            $platform->id,
            $validated['language'] ?? null,
            $validated['force'] ?? false
        );

        $count = Article::where('platform_id', $platform->id)
            ->where('status', 'published')
            ->when(isset($validated['language']), fn($q) => $q->where('language_code', $validated['language']))
            ->when(isset($validated['type']), fn($q) => $q->where('type', $validated['type']))
            ->when(isset($validated['limit']), fn($q) => $q->limit($validated['limit']))
            ->count();

        return response()->json([
            'success' => true,
            'message' => __('linking.batch_job_dispatched'),
            'data' => [
                'articles_count' => $count,
                'platform_id' => $platform->id,
            ]
        ], 202);
    }

    /**
     * Met à jour les liens pilier d'un article
     *
     * POST /api/admin/linking/articles/{article}/update-pillar-links
     */
    public function updatePillarLinks(Request $request, Article $article): JsonResponse
    {
        $validated = $request->validate([
            'pillar_article_id' => 'nullable|exists:articles,id',
            'force' => 'boolean',
        ]);

        $result = $this->orchestrator->updatePillarLinks(
            $article,
            $validated['pillar_article_id'] ?? null,
            $validated['force'] ?? false
        );

        return response()->json([
            'success' => true,
            'data' => $result
        ]);
    }

    /**
     * Ajoute un lien interne manuellement
     *
     * POST /api/admin/linking/articles/{article}/internal-links
     */
    public function addInternalLink(Request $request, Article $article): JsonResponse
    {
        $validated = $request->validate([
            'to_article_id' => 'required|exists:articles,id|different:article.id',
            'anchor_text' => 'required|string|max:255',
            'position' => 'nullable|integer',
            'context' => 'nullable|string|max:500',
        ]);

        $link = InternalLink::create([
            'from_article_id' => $article->id,
            'to_article_id' => $validated['to_article_id'],
            'anchor_text' => $validated['anchor_text'],
            'position' => $validated['position'] ?? 0,
            'context' => $validated['context'] ?? null,
            'is_manual' => true,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => __('linking.internal_link_added'),
            'data' => $link->load('toArticle:id,title,slug')
        ], 201);
    }

    /**
     * Supprime un lien interne
     *
     * DELETE /api/admin/linking/internal-links/{link}
     */
    public function removeInternalLink(InternalLink $link): JsonResponse
    {
        $link->delete();

        return response()->json([
            'success' => true,
            'message' => __('linking.internal_link_removed')
        ]);
    }

    /**
     * Vérifie les liens externes d'un article
     *
     * POST /api/admin/linking/articles/{article}/external-links/verify
     */
    public function verifyExternalLinks(Article $article): JsonResponse
    {
        VerifyExternalLinks::dispatch($article->id);

        return response()->json([
            'success' => true,
            'message' => __('linking.verification_job_dispatched'),
            'data' => [
                'article_id' => $article->id,
                'links_count' => $article->externalLinks()->count(),
            ]
        ], 202);
    }

    /**
     * Recalcule le PageRank d'une plateforme
     *
     * POST /api/admin/linking/platforms/{platform}/pagerank/recalculate
     */
    public function recalculatePageRank(Platform $platform): JsonResponse
    {
        $result = $this->pageRank->calculateForPlatform($platform->id);

        return response()->json([
            'success' => true,
            'message' => __('linking.pagerank_recalculated'),
            'data' => $result
        ]);
    }
}
