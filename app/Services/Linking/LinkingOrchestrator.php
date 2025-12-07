<?php

namespace App\Services\Linking;

use App\Models\Article;
use App\Models\LinkingRule;
use App\Models\InternalLink;
use App\Models\ExternalLink;
use App\Events\ArticleLinksGenerated;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LinkingOrchestrator
{
    protected InternalLinkingService $internalService;
    protected ExternalLinkingService $externalService;
    protected PillarLinkingService $pillarService;
    protected AffiliateLinkService $affiliateService;
    protected ContextualLinkInjector $injector;
    protected UniformDistributionService $distributionService;
    protected MultilingualLinkAdapter $multilingualAdapter;

    public function __construct(
        InternalLinkingService $internalService,
        ExternalLinkingService $externalService,
        PillarLinkingService $pillarService,
        AffiliateLinkService $affiliateService,
        ContextualLinkInjector $injector,
        UniformDistributionService $distributionService,
        MultilingualLinkAdapter $multilingualAdapter
    ) {
        $this->internalService = $internalService;
        $this->externalService = $externalService;
        $this->pillarService = $pillarService;
        $this->affiliateService = $affiliateService;
        $this->injector = $injector;
        $this->distributionService = $distributionService;
        $this->multilingualAdapter = $multilingualAdapter;
    }

    /**
     * Pipeline complet de génération de liens pour un article
     */
    public function processArticle(Article $article, array $options = []): array
    {
        $startTime = microtime(true);
        
        $options = array_merge([
            'internal' => true,
            'external' => true,
            'affiliate' => true,
            'pillar' => true,
            'inject_content' => true,
            'force' => false,
        ], $options);

        Log::info("LinkingOrchestrator: Processing article {$article->id}", [
            'title' => $article->title,
            'type' => $article->type,
            'options' => $options
        ]);

        $results = [
            'article_id' => $article->id,
            'internal_links' => ['created' => 0],
            'external_links' => ['created' => 0],
            'affiliate_links' => ['injected' => 0],
            'pillar_links' => ['created' => 0],
            'content_updated' => false,
            'errors' => []
        ];

        DB::beginTransaction();
        try {
            // 1. Liens internes (TF-IDF + similarité)
            if ($options['internal']) {
                try {
                    $results['internal_links'] = $this->internalService->generateInternalLinks($article);
                } catch (\Exception $e) {
                    $results['errors'][] = "Internal linking failed: {$e->getMessage()}";
                    Log::warning("LinkingOrchestrator: Internal linking failed", ['error' => $e->getMessage()]);
                }
            }

            // 2. Liens pilier (hub & spoke)
            if ($options['pillar']) {
                try {
                    if ($article->type === 'pillar') {
                        $results['pillar_links'] = $this->pillarService->linkPillarToArticles($article);
                    } else {
                        $pillarLink = $this->pillarService->linkArticleToPillar($article);
                        $results['pillar_links']['created'] = $pillarLink ? 1 : 0;
                    }
                } catch (\Exception $e) {
                    $results['errors'][] = "Pillar linking failed: {$e->getMessage()}";
                }
            }

            // 3. Liens externes (sources autorité)
            if ($options['external']) {
                try {
                    $results['external_links'] = $this->externalService->generateExternalLinks($article);
                } catch (\Exception $e) {
                    $results['errors'][] = "External linking failed: {$e->getMessage()}";
                }
            }

            // 4. Liens affiliés
            if ($options['affiliate']) {
                try {
                    $results['affiliate_links'] = $this->affiliateService->injectAffiliateLinks($article);
                } catch (\Exception $e) {
                    $results['errors'][] = "Affiliate linking failed: {$e->getMessage()}";
                }
            }

            // 5. Injection dans le contenu
            if ($options['inject_content']) {
                try {
                    $updatedContent = $this->injectLinksInContent($article);
                    if ($updatedContent !== $article->content) {
                        $article->update(['content' => $updatedContent]);
                        $results['content_updated'] = true;
                    }
                } catch (\Exception $e) {
                    $results['errors'][] = "Content injection failed: {$e->getMessage()}";
                }
            }

            DB::commit();

            // Dispatcher l'événement
            event(new ArticleLinksGenerated($article, $results));

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("LinkingOrchestrator: Failed for article {$article->id}", [
                'error' => $e->getMessage()
            ]);
            throw $e;
        }

        $results['duration_ms'] = round((microtime(true) - $startTime) * 1000);

        Log::info("LinkingOrchestrator: Completed for article {$article->id}", [
            'internal' => $results['internal_links']['created'],
            'external' => $results['external_links']['created'],
            'affiliate' => $results['affiliate_links']['injected'],
            'duration_ms' => $results['duration_ms']
        ]);

        return $results;
    }

    /**
     * Traite un lot d'articles
     */
    public function processBatch(array $articleIds, array $options = []): array
    {
        $results = [
            'total' => count($articleIds),
            'success' => 0,
            'failed' => 0,
            'articles' => []
        ];

        foreach ($articleIds as $articleId) {
            $article = Article::find($articleId);
            if (!$article) {
                $results['failed']++;
                continue;
            }

            try {
                $articleResult = $this->processArticle($article, $options);
                $results['success']++;
                $results['articles'][$articleId] = $articleResult;
            } catch (\Exception $e) {
                $results['failed']++;
                $results['articles'][$articleId] = [
                    'error' => $e->getMessage()
                ];
            }
        }

        return $results;
    }

    /**
     * Injecte tous les liens dans le contenu HTML
     */
    public function injectLinksInContent(Article $article): string
    {
        $content = $article->content;
        $rules = LinkingRule::forPlatform($article->platform_id);

        // Adapter pour la langue
        $content = $this->multilingualAdapter->prepareContent($content, $article->language_code);

        // Collecter tous les liens à injecter
        $internalLinks = $article->internalLinksAsSource()
            ->where('is_automatic', true)
            ->with('targetArticle')
            ->get();

        $externalLinks = $article->externalLinks()
            ->where('is_automatic', true)
            ->get();

        // Utiliser le service de distribution uniforme
        $content = $this->distributionService->distributeLinks(
            $content,
            $internalLinks,
            $externalLinks,
            $rules
        );

        // Injecter les liens affiliés
        $content = $this->affiliateService->insertLinksInContent($content, $article);

        return $content;
    }

    /**
     * Génère les liens pour un article pilier et ses enfants
     */
    public function processPillarCluster(Article $pillar): array
    {
        if ($pillar->type !== 'pillar') {
            throw new \InvalidArgumentException('Article must be a pillar');
        }

        $results = [
            'pillar' => null,
            'children' => [],
            'total_links' => 0
        ];

        // Traiter le pilier
        $results['pillar'] = $this->processArticle($pillar);
        $results['total_links'] += $results['pillar']['internal_links']['created'] ?? 0;

        // Traiter les articles enfants
        $children = $this->pillarService->findChildArticles($pillar);
        
        foreach ($children as $child) {
            $childResult = $this->processArticle($child, [
                'pillar' => true,
                'internal' => true,
                'external' => true,
                'affiliate' => false, // Moins d'affiliés sur les enfants
            ]);
            
            $results['children'][$child->id] = $childResult;
            $results['total_links'] += $childResult['internal_links']['created'] ?? 0;
        }

        return $results;
    }

    /**
     * Régénère tous les liens d'une plateforme
     */
    public function regeneratePlatformLinks(int $platformId, array $options = []): array
    {
        $articles = Article::where('platform_id', $platformId)
            ->where('status', 'published')
            ->get();

        return $this->processBatch($articles->pluck('id')->toArray(), $options);
    }

    /**
     * Vérifie la santé du maillage d'un article
     */
    public function checkArticleLinkHealth(Article $article): array
    {
        $internal = $article->internalLinksAsSource()->count();
        $inbound = $article->internalLinksAsTarget()->count();
        $external = $article->externalLinks()->count();
        $brokenExternal = $article->externalLinks()->where('is_broken', true)->count();
        
        $hasPillarLink = $article->internalLinksAsSource()
            ->where('link_context', 'article_to_pillar')
            ->exists();

        $issues = [];
        $score = 100;

        // Vérifications
        if ($internal < 3) {
            $issues[] = 'Too few internal links';
            $score -= 20;
        }

        if ($inbound === 0 && $article->type !== 'pillar') {
            $issues[] = 'No inbound links (orphan)';
            $score -= 30;
        }

        if ($external < 2) {
            $issues[] = 'Too few external links';
            $score -= 10;
        }

        if ($brokenExternal > 0) {
            $issues[] = "Has {$brokenExternal} broken external links";
            $score -= $brokenExternal * 5;
        }

        if (!$hasPillarLink && $article->type !== 'pillar') {
            $issues[] = 'No link to pillar article';
            $score -= 15;
        }

        return [
            'article_id' => $article->id,
            'score' => max(0, $score),
            'grade' => $this->scoreToGrade($score),
            'metrics' => [
                'internal_outbound' => $internal,
                'internal_inbound' => $inbound,
                'external' => $external,
                'broken' => $brokenExternal,
                'has_pillar_link' => $hasPillarLink
            ],
            'issues' => $issues
        ];
    }

    /**
     * Convertit un score en grade
     */
    protected function scoreToGrade(int $score): string
    {
        if ($score >= 90) return 'A';
        if ($score >= 80) return 'B';
        if ($score >= 70) return 'C';
        if ($score >= 60) return 'D';
        return 'F';
    }

    /**
     * Récupère les statistiques globales du maillage
     */
    public function getStats(int $platformId): array
    {
        $articles = Article::where('platform_id', $platformId)
            ->where('status', 'published');

        $totalArticles = $articles->count();
        $articleIds = $articles->pluck('id');

        return [
            'platform_id' => $platformId,
            'total_articles' => $totalArticles,
            'internal_links' => InternalLink::whereIn('source_article_id', $articleIds)->count(),
            'external_links' => ExternalLink::whereIn('article_id', $articleIds)->count(),
            'broken_links' => ExternalLink::whereIn('article_id', $articleIds)->where('is_broken', true)->count(),
            'orphan_articles' => $this->countOrphanArticles($platformId),
            'average_internal_per_article' => $totalArticles > 0 
                ? round(InternalLink::whereIn('source_article_id', $articleIds)->count() / $totalArticles, 1)
                : 0,
        ];
    }

    /**
     * Compte les articles orphelins
     */
    protected function countOrphanArticles(int $platformId): int
    {
        return Article::where('platform_id', $platformId)
            ->where('status', 'published')
            ->whereNotIn('id', function ($query) {
                $query->select('target_article_id')
                    ->from('internal_links')
                    ->distinct();
            })
            ->count();
    }
}
