<?php

namespace App\Services\Seo;

use App\Models\Article;
use App\Models\ArticleTranslation;
use App\Models\Country;
use App\Models\Language;
use App\Services\Translation\SlugService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * LocaleSlugService - Génération automatique des slugs locale-pays
 *
 * Génère automatiquement TOUS les slugs pour chaque combinaison {langue}-{pays}
 * Exemple: un article sur l'Allemagne traduit en 9 langues génère:
 * - fr-DE → /allemagne/mon-article
 * - en-DE → /en/germany/my-article
 * - de-DE → /de/deutschland/mein-artikel
 * - ar-DE → /ar/almania/maqali
 * etc.
 *
 * @package App\Services\Seo
 */
class LocaleSlugService
{
    protected SlugService $slugService;

    // Langues supportées
    const SUPPORTED_LANGUAGES = ['fr', 'en', 'de', 'es', 'pt', 'ru', 'zh', 'ar', 'hi'];

    public function __construct(SlugService $slugService)
    {
        $this->slugService = $slugService;
    }

    // =========================================================================
    // GÉNÉRATION SLUGS LOCALE-PAYS
    // =========================================================================

    /**
     * Génère tous les slugs locale-pays pour un article
     *
     * @param Article $article Article source
     * @return array Slugs générés par locale ['fr-DE' => '/allemagne/slug', ...]
     */
    public function generateAllLocaleSlugs(Article $article): array
    {
        $country = $article->country;
        if (!$country) {
            Log::warning('LocaleSlugService: Article sans pays', ['article_id' => $article->id]);
            return [];
        }

        $localeSlugs = [];
        $countryCode = strtoupper($country->code);

        // Slug pour la langue source
        $sourceLanguage = $article->language;
        if ($sourceLanguage) {
            $locale = "{$sourceLanguage->code}-{$countryCode}";
            $localeSlugs[$locale] = $this->buildLocaleSlug(
                $sourceLanguage->code,
                $country,
                $article->slug
            );
        }

        // Slugs pour toutes les traductions
        foreach ($article->translations as $translation) {
            if ($translation->status !== 'active' && $translation->status !== 'completed') {
                continue;
            }

            $lang = $translation->language;
            if (!$lang) continue;

            $locale = "{$lang->code}-{$countryCode}";
            $localeSlugs[$locale] = $this->buildLocaleSlug(
                $lang->code,
                $country,
                $translation->slug
            );
        }

        Log::info('LocaleSlugService: Slugs locale-pays générés', [
            'article_id' => $article->id,
            'country' => $countryCode,
            'locales' => array_keys($localeSlugs),
        ]);

        return $localeSlugs;
    }

    /**
     * Construit un slug locale complet
     *
     * @param string $langCode Code langue (fr, en, etc.)
     * @param Country $country Pays
     * @param string $articleSlug Slug de l'article
     * @return string Slug locale complet
     */
    protected function buildLocaleSlug(string $langCode, Country $country, string $articleSlug): string
    {
        // Slug du pays dans la langue
        $countrySlug = $country->getSlug($langCode);

        // Langue par défaut (FR) = pas de préfixe
        $defaultLang = config('languages.default', 'fr');

        if ($langCode === $defaultLang) {
            return "/{$countrySlug}/{$articleSlug}";
        }

        return "/{$langCode}/{$countrySlug}/{$articleSlug}";
    }

    // =========================================================================
    // GÉNÉRATION SLUG POUR TRADUCTION
    // =========================================================================

    /**
     * Génère un slug pour une traduction d'article
     *
     * @param string $title Titre traduit
     * @param string $langCode Code langue cible
     * @param int $articleId ID de l'article parent
     * @return string Slug unique
     */
    public function generateTranslationSlug(string $title, string $langCode, int $articleId): string
    {
        // Générer le slug de base avec translittération si nécessaire
        $baseSlug = $this->slugService->generateSlug($title, $langCode);

        // Vérifier l'unicité
        $slug = $baseSlug;
        $counter = 1;

        while ($this->translationSlugExists($slug, $langCode, $articleId)) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;

            if ($counter > 100) {
                // Fallback avec timestamp
                $slug = "{$baseSlug}-" . time();
                break;
            }
        }

        return $slug;
    }

    /**
     * Vérifie si un slug de traduction existe déjà
     */
    protected function translationSlugExists(string $slug, string $langCode, int $excludeArticleId): bool
    {
        return ArticleTranslation::where('slug', $slug)
            ->whereHas('language', fn($q) => $q->where('code', $langCode))
            ->where('article_id', '!=', $excludeArticleId)
            ->exists();
    }

    // =========================================================================
    // GÉNÉRATION SLUGS POUR NOUVEAU CONTENU
    // =========================================================================

    /**
     * Génère les slugs pour un nouvel article dans toutes les langues demandées
     *
     * @param string $baseTitle Titre de base
     * @param string $sourceLang Langue source
     * @param array $targetLanguages Langues cibles ['en', 'de', 'ar', ...]
     * @param Country $country Pays de l'article
     * @param int|null $platformId ID plateforme (pour unicité)
     * @return array Slugs par langue ['fr' => 'mon-slug', 'en' => 'my-slug', ...]
     */
    public function generateSlugsForAllLanguages(
        string $baseTitle,
        string $sourceLang,
        array $targetLanguages,
        Country $country,
        ?int $platformId = null
    ): array {
        $slugs = [];

        // Slug pour la langue source
        $slugs[$sourceLang] = $this->generateUniqueSlug($baseTitle, $sourceLang, $platformId);

        // Slugs pour les langues cibles (seront remplis lors de la traduction)
        // Pour l'instant, on initialise avec le slug source translittéré
        foreach ($targetLanguages as $lang) {
            if ($lang === $sourceLang) continue;

            // Pour les langues non-latines, on prépare un placeholder
            // Le vrai slug sera généré lors de la traduction
            $slugs[$lang] = $this->slugService->generateSlug($baseTitle, $lang);
        }

        return $slugs;
    }

    /**
     * Génère un slug unique pour un article
     */
    public function generateUniqueSlug(string $title, string $langCode, ?int $platformId = null): string
    {
        $baseSlug = $this->slugService->generateSlug($title, $langCode);
        $slug = $baseSlug;
        $counter = 1;

        while ($this->articleSlugExists($slug, $langCode, $platformId)) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;

            if ($counter > 100) {
                $slug = "{$baseSlug}-" . Str::random(6);
                break;
            }
        }

        return $slug;
    }

    /**
     * Vérifie si un slug d'article existe
     */
    protected function articleSlugExists(string $slug, string $langCode, ?int $platformId): bool
    {
        $query = Article::where('slug', $slug)
            ->whereHas('language', fn($q) => $q->where('code', $langCode));

        if ($platformId) {
            $query->where('platform_id', $platformId);
        }

        return $query->exists();
    }

    // =========================================================================
    // STOCKAGE DES LOCALE SLUGS
    // =========================================================================

    /**
     * Sauvegarde tous les locale slugs d'un article
     *
     * @param Article $article Article
     * @return int Nombre de slugs sauvegardés
     */
    public function saveLocaleSlugs(Article $article): int
    {
        $localeSlugs = $this->generateAllLocaleSlugs($article);

        if (empty($localeSlugs)) {
            return 0;
        }

        // Stocker dans article.locale_slugs (JSON)
        $article->locale_slugs = $localeSlugs;
        $article->save();

        // Stocker aussi dans la table dédiée pour recherche rapide
        $this->saveToLocaleSlugTable($article, $localeSlugs);

        return count($localeSlugs);
    }

    /**
     * Sauvegarde dans la table article_locale_slugs
     */
    protected function saveToLocaleSlugTable(Article $article, array $localeSlugs): void
    {
        // Supprimer les anciens slugs
        DB::table('article_locale_slugs')
            ->where('article_id', $article->id)
            ->delete();

        // Insérer les nouveaux
        $inserts = [];
        foreach ($localeSlugs as $locale => $slug) {
            [$lang, $countryCode] = explode('-', $locale);

            $inserts[] = [
                'article_id' => $article->id,
                'locale' => $locale,
                'language_code' => $lang,
                'country_code' => $countryCode,
                'slug' => $slug,
                'full_path' => $slug,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!empty($inserts)) {
            DB::table('article_locale_slugs')->insert($inserts);
        }
    }

    // =========================================================================
    // RECHERCHE PAR LOCALE SLUG
    // =========================================================================

    /**
     * Trouve un article par son locale slug
     *
     * @param string $locale Locale (ex: fr-DE)
     * @param string $slug Slug de l'article
     * @return Article|null
     */
    public function findByLocaleSlug(string $locale, string $slug): ?Article
    {
        // Recherche dans la table dédiée
        $record = DB::table('article_locale_slugs')
            ->where('locale', $locale)
            ->where('slug', 'LIKE', "%{$slug}")
            ->first();

        if ($record) {
            return Article::find($record->article_id);
        }

        // Fallback: recherche dans locale_slugs JSON
        return Article::whereJsonContains('locale_slugs->' . $locale, $slug)->first();
    }

    /**
     * Trouve un article par chemin complet
     *
     * @param string $path Chemin (ex: /en/germany/my-article)
     * @return Article|null
     */
    public function findByPath(string $path): ?Article
    {
        $path = '/' . ltrim($path, '/');

        $record = DB::table('article_locale_slugs')
            ->where('full_path', $path)
            ->first();

        if ($record) {
            return Article::find($record->article_id);
        }

        return null;
    }

    // =========================================================================
    // GÉNÉRATION HREFLANG URLS
    // =========================================================================

    /**
     * Génère toutes les URLs hreflang pour un article
     *
     * @param Article $article Article
     * @param string|null $baseUrl URL de base du site (si null, utilise le domaine de la plateforme)
     * @return array URLs par locale ['fr-DE' => 'https://...', ...]
     */
    public function generateHreflangUrls(Article $article, ?string $baseUrl = null): array
    {
        $localeSlugs = $article->locale_slugs ?? $this->generateAllLocaleSlugs($article);
        $urls = [];

        // Utiliser le domaine de la plateforme si pas de baseUrl fourni
        if ($baseUrl === null && $article->platform) {
            $baseUrl = $this->getPlatformBaseUrl($article->platform);
        } else {
            $baseUrl = rtrim($baseUrl ?? '', '/');
        }

        foreach ($localeSlugs as $locale => $slug) {
            $urls[$locale] = $baseUrl . $slug;
        }

        // Ajouter x-default (FR par défaut)
        $defaultLocale = $this->findDefaultLocale($localeSlugs);
        if ($defaultLocale && isset($urls[$defaultLocale])) {
            $urls['x-default'] = $urls[$defaultLocale];
        }

        return $urls;
    }

    /**
     * Récupère l'URL de base d'une plateforme
     *
     * @param \App\Models\Platform $platform
     * @return string URL de base avec https://
     */
    protected function getPlatformBaseUrl($platform): string
{
    // Priorité: domain > url > chaîne vide
    $baseUrl = $platform->domain ?? $platform->url ?? '';

    // Supprimer le protocole existant pour normaliser
    $baseUrl = preg_replace('#^https?://#', '', $baseUrl);

    // S'assurer que l'URL a le protocole https
    if (!empty($baseUrl)) {
        $baseUrl = 'https://' . $baseUrl;
    }

    return rtrim($baseUrl, '/');
}

    /**
     * Génère les URLs complètes pour une plateforme externe
     *
     * Utilisé quand le contenu est syndiqué/publié sur une plateforme externe
     *
     * @param Article $article Article
     * @return array URLs par locale avec domaine complet
     */
    public function generateExternalPlatformUrls(Article $article): array
    {
        if (!$article->platform) {
            return [];
        }

        $baseUrl = $this->getPlatformBaseUrl($article->platform);

        if (empty($baseUrl)) {
            Log::warning('LocaleSlugService: Plateforme sans domaine configuré', [
                'platform_id' => $article->platform->id,
                'platform_name' => $article->platform->name,
            ]);
            return [];
        }

        return $this->generateHreflangUrls($article, $baseUrl);
    }

    /**
     * Trouve la locale par défaut (FR-XX en priorité)
     */
    protected function findDefaultLocale(array $localeSlugs): ?string
    {
        foreach (array_keys($localeSlugs) as $locale) {
            if (str_starts_with($locale, 'fr-')) {
                return $locale;
            }
        }

        return array_key_first($localeSlugs);
    }

    // =========================================================================
    // RÉGÉNÉRATION EN MASSE
    // =========================================================================

    /**
     * Régénère tous les locale slugs pour une plateforme
     *
     * @param int $platformId ID plateforme
     * @return array Statistiques
     */
    public function regenerateForPlatform(int $platformId): array
    {
        $articles = Article::where('platform_id', $platformId)
            ->whereNotNull('country_id')
            ->with(['translations.language', 'language', 'country'])
            ->get();

        $stats = [
            'total' => $articles->count(),
            'processed' => 0,
            'slugs_generated' => 0,
            'errors' => [],
        ];

        foreach ($articles as $article) {
            try {
                $count = $this->saveLocaleSlugs($article);
                $stats['slugs_generated'] += $count;
                $stats['processed']++;
            } catch (\Exception $e) {
                $stats['errors'][] = [
                    'article_id' => $article->id,
                    'error' => $e->getMessage(),
                ];
            }
        }

        Log::info('LocaleSlugService: Régénération plateforme terminée', $stats);

        return $stats;
    }

    /**
     * Met à jour les locale slugs après une traduction
     *
     * @param Article $article Article traduit
     * @param ArticleTranslation $translation Nouvelle traduction
     * @return void
     */
    public function updateAfterTranslation(Article $article, ArticleTranslation $translation): void
    {
        // Régénérer tous les locale slugs
        $this->saveLocaleSlugs($article);

        Log::info('LocaleSlugService: Slugs mis à jour après traduction', [
            'article_id' => $article->id,
            'translation_lang' => $translation->language->code ?? 'unknown',
        ]);
    }
}
