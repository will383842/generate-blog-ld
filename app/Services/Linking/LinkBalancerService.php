<?php

namespace App\Services\Linking;

use App\Models\Article;
use App\Models\InternalLink;
use App\Models\ExternalLink;
use App\Models\Platform;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LinkBalancerService
{
    protected InternalLinkingService $internalLinkingService;

    public function __construct(InternalLinkingService $internalLinkingService)
    {
        $this->internalLinkingService = $internalLinkingService;
    }

    /**
     * Analyse complète du maillage d'un article
     */
    public function analyzeArticleLinkBalance(Article $article): array
    {
        $inboundLinks = $this->calculateInboundLinks($article);
        $outboundLinks = $this->calculateOutboundLinks($article);
        $externalLinks = $this->calculateExternalLinks($article);

        $analysis = [
            'article_id' => $article->id,
            'title' => $article->title,
            'type' => $article->type,
            'inbound' => [
                'total' => $inboundLinks->count(),
                'from_pillars' => $inboundLinks->where('link_context', 'pillar_to_article')->count(),
                'from_articles' => $inboundLinks->where('link_context', '!=', 'pillar_to_article')->count(),
                'average_relevance' => round($inboundLinks->avg('relevance_score') ?? 0, 1)
            ],
            'outbound' => [
                'total' => $outboundLinks->count(),
                'to_pillars' => $outboundLinks->where('link_context', 'article_to_pillar')->count(),
                'to_articles' => $outboundLinks->where('link_context', '!=', 'article_to_pillar')->count(),
                'average_relevance' => round($outboundLinks->avg('relevance_score') ?? 0, 1)
            ],
            'external' => [
                'total' => $externalLinks->count(),
                'by_type' => $externalLinks->groupBy('source_type')->map->count()->toArray(),
                'broken' => $externalLinks->where('is_broken', true)->count()
            ],
            'health' => $this->calculateLinkHealth($article, $inboundLinks, $outboundLinks, $externalLinks),
            'recommendations' => []
        ];

        // Générer recommandations
        $analysis['recommendations'] = $this->generateRecommendations($analysis);

        return $analysis;
    }

    /**
     * Calcule les liens entrants d'un article
     */
    public function calculateInboundLinks(Article $article): Collection
    {
        return InternalLink::where('target_article_id', $article->id)
            ->with('sourceArticle:id,title,type')
            ->get();
    }

    /**
     * Calcule les liens sortants d'un article
     */
    public function calculateOutboundLinks(Article $article): Collection
    {
        return InternalLink::where('source_article_id', $article->id)
            ->with('targetArticle:id,title,type')
            ->get();
    }

    /**
     * Calcule les liens externes d'un article
     */
    public function calculateExternalLinks(Article $article): Collection
    {
        return ExternalLink::where('article_id', $article->id)->get();
    }

    /**
     * Identifie les articles orphelins (0 liens entrants)
     */
    public function identifyOrphanArticles(int $platformId, ?string $languageCode = null): Collection
    {
        $query = Article::where('platform_id', $platformId)
            ->where('status', 'published')
            ->whereNotIn('id', function ($subquery) {
                $subquery->select('target_article_id')
                    ->from('internal_links')
                    ->distinct();
            });

        if ($languageCode) {
            $query->where('language_code', $languageCode);
        }

        return $query->get()->map(function ($article) {
            return [
                'id' => $article->id,
                'title' => $article->title,
                'type' => $article->type,
                'language' => $article->language_code,
                'country' => $article->country_code,
                'published_at' => $article->published_at,
                'severity' => $article->type === 'pillar' ? 'critical' : 'high'
            ];
        });
    }

    /**
     * Identifie les articles dead-end (0 liens sortants)
     */
    public function identifyDeadEnds(int $platformId, ?string $languageCode = null): Collection
    {
        $query = Article::where('platform_id', $platformId)
            ->where('status', 'published')
            ->whereNotIn('id', function ($subquery) {
                $subquery->select('source_article_id')
                    ->from('internal_links')
                    ->distinct();
            });

        if ($languageCode) {
            $query->where('language_code', $languageCode);
        }

        return $query->get()->map(function ($article) {
            return [
                'id' => $article->id,
                'title' => $article->title,
                'type' => $article->type,
                'language' => $article->language_code,
                'country' => $article->country_code,
                'inbound_count' => InternalLink::where('target_article_id', $article->id)->count(),
                'severity' => 'medium'
            ];
        });
    }

    /**
     * Identifie les articles faiblement connectés
     */
    public function identifyWeaklyConnected(int $platformId, int $minLinks = 2): Collection
    {
        return Article::where('platform_id', $platformId)
            ->where('status', 'published')
            ->get()
            ->map(function ($article) {
                $inbound = InternalLink::where('target_article_id', $article->id)->count();
                $outbound = InternalLink::where('source_article_id', $article->id)->count();
                return [
                    'article' => $article,
                    'inbound' => $inbound,
                    'outbound' => $outbound,
                    'total' => $inbound + $outbound
                ];
            })
            ->filter(fn ($item) => $item['total'] < $minLinks)
            ->sortBy('total')
            ->values();
    }

    /**
     * Génère des suggestions d'amélioration du maillage
     */
    public function suggestLinkImprovements(int $platformId): array
    {
        $suggestions = [];

        // 1. Articles orphelins
        $orphans = $this->identifyOrphanArticles($platformId);
        if ($orphans->isNotEmpty()) {
            $suggestions['orphan_articles'] = [
                'severity' => 'high',
                'count' => $orphans->count(),
                'message' => "{$orphans->count()} articles have no inbound links",
                'articles' => $orphans->take(10)->toArray(),
                'action' => 'Run links:generate-internal to create inbound links'
            ];
        }

        // 2. Dead ends
        $deadEnds = $this->identifyDeadEnds($platformId);
        if ($deadEnds->isNotEmpty()) {
            $suggestions['dead_end_articles'] = [
                'severity' => 'medium',
                'count' => $deadEnds->count(),
                'message' => "{$deadEnds->count()} articles have no outbound links",
                'articles' => $deadEnds->take(10)->toArray(),
                'action' => 'Add internal links to guide users to related content'
            ];
        }

        // 3. Articles faiblement connectés
        $weaklyConnected = $this->identifyWeaklyConnected($platformId, 3);
        if ($weaklyConnected->isNotEmpty()) {
            $suggestions['weakly_connected'] = [
                'severity' => 'low',
                'count' => $weaklyConnected->count(),
                'message' => "{$weaklyConnected->count()} articles have fewer than 3 total links",
                'action' => 'Consider adding more contextual links'
            ];
        }

        // 4. Distribution déséquilibrée
        $distribution = $this->analyzeDistribution($platformId);
        if ($distribution['imbalance_ratio'] > 0.3) {
            $suggestions['link_distribution'] = [
                'severity' => 'medium',
                'message' => 'Link distribution is uneven across articles',
                'stats' => $distribution,
                'action' => 'Redistribute links from over-linked to under-linked articles'
            ];
        }

        // 5. Liens cassés
        $brokenCount = ExternalLink::whereHas('article', function ($q) use ($platformId) {
            $q->where('platform_id', $platformId);
        })->where('is_broken', true)->count();
        
        if ($brokenCount > 0) {
            $suggestions['broken_links'] = [
                'severity' => 'high',
                'count' => $brokenCount,
                'message' => "{$brokenCount} external links are broken",
                'action' => 'Run links:verify to identify and fix broken links'
            ];
        }

        // 6. Piliers sans enfants
        $emptyPillars = $this->findPillarsWithoutChildren($platformId);
        if ($emptyPillars->isNotEmpty()) {
            $suggestions['empty_pillars'] = [
                'severity' => 'high',
                'count' => $emptyPillars->count(),
                'message' => "{$emptyPillars->count()} pillar articles have no linked child articles",
                'pillars' => $emptyPillars->pluck('title', 'id')->toArray(),
                'action' => 'Create child articles or link existing articles to pillars'
            ];
        }

        return $suggestions;
    }

    /**
     * Analyse la distribution des liens sur la plateforme
     */
    public function analyzeDistribution(int $platformId): array
    {
        $articles = Article::where('platform_id', $platformId)
            ->where('status', 'published')
            ->get();

        $linkCounts = $articles->map(function ($article) {
            return [
                'id' => $article->id,
                'inbound' => InternalLink::where('target_article_id', $article->id)->count(),
                'outbound' => InternalLink::where('source_article_id', $article->id)->count()
            ];
        });

        $inboundValues = $linkCounts->pluck('inbound');
        $outboundValues = $linkCounts->pluck('outbound');

        return [
            'total_articles' => $articles->count(),
            'total_internal_links' => InternalLink::whereIn('source_article_id', $articles->pluck('id'))->count(),
            'inbound' => [
                'min' => $inboundValues->min(),
                'max' => $inboundValues->max(),
                'avg' => round($inboundValues->avg(), 2),
                'median' => $this->median($inboundValues->toArray()),
                'std_dev' => round($this->standardDeviation($inboundValues->toArray()), 2)
            ],
            'outbound' => [
                'min' => $outboundValues->min(),
                'max' => $outboundValues->max(),
                'avg' => round($outboundValues->avg(), 2),
                'median' => $this->median($outboundValues->toArray()),
                'std_dev' => round($this->standardDeviation($outboundValues->toArray()), 2)
            ],
            'imbalance_ratio' => $this->calculateImbalanceRatio($inboundValues->toArray())
        ];
    }

    /**
     * Trouve les piliers sans articles enfants
     */
    protected function findPillarsWithoutChildren(int $platformId): Collection
    {
        return Article::where('platform_id', $platformId)
            ->where('type', 'pillar')
            ->where('status', 'published')
            ->whereNotIn('id', function ($subquery) {
                $subquery->select('source_article_id')
                    ->from('internal_links')
                    ->where('link_context', 'pillar_to_article')
                    ->distinct();
            })
            ->get();
    }

    /**
     * Calcule la santé du maillage d'un article
     */
    protected function calculateLinkHealth(
        Article $article,
        Collection $inbound,
        Collection $outbound,
        Collection $external
    ): array {
        $score = 100;
        $issues = [];

        // Pénalité: pas de liens entrants (sauf piliers)
        if ($inbound->isEmpty() && $article->type !== 'pillar') {
            $score -= 30;
            $issues[] = 'No inbound links (orphan article)';
        }

        // Pénalité: pas de liens sortants
        if ($outbound->isEmpty()) {
            $score -= 20;
            $issues[] = 'No outbound links (dead end)';
        }

        // Pénalité: pas de lien vers pilier
        if ($article->type !== 'pillar' && !$outbound->where('link_context', 'article_to_pillar')->count()) {
            $score -= 15;
            $issues[] = 'No link to parent pillar';
        }

        // Pénalité: pas de liens externes
        if ($external->isEmpty()) {
            $score -= 10;
            $issues[] = 'No external links';
        }

        // Pénalité: liens cassés
        $brokenCount = $external->where('is_broken', true)->count();
        if ($brokenCount > 0) {
            $score -= min(20, $brokenCount * 5);
            $issues[] = "{$brokenCount} broken external links";
        }

        // Bonus: relevance score élevé
        $avgRelevance = $outbound->avg('relevance_score') ?? 0;
        if ($avgRelevance >= 80) {
            $score = min(100, $score + 5);
        }

        return [
            'score' => max(0, $score),
            'grade' => $this->scoreToGrade($score),
            'issues' => $issues
        ];
    }

    /**
     * Génère des recommandations basées sur l'analyse
     */
    protected function generateRecommendations(array $analysis): array
    {
        $recommendations = [];

        if ($analysis['inbound']['total'] === 0) {
            $recommendations[] = [
                'priority' => 'high',
                'type' => 'add_inbound',
                'message' => 'Add inbound links from related articles'
            ];
        }

        if ($analysis['outbound']['total'] < 3) {
            $recommendations[] = [
                'priority' => 'medium',
                'type' => 'add_outbound',
                'message' => 'Add more outbound links to related content'
            ];
        }

        if ($analysis['outbound']['to_pillars'] === 0 && $analysis['type'] !== 'pillar') {
            $recommendations[] = [
                'priority' => 'high',
                'type' => 'link_to_pillar',
                'message' => 'Add link to parent pillar article'
            ];
        }

        if ($analysis['external']['total'] < 2) {
            $recommendations[] = [
                'priority' => 'medium',
                'type' => 'add_external',
                'message' => 'Add external links to authoritative sources'
            ];
        }

        if ($analysis['external']['broken'] > 0) {
            $recommendations[] = [
                'priority' => 'high',
                'type' => 'fix_broken',
                'message' => "Fix {$analysis['external']['broken']} broken external links"
            ];
        }

        return $recommendations;
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
     * Calcule la médiane
     */
    protected function median(array $values): float
    {
        if (empty($values)) return 0;
        
        sort($values);
        $count = count($values);
        $middle = floor($count / 2);
        
        if ($count % 2 === 0) {
            return ($values[$middle - 1] + $values[$middle]) / 2;
        }
        
        return $values[$middle];
    }

    /**
     * Calcule l'écart-type
     */
    protected function standardDeviation(array $values): float
    {
        if (count($values) < 2) return 0;
        
        $mean = array_sum($values) / count($values);
        $squaredDiffs = array_map(fn($v) => pow($v - $mean, 2), $values);
        
        return sqrt(array_sum($squaredDiffs) / count($values));
    }

    /**
     * Calcule le ratio de déséquilibre (Gini-like)
     */
    protected function calculateImbalanceRatio(array $values): float
    {
        if (empty($values) || max($values) === 0) return 0;
        
        $sorted = $values;
        sort($sorted);
        $n = count($sorted);
        $sum = array_sum($sorted);
        
        if ($sum === 0) return 0;
        
        $cumulativeSum = 0;
        $giniSum = 0;
        
        foreach ($sorted as $i => $value) {
            $cumulativeSum += $value;
            $giniSum += ($i + 1) * $value;
        }
        
        return round(1 - (2 * $giniSum) / ($n * $sum) + 1 / $n, 3);
    }

    /**
     * Auto-répare le maillage d'une plateforme
     */
    public function autoRepairLinkBalance(int $platformId, bool $dryRun = true): array
    {
        $repairs = [
            'orphans_fixed' => 0,
            'dead_ends_fixed' => 0,
            'pillars_linked' => 0,
            'actions' => []
        ];

        // 1. Réparer orphelins
        $orphans = $this->identifyOrphanArticles($platformId);
        foreach ($orphans as $orphan) {
            $action = "Generate inbound links for article {$orphan['id']}";
            
            if (!$dryRun) {
                // Trouver articles similaires et créer liens vers cet orphelin
                $article = Article::find($orphan['id']);
                if ($article) {
                    $this->internalLinkingService->generateInternalLinks($article);
                    $repairs['orphans_fixed']++;
                }
            }
            
            $repairs['actions'][] = $action;
        }

        // 2. Réparer dead-ends
        $deadEnds = $this->identifyDeadEnds($platformId);
        foreach ($deadEnds->take(50) as $deadEnd) {
            $action = "Generate outbound links for article {$deadEnd['id']}";
            
            if (!$dryRun) {
                $article = Article::find($deadEnd['id']);
                if ($article) {
                    $this->internalLinkingService->generateInternalLinks($article);
                    $repairs['dead_ends_fixed']++;
                }
            }
            
            $repairs['actions'][] = $action;
        }

        $repairs['dry_run'] = $dryRun;
        
        return $repairs;
    }

    /**
     * Génère un rapport complet du maillage plateforme
     */
    public function generatePlatformReport(int $platformId): array
    {
        $platform = Platform::findOrFail($platformId);
        
        return [
            'platform' => [
                'id' => $platform->id,
                'name' => $platform->name
            ],
            'summary' => [
                'total_articles' => Article::where('platform_id', $platformId)->where('status', 'published')->count(),
                'total_internal_links' => InternalLink::whereHas('sourceArticle', fn($q) => $q->where('platform_id', $platformId))->count(),
                'total_external_links' => ExternalLink::whereHas('article', fn($q) => $q->where('platform_id', $platformId))->count()
            ],
            'distribution' => $this->analyzeDistribution($platformId),
            'issues' => [
                'orphan_articles' => $this->identifyOrphanArticles($platformId)->count(),
                'dead_end_articles' => $this->identifyDeadEnds($platformId)->count(),
                'broken_links' => ExternalLink::whereHas('article', fn($q) => $q->where('platform_id', $platformId))
                    ->where('is_broken', true)->count()
            ],
            'suggestions' => $this->suggestLinkImprovements($platformId),
            'generated_at' => now()->toIso8601String()
        ];
    }
}
