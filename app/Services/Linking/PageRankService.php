<?php

namespace App\Services\Linking;

use App\Models\Article;
use App\Models\InternalLink;
use App\Models\Platform;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class PageRankService
{
    /**
     * Damping factor (probabilité de suivre un lien vs saut aléatoire)
     */
    protected float $dampingFactor = 0.85;

    /**
     * Nombre maximum d'itérations
     */
    protected int $maxIterations = 100;

    /**
     * Seuil de convergence
     */
    protected float $convergenceThreshold = 0.0001;

    /**
     * Durée du cache en secondes (1 heure)
     */
    protected int $cacheTtl = 3600;

    /**
     * Calcule le PageRank interne de tous les articles d'une plateforme
     */
    public function calculateInternalPageRank(int $platformId, bool $useCache = true): array
    {
        $cacheKey = "pagerank_platform_{$platformId}";

        if ($useCache && Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        // Récupérer tous les articles publiés
        $articles = Article::where('platform_id', $platformId)
            ->where('status', 'published')
            ->get(['id', 'title', 'type', 'language_code', 'country_code']);

        if ($articles->isEmpty()) {
            return [];
        }

        // Construire la matrice d'adjacence (liens)
        $articleIds = $articles->pluck('id')->toArray();
        $idToIndex = array_flip($articleIds);
        $n = count($articleIds);

        // Initialiser les scores PageRank (distribution uniforme)
        $pageRank = array_fill(0, $n, 1 / $n);

        // Construire la matrice de liens sortants
        $outboundLinks = $this->buildOutboundMatrix($articleIds, $idToIndex);
        
        // Compter les liens sortants par article
        $outboundCounts = array_map('count', $outboundLinks);

        // Itérations PageRank
        for ($iteration = 0; $iteration < $this->maxIterations; $iteration++) {
            $newPageRank = array_fill(0, $n, (1 - $this->dampingFactor) / $n);

            // Pour chaque article
            foreach ($articleIds as $i => $sourceId) {
                if ($outboundCounts[$i] === 0) {
                    // Dangling node: distribue uniformément
                    $contribution = $pageRank[$i] / $n;
                    for ($j = 0; $j < $n; $j++) {
                        $newPageRank[$j] += $this->dampingFactor * $contribution;
                    }
                } else {
                    // Distribue aux liens sortants
                    $contribution = $pageRank[$i] / $outboundCounts[$i];
                    foreach ($outboundLinks[$i] as $targetIndex) {
                        $newPageRank[$targetIndex] += $this->dampingFactor * $contribution;
                    }
                }
            }

            // Vérifier la convergence
            $diff = 0;
            for ($i = 0; $i < $n; $i++) {
                $diff += abs($newPageRank[$i] - $pageRank[$i]);
            }

            $pageRank = $newPageRank;

            if ($diff < $this->convergenceThreshold) {
                Log::info("PageRank converged after {$iteration} iterations");
                break;
            }
        }

        // Construire le résultat
        $results = [];
        foreach ($articles as $index => $article) {
            $results[$article->id] = [
                'article_id' => $article->id,
                'title' => $article->title,
                'type' => $article->type,
                'language' => $article->language_code,
                'country' => $article->country_code,
                'pagerank' => round($pageRank[$index], 8),
                'normalized_score' => round($pageRank[$index] * $n * 100, 2), // Score 0-100+
                'outbound_links' => $outboundCounts[$index],
                'inbound_links' => $this->countInboundLinks($article->id, $articleIds, $outboundLinks, $idToIndex)
            ];
        }

        // Trier par PageRank décroissant
        usort($results, fn($a, $b) => $b['pagerank'] <=> $a['pagerank']);

        // Ajouter le rang
        foreach ($results as $rank => &$result) {
            $result['rank'] = $rank + 1;
        }

        // Créer tableau indexé par article_id
        $indexedResults = [];
        foreach ($results as $result) {
            $indexedResults[$result['article_id']] = $result;
        }

        // Mettre en cache
        Cache::put($cacheKey, $indexedResults, $this->cacheTtl);

        return $indexedResults;
    }

    /**
     * Identifie les pages à haute valeur PageRank
     */
    public function identifyHighValuePages(int $platformId, int $limit = 20): Collection
    {
        $pageRanks = $this->calculateInternalPageRank($platformId);
        
        // Trier par PageRank et prendre le top N
        uasort($pageRanks, fn($a, $b) => $b['pagerank'] <=> $a['pagerank']);
        
        return collect(array_slice($pageRanks, 0, $limit, true));
    }

    /**
     * Identifie les pages à faible valeur PageRank
     */
    public function identifyLowValuePages(int $platformId, int $limit = 20): Collection
    {
        $pageRanks = $this->calculateInternalPageRank($platformId);
        
        // Trier par PageRank croissant
        uasort($pageRanks, fn($a, $b) => $a['pagerank'] <=> $b['pagerank']);
        
        return collect(array_slice($pageRanks, 0, $limit, true));
    }

    /**
     * Optimise le flux de PageRank
     */
    public function optimizeLinkFlow(int $platformId): array
    {
        $pageRanks = $this->calculateInternalPageRank($platformId);
        $recommendations = [];

        // Trouver les articles à haut PR avec peu de liens sortants
        $highPrLowOutbound = array_filter($pageRanks, function ($pr) {
            return $pr['normalized_score'] > 100 && $pr['outbound_links'] < 5;
        });

        foreach ($highPrLowOutbound as $pr) {
            $recommendations[] = [
                'type' => 'add_outbound_links',
                'priority' => 'high',
                'article_id' => $pr['article_id'],
                'title' => $pr['title'],
                'current_outbound' => $pr['outbound_links'],
                'pagerank_score' => $pr['normalized_score'],
                'suggestion' => "Article has high PageRank ({$pr['normalized_score']}) but only {$pr['outbound_links']} outbound links. Add more links to distribute link juice."
            ];
        }

        // Trouver les articles à faible PR avec beaucoup de liens sortants
        $lowPrHighOutbound = array_filter($pageRanks, function ($pr) {
            return $pr['normalized_score'] < 50 && $pr['outbound_links'] > 10;
        });

        foreach ($lowPrHighOutbound as $pr) {
            $recommendations[] = [
                'type' => 'reduce_outbound_links',
                'priority' => 'medium',
                'article_id' => $pr['article_id'],
                'title' => $pr['title'],
                'current_outbound' => $pr['outbound_links'],
                'pagerank_score' => $pr['normalized_score'],
                'suggestion' => "Article has low PageRank ({$pr['normalized_score']}) but {$pr['outbound_links']} outbound links. Consider reducing links to concentrate link juice."
            ];
        }

        // Trouver les piliers qui ne reçoivent pas assez de jus
        $pillarsLowPr = array_filter($pageRanks, function ($pr) {
            return $pr['type'] === 'pillar' && $pr['inbound_links'] < 5;
        });

        foreach ($pillarsLowPr as $pr) {
            $recommendations[] = [
                'type' => 'boost_pillar',
                'priority' => 'high',
                'article_id' => $pr['article_id'],
                'title' => $pr['title'],
                'current_inbound' => $pr['inbound_links'],
                'suggestion' => "Pillar article has only {$pr['inbound_links']} inbound links. Add more links from child articles to boost authority."
            ];
        }

        // Trier par priorité
        usort($recommendations, function ($a, $b) {
            $priorityOrder = ['high' => 0, 'medium' => 1, 'low' => 2];
            return $priorityOrder[$a['priority']] <=> $priorityOrder[$b['priority']];
        });

        return [
            'platform_id' => $platformId,
            'total_articles' => count($pageRanks),
            'average_pagerank' => round(array_sum(array_column($pageRanks, 'normalized_score')) / count($pageRanks), 2),
            'recommendations_count' => count($recommendations),
            'recommendations' => $recommendations
        ];
    }

    /**
     * Récupère le score PageRank d'un article
     */
    public function getPageRankScore(Article $article): array
    {
        $pageRanks = $this->calculateInternalPageRank($article->platform_id);
        
        return $pageRanks[$article->id] ?? [
            'article_id' => $article->id,
            'pagerank' => 0,
            'normalized_score' => 0,
            'rank' => null,
            'message' => 'Article not found in PageRank calculation'
        ];
    }

    /**
     * Compare le PageRank avant/après modification
     */
    public function simulateLinkAddition(int $platformId, int $sourceId, int $targetId): array
    {
        // Calcul avant
        $before = $this->calculateInternalPageRank($platformId, false);
        $targetBefore = $before[$targetId] ?? null;
        
        if (!$targetBefore) {
            return ['error' => 'Target article not found'];
        }

        // Simuler ajout de lien temporairement
        $tempLink = InternalLink::create([
            'source_article_id' => $sourceId,
            'target_article_id' => $targetId,
            'anchor_text' => 'simulation',
            'anchor_type' => 'generic',
            'link_context' => 'related',
            'relevance_score' => 50,
            'is_automatic' => true
        ]);

        // Invalider le cache
        Cache::forget("pagerank_platform_{$platformId}");

        // Calcul après
        $after = $this->calculateInternalPageRank($platformId, false);
        $targetAfter = $after[$targetId];

        // Supprimer le lien temporaire
        $tempLink->delete();
        Cache::forget("pagerank_platform_{$platformId}");

        return [
            'source_article_id' => $sourceId,
            'target_article_id' => $targetId,
            'before' => [
                'pagerank' => $targetBefore['pagerank'],
                'normalized_score' => $targetBefore['normalized_score'],
                'rank' => $targetBefore['rank']
            ],
            'after' => [
                'pagerank' => $targetAfter['pagerank'],
                'normalized_score' => $targetAfter['normalized_score'],
                'rank' => $targetAfter['rank']
            ],
            'change' => [
                'pagerank_delta' => round($targetAfter['pagerank'] - $targetBefore['pagerank'], 8),
                'score_delta' => round($targetAfter['normalized_score'] - $targetBefore['normalized_score'], 2),
                'rank_delta' => $targetBefore['rank'] - $targetAfter['rank'] // Positif = amélioration
            ]
        ];
    }

    /**
     * Génère un graphe de flux PageRank (pour visualisation)
     */
    public function generateFlowGraph(int $platformId): array
    {
        $pageRanks = $this->calculateInternalPageRank($platformId);
        $articleIds = array_keys($pageRanks);

        $nodes = [];
        $edges = [];

        // Créer les nœuds
        foreach ($pageRanks as $pr) {
            $nodes[] = [
                'id' => $pr['article_id'],
                'label' => mb_substr($pr['title'], 0, 30) . '...',
                'type' => $pr['type'],
                'pagerank' => $pr['normalized_score'],
                'size' => min(50, max(10, $pr['normalized_score'] / 5)) // Taille proportionnelle au PR
            ];
        }

        // Créer les arêtes (liens)
        $links = InternalLink::whereIn('source_article_id', $articleIds)
            ->whereIn('target_article_id', $articleIds)
            ->get();

        foreach ($links as $link) {
            $edges[] = [
                'source' => $link->source_article_id,
                'target' => $link->target_article_id,
                'context' => $link->link_context,
                'relevance' => $link->relevance_score
            ];
        }

        return [
            'nodes' => $nodes,
            'edges' => $edges,
            'stats' => [
                'total_nodes' => count($nodes),
                'total_edges' => count($edges),
                'average_degree' => count($nodes) > 0 ? round(count($edges) / count($nodes), 2) : 0
            ]
        ];
    }

    /**
     * Construit la matrice des liens sortants
     */
    protected function buildOutboundMatrix(array $articleIds, array $idToIndex): array
    {
        $matrix = array_fill(0, count($articleIds), []);

        $links = InternalLink::whereIn('source_article_id', $articleIds)
            ->whereIn('target_article_id', $articleIds)
            ->get(['source_article_id', 'target_article_id']);

        foreach ($links as $link) {
            $sourceIndex = $idToIndex[$link->source_article_id] ?? null;
            $targetIndex = $idToIndex[$link->target_article_id] ?? null;

            if ($sourceIndex !== null && $targetIndex !== null) {
                $matrix[$sourceIndex][] = $targetIndex;
            }
        }

        return $matrix;
    }

    /**
     * Compte les liens entrants pour un article
     */
    protected function countInboundLinks(int $articleId, array $articleIds, array $outboundLinks, array $idToIndex): int
    {
        $targetIndex = $idToIndex[$articleId] ?? null;
        if ($targetIndex === null) return 0;

        $count = 0;
        foreach ($outboundLinks as $targets) {
            if (in_array($targetIndex, $targets)) {
                $count++;
            }
        }

        return $count;
    }

    /**
     * Invalide le cache PageRank pour une plateforme
     */
    public function invalidateCache(int $platformId): void
    {
        Cache::forget("pagerank_platform_{$platformId}");
    }

    /**
     * Récupère les statistiques PageRank de la plateforme
     */
    public function getPlatformStats(int $platformId): array
    {
        $pageRanks = $this->calculateInternalPageRank($platformId);

        if (empty($pageRanks)) {
            return [
                'error' => 'No articles found',
                'total_articles' => 0
            ];
        }

        $scores = array_column($pageRanks, 'normalized_score');
        sort($scores);

        return [
            'platform_id' => $platformId,
            'total_articles' => count($pageRanks),
            'statistics' => [
                'min' => min($scores),
                'max' => max($scores),
                'average' => round(array_sum($scores) / count($scores), 2),
                'median' => $scores[(int)(count($scores) / 2)],
                'percentile_25' => $scores[(int)(count($scores) * 0.25)],
                'percentile_75' => $scores[(int)(count($scores) * 0.75)]
            ],
            'distribution' => [
                'high_pr_100plus' => count(array_filter($scores, fn($s) => $s >= 100)),
                'medium_pr_50_100' => count(array_filter($scores, fn($s) => $s >= 50 && $s < 100)),
                'low_pr_under_50' => count(array_filter($scores, fn($s) => $s < 50))
            ],
            'top_10' => array_slice($pageRanks, 0, 10)
        ];
    }

    /**
     * Configure le damping factor
     */
    public function setDampingFactor(float $factor): self
    {
        $this->dampingFactor = max(0, min(1, $factor));
        return $this;
    }

    /**
     * Configure le nombre max d'itérations
     */
    public function setMaxIterations(int $iterations): self
    {
        $this->maxIterations = max(1, $iterations);
        return $this;
    }
}
