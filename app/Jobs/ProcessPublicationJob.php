<?php

namespace App\Jobs;

use App\Models\Article;
use App\Models\PublicationQueue;
use App\Services\Publishing\PublicationScheduler;
use App\Services\Publishing\AntiSpamChecker;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

/**
 * Job de publication d'un article
 * 
 * Traite la publication d'un article planifié vers sa plateforme cible.
 * Utilise la queue Laravel pour traiter en arrière-plan.
 */
class ProcessPublicationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * ID de l'élément de la queue à publier
     *
     * @var int
     */
    protected int $queueItemId;

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
     * @param int $queueItemId
     * @return void
     */
    public function __construct(int $queueItemId)
    {
        $this->queueItemId = $queueItemId;
    }

    /**
     * Exécuter le job
     *
     * @param PublicationScheduler $scheduler
     * @param AntiSpamChecker $antiSpamChecker
     * @return void
     */
    public function handle(
        PublicationScheduler $scheduler,
        AntiSpamChecker $antiSpamChecker
    ): void {
        // Récupérer l'élément de la queue
        $item = PublicationQueue::with(['article', 'platform'])->find($this->queueItemId);

        if (!$item) {
            Log::error('PublicationQueue introuvable', ['id' => $this->queueItemId]);
            return;
        }

        $article = $item->article;
        $platform = $item->platform;

        // Vérifier que l'article existe
        if (!$article) {
            Log::error('Article introuvable', ['article_id' => $item->article_id]);
            $item->markAsFailed('Article introuvable');
            return;
        }

        // Vérifier les règles anti-spam
        $canPublish = $antiSpamChecker->canPublishNow($item->platform_id);
        
        if (!$canPublish['can_publish']) {
            Log::warning('Publication refusée par anti-spam', [
                'article_id' => $article->id,
                'reason' => $canPublish['reason'],
            ]);

            // Replanifier
            $scheduler->reschedule($item);
            return;
        }

        Log::info('Début de publication', [
            'article_id' => $article->id,
            'title' => $article->title,
            'platform' => $platform->name,
        ]);

        try {
            // Marquer comme "en cours"
            $item->markAsPublishing();

            // Publier vers la plateforme
            $this->publishToPlatform($article, $platform);

            // Marquer comme publié
            $item->markAsPublished();
            
            $article->update([
                'status' => Article::STATUS_PUBLISHED,
                'published_at' => now(),
            ]);

            Log::info('Article publié avec succès', [
                'article_id' => $article->id,
                'platform' => $platform->name,
            ]);

        } catch (\Exception $e) {
            Log::error('Échec de publication', [
                'article_id' => $article->id,
                'platform' => $platform->name,
                'error' => $e->getMessage(),
                'attempt' => $item->attempts,
            ]);

            $item->markAsFailed($e->getMessage());

            // Si on peut retry, le job sera relancé automatiquement
            if (!$item->canRetry()) {
                $article->update([
                    'status' => Article::STATUS_FAILED,
                ]);

                // Notification optionnelle
                $this->notifyFailure($article, $platform, $e);
            } else {
                // Replanifier avec délai
                $scheduler->reschedule($item);
            }

            throw $e; // Relancer l'exception pour que Laravel gère le retry
        }
    }

    /**
     * Publier l'article vers la plateforme via API
     *
     * @param Article $article
     * @param \App\Models\Platform $platform
     * @return void
     * @throws \Exception
     */
    protected function publishToPlatform(Article $article, $platform): void
    {
        // Récupérer la configuration API
        $apiUrl = config("platforms.{$platform->slug}.api_url");
        $apiKey = config("platforms.{$platform->slug}.api_key");

        if (!$apiUrl || !$apiKey) {
            throw new \Exception('Configuration API manquante pour cette plateforme');
        }

        // Préparer les données
        $data = $this->prepareArticleData($article);

        // Envoyer la requête
        $response = Http::timeout(config('platforms.publish.timeout', 30))
            ->retry(
                config('platforms.publish.retry_attempts', 3),
                config('platforms.publish.retry_delay', 60)
            )
            ->withHeaders([
                'Authorization' => "Bearer {$apiKey}",
                'Content-Type' => 'application/json',
                'X-Content-Engine' => 'v9.4',
                'X-Article-ID' => $article->id,
                'X-Platform' => $platform->slug,
            ])
            ->post("{$apiUrl}/articles", $data);

        if (!$response->successful()) {
            throw new \Exception(
                "Erreur API {$response->status()}: " . $response->body()
            );
        }

        // Stocker l'ID distant si retourné
        $responseData = $response->json();
        if (isset($responseData['id'])) {
            $article->update([
                'metadata->remote_id' => $responseData['id'],
                'metadata->remote_url' => $responseData['url'] ?? null,
            ]);
        }
    }

    /**
     * Préparer les données de l'article pour l'API
     *
     * @param Article $article
     * @return array
     */
    protected function prepareArticleData(Article $article): array
    {
        return [
            'title' => $article->title,
            'slug' => $article->slug,
            'content' => $article->content,
            'excerpt' => $article->excerpt,
            'status' => 'publish',
            
            'meta' => [
                'title' => $article->meta_title,
                'description' => $article->meta_description,
                'canonical_url' => $article->canonical_url,
            ],
            
            'seo' => [
                'json_ld' => $article->json_ld,
            ],
            
            'featured_image' => [
                'url' => $article->image_url,
                'alt' => $article->image_alt,
            ],
            
            'taxonomy' => [
                'theme_type' => $article->theme_type,
                'theme_id' => $article->theme_id,
            ],
            
            'localization' => [
                'country_id' => $article->country_id,
                'language_id' => $article->language_id,
            ],
            
            'metadata' => [
                'word_count' => $article->word_count,
                'reading_time' => $article->reading_time,
                'quality_score' => $article->quality_score,
                'generated_by' => 'content-engine-v9.4',
                'generated_at' => $article->created_at->toIso8601String(),
            ],
        ];
    }

    /**
     * Notifier l'échec définitif
     *
     * @param Article $article
     * @param \App\Models\Platform $platform
     * @param \Exception $exception
     * @return void
     */
    protected function notifyFailure(Article $article, $platform, \Exception $exception): void
    {
        if (!config('publishing.monitoring.send_alerts', true)) {
            return;
        }

        $emails = config('publishing.monitoring.alert_emails', []);
        
        if (empty($emails)) {
            return;
        }

        // TODO: Implémenter l'envoi d'email avec Laravel Mail
        // Mail::to($emails)->send(new PublicationFailedMail($article, $platform, $exception));

        // Alternative : notification Slack
        $slackWebhook = config('publishing.monitoring.slack_webhook');
        
        if ($slackWebhook) {
            try {
                Http::post($slackWebhook, [
                    'text' => "❌ Échec de publication définitif",
                    'attachments' => [[
                        'color' => 'danger',
                        'fields' => [
                            [
                                'title' => 'Article',
                                'value' => $article->title,
                                'short' => true,
                            ],
                            [
                                'title' => 'Plateforme',
                                'value' => $platform->name,
                                'short' => true,
                            ],
                            [
                                'title' => 'Erreur',
                                'value' => $exception->getMessage(),
                                'short' => false,
                            ],
                        ],
                    ]],
                ]);
            } catch (\Exception $e) {
                Log::error('Échec notification Slack', ['error' => $e->getMessage()]);
            }
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
        Log::error('Job de publication échoué définitivement', [
            'queue_item_id' => $this->queueItemId,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);

        // Marquer l'élément comme failed si possible
        $item = PublicationQueue::find($this->queueItemId);
        if ($item) {
            $item->markAsFailed($exception->getMessage());
            
            if ($item->article) {
                $item->article->update([
                    'status' => Article::STATUS_FAILED,
                ]);
            }
        }
    }
}