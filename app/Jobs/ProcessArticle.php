<?php

namespace App\Jobs;

use App\Models\Article;
use App\Models\Country;
use App\Models\Language;
use App\Models\Platform;
use App\Models\GenerationLog;
use App\Services\Content\ArticleGenerator;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

/**
 * Job de génération complète d'un article
 * 
 * Pipeline en 12 étapes :
 * 1. Validation paramètres
 * 2. Recherche sources (Perplexity)
 * 3. Génération titre (anti-doublon SHA256)
 * 4. Génération accroche
 * 5. Génération introduction
 * 6. Génération contenu (6-8 sections H2)
 * 7. Génération FAQs (8 questions)
 * 8. Génération meta (title, description)
 * 9. Génération JSON-LD (schema.org)
 * 10. Ajout liens internes/externes
 * 11. Génération CTA
 * 12. Calcul quality_score + sauvegarde
 */
class ProcessArticle implements ShouldQueue
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
     *   - language_code (required)
     *   - theme_id (required)
     *   - provider_type_id (optional)
     *   - lawyer_specialty_id (optional)
     *   - expat_domain_id (optional)
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
     * @param ArticleGenerator $generator
     * @return void
     */
    public function handle(ArticleGenerator $generator): void
    {
        $startTime = now();
        
        Log::info('🚀 Démarrage génération article', [
            'params' => $this->params,
            'attempt' => $this->attempts(),
        ]);

        DB::beginTransaction();

        try {
            // Étape 1-12 : Génération complète via ArticleGenerator
            $article = $generator->generate($this->params);

            // Log de succès
            $this->logGeneration($article, 'completed', $startTime);

            DB::commit();

            Log::info('✅ Article généré avec succès', [
                'article_id' => $article->id,
                'title' => $article->title,
                'quality_score' => $article->quality_score,
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

            Log::error('❌ Échec génération article', [
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
            'type' => 'article',
            'status' => $status,
            'duration_seconds' => $startTime->diffInSeconds(now()),
            'tokens_used' => $article?->metadata['tokens_used'] ?? null,
            'cost' => $article?->generation_cost ?? 0,
            'error_message' => $errorMessage,
            'metadata' => [
                'params' => $this->params,
                'quality_score' => $article?->quality_score,
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
        Log::error('💥 Échec définitif génération article', [
            'params' => $this->params,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);

        // Logger l'échec définitif
        GenerationLog::create([
            'platform_id' => $this->params['platform_id'],
            'country_id' => $this->params['country_id'],
            'language_id' => Language::where('code', $this->params['language_code'])->first()?->id,
            'type' => 'article',
            'status' => 'failed',
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
            'article',
            'platform:' . $this->params['platform_id'],
            'country:' . $this->params['country_id'],
        ];
    }
}