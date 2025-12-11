<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\InternalLink;
use App\Models\IndexingQueue;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * SeoController - Dashboard and SEO tools management
 */
class SeoController extends Controller
{
    /**
     * Get SEO dashboard data
     *
     * GET /api/admin/seo/dashboard
     */
    public function dashboard(): JsonResponse
    {
        // Indexing stats
        $indexingStats = [
            'total_indexed' => Article::whereNotNull('indexed_at')->count(),
            'pending_indexing' => IndexingQueue::where('status', 'pending')->count(),
            'failed_indexing' => IndexingQueue::where('status', 'failed')->count(),
            'success_rate' => $this->calculateIndexingSuccessRate(),
        ];

        // Internal linking stats
        $linkingStats = [
            'total_internal_links' => DB::table('internal_links')->count(),
            'avg_links_per_article' => round(
                DB::table('internal_links')->count() / max(Article::count(), 1),
                1
            ),
            'orphan_articles' => Article::whereDoesntHave('internalLinksFrom')
                ->whereDoesntHave('internalLinksTo')
                ->where('status', 'published')
                ->count(),
        ];

        // Content quality overview
        $qualityStats = [
            'avg_word_count' => round(Article::avg(DB::raw('CHAR_LENGTH(content) / 5')) ?? 0),
            'articles_with_meta' => Article::whereNotNull('meta_title')
                ->whereNotNull('meta_description')
                ->count(),
            'articles_missing_meta' => Article::where(function ($q) {
                $q->whereNull('meta_title')->orWhereNull('meta_description');
            })->count(),
        ];

        // Technical SEO
        $technicalStats = [
            'total_redirects' => DB::table('redirects')->count(),
            'active_redirects' => DB::table('redirects')->where('is_active', true)->count(),
            'broken_links' => 0, // Would need crawl data
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'indexing' => $indexingStats,
                'linking' => $linkingStats,
                'quality' => $qualityStats,
                'technical' => $technicalStats,
                'last_updated' => now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Get schema templates
     *
     * GET /api/admin/seo/schema/templates
     */
    public function schemaTemplates(): JsonResponse
    {
        $templates = [
            [
                'id' => 'article',
                'name' => 'Article',
                'description' => 'Schema.org Article markup',
                'fields' => ['headline', 'description', 'author', 'datePublished', 'dateModified', 'image'],
            ],
            [
                'id' => 'faq',
                'name' => 'FAQ Page',
                'description' => 'Schema.org FAQPage markup for FAQ sections',
                'fields' => ['questions', 'answers'],
            ],
            [
                'id' => 'howto',
                'name' => 'How To',
                'description' => 'Schema.org HowTo markup for tutorials',
                'fields' => ['name', 'description', 'steps', 'totalTime'],
            ],
            [
                'id' => 'breadcrumb',
                'name' => 'Breadcrumb',
                'description' => 'Schema.org BreadcrumbList markup',
                'fields' => ['items'],
            ],
        ];

        return response()->json($templates);
    }

    /**
     * Get schema for specific article
     *
     * GET /api/admin/seo/schema/article/{articleId}
     */
    public function articleSchema(int $articleId): JsonResponse
    {
        $article = Article::findOrFail($articleId);

        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'Article',
            'headline' => $article->title,
            'description' => $article->meta_description ?? $article->excerpt,
            'datePublished' => $article->published_at?->toIso8601String(),
            'dateModified' => $article->updated_at->toIso8601String(),
            'author' => [
                '@type' => 'Organization',
                'name' => $article->platform?->name ?? 'Content Engine',
            ],
        ];

        return response()->json($schema);
    }

    /**
     * Generate schema for article
     *
     * POST /api/admin/seo/schema/generate
     */
    public function generateSchema(Request $request): JsonResponse
    {
        $request->validate([
            'article_id' => 'required|exists:articles,id',
            'type' => 'required|in:article,faq,howto,breadcrumb',
        ]);

        $article = Article::findOrFail($request->article_id);
        $type = $request->type;

        $schema = match ($type) {
            'article' => $this->generateArticleSchema($article),
            'faq' => $this->generateFaqSchema($article),
            'howto' => $this->generateHowToSchema($article),
            'breadcrumb' => $this->generateBreadcrumbSchema($article),
            default => $this->generateArticleSchema($article),
        };

        return response()->json([
            'success' => true,
            'data' => $schema,
        ]);
    }

    /**
     * Validate schema markup
     *
     * POST /api/admin/seo/schema/validate
     */
    public function validateSchema(Request $request): JsonResponse
    {
        $schemaData = $request->all();
        $errors = [];
        $warnings = [];

        // Basic validation
        if (!isset($schemaData['@context'])) {
            $errors[] = 'Missing @context property';
        }
        if (!isset($schemaData['@type'])) {
            $errors[] = 'Missing @type property';
        }

        // Type-specific validation
        if (isset($schemaData['@type'])) {
            switch ($schemaData['@type']) {
                case 'Article':
                    if (!isset($schemaData['headline'])) {
                        $errors[] = 'Article schema requires headline';
                    }
                    if (!isset($schemaData['datePublished'])) {
                        $warnings[] = 'Article schema should have datePublished';
                    }
                    break;
                case 'FAQPage':
                    if (!isset($schemaData['mainEntity']) || !is_array($schemaData['mainEntity'])) {
                        $errors[] = 'FAQPage schema requires mainEntity array';
                    }
                    break;
            }
        }

        return response()->json([
            'isValid' => empty($errors),
            'errors' => $errors,
            'warnings' => $warnings,
        ]);
    }

    /**
     * Get maillage (internal linking) stats
     *
     * GET /api/admin/seo/maillage/stats
     */
    public function maillageStats(): JsonResponse
    {
        $totalLinks = DB::table('internal_links')->count();
        $totalArticles = Article::where('status', 'published')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_links' => $totalLinks,
                'avg_outbound' => $totalArticles > 0 ? round($totalLinks / $totalArticles, 1) : 0,
                'orphan_pages' => Article::whereDoesntHave('internalLinksFrom')
                    ->whereDoesntHave('internalLinksTo')
                    ->where('status', 'published')
                    ->count(),
                'well_linked' => Article::has('internalLinksFrom', '>=', 3)
                    ->where('status', 'published')
                    ->count(),
                'anchor_diversity' => $this->calculateAnchorDiversity(),
            ],
        ]);
    }

    /**
     * Get link opportunities
     *
     * GET /api/admin/seo/maillage/opportunities
     */
    public function linkOpportunities(): JsonResponse
    {
        // Find articles with few inbound links
        $opportunities = Article::withCount('internalLinksTo')
            ->where('status', 'published')
            ->having('internal_links_to_count', '<', 2)
            ->orderBy('internal_links_to_count')
            ->limit(20)
            ->get()
            ->map(function ($article) {
                return [
                    'article_id' => $article->id,
                    'title' => $article->title,
                    'slug' => $article->slug,
                    'inbound_links' => $article->internal_links_to_count,
                    'priority' => $article->internal_links_to_count === 0 ? 'high' : 'medium',
                ];
            });

        return response()->json($opportunities);
    }

    /**
     * Get internal links list
     *
     * GET /api/admin/seo/maillage/links
     */
    public function maillageLinks(Request $request): JsonResponse
    {
        $query = DB::table('internal_links')
            ->join('articles as from_article', 'internal_links.from_article_id', '=', 'from_article.id')
            ->join('articles as to_article', 'internal_links.to_article_id', '=', 'to_article.id')
            ->select(
                'internal_links.*',
                'from_article.title as from_title',
                'from_article.slug as from_slug',
                'to_article.title as to_title',
                'to_article.slug as to_slug'
            );

        if ($request->has('from_article_id')) {
            $query->where('internal_links.from_article_id', $request->from_article_id);
        }

        if ($request->has('to_article_id')) {
            $query->where('internal_links.to_article_id', $request->to_article_id);
        }

        $perPage = min($request->get('per_page', 50), 100);
        $links = $query->paginate($perPage);

        return response()->json([
            'data' => $links->items(),
            'total' => $links->total(),
        ]);
    }

    /**
     * Get technical SEO data
     *
     * GET /api/admin/seo/technical
     */
    public function technicalData(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'robots_txt' => [
                    'exists' => file_exists(public_path('robots.txt')),
                    'content' => file_exists(public_path('robots.txt'))
                        ? file_get_contents(public_path('robots.txt'))
                        : null,
                ],
                'sitemap' => [
                    'exists' => file_exists(public_path('sitemap.xml')),
                    'last_updated' => file_exists(public_path('sitemap.xml'))
                        ? date('Y-m-d H:i:s', filemtime(public_path('sitemap.xml')))
                        : null,
                ],
                'canonical_issues' => 0,
                'duplicate_content' => 0,
            ],
        ]);
    }

    /**
     * Get technical issues
     *
     * GET /api/admin/seo/technical/issues
     */
    public function technicalIssues(Request $request): JsonResponse
    {
        $issues = [];

        // Check for articles without meta
        $missingMeta = Article::where('status', 'published')
            ->where(function ($q) {
                $q->whereNull('meta_title')->orWhereNull('meta_description');
            })
            ->limit(20)
            ->get();

        foreach ($missingMeta as $article) {
            $issues[] = [
                'id' => 'meta_' . $article->id,
                'type' => 'missing_meta',
                'severity' => 'warning',
                'message' => 'Article missing meta tags',
                'url' => $article->slug,
                'article_id' => $article->id,
            ];
        }

        return response()->json([
            'data' => $issues,
            'total' => count($issues),
        ]);
    }

    // =========================================================================
    // REDIRECTS
    // =========================================================================

    /**
     * List redirects
     *
     * GET /api/admin/seo/redirects
     */
    public function redirects(Request $request): JsonResponse
    {
        $query = DB::table('redirects');

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $perPage = min($request->get('per_page', 50), 100);
        $redirects = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'data' => $redirects->items(),
            'total' => $redirects->total(),
        ]);
    }

    /**
     * Redirect stats
     *
     * GET /api/admin/seo/redirects/stats
     */
    public function redirectStats(): JsonResponse
    {
        return response()->json([
            'total' => DB::table('redirects')->count(),
            'active' => DB::table('redirects')->where('is_active', true)->count(),
            'by_type' => [
                '301' => DB::table('redirects')->where('type', 301)->count(),
                '302' => DB::table('redirects')->where('type', 302)->count(),
                '307' => DB::table('redirects')->where('type', 307)->count(),
            ],
            'hits_today' => 0, // Would need tracking
        ]);
    }

    /**
     * Create redirect
     *
     * POST /api/admin/seo/redirects
     */
    public function createRedirect(Request $request): JsonResponse
    {
        $request->validate([
            'from' => 'required|string|max:500',
            'to' => 'required|string|max:500',
            'type' => 'required|in:301,302,307',
        ]);

        $id = DB::table('redirects')->insertGetId([
            'from_url' => $request->from,
            'to_url' => $request->to,
            'type' => $request->type,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => DB::table('redirects')->find($id),
        ], 201);
    }

    /**
     * Update redirect
     *
     * PUT /api/admin/seo/redirects/{id}
     */
    public function updateRedirect(Request $request, int $id): JsonResponse
    {
        $redirect = DB::table('redirects')->find($id);

        if (!$redirect) {
            return response()->json(['error' => 'Redirect not found'], 404);
        }

        DB::table('redirects')->where('id', $id)->update([
            'from_url' => $request->from ?? $redirect->from_url,
            'to_url' => $request->to ?? $redirect->to_url,
            'type' => $request->type ?? $redirect->type,
            'is_active' => $request->has('is_active') ? $request->boolean('is_active') : $redirect->is_active,
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => DB::table('redirects')->find($id),
        ]);
    }

    /**
     * Delete redirect
     *
     * DELETE /api/admin/seo/redirects/{id}
     */
    public function deleteRedirect(int $id): JsonResponse
    {
        DB::table('redirects')->where('id', $id)->delete();

        return response()->json(['success' => true]);
    }

    // =========================================================================
    // INDEXING (Wrapper around IndexingQueueController)
    // =========================================================================

    /**
     * Get indexing stats
     *
     * GET /api/admin/seo/indexing/stats
     */
    public function indexingStats(): JsonResponse
    {
        $stats = [
            'total' => IndexingQueue::count(),
            'pending' => IndexingQueue::where('status', 'pending')->count(),
            'processing' => IndexingQueue::where('status', 'processing')->count(),
            'completed' => IndexingQueue::where('status', 'completed')->count(),
            'failed' => IndexingQueue::where('status', 'failed')->count(),
        ];

        // Last 24h
        $last24h = IndexingQueue::where('processed_at', '>=', now()->subDay())
            ->where('status', 'completed')
            ->count();

        // Success rate
        $totalProcessed = $stats['completed'] + $stats['failed'];
        $successRate = $totalProcessed > 0
            ? round(($stats['completed'] / $totalProcessed) * 100, 1)
            : 100;

        // Quotas
        $googleQuota = [
            'used' => IndexingQueue::where('type', 'google')
                ->where('created_at', '>=', now()->startOfDay())
                ->count(),
            'limit' => 200,
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'queue' => $stats,
                'last_24h' => $last24h,
                'success_rate' => $successRate,
                'google_quota' => $googleQuota,
            ],
        ]);
    }

    /**
     * Get indexing queue
     *
     * GET /api/admin/seo/indexing/queue
     */
    public function indexingQueue(Request $request): JsonResponse
    {
        $query = IndexingQueue::with(['article:id,title,slug,status']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $perPage = min($request->get('per_page', 20), 100);
        $items = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'data' => $items->items(),
            'total' => $items->total(),
            'page' => $items->currentPage(),
            'per_page' => $items->perPage(),
        ]);
    }

    /**
     * Get not indexed articles
     *
     * GET /api/admin/seo/indexing/not-indexed
     */
    public function notIndexedArticles(Request $request): JsonResponse
    {
        $query = Article::whereNull('indexed_at')
            ->where('status', 'published')
            ->select('id', 'title', 'slug', 'published_at', 'created_at');

        $perPage = min($request->get('per_page', 20), 100);
        $articles = $query->orderBy('published_at', 'desc')->paginate($perPage);

        return response()->json([
            'data' => $articles->items(),
            'total' => $articles->total(),
            'page' => $articles->currentPage(),
            'per_page' => $articles->perPage(),
        ]);
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    protected function calculateIndexingSuccessRate(): float
    {
        $completed = IndexingQueue::where('status', 'completed')->count();
        $failed = IndexingQueue::where('status', 'failed')->count();
        $total = $completed + $failed;

        return $total > 0 ? round(($completed / $total) * 100, 1) : 100;
    }

    protected function calculateAnchorDiversity(): float
    {
        $totalAnchors = DB::table('internal_links')->count();
        $uniqueAnchors = DB::table('internal_links')->distinct('anchor_text')->count('anchor_text');

        return $totalAnchors > 0 ? round(($uniqueAnchors / $totalAnchors) * 100, 1) : 100;
    }

    protected function generateArticleSchema(Article $article): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'Article',
            'headline' => $article->title,
            'description' => $article->meta_description ?? $article->excerpt,
            'datePublished' => $article->published_at?->toIso8601String(),
            'dateModified' => $article->updated_at->toIso8601String(),
            'author' => [
                '@type' => 'Organization',
                'name' => $article->platform?->name ?? 'Content Engine',
            ],
            'publisher' => [
                '@type' => 'Organization',
                'name' => $article->platform?->name ?? 'Content Engine',
            ],
        ];
    }

    protected function generateFaqSchema(Article $article): array
    {
        // Extract H3 questions and their content from article
        preg_match_all('/<h3[^>]*>(.*?)<\/h3>(.*?)(?=<h[23]|$)/s', $article->content, $matches, PREG_SET_ORDER);

        $questions = [];
        foreach ($matches as $match) {
            $questions[] = [
                '@type' => 'Question',
                'name' => strip_tags($match[1]),
                'acceptedAnswer' => [
                    '@type' => 'Answer',
                    'text' => strip_tags($match[2]),
                ],
            ];
        }

        return [
            '@context' => 'https://schema.org',
            '@type' => 'FAQPage',
            'mainEntity' => $questions,
        ];
    }

    protected function generateHowToSchema(Article $article): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'HowTo',
            'name' => $article->title,
            'description' => $article->meta_description ?? $article->excerpt,
            'step' => [],
        ];
    }

    protected function generateBreadcrumbSchema(Article $article): array
    {
        $items = [
            [
                '@type' => 'ListItem',
                'position' => 1,
                'name' => 'Home',
                'item' => config('app.url'),
            ],
        ];

        if ($article->theme) {
            $items[] = [
                '@type' => 'ListItem',
                'position' => 2,
                'name' => $article->theme->name,
            ];
        }

        $items[] = [
            '@type' => 'ListItem',
            'position' => count($items) + 1,
            'name' => $article->title,
        ];

        return [
            '@context' => 'https://schema.org',
            '@type' => 'BreadcrumbList',
            'itemListElement' => $items,
        ];
    }
}

    /**
     * Get articles without schema markup
     */
    public function articlesWithoutSchema(): JsonResponse
    {
        $articles = Article::whereNull('schema_markup')
            ->where('status', 'published')
            ->select('id', 'title', 'platform_id')
            ->limit(50)
            ->get()
            ->map(function ($article) {
                return [
                    'id' => $article->id,
                    'title' => $article->title,
                    'platform' => $article->platform->name ?? 'Unknown',
                ];
            });

        return response()->json($articles);
    }

    /**
     * Get schema statistics
     */
    public function schemaStats(): JsonResponse
    {
        $stats = [
            'withSchema' => Article::whereNotNull('schema_markup')
                ->where('status', 'published')
                ->count(),
            'withoutSchema' => Article::whereNull('schema_markup')
                ->where('status', 'published')
                ->count(),
            'errors' => 0,
        ];

        return response()->json($stats);
    }
}
