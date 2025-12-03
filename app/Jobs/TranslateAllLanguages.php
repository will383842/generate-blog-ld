<?php

namespace App\Jobs;

use App\Models\Article;
use App\Models\Language;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Job de traduction d'un article dans toutes les langues supportées
 * 
 * Dispatche des jobs TranslateArticle pour chacune des 8 langues cibles
 * (toutes sauf la langue source de l'article).
 * 
 * Langues supportées : FR, EN, DE, ES, PT, RU, ZH, AR, HI (9 langues)
 */
class TranslateAllLanguages implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * ID de l'article à traduire
     *
     * @var int
     */
    protected int $articleId;

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
     * @param int $articleId ID de l'article source
     * @return void
     */
    public function __construct(int $articleId)
    {
        $this->articleId = $articleId;
        
        // Queue configuration
        $this->onQueue('translation');
    }

    /**
     * Exécuter le job
     *
     * @return void
     */
    public function handle(): void
    {
        // Récupérer l'article source
        $article = Article::with('language')->findOrFail($this->articleId);
        
        $sourceLanguageCode = $article->language->code;

        Log::info('🌍 Démarrage traduction multilingue', [
            'article_id' => $article->id,
            'source_language' => $sourceLanguageCode,
            'title' => $article->title,
        ]);

        // Récupérer toutes les langues actives sauf la source
        $targetLanguages = Language::where('is_active', true)
            ->where('code', '!=', $sourceLanguageCode)
            ->get();

        if ($targetLanguages->isEmpty()) {
            Log::warning('⚠️ Aucune langue cible disponible', [
                'article_id' => $article->id,
            ]);
            return;
        }

        Log::info("📋 {$targetLanguages->count()} langues cibles à traduire");

        $dispatched = 0;
        $delaySeconds = 0; // Délai progressif pour éviter surcharge

        foreach ($targetLanguages as $language) {
            try {
                // Dispatcher le job de traduction avec délai progressif
                TranslateArticle::dispatch($this->articleId, $language->code)
                    ->onQueue('translation')
                    ->delay(now()->addSeconds($delaySeconds));

                Log::info("✅ Job traduction dispatché", [
                    'article_id' => $this->articleId,
                    'target_language' => $language->code,
                    'delay' => $delaySeconds . 's',
                ]);

                $dispatched++;
                $delaySeconds += 10; // Espacer de 10 secondes entre chaque

            } catch (\Exception $e) {
                Log::error('❌ Erreur dispatch traduction', [
                    'article_id' => $this->articleId,
                    'target_language' => $language->code,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        Log::info('✅ Traductions multilingues dispatchées', [
            'article_id' => $this->articleId,
            'dispatched' => $dispatched,
            'total_languages' => $targetLanguages->count(),
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
        Log::error('💥 Échec dispatch traductions multilingues', [
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
            'translation',
            'multilingual',
            'article:' . $this->articleId,
        ];
    }
}