<?php

namespace App\Jobs;

use App\Models\ManualTitle;
use App\Services\Content\ManualGenerationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Exception;

class ProcessManualTitle implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Le nombre de tentatives pour le job
     *
     * @var int
     */
    public $tries = 3;

    /**
     * Le nombre de secondes d'attente avant de réessayer
     *
     * @var int
     */
    public $backoff = 60;

    /**
     * Le timeout du job en secondes
     *
     * @var int
     */
    public $timeout = 600; // 10 minutes

    /**
     * Le titre manuel à traiter
     *
     * @var ManualTitle
     */
    protected ManualTitle $manualTitle;

    /**
     * Create a new job instance.
     */
    public function __construct(ManualTitle $manualTitle)
    {
        $this->manualTitle = $manualTitle;
        
        // Assigner à la queue spécifique
        $this->onQueue('manual-generation');
    }

    /**
     * Execute the job.
     */
    public function handle(ManualGenerationService $service): void
    {
        try {
            Log::info("Démarrage traitement titre manuel", [
                'manual_title_id' => $this->manualTitle->id,
                'title' => $this->manualTitle->title,
                'attempt' => $this->attempts(),
            ]);

            // Traiter le titre manuel
            $article = $service->processManualTitle($this->manualTitle);

            Log::info("Titre manuel traité avec succès", [
                'manual_title_id' => $this->manualTitle->id,
                'article_id' => $article->id,
                'attempt' => $this->attempts(),
            ]);

        } catch (Exception $e) {
            Log::error("Erreur traitement titre manuel", [
                'manual_title_id' => $this->manualTitle->id,
                'error' => $e->getMessage(),
                'attempt' => $this->attempts(),
                'max_tries' => $this->tries,
            ]);

            // Si c'est la dernière tentative, marquer comme failed
            if ($this->attempts() >= $this->tries) {
                $this->manualTitle->markAsFailed();
            }

            // Relancer l'exception pour que Laravel gère le retry
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(Exception $exception): void
    {
        Log::error("Job ProcessManualTitle définitivement échoué", [
            'manual_title_id' => $this->manualTitle->id,
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts(),
        ]);

        // Marquer comme failed
        $this->manualTitle->markAsFailed();
    }

    /**
     * Get the tags that should be assigned to the job.
     *
     * @return array<int, string>
     */
    public function tags(): array
    {
        return [
            'manual-generation',
            'manual_title:' . $this->manualTitle->id,
            'platform:' . $this->manualTitle->platform_id,
        ];
    }
}