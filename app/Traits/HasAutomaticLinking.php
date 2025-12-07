<?php

namespace App\Traits;

use App\Models\Article;
use App\Services\Linking\LinkingOrchestrator;
use Illuminate\Support\Facades\Log;

trait HasAutomaticLinking
{
    /**
     * Génère les liens automatiques après création de l'article
     */
    protected function generateLinksForArticle(Article $article, array $options = []): array
    {
        $orchestrator = app(LinkingOrchestrator::class);

        $defaultOptions = [
            'internal' => true,
            'external' => true,
            'affiliate' => $this->shouldIncludeAffiliates($article),
            'pillar' => true,
            'inject_content' => true,
        ];

        $options = array_merge($defaultOptions, $options);

        try {
            $result = $orchestrator->processArticle($article, $options);

            Log::info("HasAutomaticLinking: Generated links for article {$article->id}", [
                'internal' => $result['internal_links']['created'] ?? 0,
                'external' => $result['external_links']['created'] ?? 0,
                'affiliate' => $result['affiliate_links']['injected'] ?? 0,
            ]);

            return $result;

        } catch (\Exception $e) {
            Log::error("HasAutomaticLinking: Failed for article {$article->id}", [
                'error' => $e->getMessage()
            ]);

            return [
                'error' => $e->getMessage(),
                'internal_links' => ['created' => 0],
                'external_links' => ['created' => 0],
            ];
        }
    }

    /**
     * Détermine si les liens affiliés doivent être inclus
     */
    protected function shouldIncludeAffiliates(Article $article): bool
    {
        // Pas d'affiliés sur les piliers (trop commerciaux)
        if ($article->type === 'pillar') {
            return false;
        }

        // Pas d'affiliés sur les landing pages légales
        if ($article->type === 'landing' && $article->theme === 'legal') {
            return false;
        }

        // Sinon, affiliés autorisés
        return true;
    }

    /**
     * Met à jour le contenu avec les liens générés
     */
    protected function injectLinksIntoContent(Article $article): string
    {
        $orchestrator = app(LinkingOrchestrator::class);
        return $orchestrator->injectLinksInContent($article);
    }

    /**
     * Génère les liens après création batch d'articles
     */
    protected function generateLinksForBatch(array $articles, array $options = []): array
    {
        $orchestrator = app(LinkingOrchestrator::class);
        $articleIds = collect($articles)->pluck('id')->toArray();
        
        return $orchestrator->processBatch($articleIds, $options);
    }

    /**
     * Rafraîchit les liens d'un article existant
     */
    protected function refreshArticleLinks(Article $article): array
    {
        // Supprimer les liens automatiques existants
        $article->internalLinksAsSource()
            ->where('is_automatic', true)
            ->delete();

        $article->externalLinks()
            ->where('is_automatic', true)
            ->delete();

        // Régénérer
        return $this->generateLinksForArticle($article, ['force' => true]);
    }

    /**
     * Vérifie la santé des liens d'un article
     */
    protected function checkArticleLinkHealth(Article $article): array
    {
        $orchestrator = app(LinkingOrchestrator::class);
        return $orchestrator->checkArticleLinkHealth($article);
    }

    /**
     * Traite un cluster pilier complet
     */
    protected function processPillarCluster(Article $pillar): array
    {
        if ($pillar->type !== 'pillar') {
            throw new \InvalidArgumentException('Article must be a pillar type');
        }

        $orchestrator = app(LinkingOrchestrator::class);
        return $orchestrator->processPillarCluster($pillar);
    }

    /**
     * Obtient les options de linking selon le type d'article
     */
    protected function getLinkingOptionsForType(string $articleType): array
    {
        $options = [
            'pillar' => [
                'internal' => true,
                'external' => true,
                'affiliate' => false,
                'pillar' => true,
                'inject_content' => true,
            ],
            'standard' => [
                'internal' => true,
                'external' => true,
                'affiliate' => true,
                'pillar' => true,
                'inject_content' => true,
            ],
            'landing' => [
                'internal' => true,
                'external' => true,
                'affiliate' => false,
                'pillar' => false,
                'inject_content' => true,
            ],
            'comparative' => [
                'internal' => true,
                'external' => true,
                'affiliate' => true,
                'pillar' => true,
                'inject_content' => true,
            ],
        ];

        return $options[$articleType] ?? $options['standard'];
    }
}
