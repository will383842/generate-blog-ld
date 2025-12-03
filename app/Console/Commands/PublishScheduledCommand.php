<?php

namespace App\Console\Commands;

use App\Models\PublicationQueue;
use App\Models\Article;
use App\Services\Publishing\PublicationScheduler;
use App\Services\Publishing\AntiSpamChecker;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;

/**
 * Commande de publication des articles planifiés
 * 
 * Exécutée toutes les minutes via cron pour publier les articles
 * dont le créneau scheduled_at est arrivé.
 * 
 * Usage: php artisan content:publish-scheduled
 */
class PublishScheduledCommand extends Command
{
    /**
     * Nom et signature de la commande
     *
     * @var string
     */
    protected $signature = 'content:publish-scheduled
                            {--dry-run : Simuler sans publier réellement}
                            {--platform= : Publier uniquement pour une plateforme spécifique}
                            {--limit=10 : Nombre maximum d\'articles à publier par exécution}';

    /**
     * Description de la commande
     *
     * @var string
     */
    protected $description = 'Publie les articles planifiés dont le créneau est arrivé';

    protected PublicationScheduler $scheduler;
    protected AntiSpamChecker $antiSpamChecker;

    /**
     * Constructeur
     */
    public function __construct(
        PublicationScheduler $scheduler,
        AntiSpamChecker $antiSpamChecker
    ) {
        parent::__construct();
        $this->scheduler = $scheduler;
        $this->antiSpamChecker = $antiSpamChecker;
    }

    /**
     * Exécuter la commande
     *
     * @return int
     */
    public function handle(): int
    {
        $startTime = now();
        $dryRun = $this->option('dry-run');
        $platformId = $this->option('platform');
        $limit = (int) $this->option('limit');

        $this->info('🚀 Démarrage de la publication des articles planifiés...');
        
        if ($dryRun) {
            $this->warn('⚠️  Mode DRY-RUN activé - aucune publication réelle');
        }

        // Récupérer les articles prêts à publier
        $query = PublicationQueue::readyToPublish()
            ->byPriority()
            ->with(['article', 'platform'])
            ->limit($limit);

        if ($platformId) {
            $query->forPlatform($platformId);
        }

        $items = $query->get();

        if ($items->isEmpty()) {
            $this->info('✅ Aucun article à publier pour le moment');
            return Command::SUCCESS;
        }

        $this->info("📋 {$items->count()} article(s) à publier");
        $this->newLine();

        $published = 0;
        $failed = 0;
        $skipped = 0;

        foreach ($items as $item) {
            $result = $this->publishItem($item, $dryRun);

            switch ($result) {
                case 'published':
                    $published++;
                    break;
                case 'failed':
                    $failed++;
                    break;
                case 'skipped':
                    $skipped++;
                    break;
            }
        }

        // Résumé
        $this->newLine();
        $this->info('📊 Résumé de l\'exécution :');
        $this->table(
            ['Statut', 'Nombre'],
            [
                ['✅ Publiés', $published],
                ['❌ Échecs', $failed],
                ['⏭️  Ignorés', $skipped],
                ['📝 Total traité', $items->count()],
            ]
        );

        $duration = $startTime->diffInSeconds(now());
        $this->info("⏱️  Durée d'exécution : {$duration}s");

        // Code de retour
        if ($failed > 0) {
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }

    /**
     * Publier un élément de la queue
     *
     * @param PublicationQueue $item
     * @param bool $dryRun
     * @return string 'published'|'failed'|'skipped'
     */
    protected function publishItem(PublicationQueue $item, bool $dryRun): string
    {
        $article = $item->article;
        $platform = $item->platform;

        // Vérifier que l'article existe toujours
        if (!$article) {
            $this->error("❌ Article #{$item->article_id} introuvable");
            $item->markAsFailed('Article introuvable');
            return 'failed';
        }

        // Vérifier les règles anti-spam
        $canPublish = $this->antiSpamChecker->canPublishNow($item->platform_id);
        
        if (!$canPublish['can_publish']) {
            $this->warn("⏭️  Article #{$article->id} ignoré : {$canPublish['reason']}");
            
            // Replanifier
            $this->scheduler->reschedule($item);
            
            return 'skipped';
        }

        $this->line("📤 Publication : {$article->title}");
        $this->line("   Plateforme : {$platform->name}");
        $this->line("   Prévu à : {$item->scheduled_at->format('Y-m-d H:i:s')}");

        if ($dryRun) {
            $this->info('   ✅ [DRY-RUN] Publication simulée');
            return 'published';
        }

        try {
            // Marquer comme "en cours de publication"
            $item->markAsPublishing();

            // Publier vers la plateforme
            $response = $this->publishToPlatform($article, $platform);

            if ($response['success']) {
                // Succès !
                $item->markAsPublished();
                $article->update([
                    'status' => Article::STATUS_PUBLISHED,
                    'published_at' => now(),
                ]);

                $this->info('   ✅ Publié avec succès');
                
                Log::info('Article publié', [
                    'article_id' => $article->id,
                    'platform' => $platform->name,
                    'published_at' => now()->toDateTimeString(),
                ]);

                return 'published';

            } else {
                // Échec
                throw new \Exception($response['error'] ?? 'Erreur de publication');
            }

        } catch (\Exception $e) {
            $this->error("   ❌ Échec : {$e->getMessage()}");

            $item->markAsFailed($e->getMessage());

            // Si on peut retry, replanifier
            if ($item->canRetry()) {
                $this->warn("   🔄 Replanification (tentative {$item->attempts}/{$item->max_attempts})");
                $this->scheduler->reschedule($item);
            } else {
                $this->error("   ❌ Échec définitif après {$item->attempts} tentatives");
                
                $article->update([
                    'status' => Article::STATUS_FAILED,
                ]);
            }

            Log::error('Échec de publication', [
                'article_id' => $article->id,
                'platform' => $platform->name,
                'error' => $e->getMessage(),
                'attempt' => $item->attempts,
            ]);

            return 'failed';
        }
    }

    /**
     * Publier l'article vers la plateforme (API)
     *
     * @param Article $article
     * @param \App\Models\Platform $platform
     * @return array ['success' => bool, 'error' => string|null]
     */
    protected function publishToPlatform(Article $article, $platform): array
    {
        // Récupérer la configuration de la plateforme
        $apiUrl = config("platforms.{$platform->slug}.api_url");
        $apiKey = config("platforms.{$platform->slug}.api_key");

        if (!$apiUrl || !$apiKey) {
            return [
                'success' => false,
                'error' => 'Configuration API manquante pour cette plateforme',
            ];
        }

        try {
            // Préparer les données de l'article
            $data = [
                'title' => $article->title,
                'slug' => $article->slug,
                'content' => $article->content,
                'excerpt' => $article->excerpt,
                'status' => 'publish',
                'meta' => [
                    'title' => $article->meta_title,
                    'description' => $article->meta_description,
                ],
                'featured_image' => $article->image_url,
                'categories' => $article->theme_type,
                'tags' => [],
            ];

            // Envoyer la requête API
            $response = Http::timeout(config('publishing.api.timeout', 30))
                ->retry(config('publishing.api.retry_attempts', 3), config('publishing.api.retry_delay', 5))
                ->withHeaders([
                    'Authorization' => "Bearer {$apiKey}",
                    'Content-Type' => 'application/json',
                    'X-Content-Engine' => 'v9.4',
                ])
                ->post("{$apiUrl}/articles", $data);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'error' => null,
                ];
            }

            return [
                'success' => false,
                'error' => "Erreur API {$response->status()}: " . $response->body(),
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}