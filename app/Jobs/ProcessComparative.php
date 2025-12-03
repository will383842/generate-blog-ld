<?php

namespace App\Jobs;

use App\Models\Article;
use App\Models\Language;
use App\Models\GenerationLog;
use App\Services\Content\ComparativeGenerator;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

/**
 * Job de génération complète d'un article comparatif
 * 
 * Pipeline comparatif :
 * 1. Validation paramètres
 * 2. Recherche concurrents (Perplexity)
 * 3. Fetch données concurrents (prix, avis, features)
 * 4. Définition critères de comparaison (8 critères)
 * 5. Notation concurrents /10 par critère
 * 6. Génération titre comparatif
 * 7. Génération introduction
 * 8. Génération tableau comparatif HTML
 * 9. Génération graphique radar (Chart.js)
 * 10. Génération sections détaillées par critère
 * 11. Génération verdict final (avec notre plateforme #1 🥇)
 * 12. Génération FAQ comparatives
 * 13. Génération CTA vers inscription
 * 14. Génération meta SEO + JSON-LD Comparison schema
 * 15. Sauvegarde article
 */
class ProcessComparative implements ShouldQueue
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
     * Timeout en secondes (comparatifs peuvent être longs)
     *
     * @var int
     */
    public int $timeout = 600; // 10 minutes

    /**
     * Créer une nouvelle instance du job
     *
     * @param array $params Paramètres de génération :
     *   - platform_id (required)
     *   - country_id (required)
     *   - language_code (required)
     *   - comparison_type (required) : 'platforms', 'services', 'providers'
     *   - competitors_count (optional, default: 5)
     * @return void
     */
    public function __construct(array $params)
    {
        $this->params = $params;
        
        // Queue configuration - priorité plus basse (moins urgent)
        $this->onQueue('content-generation-low');
    }

    /**
     * Exécuter le job
     *
     * @param ComparativeGenerator $generator
     * @return void
     */
    public function handle(ComparativeGenerator $generator): void
    {
        $startTime = now();
        
        Log::info('🚀 Démarrage génération article comparatif', [
            'params' => $this->params,
            'attempt' => $this->attempts(),
        ]);

        DB::beginTransaction();

        try {
            // Génération complète via ComparativeGenerator
            $article = $generator->generate($this->params);

            // Log de succès
            $this->logGeneration($article, 'success', $startTime);

            DB::commit();

            Log::info('✅ Article comparatif généré avec succès', [
                'article_id' => $article->id,
                'title' => $article->title,
                'comparison_type' => $this->params['comparison_type'],
                'competitors' => $article->metadata['competitors_count'] ?? 0,
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

            Log::error('❌ Échec génération article comparatif', [
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
            'language_id' => Language::where('code', $this->params['language_code'])->first()?->id,
            'type' => 'comparative',
            'status' => $status,
            'duration_seconds' => $startTime->diffInSeconds(now()),
            'tokens_used' => $article?->metadata['tokens_used'] ?? null,
            'cost' => $article?->generation_cost ?? 0,
            'error_message' => $errorMessage,
            'metadata' => [
                'params' => $this->params,
                'comparison_type' => $this->params['comparison_type'],
                'competitors_count' => $article?->metadata['competitors_count'] ?? 0,
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
        Log::error('💥 Échec définitif génération article comparatif', [
            'params' => $this->params,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);

        // Logger l'échec définitif
        GenerationLog::create([
            'platform_id' => $this->params['platform_id'],
            'country_id' => $this->params['country_id'],
            'language_id' => Language::where('code', $this->params['language_code'])->first()?->id,
            'type' => 'comparative',
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
            'comparative',
            'platform:' . $this->params['platform_id'],
            'country:' . $this->params['country_id'],
        ];
    }
}