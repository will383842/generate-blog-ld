<?php

namespace App\Jobs;

use App\Models\Article;
use App\Models\Language;
use App\Models\GenerationLog;
use App\Services\Content\LandingGenerator;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

/**
 * Job de génération complète d'une landing page
 * 
 * Pipeline landing page :
 * 1. Validation paramètres
 * 2. Génération hero (titre H1 + CTA)
 * 3. Génération problème (3-4 douleurs)
 * 4. Génération solution (bénéfices)
 * 5. Génération avantages (5-7 points)
 * 6. Génération "Comment ça marche" (3-5 étapes)
 * 7. Génération preuves sociales (testimonials)
 * 8. Génération tarifs (optionnel)
 * 9. Génération FAQ (5-8 questions)
 * 10. Génération CTA final
 * 11. Génération meta SEO
 * 12. Assemblage complet + sauvegarde
 */
class ProcessLanding implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Paramètres de génération
     *
     * @var array
     */
    protected array $params;

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
    public int $timeout = 300; // 5 minutes

    /**
     * Créer une nouvelle instance du job
     *
     * @param array $params Paramètres de génération :
     *   - platform_id (required)
     *   - country_id (required)
     *   - language_id (required)
     *   - service (required) - Service ou thème principal
     *   - target_audience (optional)
     *   - keywords (optional)
     *   - sections_enabled (optional)
     * @return void
     */
    public function __construct(array $params)
    {
        $this->params = $params;
        
        // Queue configuration
        $this->onQueue('content-generation');
    }

    /**
     * Exécuter le job
     *
     * @param LandingGenerator $generator
     * @return void
     */
    public function handle(LandingGenerator $generator): void
    {
        $startTime = now();
        
        Log::info('🚀 Démarrage génération landing page', [
            'params' => $this->params,
            'attempt' => $this->attempts(),
        ]);

        DB::beginTransaction();

        try {
            // Génération complète via LandingGenerator
            $article = $generator->generate($this->params);

            // Log de succès
            $this->logGeneration($article, 'success', $startTime);

            DB::commit();

            Log::info('✅ Landing page générée avec succès', [
                'article_id' => $article->id,
                'title' => $article->title,
                'service' => $this->params['service'],
                'duration' => $startTime->diffInSeconds(now()) . 's',
            ]);

            // Dispatch jobs suivants si configuré
            if (config('content.auto_translate', false)) {
                TranslateAllLanguages::dispatch($article->id)
                    ->onQueue('translation');
            }

            if (config('content.auto_generate_image', false)) {
                GenerateImage::dispatch($article->id)
                    ->onQueue('image-generation');
            }

        } catch (\Exception $e) {
            DB::rollBack();

            // Log d'erreur
            $this->logGeneration(null, 'failed', $startTime, $e->getMessage());

            Log::error('❌ Échec génération landing page', [
                'params' => $this->params,
                'error' => $e->getMessage(),
                'attempt' => $this->attempts(),
            ]);

            throw $e; // Relancer pour retry
        }
    }

    /**
     * Logger la génération
     *
     * @param Article|null $article
     * @param string $status
     * @param \Carbon\Carbon $startTime
     * @param string|null $errorMessage
     * @return void
     */
    protected function logGeneration(
        ?Article $article,
        string $status,
        $startTime,
        ?string $errorMessage = null
    ): void {
        GenerationLog::create([
            'article_id' => $article?->id,
            'platform_id' => $this->params['platform_id'],
            'country_id' => $this->params['country_id'],
            'language_id' => $this->params['language_id'],
            'type' => 'landing',
            'status' => $status,
            'duration_seconds' => $startTime->diffInSeconds(now()),
            'tokens_used' => $article?->metadata['tokens_used'] ?? null,
            'cost' => $article?->generation_cost ?? 0,
            'error_message' => $errorMessage,
            'metadata' => [
                'params' => $this->params,
                'service' => $this->params['service'],
                'word_count' => $article?->word_count,
            ],
        ]);
    }

    /**
     * Gérer l'échec du job
     *
     * @param \Throwable $exception
     * @return void
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('💥 Échec définitif génération landing page', [
            'params' => $this->params,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);

        // Logger l'échec définitif
        GenerationLog::create([
            'platform_id' => $this->params['platform_id'],
            'country_id' => $this->params['country_id'],
            'language_id' => $this->params['language_id'],
            'type' => 'landing',
            'status' => 'failed_permanent',
            'error_message' => $exception->getMessage(),
            'metadata' => [
                'params' => $this->params,
                'attempts' => $this->tries,
            ],
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
            'content-generation',
            'landing',
            'platform:' . $this->params['platform_id'],
            'country:' . $this->params['country_id'],
        ];
    }
}