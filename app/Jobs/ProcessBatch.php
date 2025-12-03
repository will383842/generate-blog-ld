<?php

namespace App\Jobs;

use App\Models\GenerationQueue;
use App\Models\GenerationLog;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Job d'orchestration de génération par lot
 * 
 * Traite une queue de génération en dispatchant les jobs appropriés
 * selon le type de contenu à générer (article, landing, comparative).
 * 
 * Utilise la table generation_queues pour gérer la file d'attente.
 */
class ProcessBatch implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Type de contenu à traiter
     *
     * @var string 'article'|'landing'|'comparative'|'all'
     */
    protected string $contentType;

    /**
     * Nombre maximum d'items à traiter
     *
     * @var int
     */
    protected int $limit;

    /**
     * Plateforme spécifique (optionnel)
     *
     * @var int|null
     */
    protected ?int $platformId;

    /**
     * Nombre de tentatives maximum
     *
     * @var int
     */
    public int $tries = 1; // Pas de retry pour l'orchestrateur

    /**
     * Timeout en secondes
     *
     * @var int
     */
    public int $timeout = 60;

    /**
     * Créer une nouvelle instance du job
     *
     * @param string $contentType Type de contenu à traiter
     * @param int $limit Nombre max d'items
     * @param int|null $platformId Plateforme spécifique
     * @return void
     */
    public function __construct(
        string $contentType = 'all',
        int $limit = 10,
        ?int $platformId = null
    ) {
        $this->contentType = $contentType;
        $this->limit = $limit;
        $this->platformId = $platformId;
        
        // Queue configuration - haute priorité
        $this->onQueue('batch-processing');
    }

    /**
     * Exécuter le job
     *
     * @return void
     */
    public function handle(): void
    {
        Log::info('🔄 Démarrage traitement batch', [
            'content_type' => $this->contentType,
            'limit' => $this->limit,
            'platform_id' => $this->platformId,
        ]);

        // Récupérer les items en attente
        $query = GenerationQueue::where('status', 'pending')
            ->orderBy('priority', 'desc')
            ->orderBy('created_at', 'asc')
            ->limit($this->limit);

        // Filtrer par type si spécifié
        if ($this->contentType !== 'all') {
            $query->where('type', $this->contentType);
        }

        // Filtrer par plateforme si spécifié
        if ($this->platformId) {
            $query->where('platform_id', $this->platformId);
        }

        $items = $query->get();

        if ($items->isEmpty()) {
            Log::info('✅ Aucun item à traiter dans la queue');
            return;
        }

        Log::info("📋 {$items->count()} item(s) à traiter");

        $dispatched = 0;
        $failed = 0;

        foreach ($items as $item) {
            try {
                // Dispatch le job approprié selon le type
                $this->dispatchGenerationJob($item);
                
                // Marquer comme "processing"
                $item->update([
                    'status' => 'processing',
                    'started_at' => now(),
                ]);

                $dispatched++;

            } catch (\Exception $e) {
                Log::error('❌ Erreur dispatch job génération', [
                    'item_id' => $item->id,
                    'type' => $item->type,
                    'error' => $e->getMessage(),
                ]);

                // Marquer comme "failed"
                $item->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                ]);

                $failed++;
            }
        }

        Log::info('✅ Traitement batch terminé', [
            'dispatched' => $dispatched,
            'failed' => $failed,
            'total' => $items->count(),
        ]);
    }

    /**
     * Dispatcher le job de génération approprié
     *
     * @param GenerationQueue $item
     * @return void
     * @throws \Exception
     */
    protected function dispatchGenerationJob(GenerationQueue $item): void
    {
        $params = $item->params;

        switch ($item->type) {
            case 'article':
                ProcessArticle::dispatch($params)
                    ->onQueue('content-generation')
                    ->delay(now()->addSeconds($this->calculateDelay($item)));
                break;

            case 'landing':
                ProcessLanding::dispatch($params)
                    ->onQueue('content-generation')
                    ->delay(now()->addSeconds($this->calculateDelay($item)));
                break;

            case 'comparative':
                ProcessComparative::dispatch($params)
                    ->onQueue('content-generation-low')
                    ->delay(now()->addSeconds($this->calculateDelay($item)));
                break;

            default:
                throw new \Exception("Type de contenu non supporté : {$item->type}");
        }

        Log::info("✅ Job dispatché", [
            'item_id' => $item->id,
            'type' => $item->type,
            'priority' => $item->priority,
        ]);
    }

    /**
     * Calculer le délai de dispatch basé sur la priorité
     *
     * @param GenerationQueue $item
     * @return int Délai en secondes
     */
    protected function calculateDelay(GenerationQueue $item): int
    {
        // Priorité haute : immédiat
        if ($item->priority === 'high') {
            return 0;
        }

        // Priorité normale : 30 secondes
        if ($item->priority === 'normal') {
            return 30;
        }

        // Priorité basse : 60 secondes
        return 60;
    }

    /**
     * Gérer l'échec du job
     *
     * @param \Throwable $exception
     * @return void
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('💥 Échec traitement batch', [
            'content_type' => $this->contentType,
            'limit' => $this->limit,
            'platform_id' => $this->platformId,
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
        $tags = [
            'batch-processing',
            'type:' . $this->contentType,
        ];

        if ($this->platformId) {
            $tags[] = 'platform:' . $this->platformId;
        }

        return $tags;
    }
}