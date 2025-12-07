<?php

namespace App\Jobs;

use App\Models\Article;
use App\Models\PublicationQueue;
use App\Services\Publishing\PublicationScheduler;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Job de publication d'un article
 * 
 * Planifie la publication d'un article en utilisant le système
 * de publication anti-spam (Phase 8).
 * 
 * Ce job crée une entrée dans publication_queue et laisse
 * le système de publication automatique (PublishScheduledCommand)
 * gérer la publication effective au moment optimal.
 */
class PublishArticle implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * ID de l'article à publier
     *
     * @var int
     */
    protected int $articleId;

    /**
     * Priorité de publication
     *
     * @var string 'high'|'default'|'low'
     */
    protected string $priority;

    /**
     * Publier immédiatement (si possible)
     *
     * @var bool
     */
    protected bool $immediate;

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
     * Délais entre les tentatives (30s, 2min, 5min)
     */
    public function backoff(): array
    {
        return [30, 120, 300];
    }

    /**
     * Créer une nouvelle instance du job
     *
     * @param int $articleId ID de l'article
     * @param string $priority Priorité
     * @param bool $immediate Publier immédiatement
     * @return void
     */
    public function __construct(
        int $articleId,
        string $priority = 'default',
        bool $immediate = false
    ) {
        $this->articleId = $articleId;
        $this->priority = $priority;
        $this->immediate = $immediate;
        
        // Queue configuration
        $this->onQueue('publishing');
    }

    /**
     * Exécuter le job
     *
     * @param PublicationScheduler $scheduler
     * @return void
     */
    public function handle(PublicationScheduler $scheduler): void
    {
        // Récupérer l'article
        $article = Article::findOrFail($this->articleId);

        // Vérifier que l'article est prêt à être publié
        if ($article->status !== Article::STATUS_DRAFT && 
            $article->status !== Article::STATUS_PENDING) {
            Log::warning('⚠️ Article non publiable', [
                'article_id' => $article->id,
                'status' => $article->status,
            ]);
            return;
        }

        // Vérifier qu'il n'est pas déjà dans la queue
        $existingQueue = PublicationQueue::where('article_id', $article->id)
            ->whereIn('status', ['scheduled', 'publishing'])
            ->first();

        if ($existingQueue) {
            Log::info('⏭️ Article déjà en queue de publication', [
                'article_id' => $article->id,
                'queue_id' => $existingQueue->id,
                'scheduled_at' => $existingQueue->scheduled_at,
            ]);
            return;
        }

        Log::info('📤 Planification publication article', [
            'article_id' => $article->id,
            'title' => $article->title,
            'priority' => $this->priority,
            'immediate' => $this->immediate,
        ]);

        try {
            // Planifier la publication via PublicationScheduler (Phase 8)
            $queueItem = $scheduler->scheduleArticle($article, $this->priority);

            Log::info('✅ Article planifié pour publication', [
                'article_id' => $article->id,
                'queue_id' => $queueItem->id,
                'scheduled_at' => $queueItem->scheduled_at->toDateTimeString(),
                'priority' => $this->priority,
            ]);

            // Si publication immédiate demandée et possible
            if ($this->immediate) {
                // Dispatcher ProcessPublicationJob immédiatement
                ProcessPublicationJob::dispatch($queueItem->id)
                    ->onQueue('publishing-immediate');

                Log::info('⚡ Publication immédiate dispatchée', [
                    'article_id' => $article->id,
                    'queue_id' => $queueItem->id,
                ]);
            }

        } catch (\Exception $e) {
            Log::error('❌ Échec planification publication', [
                'article_id' => $article->id,
                'error' => $e->getMessage(),
                'attempt' => $this->attempts(),
            ]);

            throw $e; // Relancer pour retry
        }
    }

    /**
     * Gérer l'échec du job
     *
     * @param \Throwable $exception
     * @return void
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('💥 Échec définitif planification publication', [
            'article_id' => $this->articleId,
            'error' => $exception->getMessage(),
        ]);
    }

    /**
     * Tags pour identification du job
     *
     * @return array
     */
    public function tags(): array
    {
        return [
            'publishing',
            'article:' . $this->articleId,
            'priority:' . $this->priority,
        ];
    }
}