<?php

namespace App\Listeners;

use App\Events\ArticleLinksGenerated;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class LogLinkingMetrics
{
    /**
     * Handle the event.
     */
    public function handle(ArticleLinksGenerated $event): void
    {
        $article = $event->article;

        // Log les métriques principales
        Log::channel('linking')->info('Article links generated', [
            'article_id' => $article->id,
            'article_title' => $article->title,
            'platform_id' => $article->platform_id,
            'language' => $article->language_code,
            'country' => $article->country_code,
            'type' => $article->type,
            'internal_links' => $event->getInternalLinksCount(),
            'external_links' => $event->getExternalLinksCount(),
            'affiliate_links' => $event->getAffiliateLinksCount(),
            'pillar_links' => $event->getPillarLinksCount(),
            'total_links' => $event->getTotalLinksCount(),
            'content_updated' => $event->wasContentUpdated(),
            'duration_ms' => $event->getDurationMs(),
            'has_errors' => $event->hasErrors(),
        ]);

        // Log les erreurs séparément si présentes
        if ($event->hasErrors()) {
            Log::channel('linking')->warning('Linking errors for article', [
                'article_id' => $article->id,
                'errors' => $event->getErrors()
            ]);
        }

        // Mettre à jour les statistiques en base
        $this->updateStatistics($event);

        // Mettre à jour les compteurs de l'article
        $this->updateArticleCounters($article);
    }

    /**
     * Met à jour les statistiques globales
     */
    protected function updateStatistics(ArticleLinksGenerated $event): void
    {
        $date = now()->toDateString();
        $platformId = $event->article->platform_id;

        // Incrémenter les compteurs journaliers (table linking_statistics)
        try {
            DB::table('linking_statistics')->updateOrInsert(
                [
                    'platform_id' => $platformId,
                    'date' => $date
                ],
                [
                    'articles_processed' => DB::raw('COALESCE(articles_processed, 0) + 1'),
                    'internal_links_created' => DB::raw('COALESCE(internal_links_created, 0) + ' . $event->getInternalLinksCount()),
                    'external_links_created' => DB::raw('COALESCE(external_links_created, 0) + ' . $event->getExternalLinksCount()),
                    'affiliate_links_created' => DB::raw('COALESCE(affiliate_links_created, 0) + ' . $event->getAffiliateLinksCount()),
                    'pillar_links_created' => DB::raw('COALESCE(pillar_links_created, 0) + ' . $event->getPillarLinksCount()),
                    'total_duration_ms' => DB::raw('COALESCE(total_duration_ms, 0) + ' . $event->getDurationMs()),
                    'errors_count' => DB::raw('COALESCE(errors_count, 0) + ' . ($event->hasErrors() ? 1 : 0)),
                    'updated_at' => now()
                ]
            );
        } catch (\Exception $e) {
            // La table n'existe peut-être pas encore, on ignore silencieusement
            Log::debug('Could not update linking_statistics: ' . $e->getMessage());
        }
    }

    /**
     * Met à jour les compteurs de liens sur l'article
     */
    protected function updateArticleCounters($article): void
    {
        try {
            $internalCount = $article->internalLinksAsSource()->count();
            $externalCount = $article->externalLinks()->count();
            $inboundCount = $article->internalLinksAsTarget()->count();

            $article->update([
                'internal_links_count' => $internalCount,
                'external_links_count' => $externalCount,
                'inbound_links_count' => $inboundCount,
                'links_generated_at' => now()
            ]);
        } catch (\Exception $e) {
            // Les colonnes n'existent peut-être pas encore
            Log::debug('Could not update article counters: ' . $e->getMessage());
        }
    }
}
