<?php

namespace App\Jobs;

use App\Models\Article;
use App\Models\ArticleTranslation;
use App\Models\Language;
use App\Services\Translation\TranslationService;
use App\Services\Translation\SlugService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

/**
 * Job de traduction d'un article dans une langue
 * 
 * Traduit un article depuis la langue source vers une langue cible
 * en utilisant GPT-4o-mini (99% moins cher que GPT-4).
 * 
 * CORRIGÉ: Méthode generateSlug() au lieu de generate()
 */
class TranslateArticle implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * ID de l'article à traduire
     */
    protected int $articleId;

    /**
     * Code de la langue cible
     */
    protected string $targetLanguageCode;

    /**
     * Nombre de tentatives maximum
     */
    public int $tries = 3;

    /**
     * Timeout en secondes
     */
    public int $timeout = 180; // 3 minutes

    /**
     * Délais entre tentatives (backoff exponentiel)
     */
    public function backoff(): array
    {
        return [30, 60, 120];
    }

    /**
     * Créer une nouvelle instance du job
     */
    public function __construct(int $articleId, string $targetLanguageCode)
    {
        $this->articleId = $articleId;
        $this->targetLanguageCode = $targetLanguageCode;
        
        // Queue configuration
        $this->onQueue('translation');
    }

    /**
     * Exécuter le job
     */
    public function handle(
        TranslationService $translationService,
        SlugService $slugService
    ): void {
        $startTime = now();
        
        // Récupérer l'article source
        $article = Article::with('language')->findOrFail($this->articleId);
        
        // Récupérer la langue cible
        $targetLanguage = Language::where('code', $this->targetLanguageCode)->firstOrFail();

        Log::info('🌐 Démarrage traduction article', [
            'article_id' => $article->id,
            'from' => $article->language->code,
            'to' => $this->targetLanguageCode,
            'title' => $article->title,
        ]);

        // Vérifier que la traduction n'existe pas déjà
        $existingTranslation = ArticleTranslation::where('article_id', $article->id)
            ->where('language_id', $targetLanguage->id)
            ->first();

        if ($existingTranslation) {
            Log::warning('⚠️ Traduction déjà existante', [
                'article_id' => $article->id,
                'language' => $this->targetLanguageCode,
            ]);
            return;
        }

        DB::beginTransaction();

        try {
            // Traduire le titre
            $translatedTitle = $translationService->translateText(
                $article->title,
                $article->language->code,
                $this->targetLanguageCode,
                'title'
            );

            // Traduire l'extrait
            $translatedExcerpt = $article->excerpt 
                ? $translationService->translateText(
                    $article->excerpt,
                    $article->language->code,
                    $this->targetLanguageCode,
                    'excerpt'
                )
                : null;

            // Traduire le contenu
            $translatedContent = $translationService->translateLongText(
                $article->content,
                $article->language->code,
                $this->targetLanguageCode
            );

            // Traduire la meta description
            $translatedMetaDescription = $article->meta_description
                ? $translationService->translateText(
                    $article->meta_description,
                    $article->language->code,
                    $this->targetLanguageCode,
                    'meta'
                )
                : null;

            // ✅ CORRIGÉ: Utiliser generateSlug() au lieu de generate()
            $slug = $slugService->generateSlug(
                $translatedTitle,
                $this->targetLanguageCode
            );

            // Créer la traduction
            $translation = ArticleTranslation::create([
                'article_id' => $article->id,
                'language_id' => $targetLanguage->id,
                'title' => $translatedTitle,
                'slug' => $slug,
                'excerpt' => $translatedExcerpt,
                'content' => $translatedContent,
                'meta_title' => $translatedTitle,
                'meta_description' => $translatedMetaDescription,
                'status' => 'published',
            ]);

            DB::commit();

            $duration = $startTime->diffInSeconds(now());

            Log::info('✅ Traduction réussie', [
                'article_id' => $article->id,
                'language' => $this->targetLanguageCode,
                'translation_id' => $translation->id,
                'duration' => $duration . 's',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('❌ Échec traduction', [
                'article_id' => $article->id,
                'language' => $this->targetLanguageCode,
                'error' => $e->getMessage(),
                'attempt' => $this->attempts(),
            ]);

            throw $e;
        }
    }

    /**
     * Gérer l'échec du job
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('💥 Échec définitif traduction', [
            'article_id' => $this->articleId,
            'target_language' => $this->targetLanguageCode,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);
    }

    /**
     * Tags pour identification du job
     */
    public function tags(): array
    {
        return [
            'translation',
            'article:' . $this->articleId,
            'language:' . $this->targetLanguageCode,
        ];
    }
}