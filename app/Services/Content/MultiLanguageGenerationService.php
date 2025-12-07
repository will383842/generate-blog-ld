<?php

namespace App\Services\Content;

use App\Models\Article;
use App\Models\Language;
use App\Jobs\TranslateArticle;
use App\Services\Seo\LocaleSlugService;
use App\Services\Translation\TranslationService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

/**
 * MultiLanguageGenerationService - Gestion de la génération multi-langues
 *
 * Permet de générer du contenu dans plusieurs langues simultanément:
 * - Génération initiale dans la langue source
 * - Dispatch automatique des traductions
 * - Génération des slugs locale-pays pour toutes les combinaisons
 * - Suivi de l'état de traduction
 *
 * Usage:
 * ```php
 * $service->generateWithTranslations($article, ['fr', 'en', 'de', 'ar']);
 * ```
 *
 * @package App\Services\Content
 */
class MultiLanguageGenerationService
{
    protected TranslationService $translationService;
    protected LocaleSlugService $localeSlugService;

    // Langues supportées
    const SUPPORTED_LANGUAGES = ['fr', 'en', 'de', 'es', 'pt', 'ru', 'zh', 'ar', 'hi'];

    // Délai entre les traductions (secondes)
    const TRANSLATION_DELAY = 15;

    public function __construct(
        TranslationService $translationService,
        LocaleSlugService $localeSlugService
    ) {
        $this->translationService = $translationService;
        $this->localeSlugService = $localeSlugService;
    }

    // =========================================================================
    // GÉNÉRATION MULTI-LANGUES
    // =========================================================================

    /**
     * Lance la génération des traductions pour un article
     *
     * @param Article $article Article source (déjà généré)
     * @param array $targetLanguages Langues cibles ['en', 'de', 'ar', ...]
     * @param array $options Options (sync, delay, priority)
     * @return array Résultats du dispatch
     */
    public function generateTranslations(Article $article, array $targetLanguages, array $options = []): array
    {
        $options = array_merge([
            'sync' => false, // true = traduction synchrone (lent mais immédiat)
            'delay' => self::TRANSLATION_DELAY,
            'priority' => 'normal', // normal, high, low
            'generate_locale_slugs' => true,
        ], $options);

        // Filtrer les langues valides
        $targetLanguages = $this->filterValidLanguages($targetLanguages, $article->language->code ?? 'fr');

        if (empty($targetLanguages)) {
            return [
                'status' => 'skipped',
                'reason' => 'No valid target languages',
                'translations' => [],
            ];
        }

        $results = [
            'status' => 'dispatched',
            'article_id' => $article->id,
            'source_language' => $article->language->code ?? 'fr',
            'target_languages' => $targetLanguages,
            'translations' => [],
        ];

        // Mode synchrone (pour tests ou petits volumes)
        if ($options['sync']) {
            return $this->generateTranslationsSync($article, $targetLanguages, $options);
        }

        // Mode asynchrone (recommandé pour production)
        $delay = 0;
        $queue = $this->getQueueName($options['priority']);

        foreach ($targetLanguages as $lang) {
            try {
                TranslateArticle::dispatch($article->id, $lang)
                    ->onQueue($queue)
                    ->delay(now()->addSeconds($delay));

                $results['translations'][$lang] = [
                    'status' => 'queued',
                    'delay' => $delay,
                    'queue' => $queue,
                ];

                $delay += $options['delay'];

            } catch (\Exception $e) {
                $results['translations'][$lang] = [
                    'status' => 'error',
                    'error' => $e->getMessage(),
                ];
            }
        }

        // Générer les slugs locale-pays initiaux
        if ($options['generate_locale_slugs']) {
            $this->localeSlugService->saveLocaleSlugs($article);
        }

        Log::info('MultiLanguageGenerationService: Traductions dispatchées', [
            'article_id' => $article->id,
            'target_count' => count($targetLanguages),
        ]);

        return $results;
    }

    /**
     * Génère les traductions de manière synchrone
     */
    protected function generateTranslationsSync(Article $article, array $targetLanguages, array $options): array
    {
        $results = [
            'status' => 'completed',
            'article_id' => $article->id,
            'source_language' => $article->language->code ?? 'fr',
            'translations' => [],
        ];

        foreach ($targetLanguages as $lang) {
            try {
                $translation = $this->translationService->translateArticle($article, $lang);

                $results['translations'][$lang] = [
                    'status' => 'success',
                    'translation_id' => $translation->id,
                    'cost' => $translation->translation_cost,
                ];

            } catch (\Exception $e) {
                $results['translations'][$lang] = [
                    'status' => 'error',
                    'error' => $e->getMessage(),
                ];

                Log::error('MultiLanguageGenerationService: Erreur traduction sync', [
                    'article_id' => $article->id,
                    'target_lang' => $lang,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Mettre à jour les slugs locale après toutes les traductions
        if ($options['generate_locale_slugs']) {
            $article->refresh();
            $this->localeSlugService->saveLocaleSlugs($article);
        }

        return $results;
    }

    /**
     * Filtre les langues valides
     */
    protected function filterValidLanguages(array $languages, string $sourceLanguage): array
    {
        return array_values(array_filter($languages, function ($lang) use ($sourceLanguage) {
            return in_array($lang, self::SUPPORTED_LANGUAGES)
                && $lang !== $sourceLanguage
                && Language::where('code', $lang)->where('is_active', true)->exists();
        }));
    }

    /**
     * Retourne le nom de la queue selon la priorité
     */
    protected function getQueueName(string $priority): string
    {
        return match ($priority) {
            'high' => 'translation-high',
            'low' => 'translation-low',
            default => 'translation',
        };
    }

    // =========================================================================
    // GÉNÉRATION TOUTES LANGUES
    // =========================================================================

    /**
     * Lance la traduction dans TOUTES les langues supportées
     *
     * @param Article $article Article source
     * @param array $options Options
     * @return array Résultats
     */
    public function generateAllLanguages(Article $article, array $options = []): array
    {
        $sourceLanguage = $article->language->code ?? 'fr';
        $allLanguages = array_diff(self::SUPPORTED_LANGUAGES, [$sourceLanguage]);

        return $this->generateTranslations($article, $allLanguages, $options);
    }

    // =========================================================================
    // VÉRIFICATION ÉTAT TRADUCTIONS
    // =========================================================================

    /**
     * Vérifie l'état des traductions d'un article
     *
     * @param Article $article Article
     * @return array État par langue
     */
    public function checkTranslationStatus(Article $article): array
    {
        $sourceLanguage = $article->language->code ?? 'fr';

        $status = [
            'article_id' => $article->id,
            'source_language' => $sourceLanguage,
            'translations' => [],
            'summary' => [
                'total_expected' => count(self::SUPPORTED_LANGUAGES) - 1,
                'completed' => 0,
                'pending' => 0,
                'missing' => 0,
            ],
        ];

        foreach (self::SUPPORTED_LANGUAGES as $lang) {
            if ($lang === $sourceLanguage) {
                continue;
            }

            $translation = $article->translations()
                ->whereHas('language', fn($q) => $q->where('code', $lang))
                ->first();

            if ($translation) {
                $translationStatus = $translation->status ?? 'unknown';
                $status['translations'][$lang] = [
                    'exists' => true,
                    'status' => $translationStatus,
                    'translation_id' => $translation->id,
                    'created_at' => $translation->created_at?->toIso8601String(),
                ];

                if (in_array($translationStatus, ['active', 'completed'])) {
                    $status['summary']['completed']++;
                } else {
                    $status['summary']['pending']++;
                }
            } else {
                $status['translations'][$lang] = [
                    'exists' => false,
                    'status' => 'missing',
                ];
                $status['summary']['missing']++;
            }
        }

        return $status;
    }

    /**
     * Retourne les langues manquantes pour un article
     *
     * @param Article $article Article
     * @return array Codes des langues manquantes
     */
    public function getMissingLanguages(Article $article): array
    {
        $sourceLanguage = $article->language->code ?? 'fr';

        $existingLanguages = $article->translations()
            ->with('language')
            ->get()
            ->pluck('language.code')
            ->filter()
            ->toArray();

        $existingLanguages[] = $sourceLanguage;

        return array_values(array_diff(self::SUPPORTED_LANGUAGES, $existingLanguages));
    }

    /**
     * Complète les traductions manquantes
     *
     * @param Article $article Article
     * @param array $options Options
     * @return array Résultats
     */
    public function completeMissingTranslations(Article $article, array $options = []): array
    {
        $missingLanguages = $this->getMissingLanguages($article);

        if (empty($missingLanguages)) {
            return [
                'status' => 'complete',
                'message' => 'All translations already exist',
            ];
        }

        return $this->generateTranslations($article, $missingLanguages, $options);
    }

    // =========================================================================
    // RÉGÉNÉRATION LOCALE SLUGS
    // =========================================================================

    /**
     * Régénère les slugs locale après ajout de traduction
     *
     * @param Article $article Article
     * @return int Nombre de slugs générés
     */
    public function refreshLocaleSlugs(Article $article): int
    {
        $article->refresh();
        $article->load(['translations.language', 'language', 'country']);

        return $this->localeSlugService->saveLocaleSlugs($article);
    }

    // =========================================================================
    // STATISTIQUES
    // =========================================================================

    /**
     * Statistiques de traduction pour une plateforme
     *
     * @param int $platformId ID plateforme
     * @return array Statistiques
     */
    public function getTranslationStats(int $platformId): array
    {
        $articles = Article::where('platform_id', $platformId)
            ->withCount('translations')
            ->get();

        $totalArticles = $articles->count();
        $fullyTranslated = $articles->filter(fn($a) => $a->translations_count >= 8)->count();
        $partiallyTranslated = $articles->filter(fn($a) => $a->translations_count > 0 && $a->translations_count < 8)->count();
        $notTranslated = $articles->filter(fn($a) => $a->translations_count === 0)->count();

        $translationsByLang = [];
        foreach (self::SUPPORTED_LANGUAGES as $lang) {
            $translationsByLang[$lang] = DB::table('article_translations')
                ->join('articles', 'article_translations.article_id', '=', 'articles.id')
                ->join('languages', 'article_translations.language_id', '=', 'languages.id')
                ->where('articles.platform_id', $platformId)
                ->where('languages.code', $lang)
                ->count();
        }

        return [
            'platform_id' => $platformId,
            'total_articles' => $totalArticles,
            'fully_translated' => $fullyTranslated,
            'partially_translated' => $partiallyTranslated,
            'not_translated' => $notTranslated,
            'coverage_percent' => $totalArticles > 0 ? round(($fullyTranslated / $totalArticles) * 100, 1) : 0,
            'by_language' => $translationsByLang,
        ];
    }
}
