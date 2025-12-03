<?php

namespace App\Jobs;

use App\Models\Article;
use App\Models\IndexingQueue;
use App\Services\Seo\IndexingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Job de demande d'indexation
 * 
 * Soumet l'URL d'un article aux services d'indexation :
 * - Google Indexing API
 * - IndexNow (Bing, Yandex)
 */
class RequestIndexing implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * ID de l'article à indexer
     *
     * @var int
     */
    protected int $articleId;

    /**
     * Type d'action
     *
     * @var string 'URL_UPDATED'|'URL_DELETED'
     */
    protected string $action;

    /**
     * Nombre de tentatives maximum
     *
     * @var int
     */
    public int $tries = 3;

    /**
     * Timeout en secondes
     *
     * @var int
     */
    public int $timeout = 60;

    /**
     * Créer une nouvelle instance du job
     *
     * @param int $articleId ID de l'article
     * @param string $action Type d'action
     * @return void
     */
    public function __construct(int $articleId, string $action = 'URL_UPDATED')
    {
        $this->articleId = $articleId;
        $this->action = $action;
        
        // Queue configuration - basse priorité
        $this->onQueue('indexing');
    }

    /**
     * Exécuter le job
     *
     * @param IndexingService $indexingService
     * @return void
     */
    public function handle(IndexingService $indexingService): void
    {
        // Récupérer l'article
        $article = Article::with(['platform', 'country', 'language'])->findOrFail($this->articleId);

        // Construire l'URL complète
        $url = $this->buildArticleUrl($article);

        Log::info('🔍 Demande d\'indexation', [
            'article_id' => $article->id,
            'url' => $url,
            'action' => $this->action,
            'attempt' => $this->attempts(),
        ]);

        // Vérifier si déjà dans la queue d'indexation
        $existingQueue = IndexingQueue::where('article_id', $article->id)
            ->whereIn('status', ['pending', 'processing'])
            ->first();

        if ($existingQueue) {
            Log::info('⏭️ Article déjà en queue d\'indexation', [
                'article_id' => $article->id,
                'queue_id' => $existingQueue->id,
            ]);
            return;
        }

        try {
            $results = [];

            // 1. Google Indexing API
            if (config('seo.indexing.google.enabled', true)) {
                try {
                    $googleResult = $indexingService->submitToGoogle($url, $this->action);
                    $results['google'] = [
                        'success' => true,
                        'response' => $googleResult,
                    ];

                    Log::info('✅ Soumis à Google Indexing API', [
                        'article_id' => $article->id,
                        'url' => $url,
                    ]);

                } catch (\Exception $e) {
                    $results['google'] = [
                        'success' => false,
                        'error' => $e->getMessage(),
                    ];

                    Log::warning('⚠️ Échec Google Indexing API', [
                        'article_id' => $article->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            // 2. IndexNow (Bing, Yandex)
            if (config('seo.indexing.indexnow.enabled', true)) {
                try {
                    $indexNowResult = $indexingService->submitToIndexNow($url);
                    $results['indexnow'] = [
                        'success' => true,
                        'response' => $indexNowResult,
                    ];

                    Log::info('✅ Soumis à IndexNow', [
                        'article_id' => $article->id,
                        'url' => $url,
                    ]);

                } catch (\Exception $e) {
                    $results['indexnow'] = [
                        'success' => false,
                        'error' => $e->getMessage(),
                    ];

                    Log::warning('⚠️ Échec IndexNow', [
                        'article_id' => $article->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            // Créer/mettre à jour l'entrée dans indexing_queue
            $queueItem = IndexingQueue::updateOrCreate(
                ['article_id' => $article->id],
                [
                    'url' => $url,
                    'status' => 'completed',
                    'priority' => 'default',
                    'google_status' => $results['google']['success'] ?? false ? 'success' : 'failed',
                    'indexnow_status' => $results['indexnow']['success'] ?? false ? 'success' : 'failed',
                    'attempts' => $this->attempts(),
                    'last_attempt_at' => now(),
                    'metadata' => $results,
                ]
            );

            // Marquer l'article comme indexé si succès
            if (($results['google']['success'] ?? false) || 
                ($results['indexnow']['success'] ?? false)) {
                $article->markAsIndexed();
            }

            Log::info('✅ Demande d\'indexation complétée', [
                'article_id' => $article->id,
                'google' => $results['google']['success'] ?? false,
                'indexnow' => $results['indexnow']['success'] ?? false,
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Échec demande d\'indexation', [
                'article_id' => $article->id,
                'url' => $url,
                'error' => $e->getMessage(),
                'attempt' => $this->attempts(),
            ]);

            // Créer une entrée d'échec
            IndexingQueue::updateOrCreate(
                ['article_id' => $article->id],
                [
                    'url' => $url,
                    'status' => $this->attempts() >= $this->tries ? 'failed' : 'pending',
                    'priority' => 'default',
                    'attempts' => $this->attempts(),
                    'error_message' => $e->getMessage(),
                    'last_attempt_at' => now(),
                ]
            );

            throw $e; // Relancer pour retry
        }
    }

    /**
     * Construire l'URL complète de l'article
     *
     * @param Article $article
     * @return string
     */
    protected function buildArticleUrl(Article $article): string
    {
        $baseUrl = config("platforms.{$article->platform->slug}.url");
        $languageCode = $article->language->code;
        $slug = $article->slug;

        // Format : https://sos-expat.com/fr/articles/slug-article
        return "{$baseUrl}/{$languageCode}/articles/{$slug}";
    }

    /**
     * Gérer l'échec du job
     *
     * @param \Throwable $exception
     * @return void
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('💥 Échec définitif demande d\'indexation', [
            'article_id' => $this->articleId,
            'error' => $exception->getMessage(),
        ]);

        // Marquer comme échoué définitivement
        IndexingQueue::updateOrCreate(
            ['article_id' => $this->articleId],
            [
                'status' => 'failed_permanent',
                'attempts' => $this->tries,
                'error_message' => $exception->getMessage(),
            ]
        );
    }

    /**
     * Tags pour identification du job
     *
     * @return array
     */
    public function tags(): array
    {
        return [
            'indexing',
            'seo',
            'article:' . $this->articleId,
            'action:' . $this->action,
        ];
    }
}