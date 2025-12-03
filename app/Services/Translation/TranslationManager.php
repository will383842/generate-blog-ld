<?php

namespace App\Services\Translation;

use App\Models\Article;
use App\Models\ArticleTranslation;
use App\Models\Language;
use App\Services\Seo\MetaService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Collection;

/**
 * Manager de traduction multi-langues
 * Orchestre la traduction d'articles vers toutes les langues supportées
 */
class TranslationManager
{
    protected TranslationService $translationService;
    protected MetaService $metaService;

    // Langues supportées
    protected array $supportedLanguages = ['fr', 'en', 'de', 'es', 'pt', 'ru', 'zh', 'ar', 'hi'];

    public function __construct(
        TranslationService $translationService,
        MetaService $metaService
    ) {
        $this->translationService = $translationService;
        $this->metaService = $metaService;
    }

    // =========================================================================
    // TRADUCTION VERS TOUTES LES LANGUES
    // =========================================================================

    /**
     * Traduit un article vers toutes les langues disponibles
     * 
     * @param Article $article Article à traduire
     * @param array|null $languages Langues spécifiques (null = toutes)
     * @param bool $skipExisting Ignorer les traductions existantes
     * @return array Résultats de traduction
     */
    public function translateToAllLanguages(
        Article $article,
        ?array $languages = null,
        bool $skipExisting = true
    ): array {
        $startTime = microtime(true);
        $results = [
            'success' => [],
            'failed' => [],
            'skipped' => [],
            'total_cost' => 0,
        ];

        // Déterminer les langues à traduire
        $targetLanguages = $languages ?? $this->getLanguagesToTranslate($article);

        Log::info("🌍 Démarrage traduction multi-langues", [
            'article_id' => $article->id,
            'source_lang' => $article->language->code,
            'target_langs' => $targetLanguages,
            'count' => count($targetLanguages),
        ]);

        foreach ($targetLanguages as $targetLang) {
            try {
                // Vérifier si traduction existe déjà
                if ($skipExisting && $this->translationExists($article, $targetLang)) {
                    $results['skipped'][] = $targetLang;
                    Log::info("⏭️ Traduction {$targetLang} déjà existante, ignorée");
                    continue;
                }

                // Traduction
                $translation = $this->translationService->translateArticle($article, $targetLang);

                // Génération des métadonnées SEO
                $this->enrichTranslationWithSeo($translation, $article, $targetLang);

                $results['success'][] = $targetLang;
                $results['total_cost'] += $translation->translation_cost;

                Log::info("✅ Traduction {$targetLang} réussie", [
                    'translation_id' => $translation->id,
                    'cost' => $translation->translation_cost,
                ]);

                // Petit délai entre traductions pour éviter rate limiting
                if (count($targetLanguages) > 1) {
                    usleep(200000); // 0.2s
                }

            } catch (\Exception $e) {
                $results['failed'][] = [
                    'lang' => $targetLang,
                    'error' => $e->getMessage(),
                ];

                Log::error("❌ Échec traduction {$targetLang}", [
                    'article_id' => $article->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $duration = round(microtime(true) - $startTime, 2);

        Log::info("🏁 Traduction multi-langues terminée", [
            'article_id' => $article->id,
            'success' => count($results['success']),
            'failed' => count($results['failed']),
            'skipped' => count($results['skipped']),
            'total_cost' => $results['total_cost'],
            'duration' => $duration . 's',
        ]);

        return $results;
    }

    /**
     * Traduit un batch d'articles vers toutes les langues
     * 
     * @param Collection $articles Collection d'articles
     * @param array|null $languages Langues cibles
     * @return array Résultats globaux
     */
    public function translateBatch(Collection $articles, ?array $languages = null): array
    {
        $globalResults = [
            'total_articles' => $articles->count(),
            'completed' => 0,
            'failed' => 0,
            'total_translations' => 0,
            'total_cost' => 0,
            'articles' => [],
        ];

        foreach ($articles as $article) {
            try {
                $results = $this->translateToAllLanguages($article, $languages);
                
                $globalResults['completed']++;
                $globalResults['total_translations'] += count($results['success']);
                $globalResults['total_cost'] += $results['total_cost'];
                $globalResults['articles'][$article->id] = $results;

            } catch (\Exception $e) {
                $globalResults['failed']++;
                Log::error("❌ Échec traduction batch article #{$article->id}", [
                    'error' => $e->getMessage(),
                ]);
            }

            // Délai entre articles
            if ($articles->count() > 1) {
                sleep(1);
            }
        }

        Log::info("📊 Batch traduction terminé", $globalResults);

        return $globalResults;
    }

    // =========================================================================
    // RETRADUCTION
    // =========================================================================

    /**
     * Retraduit un article dans des langues spécifiques
     * Utile après mise à jour du contenu source
     * 
     * @param Article $article Article à retraduire
     * @param array $languages Langues à retraduire
     * @return array Résultats
     */
    public function retranslate(Article $article, array $languages): array
    {
        $results = [
            'success' => [],
            'failed' => [],
            'total_cost' => 0,
        ];

        Log::info("🔄 Retraduction article #{$article->id}", [
            'languages' => $languages,
        ]);

        foreach ($languages as $lang) {
            try {
                // Supprimer l'ancienne traduction
                $this->deleteTranslation($article, $lang);

                // Créer nouvelle traduction
                $translation = $this->translationService->translateArticle($article, $lang);
                
                // Enrichir avec SEO
                $this->enrichTranslationWithSeo($translation, $article, $lang);

                $results['success'][] = $lang;
                $results['total_cost'] += $translation->translation_cost;

            } catch (\Exception $e) {
                $results['failed'][] = [
                    'lang' => $lang,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return $results;
    }

    // =========================================================================
    // GESTION DES LANGUES
    // =========================================================================

    /**
     * Retourne les langues à traduire (toutes sauf la source)
     * 
     * @param Article $article Article source
     * @return array Codes langues à traduire
     */
    public function getLanguagesToTranslate(Article $article): array
    {
        $sourceLang = $article->language->code;
        
        return array_values(
            array_filter($this->supportedLanguages, fn($lang) => $lang !== $sourceLang)
        );
    }

    /**
     * Retourne les langues manquantes (non encore traduites)
     * 
     * @param Article $article Article source
     * @return array Codes langues manquantes
     */
    public function getMissingLanguages(Article $article): array
    {
        $allLanguages = $this->getLanguagesToTranslate($article);
        $existingLanguages = $this->getExistingLanguages($article);

        return array_values(
            array_diff($allLanguages, $existingLanguages)
        );
    }

    /**
     * Retourne les langues déjà traduites
     * 
     * @param Article $article Article source
     * @return array Codes langues existantes
     */
    public function getExistingLanguages(Article $article): array
    {
        return $article->translations()
            ->with('language')
            ->get()
            ->pluck('language.code')
            ->toArray();
    }

    /**
     * Vérifie si une traduction existe
     * 
     * @param Article $article Article source
     * @param string $targetLang Code langue
     * @return bool True si existe
     */
    public function translationExists(Article $article, string $targetLang): bool
    {
        $targetLanguage = Language::where('code', $targetLang)->first();
        
        if (!$targetLanguage) {
            return false;
        }

        return ArticleTranslation::where('article_id', $article->id)
            ->where('language_id', $targetLanguage->id)
            ->exists();
    }

    /**
     * Compte le nombre de traductions d'un article
     * 
     * @param Article $article Article source
     * @return int Nombre de traductions
     */
    public function countTranslations(Article $article): int
    {
        return $article->translations()->count();
    }

    /**
     * Vérifie si un article est complètement traduit (toutes langues)
     * 
     * @param Article $article Article source
     * @return bool True si toutes traductions présentes
     */
    public function isFullyTranslated(Article $article): bool
    {
        $expectedCount = count($this->getLanguagesToTranslate($article));
        $actualCount = $this->countTranslations($article);

        return $actualCount >= $expectedCount;
    }

    // =========================================================================
    // ENRICHISSEMENT SEO
    // =========================================================================

    /**
     * Enrichit une traduction avec les métadonnées SEO
     * 
     * @param ArticleTranslation $translation Traduction à enrichir
     * @param Article $article Article source
     * @param string $lang Code langue
     * @return void
     */
    protected function enrichTranslationWithSeo(
        ArticleTranslation $translation,
        Article $article,
        string $lang
    ): void {
        // Génération meta tags
        $meta = $this->metaService->generateMeta($article, $lang);
        
        // Génération JSON-LD complet
        $jsonLd = [
            'article' => $this->metaService->generateJsonLdArticle($article, $lang),
            'breadcrumb' => $this->metaService->generateJsonLdBreadcrumb($article, $lang),
        ];

        // Si FAQs, ajouter JSON-LD FAQ
        $faqs = $article->faqs()
            ->where('language_id', $translation->language_id)
            ->get();

        if ($faqs->isNotEmpty()) {
            $faqsArray = $faqs->map(fn($faq) => [
                'question' => $faq->question,
                'answer' => $faq->answer,
            ])->toArray();

            $jsonLd['faq'] = $this->metaService->generateJsonLdFaq(
                $faqsArray,
                $this->metaService->generateCanonicalUrl($article, $lang)
            );
        }

        // Génération URL canonique
        $canonicalUrl = $this->metaService->generateCanonicalUrl($article, $lang);

        // Mise à jour de la traduction
        $translation->update([
            'meta_title' => $meta['title'],
            'meta_description' => $meta['description'],
            'canonical_url' => $canonicalUrl,
            'json_ld' => $jsonLd,
        ]);

        Log::debug("🏷️ Métadonnées SEO ajoutées à traduction {$lang}");
    }

    // =========================================================================
    // SUPPRESSION
    // =========================================================================

    /**
     * Supprime une traduction spécifique
     * 
     * @param Article $article Article source
     * @param string $lang Code langue à supprimer
     * @return bool True si supprimée
     */
    public function deleteTranslation(Article $article, string $lang): bool
    {
        $targetLanguage = Language::where('code', $lang)->first();
        
        if (!$targetLanguage) {
            return false;
        }

        $deleted = ArticleTranslation::where('article_id', $article->id)
            ->where('language_id', $targetLanguage->id)
            ->delete();

        if ($deleted) {
            Log::info("🗑️ Traduction {$lang} supprimée", ['article_id' => $article->id]);
        }

        return $deleted > 0;
    }

    /**
     * Supprime toutes les traductions d'un article
     * 
     * @param Article $article Article source
     * @return int Nombre de traductions supprimées
     */
    public function deleteAllTranslations(Article $article): int
    {
        $count = $article->translations()->delete();
        
        Log::info("🗑️ {$count} traductions supprimées", ['article_id' => $article->id]);

        return $count;
    }

    // =========================================================================
    // STATISTIQUES
    // =========================================================================

    /**
     * Obtient les statistiques de traduction d'un article
     * 
     * @param Article $article Article source
     * @return array Statistiques
     */
    public function getTranslationStats(Article $article): array
    {
        $translations = $article->translations()->with('language')->get();

        return [
            'article_id' => $article->id,
            'source_language' => $article->language->code,
            'total_translations' => $translations->count(),
            'expected_translations' => count($this->getLanguagesToTranslate($article)),
            'missing_languages' => $this->getMissingLanguages($article),
            'existing_languages' => $this->getExistingLanguages($article),
            'is_fully_translated' => $this->isFullyTranslated($article),
            'total_cost' => $translations->sum('translation_cost'),
            'translations' => $translations->map(fn($t) => [
                'id' => $t->id,
                'language' => $t->language->code,
                'status' => $t->status,
                'cost' => $t->translation_cost,
                'created_at' => $t->created_at,
            ])->toArray(),
        ];
    }

    /**
     * Obtient les statistiques globales de traduction
     * 
     * @return array Statistiques globales
     */
    public function getGlobalStats(): array
    {
        return [
            'total_articles' => Article::count(),
            'total_translations' => ArticleTranslation::count(),
            'fully_translated_articles' => $this->countFullyTranslatedArticles(),
            'total_cost' => ArticleTranslation::sum('translation_cost'),
            'by_language' => $this->getStatsByLanguage(),
            'by_status' => $this->getStatsByStatus(),
        ];
    }

    /**
     * Compte les articles complètement traduits
     */
    protected function countFullyTranslatedArticles(): int
    {
        $expectedTranslations = count($this->supportedLanguages) - 1; // -1 pour langue source

        return Article::withCount('translations')
            ->having('translations_count', '>=', $expectedTranslations)
            ->count();
    }

    /**
     * Statistiques par langue
     */
    protected function getStatsByLanguage(): array
    {
        return ArticleTranslation::select('language_id', DB::raw('count(*) as count'))
            ->with('language:id,code,name')
            ->groupBy('language_id')
            ->get()
            ->map(fn($stat) => [
                'language' => $stat->language->code,
                'name' => $stat->language->name,
                'count' => $stat->count,
            ])
            ->toArray();
    }

    /**
     * Statistiques par statut
     */
    protected function getStatsByStatus(): array
    {
        return ArticleTranslation::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Obtient les langues supportées
     * 
     * @return array Codes langues
     */
    public function getSupportedLanguages(): array
    {
        return $this->supportedLanguages;
    }

    /**
     * Vérifie si une langue est supportée
     * 
     * @param string $lang Code langue
     * @return bool True si supportée
     */
    public function isLanguageSupported(string $lang): bool
    {
        return in_array($lang, $this->supportedLanguages);
    }
}