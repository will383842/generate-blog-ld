<?php

namespace App\Services\Linking;

use App\Models\Article;
use App\Models\InternalLink;
use App\Models\LinkingRule;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class InternalLinkingService
{
    protected TfIdfService $tfIdfService;
    protected AnchorTextService $anchorService;
    protected LinkPositionService $positionService;

    public function __construct(
        TfIdfService $tfIdfService,
        AnchorTextService $anchorService,
        LinkPositionService $positionService
    ) {
        $this->tfIdfService = $tfIdfService;
        $this->anchorService = $anchorService;
        $this->positionService = $positionService;
    }

    /**
     * Génère les liens internes pour un article
     */
    public function generateInternalLinks(Article $article, bool $force = false): array
    {
        $rules = LinkingRule::forPlatform($article->platform_id);
        $minLinks = $rules?->min_internal_links ?? config('linking.internal.min_links', 5);
        $maxLinks = $rules?->max_internal_links ?? config('linking.internal.max_links', 12);

        // Supprimer les anciens liens automatiques si force
        if ($force) {
            $article->internalLinksAsSource()->where('is_automatic', true)->delete();
        }

        // Trouver les articles candidats
        $candidates = $this->findCandidateArticles($article, $maxLinks * 3);

        if ($candidates->isEmpty()) {
            Log::info("InternalLinkingService: No candidates found for article {$article->id}");
            return ['created' => 0, 'deleted' => 0];
        }

        // Calculer les scores de pertinence avec TF-IDF
        $scoredCandidates = $this->tfIdfService->scoreArticleRelevance($article, $candidates);

        // Filtrer par score minimum
        $minRelevance = config('linking.internal.min_relevance', 40);
        $scoredCandidates = $scoredCandidates->filter(fn($c) => $c['score'] >= $minRelevance);

        // Sélectionner les meilleurs candidats
        $selectedCandidates = $this->selectBestCandidates($scoredCandidates, $minLinks, $maxLinks, $article);

        // Créer les liens
        $created = $this->createLinks($article, $selectedCandidates);

        Log::info("InternalLinkingService: Created {$created} links for article {$article->id}");

        return [
            'created' => $created,
            'deleted' => $force ? $article->internalLinksAsSource()->where('is_automatic', true)->count() : 0,
            'candidates_found' => $candidates->count(),
            'candidates_after_scoring' => $scoredCandidates->count()
        ];
    }

    /**
     * Trouve les articles candidats pour le maillage
     */
    public function findCandidateArticles(Article $article, int $limit = 50): Collection
    {
        return Article::where('platform_id', $article->platform_id)
            ->where('id', '!=', $article->id)
            ->where('status', 'published')
            ->where('language_code', $article->language_code)
            ->where(function ($query) use ($article) {
                // Même pays ou pays proche
                if ($article->country_code) {
                    $query->where('country_code', $article->country_code)
                        ->orWhereNull('country_code');
                }
            })
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }

    /**
     * Sélectionne les meilleurs candidats en respectant les règles
     */
    protected function selectBestCandidates(
        Collection $scoredCandidates,
        int $min,
        int $max,
        Article $sourceArticle
    ): Collection {
        $selected = collect();
        $anchorDistribution = config('linking.internal.anchor_distribution', [
            'exact_match' => 30,
            'long_tail' => 25,
            'generic' => 20,
            'cta' => 15,
            'question' => 10
        ]);

        // Trier par score décroissant
        $sorted = $scoredCandidates->sortByDesc('score');

        // Appliquer les boosts
        $boosts = config('linking.internal.boosts', []);
        
        foreach ($sorted as $candidate) {
            if ($selected->count() >= $max) {
                break;
            }

            $article = $candidate['article'];
            $score = $candidate['score'];

            // Boost même pays
            if ($article->country_code === $sourceArticle->country_code) {
                $score += $boosts['same_country'] ?? 10;
            }

            // Boost même thème
            if ($article->theme === $sourceArticle->theme) {
                $score += $boosts['same_theme'] ?? 15;
            }

            // Boost article pilier
            if ($article->type === 'pillar') {
                $score += $boosts['pillar_article'] ?? 20;
            }

            // Vérifier qu'on n'a pas déjà un lien vers cet article
            if (!$selected->contains(fn($s) => $s['article']->id === $article->id)) {
                $selected->push([
                    'article' => $article,
                    'score' => $score,
                    'original_score' => $candidate['score']
                ]);
            }
        }

        // S'assurer d'avoir le minimum
        if ($selected->count() < $min && $sorted->count() > $selected->count()) {
            $remaining = $sorted->filter(fn($c) => !$selected->contains(fn($s) => $s['article']->id === $c['article']->id));
            
            foreach ($remaining as $candidate) {
                if ($selected->count() >= $min) break;
                $selected->push([
                    'article' => $candidate['article'],
                    'score' => $candidate['score'],
                    'original_score' => $candidate['score']
                ]);
            }
        }

        return $selected;
    }

    /**
     * Crée les liens en base de données
     */
    protected function createLinks(Article $source, Collection $candidates): int
    {
        $created = 0;
        $anchorTypes = $this->getAnchorTypeDistribution($candidates->count());

        foreach ($candidates as $index => $candidate) {
            $target = $candidate['article'];
            $anchorType = $anchorTypes[$index] ?? 'exact_match';

            // Générer l'anchor text
            $anchorText = $this->anchorService->generateAnchor(
                $target,
                $source->language_code,
                $anchorType
            );

            // Déterminer la position
            $position = $this->positionService->suggestPosition($source->content, $index, $candidates->count());

            try {
                InternalLink::create([
                    'source_article_id' => $source->id,
                    'target_article_id' => $target->id,
                    'anchor_text' => $anchorText,
                    'anchor_type' => $anchorType,
                    'position' => $position['position'] ?? null,
                    'position_type' => $position['type'] ?? 'body',
                    'relevance_score' => $candidate['score'],
                    'is_automatic' => true,
                    'link_context' => $this->determineLinkContext($source, $target),
                ]);
                $created++;
            } catch (\Exception $e) {
                Log::warning("InternalLinkingService: Failed to create link", [
                    'source' => $source->id,
                    'target' => $target->id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        return $created;
    }

    /**
     * Détermine la distribution des types d'ancres
     */
    protected function getAnchorTypeDistribution(int $count): array
    {
        $distribution = config('linking.internal.anchor_distribution', []);
        $types = [];
        
        foreach ($distribution as $type => $percentage) {
            $typeCount = (int) round($count * $percentage / 100);
            for ($i = 0; $i < $typeCount; $i++) {
                $types[] = $type;
            }
        }

        // Compléter si nécessaire
        while (count($types) < $count) {
            $types[] = 'exact_match';
        }

        // Mélanger pour variété
        shuffle($types);

        return array_slice($types, 0, $count);
    }

    /**
     * Détermine le contexte du lien
     */
    protected function determineLinkContext(Article $source, Article $target): string
    {
        if ($source->type === 'pillar' && $target->type !== 'pillar') {
            return 'pillar_to_article';
        }
        
        if ($source->type !== 'pillar' && $target->type === 'pillar') {
            return 'article_to_pillar';
        }
        
        if ($source->country_code === $target->country_code) {
            return 'same_country';
        }
        
        if ($source->theme === $target->theme) {
            return 'same_theme';
        }

        return 'related';
    }

    /**
     * Récupère les statistiques de maillage d'un article
     */
    public function getArticleStats(Article $article): array
    {
        return [
            'outgoing_links' => $article->internalLinksAsSource()->count(),
            'incoming_links' => $article->internalLinksAsTarget()->count(),
            'automatic_links' => $article->internalLinksAsSource()->where('is_automatic', true)->count(),
            'manual_links' => $article->internalLinksAsSource()->where('is_automatic', false)->count(),
            'average_relevance' => round($article->internalLinksAsSource()->avg('relevance_score') ?? 0, 1),
        ];
    }

    /**
     * Recalcule tous les liens d'une plateforme
     */
    public function regeneratePlatformLinks(int $platformId): array
    {
        $articles = Article::where('platform_id', $platformId)
            ->where('status', 'published')
            ->get();

        $stats = ['total' => $articles->count(), 'processed' => 0, 'links_created' => 0];

        foreach ($articles as $article) {
            $result = $this->generateInternalLinks($article, true);
            $stats['processed']++;
            $stats['links_created'] += $result['created'];
        }

        // Invalider le cache PageRank
        Cache::tags(["platform:{$platformId}", 'pagerank'])->flush();

        return $stats;
    }
}
