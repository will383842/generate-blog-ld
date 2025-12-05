<?php

namespace App\Services\Seo;

use App\Models\Article;
use App\Models\ArticleTranslation;
use App\Models\Language;
use App\Models\Platform;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Service de génération de métadonnées SEO
 * Génère meta tags, JSON-LD, hreflang, OpenGraph et Twitter Cards
 * 
 * ✅ CORRIGÉ: hreflang avec format langue-PAYS (fr-DE, en-DE, etc.)
 * ✅ CORRIGÉ: URLs avec structure /{pays}/{article}
 * 
 * Placement: app/Services/Seo/MetaService.php
 */
class MetaService
{
    // Limites SEO recommandées
    const META_TITLE_MAX_LENGTH = 60;
    const META_DESCRIPTION_MAX_LENGTH = 160;
    const OG_TITLE_MAX_LENGTH = 70;
    const OG_DESCRIPTION_MAX_LENGTH = 200;

    // =========================================================================
    // META TAGS DE BASE
    // =========================================================================

    /**
     * Génère les meta tags de base pour un article
     */
    public function generateMeta(Article $article, string $lang = 'fr'): array
    {
        $translation = $this->getTranslation($article, $lang);

        $title = $this->generateMetaTitle($translation->title ?? $article->title);
        $description = $this->generateMetaDescription($translation->excerpt ?? $article->excerpt);

        Log::debug("🏷️ Meta tags générés pour {$lang}", [
            'title_length' => strlen($title),
            'description_length' => strlen($description),
        ]);

        return [
            'title' => $title,
            'description' => $description,
            'keywords' => $this->generateKeywords($article, $lang),
            'author' => $article->author->name ?? 'SOS-Expat',
            'robots' => 'index, follow',
            'language' => $lang,
        ];
    }

    /**
     * Génère un meta title optimisé SEO
     */
    public function generateMetaTitle(string $title): string
    {
        $title = strip_tags($title);

        if (mb_strlen($title) > self::META_TITLE_MAX_LENGTH) {
            $title = mb_substr($title, 0, self::META_TITLE_MAX_LENGTH - 3);
            $lastSpace = mb_strrpos($title, ' ');
            if ($lastSpace !== false) {
                $title = mb_substr($title, 0, $lastSpace);
            }
            $title .= '...';
        }

        return trim($title);
    }

    /**
     * Génère une meta description optimisée SEO
     */
    public function generateMetaDescription(string $excerpt): string
    {
        $description = strip_tags($excerpt);
        $description = preg_replace('/\s+/', ' ', $description);

        if (mb_strlen($description) > self::META_DESCRIPTION_MAX_LENGTH) {
            $description = mb_substr($description, 0, self::META_DESCRIPTION_MAX_LENGTH - 3);
            $lastSpace = mb_strrpos($description, ' ');
            if ($lastSpace !== false) {
                $description = mb_substr($description, 0, $lastSpace);
            }
            $description .= '...';
        }

        return trim($description);
    }

    /**
     * Génère les mots-clés SEO
     */
    public function generateKeywords(Article $article, string $lang = 'fr'): string
    {
        $keywords = [];

        // Pays
        if ($article->country) {
            $keywords[] = $article->country->getName($lang);
        }

        // Thème
        if ($article->theme) {
            $themeTranslation = $article->theme->translations()
                ->whereHas('language', fn($q) => $q->where('code', $lang))
                ->first();
            $keywords[] = $themeTranslation?->name ?? $article->theme->name;
        }

        // Plateforme
        $keywords[] = $article->platform->name ?? 'expatriation';

        // Ajouter des mots-clés contextuels
        $contextKeywords = $this->getContextKeywords($lang);
        $keywords = array_merge($keywords, $contextKeywords);

        return implode(', ', array_filter(array_unique($keywords)));
    }

    /**
     * Mots-clés contextuels par langue
     */
    private function getContextKeywords(string $lang): array
    {
        $keywords = [
            'fr' => ['expatriation', 'vivre à l\'étranger', 'démarches', 'conseils'],
            'en' => ['expatriation', 'living abroad', 'procedures', 'tips'],
            'de' => ['Auswanderung', 'Auslandsaufenthalt', 'Formalitäten', 'Tipps'],
            'es' => ['expatriación', 'vivir en el extranjero', 'trámites', 'consejos'],
            'pt' => ['expatriação', 'viver no exterior', 'procedimentos', 'dicas'],
            'ru' => ['эмиграция', 'жизнь за рубежом', 'процедуры', 'советы'],
            'zh' => ['移居海外', '海外生活', '手续', '建议'],
            'ar' => ['الهجرة', 'العيش في الخارج', 'الإجراءات', 'النصائح'],
            'hi' => ['प्रवास', 'विदेश में रहना', 'प्रक्रियाएं', 'सुझाव'],
        ];

        return $keywords[$lang] ?? $keywords['en'];
    }

    // =========================================================================
    // ✅ HREFLANG CORRIGÉ - AVEC CODE PAYS (fr-DE, en-DE, etc.)
    // =========================================================================

    /**
     * Génère les données hreflang pour toutes les langues
     * 
     * Format corrigé: langue-PAYS (ex: fr-DE pour français en Allemagne)
     * 
     * Exemple de sortie pour un article sur l'Allemagne:
     * [
     *   'fr-DE' => 'https://sos-expat.com/allemagne/visa-travail',
     *   'en-DE' => 'https://sos-expat.com/en/germany/work-visa',
     *   'de-DE' => 'https://sos-expat.com/de/deutschland/arbeitsvisum',
     *   'ar-DE' => 'https://sos-expat.com/ar/almania/tashira-amal',
     *   'x-default' => 'https://sos-expat.com/allemagne/visa-travail',
     * ]
     */
    public function generateHreflangData(Article $article): array
    {
        $hreflang = [];
        $country = $article->country;

        // Si pas de pays, utiliser l'ancien format (fallback)
        if (!$country) {
            Log::warning("⚠️ Article sans pays pour hreflang", ['article_id' => $article->id]);
            return $this->generateHreflangDataWithoutCountry($article);
        }

        // Code pays ISO (ex: DE, FR, US)
        $countryCode = strtoupper($country->code);

        // Langue source avec code pays
        $sourceLang = $article->language?->code ?? 'fr';
        $hreflangCode = "{$sourceLang}-{$countryCode}"; // ex: fr-DE
        $hreflang[$hreflangCode] = $this->generateCanonicalUrlWithCountry($article, $sourceLang);

        // Traductions avec code pays
        foreach ($article->translations as $translation) {
            if ($translation->status !== 'completed') {
                continue;
            }
            
            $lang = $translation->language?->code;
            if ($lang) {
                $hreflangCode = "{$lang}-{$countryCode}"; // ex: en-DE, ar-DE
                $hreflang[$hreflangCode] = $this->generateCanonicalUrlWithCountry($article, $lang);
            }
        }

        // x-default (langue par défaut = FR pour trafic international)
        $defaultLang = config('languages.default', 'fr');
        $defaultHreflang = "{$defaultLang}-{$countryCode}";
        if (isset($hreflang[$defaultHreflang])) {
            $hreflang['x-default'] = $hreflang[$defaultHreflang];
        }

        Log::debug("🌍 Hreflang généré avec pays", [
            'country' => $countryCode,
            'languages' => array_keys($hreflang),
        ]);

        return $hreflang;
    }

    /**
     * Fallback hreflang pour articles sans pays (ancien format)
     */
    private function generateHreflangDataWithoutCountry(Article $article): array
    {
        $hreflang = [];

        $hreflang[$article->language->code] = $this->generateCanonicalUrl($article, $article->language->code);

        foreach ($article->translations as $translation) {
            if ($translation->status === 'completed') {
                $lang = $translation->language->code;
                $hreflang[$lang] = $this->generateCanonicalUrl($article, $lang);
            }
        }

        $defaultLang = config('languages.default', 'fr');
        if (isset($hreflang[$defaultLang])) {
            $hreflang['x-default'] = $hreflang[$defaultLang];
        }

        return $hreflang;
    }

    /**
     * Génère les balises hreflang HTML
     */
    public function generateHreflangTags(Article $article): string
    {
        $hreflangData = $this->generateHreflangData($article);
        $tags = [];

        foreach ($hreflangData as $lang => $url) {
            $tags[] = sprintf('<link rel="alternate" hreflang="%s" href="%s" />', $lang, $url);
        }

        return implode("\n", $tags);
    }

    // =========================================================================
    // ✅ CANONICAL URL CORRIGÉ - AVEC PAYS
    // =========================================================================

    /**
     * Génère l'URL canonique avec pays
     * 
     * Structure:
     * - FR (défaut): https://domain.com/{pays-slug-fr}/{article-slug}
     * - Autres: https://domain.com/{lang}/{pays-slug-lang}/{article-slug-lang}
     * 
     * Exemples pour un article sur l'Allemagne:
     * - FR: https://sos-expat.com/allemagne/visa-travail
     * - EN: https://sos-expat.com/en/germany/work-visa
     * - DE: https://sos-expat.com/de/deutschland/arbeitsvisum
     * - AR: https://sos-expat.com/ar/almania/tashira-amal
     */
    public function generateCanonicalUrlWithCountry(Article $article, string $lang = 'fr'): string
    {
        $baseUrl = $this->getPlatformUrl($article->platform);
        $country = $article->country;

        // Si pas de pays, fallback ancien format
        if (!$country) {
            return $this->generateCanonicalUrl($article, $lang);
        }

        // Slug du pays dans la langue cible
        $countrySlug = $country->getSlug($lang);

        // Slug de l'article dans la langue cible
        $translation = $this->getTranslation($article, $lang);
        $articleSlug = $translation->slug ?? $article->slug;

        // Langue par défaut = pas de préfixe
        $defaultLang = config('languages.default', 'fr');

        if ($lang === $defaultLang) {
            return rtrim($baseUrl, '/') . "/{$countrySlug}/{$articleSlug}";
        }

        // Autres langues = préfixe /{lang}/
        return rtrim($baseUrl, '/') . "/{$lang}/{$countrySlug}/{$articleSlug}";
    }

    /**
     * Génère l'URL canonique (ancien format sans pays - pour compatibilité)
     */
    public function generateCanonicalUrl(Article $article, string $lang = 'fr'): string
    {
        // Si l'article a un pays, utiliser le nouveau format
        if ($article->country) {
            return $this->generateCanonicalUrlWithCountry($article, $lang);
        }

        // Ancien format pour articles sans pays
        $baseUrl = $this->getPlatformUrl($article->platform);
        $translation = $this->getTranslation($article, $lang);
        $slug = $translation->slug ?? $article->slug;

        if ($lang === config('languages.default', 'fr')) {
            return "{$baseUrl}/articles/{$slug}";
        }

        return "{$baseUrl}/{$lang}/articles/{$slug}";
    }

    // =========================================================================
    // ✅ JSON-LD BREADCRUMB CORRIGÉ - AVEC PAYS
    // =========================================================================

    /**
     * Génère le JSON-LD BreadcrumbList avec pays
     */
    public function generateJsonLdBreadcrumb(Article $article, string $lang = 'fr'): array
    {
        $items = [];
        $position = 1;
        $baseUrl = $this->getPlatformUrl($article->platform);
        $country = $article->country;

        // Labels traduits pour "Accueil"
        $homeLabels = [
            'fr' => 'Accueil',
            'en' => 'Home',
            'de' => 'Startseite',
            'es' => 'Inicio',
            'pt' => 'Início',
            'ru' => 'Главная',
            'zh' => '首页',
            'ar' => 'الرئيسية',
            'hi' => 'होम',
        ];

        // 1. Accueil
        $homeUrl = ($lang === 'fr') ? $baseUrl : "{$baseUrl}/{$lang}";
        $items[] = [
            '@type' => 'ListItem',
            'position' => $position++,
            'name' => $homeLabels[$lang] ?? 'Home',
            'item' => $homeUrl,
        ];

        // 2. Pays (si présent)
        if ($country) {
            $countrySlug = $country->getSlug($lang);
            $countryUrl = ($lang === 'fr')
                ? "{$baseUrl}/{$countrySlug}"
                : "{$baseUrl}/{$lang}/{$countrySlug}";

            $items[] = [
                '@type' => 'ListItem',
                'position' => $position++,
                'name' => $country->getName($lang),
                'item' => $countryUrl,
            ];
        }

        // 3. Thème (si présent)
        if ($article->theme) {
            $themeTranslation = $article->theme->translations()
                ->whereHas('language', fn($q) => $q->where('code', $lang))
                ->first();

            $items[] = [
                '@type' => 'ListItem',
                'position' => $position++,
                'name' => $themeTranslation?->name ?? $article->theme->name ?? 'Thème',
            ];
        }

        // 4. Article (dernier élément)
        $translation = $this->getTranslation($article, $lang);
        $items[] = [
            '@type' => 'ListItem',
            'position' => $position,
            'name' => $translation->title ?? $article->title,
            'item' => $this->generateCanonicalUrlWithCountry($article, $lang),
        ];

        return [
            '@context' => 'https://schema.org',
            '@type' => 'BreadcrumbList',
            'itemListElement' => $items,
        ];
    }

    // =========================================================================
    // OPEN GRAPH
    // =========================================================================

    /**
     * Génère les meta tags OpenGraph
     */
    public function generateOpenGraph(Article $article, string $lang = 'fr'): array
    {
        $translation = $this->getTranslation($article, $lang);
        $url = $this->generateCanonicalUrlWithCountry($article, $lang);

        $og = [
            'og:type' => 'article',
            'og:title' => $this->truncateForOg($translation->title ?? $article->title, self::OG_TITLE_MAX_LENGTH),
            'og:description' => $this->truncateForOg($translation->excerpt ?? $article->excerpt, self::OG_DESCRIPTION_MAX_LENGTH),
            'og:url' => $url,
            'og:site_name' => $article->platform->name ?? 'SOS-Expat',
            'og:locale' => $this->getOgLocale($lang),
        ];

        // Image
        if ($article->image_url) {
            $og['og:image'] = $article->image_url;
            $og['og:image:alt'] = strip_tags($translation->image_alt ?? $article->image_alt ?? '');
            $og['og:image:width'] = $article->image_width ?? '1200';
            $og['og:image:height'] = $article->image_height ?? '630';
        }

        // Dates pour articles
        if ($article->published_at) {
            $og['article:published_time'] = $article->published_at->toIso8601String();
        }
        if ($article->updated_at) {
            $og['article:modified_time'] = $article->updated_at->toIso8601String();
        }

        // Auteur
        if ($article->author) {
            $og['article:author'] = $article->author->name;
        }

        // Locales alternatifs
        foreach ($article->translations as $trans) {
            if ($trans->status === 'completed' && $trans->language) {
                $og['og:locale:alternate'][] = $this->getOgLocale($trans->language->code);
            }
        }

        return $og;
    }

    /**
     * Tronque pour OpenGraph
     */
    private function truncateForOg(string $text, int $maxLength): string
    {
        $text = strip_tags($text);
        $text = preg_replace('/\s+/', ' ', $text);

        if (mb_strlen($text) > $maxLength) {
            $text = mb_substr($text, 0, $maxLength - 3);
            $lastSpace = mb_strrpos($text, ' ');
            if ($lastSpace !== false) {
                $text = mb_substr($text, 0, $lastSpace);
            }
            $text .= '...';
        }

        return trim($text);
    }

    /**
     * Convertit code langue en locale OpenGraph
     */
    private function getOgLocale(string $lang): string
    {
        $locales = [
            'fr' => 'fr_FR',
            'en' => 'en_US',
            'de' => 'de_DE',
            'es' => 'es_ES',
            'pt' => 'pt_PT',
            'ru' => 'ru_RU',
            'zh' => 'zh_CN',
            'ar' => 'ar_SA',
            'hi' => 'hi_IN',
        ];

        return $locales[$lang] ?? 'en_US';
    }

    // =========================================================================
    // TWITTER CARDS
    // =========================================================================

    /**
     * Génère les meta tags Twitter Cards
     */
    public function generateTwitterCards(Article $article, string $lang = 'fr'): array
    {
        $translation = $this->getTranslation($article, $lang);

        $twitter = [
            'twitter:card' => 'summary_large_image',
            'twitter:title' => $this->truncateForOg($translation->title ?? $article->title, self::OG_TITLE_MAX_LENGTH),
            'twitter:description' => $this->truncateForOg($translation->excerpt ?? $article->excerpt, self::OG_DESCRIPTION_MAX_LENGTH),
        ];

        if ($article->image_url) {
            $twitter['twitter:image'] = $article->image_url;
            $twitter['twitter:image:alt'] = strip_tags($translation->image_alt ?? $article->image_alt ?? '');
        }

        // Handle Twitter si configuré
        $twitterHandle = config('services.twitter.handle');
        if ($twitterHandle) {
            $twitter['twitter:site'] = $twitterHandle;
            $twitter['twitter:creator'] = $twitterHandle;
        }

        return $twitter;
    }

    // =========================================================================
    // JSON-LD ARTICLE
    // =========================================================================

    /**
     * Génère le JSON-LD complet pour un article
     */
    public function generateJsonLd(Article $article, string $lang = 'fr'): array
    {
        $translation = $this->getTranslation($article, $lang);
        $url = $this->generateCanonicalUrlWithCountry($article, $lang);

        $jsonLd = [
            '@context' => 'https://schema.org',
            '@type' => 'Article',
            'headline' => $translation->title ?? $article->title,
            'description' => $translation->excerpt ?? $article->excerpt,
            'url' => $url,
            'mainEntityOfPage' => [
                '@type' => 'WebPage',
                '@id' => $url,
            ],
            'inLanguage' => $lang,
        ];

        // Dates
        if ($article->published_at) {
            $jsonLd['datePublished'] = $article->published_at->toIso8601String();
        }
        if ($article->updated_at) {
            $jsonLd['dateModified'] = $article->updated_at->toIso8601String();
        }

        // Image
        if ($article->image_url) {
            $jsonLd['image'] = [
                '@type' => 'ImageObject',
                'url' => $article->image_url,
                'width' => $article->image_width ?? 1200,
                'height' => $article->image_height ?? 630,
            ];
        }

        // Auteur
        if ($article->author) {
            $jsonLd['author'] = [
                '@type' => 'Person',
                'name' => $article->author->name,
            ];
        }

        // Publisher (plateforme)
        $jsonLd['publisher'] = [
            '@type' => 'Organization',
            'name' => $article->platform->name ?? 'SOS-Expat',
            'logo' => [
                '@type' => 'ImageObject',
                'url' => $article->platform->logo_url ?? config('app.url') . '/logo.png',
            ],
        ];

        // Compteur de mots
        if ($article->word_count) {
            $jsonLd['wordCount'] = $article->word_count;
        }

        return $jsonLd;
    }

    // =========================================================================
    // GÉNÉRATION COMPLÈTE
    // =========================================================================

    /**
     * Génère toutes les métadonnées SEO pour un article
     */
    public function generateAllMeta(Article $article, string $lang = 'fr'): array
    {
        return [
            'meta' => $this->generateMeta($article, $lang),
            'canonical' => $this->generateCanonicalUrlWithCountry($article, $lang),
            'hreflang' => $this->generateHreflangData($article),
            'openGraph' => $this->generateOpenGraph($article, $lang),
            'twitter' => $this->generateTwitterCards($article, $lang),
            'jsonLd' => [
                'article' => $this->generateJsonLd($article, $lang),
                'breadcrumb' => $this->generateJsonLdBreadcrumb($article, $lang),
            ],
        ];
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Récupère la traduction d'un article
     */
    protected function getTranslation(Article $article, string $lang): ?ArticleTranslation
    {
        // Si c'est la langue source, pas besoin de traduction
        if ($article->language && $article->language->code === $lang) {
            return null;
        }

        return $article->translations()
            ->whereHas('language', fn($q) => $q->where('code', $lang))
            ->where('status', 'completed')
            ->first();
    }

    /**
     * Récupère l'URL de base d'une plateforme
     */
    protected function getPlatformUrl(?Platform $platform): string
    {
        if ($platform && $platform->url) {
            return rtrim($platform->url, '/');
        }

        return rtrim(config('app.url'), '/');
    }
}