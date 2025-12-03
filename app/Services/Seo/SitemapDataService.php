<?php

namespace App\Services\Seo;

use App\Models\Article;
use App\Models\Platform;
use App\Models\Country;
use App\Models\Theme;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Service de préparation des données pour sitemap.xml
 * Le générateur prépare toutes les données, la plateforme génère le XML
 */
class SitemapDataService
{
    // Priorités SEO
    const PRIORITY_HIGH = 1.0;
    const PRIORITY_MEDIUM_HIGH = 0.8;
    const PRIORITY_MEDIUM = 0.6;
    const PRIORITY_LOW = 0.4;

    // Fréquences de mise à jour
    const FREQ_ALWAYS = 'always';
    const FREQ_HOURLY = 'hourly';
    const FREQ_DAILY = 'daily';
    const FREQ_WEEKLY = 'weekly';
    const FREQ_MONTHLY = 'monthly';
    const FREQ_YEARLY = 'yearly';
    const FREQ_NEVER = 'never';

    protected MetaService $metaService;

    public function __construct(MetaService $metaService)
    {
        $this->metaService = $metaService;
    }

    // =========================================================================
    // ARTICLES
    // =========================================================================

    /**
     * Récupère toutes les données d'articles pour le sitemap
     * 
     * @param int|null $platformId ID plateforme (null = toutes)
     * @param int $chunkSize Taille des chunks (50000 max par sitemap)
     * @return Collection
     */
    public function getArticlesData(?int $platformId = null, int $chunkSize = 50000): Collection
    {
        $query = Article::published()
            ->with(['language', 'translations.language', 'platform'])
            ->select(['id', 'slug', 'canonical_url', 'updated_at', 'published_at', 'platform_id', 'language_id', 'type']);

        if ($platformId) {
            $query->where('platform_id', $platformId);
        }

        $articles = $query->get();

        return $articles->map(function ($article) {
            // URL principale
            $mainUrl = $article->canonical_url ?? $this->buildArticleUrl($article);

            // URLs alternatives (traductions)
            $alternates = $article->translations->map(function ($translation) {
                return [
                    'lang' => $translation->language->code,
                    'url' => $translation->canonical_url,
                ];
            })->toArray();

            // Ajouter langue source
            array_unshift($alternates, [
                'lang' => $article->language->code,
                'url' => $mainUrl,
            ]);

            return [
                'loc' => $mainUrl,
                'lastmod' => $article->updated_at->toIso8601String(),
                'changefreq' => $this->getArticleChangeFreq($article),
                'priority' => $this->getArticlePriority($article),
                'alternates' => $alternates,
                'images' => $this->getArticleImages($article),
            ];
        });
    }

    /**
     * Détermine la fréquence de changement d'un article
     */
    protected function getArticleChangeFreq(Article $article): string
    {
        // Articles récents changent plus souvent
        $daysSincePublished = $article->published_at?->diffInDays(now()) ?? 999;

        if ($daysSincePublished < 7) {
            return self::FREQ_DAILY;
        } elseif ($daysSincePublished < 30) {
            return self::FREQ_WEEKLY;
        } elseif ($daysSincePublished < 90) {
            return self::FREQ_MONTHLY;
        }

        return self::FREQ_YEARLY;
    }

    /**
     * Détermine la priorité d'un article
     */
    protected function getArticlePriority(Article $article): float
    {
        // Landing pages = priorité maximale
        if ($article->type === 'landing') {
            return self::PRIORITY_HIGH;
        }

        // Articles récents
        $daysSincePublished = $article->published_at?->diffInDays(now()) ?? 999;

        if ($daysSincePublished < 30) {
            return self::PRIORITY_MEDIUM_HIGH;
        } elseif ($daysSincePublished < 90) {
            return self::PRIORITY_MEDIUM;
        }

        return self::PRIORITY_LOW;
    }

    /**
     * Récupère les images d'un article pour sitemap images
     */
    protected function getArticleImages(Article $article): array
    {
        $images = [];

        if ($article->image_url) {
            $images[] = [
                'loc' => $article->image_url,
                'title' => $article->title,
                'caption' => $article->image_alt ?? $article->excerpt,
            ];
        }

        // Extraction images du contenu (optionnel)
        // TODO: Parser le HTML pour extraire toutes les images

        return $images;
    }

    /**
     * Construit l'URL d'un article
     */
    protected function buildArticleUrl(Article $article): string
    {
        $baseUrl = $article->platform->url ?? config('app.url');
        $lang = $article->language->code;
        $slug = $article->slug;

        if ($lang === config('languages.default', 'fr')) {
            return "{$baseUrl}/articles/{$slug}";
        }

        return "{$baseUrl}/{$lang}/articles/{$slug}";
    }

    // =========================================================================
    // PAGES STATIQUES
    // =========================================================================

    /**
     * Récupère les données des pages statiques
     */
    public function getStaticPagesData(int $platformId): Collection
    {
        $platform = Platform::find($platformId);
        $baseUrl = $platform->url ?? config('app.url');

        // Pages statiques communes
        $pages = collect([
            [
                'loc' => $baseUrl,
                'lastmod' => now()->toIso8601String(),
                'changefreq' => self::FREQ_DAILY,
                'priority' => self::PRIORITY_HIGH,
            ],
            [
                'loc' => "{$baseUrl}/about",
                'lastmod' => now()->toIso8601String(),
                'changefreq' => self::FREQ_MONTHLY,
                'priority' => self::PRIORITY_MEDIUM,
            ],
            [
                'loc' => "{$baseUrl}/contact",
                'lastmod' => now()->toIso8601String(),
                'changefreq' => self::FREQ_MONTHLY,
                'priority' => self::PRIORITY_MEDIUM,
            ],
        ]);

        return $pages;
    }

    // =========================================================================
    // PAYS ET THÈMES
    // =========================================================================

    /**
     * Récupère les données des pages pays
     */
    public function getCountriesData(int $platformId): Collection
    {
        $platform = Platform::find($platformId);
        $baseUrl = $platform->url ?? config('app.url');

        return Country::where('is_active', true)
            ->with('translations.language')
            ->get()
            ->map(function ($country) use ($baseUrl) {
                return [
                    'loc' => "{$baseUrl}/pays/{$country->slug}",
                    'lastmod' => $country->updated_at->toIso8601String(),
                    'changefreq' => self::FREQ_WEEKLY,
                    'priority' => self::PRIORITY_MEDIUM_HIGH,
                    'alternates' => $country->translations->map(fn($t) => [
                        'lang' => $t->language->code,
                        'url' => "{$baseUrl}/{$t->language->code}/pays/{$country->slug}",
                    ])->toArray(),
                ];
            });
    }

    /**
     * Récupère les données des pages thèmes
     */
    public function getThemesData(int $platformId): Collection
    {
        $platform = Platform::find($platformId);
        $baseUrl = $platform->url ?? config('app.url');

        return Theme::where('is_active', true)
            ->with('translations.language')
            ->get()
            ->map(function ($theme) use ($baseUrl) {
                return [
                    'loc' => "{$baseUrl}/themes/{$theme->slug}",
                    'lastmod' => $theme->updated_at->toIso8601String(),
                    'changefreq' => self::FREQ_WEEKLY,
                    'priority' => self::PRIORITY_MEDIUM_HIGH,
                    'alternates' => $theme->translations->map(fn($t) => [
                        'lang' => $t->language->code,
                        'url' => "{$baseUrl}/{$t->language->code}/themes/{$theme->slug}",
                    ])->toArray(),
                ];
            });
    }

    // =========================================================================
    // SITEMAP INDEX
    // =========================================================================

    /**
     * Génère les données pour un sitemap index
     * Utile quand on a >50000 URLs
     * 
     * @param int $platformId ID plateforme
     * @return array
     */
    public function getSitemapIndexData(int $platformId): array
    {
        $platform = Platform::find($platformId);
        $baseUrl = $platform->url ?? config('app.url');

        $articlesCount = Article::where('platform_id', $platformId)
            ->where('status', 'published')
            ->count();

        $sitemaps = [];

        // Sitemap articles (peut être splité en plusieurs si >50000)
        $articleChunks = ceil($articlesCount / 50000);
        for ($i = 1; $i <= $articleChunks; $i++) {
            $sitemaps[] = [
                'loc' => "{$baseUrl}/sitemap-articles-{$i}.xml",
                'lastmod' => now()->toIso8601String(),
            ];
        }

        // Sitemap pages statiques
        $sitemaps[] = [
            'loc' => "{$baseUrl}/sitemap-pages.xml",
            'lastmod' => now()->toIso8601String(),
        ];

        // Sitemap pays
        $sitemaps[] = [
            'loc' => "{$baseUrl}/sitemap-countries.xml",
            'lastmod' => now()->toIso8601String(),
        ];

        // Sitemap thèmes
        $sitemaps[] = [
            'loc' => "{$baseUrl}/sitemap-themes.xml",
            'lastmod' => now()->toIso8601String(),
        ];

        // Sitemap images (si beaucoup d'images)
        if ($articlesCount > 1000) {
            $sitemaps[] = [
                'loc' => "{$baseUrl}/sitemap-images.xml",
                'lastmod' => now()->toIso8601String(),
            ];
        }

        return [
            'sitemaps' => $sitemaps,
            'total_sitemaps' => count($sitemaps),
        ];
    }

    // =========================================================================
    // SITEMAP COMPLET (TOUT-EN-UN)
    // =========================================================================

    /**
     * Génère toutes les données de sitemap d'une plateforme
     * 
     * @param int $platformId ID plateforme
     * @param bool $cached Utiliser le cache (1h)
     * @return array
     */
    public function getCompleteSitemapData(int $platformId, bool $cached = true): array
    {
        $cacheKey = "sitemap_data:platform:{$platformId}";

        if ($cached && Cache::has($cacheKey)) {
            Log::debug("📦 Sitemap data depuis cache", ['platform_id' => $platformId]);
            return Cache::get($cacheKey);
        }

        $startTime = microtime(true);

        $data = [
            'platform_id' => $platformId,
            'generated_at' => now()->toIso8601String(),
            'articles' => $this->getArticlesData($platformId),
            'static_pages' => $this->getStaticPagesData($platformId),
            'countries' => $this->getCountriesData($platformId),
            'themes' => $this->getThemesData($platformId),
        ];

        // Statistiques
        $data['stats'] = [
            'total_urls' => $data['articles']->count() 
                + $data['static_pages']->count()
                + $data['countries']->count()
                + $data['themes']->count(),
            'articles_count' => $data['articles']->count(),
            'static_pages_count' => $data['static_pages']->count(),
            'countries_count' => $data['countries']->count(),
            'themes_count' => $data['themes']->count(),
            'generation_time' => round(microtime(true) - $startTime, 2),
        ];

        // Vérifier si index nécessaire (>50000 URLs)
        $data['needs_index'] = $data['stats']['total_urls'] > 50000;

        if ($data['needs_index']) {
            $data['sitemap_index'] = $this->getSitemapIndexData($platformId);
        }

        // Cache 1h
        if ($cached) {
            Cache::put($cacheKey, $data, 3600);
        }

        Log::info("✅ Sitemap data généré", [
            'platform_id' => $platformId,
            'total_urls' => $data['stats']['total_urls'],
            'generation_time' => $data['stats']['generation_time'] . 's',
        ]);

        return $data;
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Vide le cache du sitemap
     */
    public function clearCache(int $platformId): void
    {
        Cache::forget("sitemap_data:platform:{$platformId}");
        Log::info("🗑️ Cache sitemap vidé", ['platform_id' => $platformId]);
    }

    /**
     * Obtient la dernière date de modification globale
     */
    public function getLastModified(int $platformId): string
    {
        $lastArticle = Article::where('platform_id', $platformId)
            ->where('status', 'published')
            ->orderBy('updated_at', 'desc')
            ->first();

        return $lastArticle?->updated_at->toIso8601String() ?? now()->toIso8601String();
    }

    /**
     * Compte le nombre total d'URLs
     */
    public function getTotalUrlsCount(int $platformId): int
    {
        $articlesCount = Article::where('platform_id', $platformId)
            ->where('status', 'published')
            ->count();

        $countriesCount = Country::where('is_active', true)->count();
        $themesCount = Theme::where('is_active', true)->count();
        $staticPagesCount = 3; // home, about, contact

        return $articlesCount + $countriesCount + $themesCount + $staticPagesCount;
    }

    /**
     * Vérifie si un sitemap index est nécessaire
     */
    public function needsSitemapIndex(int $platformId): bool
    {
        return $this->getTotalUrlsCount($platformId) > 50000;
    }
}