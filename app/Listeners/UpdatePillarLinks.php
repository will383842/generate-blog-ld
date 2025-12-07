<?php

namespace App\Listeners;

use App\Events\ArticleLinksGenerated;
use App\Models\Article;
use App\Services\Linking\PillarLinkingService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class UpdatePillarLinks implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'linking';
    public int $tries = 2;

    protected PillarLinkingService $pillarService;

    /**
     * Create the listener instance.
     */
    public function __construct(PillarLinkingService $pillarService)
    {
        $this->pillarService = $pillarService;
    }

    /**
     * Handle the event.
     */
    public function handle(ArticleLinksGenerated $event): void
    {
        $article = $event->article;

        // Si l'article est un pilier, mettre à jour sa table des matières
        if ($article->type === 'pillar') {
            $this->updatePillarTableOfContents($article);
            return;
        }

        // Sinon, chercher le pilier parent et mettre à jour ses liens
        $this->updateParentPillar($article);
    }

    /**
     * Met à jour la table des matières du pilier
     */
    protected function updatePillarTableOfContents(Article $pillar): void
    {
        try {
            $result = $this->pillarService->updatePillarTableOfContents($pillar);

            Log::info('UpdatePillarLinks: Updated pillar TOC', [
                'pillar_id' => $pillar->id,
                'children_count' => $result['children_count'] ?? 0
            ]);
        } catch (\Exception $e) {
            Log::error('UpdatePillarLinks: Failed to update pillar TOC', [
                'pillar_id' => $pillar->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Met à jour le pilier parent de l'article
     */
    protected function updateParentPillar(Article $article): void
    {
        // Trouver le pilier parent via le lien article_to_pillar
        $pillarLink = $article->internalLinksAsSource()
            ->where('link_context', 'article_to_pillar')
            ->first();

        if (!$pillarLink) {
            return;
        }

        $pillar = Article::find($pillarLink->target_article_id);
        
        if (!$pillar || $pillar->type !== 'pillar') {
            return;
        }

        try {
            // Mettre à jour la TOC du pilier
            $this->updatePillarTableOfContents($pillar);

            // Vérifier l'intégrité du cluster
            $integrity = $this->pillarService->verifyPillarIntegrity($pillar);

            if (!$integrity['is_valid']) {
                Log::warning('UpdatePillarLinks: Pillar cluster has issues', [
                    'pillar_id' => $pillar->id,
                    'issues' => $integrity['issues']
                ]);

                // Auto-repair si activé
                if (config('linking.pillar.auto_repair', true)) {
                    $this->autoRepairCluster($pillar, $integrity['issues']);
                }
            }
        } catch (\Exception $e) {
            Log::error('UpdatePillarLinks: Failed to update parent pillar', [
                'article_id' => $article->id,
                'pillar_id' => $pillar->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Répare automatiquement les problèmes du cluster
     */
    protected function autoRepairCluster(Article $pillar, array $issues): void
    {
        foreach ($issues as $issue) {
            try {
                switch ($issue['type']) {
                    case 'missing_pillar_link':
                        // Recréer le lien pilier → enfant
                        $childArticle = Article::find($issue['article_id']);
                        if ($childArticle) {
                            $this->pillarService->linkPillarToArticle($pillar, $childArticle);
                        }
                        break;

                    case 'missing_child_link':
                        // Recréer le lien enfant → pilier
                        $childArticle = Article::find($issue['article_id']);
                        if ($childArticle) {
                            $this->pillarService->linkArticleToPillar($childArticle);
                        }
                        break;

                    case 'orphan_in_cluster':
                        // L'article n'est plus dans le cluster, supprimer le lien
                        // (géré par le nettoyage régulier)
                        break;
                }

                Log::info('UpdatePillarLinks: Auto-repaired issue', [
                    'pillar_id' => $pillar->id,
                    'issue_type' => $issue['type']
                ]);

            } catch (\Exception $e) {
                Log::warning('UpdatePillarLinks: Could not auto-repair', [
                    'pillar_id' => $pillar->id,
                    'issue' => $issue,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }

    /**
     * Determine if the listener should be queued.
     */
    public function shouldQueue(ArticleLinksGenerated $event): bool
    {
        // Ne pas mettre en queue si c'est un article sans pilier possible
        if ($event->article->type === 'landing') {
            return false;
        }

        return true;
    }
}
