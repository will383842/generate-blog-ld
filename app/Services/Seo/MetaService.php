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
     * 
     * @param Article $article Article source
     * @param string $lang Code langue
     * @return array Meta tags générés
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
     * 
     * @param string $title Titre original
     * @return string Meta title (max 60 chars)
     */
    public function generateMetaTitle(string $title): string
    {
        // Nettoyage HTML
        $title = strip_tags($title);

        // Troncature intelligente
        if (mb_strlen($title) > self::META_TITLE_MAX_LENGTH) {
            $title = mb_substr($title, 0, self::META_TITLE_MAX_LENGTH - 3);
            
            // Coupe au dernier mot complet
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
     * 
     * @param string $excerpt Extrait original
     * @return string Meta description (max 160 chars)
     */
    public function generateMetaDescription(string $excerpt): string
    {
        // Nettoyage HTML
        $description = strip_tags($excerpt);
        $description = preg_replace('/\s+/', ' ', $description);

        // Troncature intelligente
        if (mb_strlen($description) > self::META_DESCRIPTION_MAX_LENGTH) {
            $description = mb_substr($description, 0, self::META_DESCRIPTION_MAX_LENGTH - 3);
            
            // Coupe au dernier mot complet
            $lastSpace = mb_strrpos($description, ' ');
            if ($lastSpace !== false) {
                $description = mb_substr($description, 0, $lastSpace);
            }
            
            $description .= '...';
        }

        return trim($description);
    }

    /**
     * Génère les keywords SEO
     * 
     * @param Article $article Article source
     * @param string $lang Code langue
     * @return string Keywords séparés par virgules
     */
    protected function generateKeywords(Article $article, string $lang): array
    {
        $keywords = [];

        // Pays
        if ($article->country) {
            $countryTranslation = $article->country->translations()
                ->whereHas('language', fn($q) => $q->where('code', $lang))
                ->first();
            
            if ($countryTranslation) {
                $keywords[] = $countryTranslation->name;
                $keywords[] = $countryTranslation->adjective;
            }
        }

        // Thème
        if ($article->theme) {
            $themeTranslation = $article->theme->translations()
                ->whereHas('language', fn($q) => $q->where('code', $lang))
                ->first();
            
            if ($themeTranslation) {
                $keywords[] = $themeTranslation->name;
            }
        }

        // Mots-clés génériques
        $genericKeywords = [
            'fr' => ['expatrié', 'expat', 'immigration', 'visa', 'séjour'],
            'en' => ['expatriate', 'expat', 'immigration', 'visa', 'residence'],
            'de' => ['Auswanderer', 'Expat', 'Einwanderung', 'Visum', 'Aufenthalt'],
            'es' => ['expatriado', 'expat', 'inmigración', 'visa', 'estancia'],
            'pt' => ['expatriado', 'expat', 'imigração', 'visto', 'estadia'],
            'ru' => ['экспат', 'иммиграция', 'виза', 'проживание'],
            'zh' => ['外籍人士', '移民', '签证', '居住'],
            'ar' => ['مغترب', 'هجرة', 'تأشيرة', 'إقامة'],
            'hi' => ['प्रवासी', 'आप्रवासन', 'वीज़ा', 'निवास'],
        ];

        if (isset($genericKeywords[$lang])) {
            $keywords = array_merge($keywords, array_slice($genericKeywords[$lang], 0, 3));
        }

        return array_unique($keywords);
    }

    // =========================================================================
    // JSON-LD SCHEMA.ORG
    // =========================================================================

    /**
     * Génère le JSON-LD Article complet
     * 
     * @param Article $article Article source
     * @param string $lang Code langue
     * @return array JSON-LD structuré
     */
    public function generateJsonLdArticle(Article $article, string $lang = 'fr'): array
    {
        $translation = $this->getTranslation($article, $lang);
        $url = $this->generateCanonicalUrl($article, $lang);

        $jsonLd = [
            '@context' => 'https://schema.org',
            '@type' => 'Article',
            'headline' => $translation->title ?? $article->title,
            'description' => $translation->excerpt ?? $article->excerpt,
            'datePublished' => $article->published_at?->toIso8601String() ?? $article->created_at->toIso8601String(),
            'dateModified' => $article->updated_at->toIso8601String(),
            'author' => [
                '@type' => 'Person',
                'name' => $article->author->name ?? 'SOS-Expat',
            ],
            'publisher' => [
                '@type' => 'Organization',
                'name' => $article->platform->name ?? 'SOS-Expat',
                'logo' => [
                    '@type' => 'ImageObject',
                    'url' => $this->getPlatformLogoUrl($article->platform),
                ],
            ],
            'mainEntityOfPage' => [
                '@type' => 'WebPage',
                '@id' => $url,
            ],
            'url' => $url,
            'inLanguage' => $lang,
        ];

        // Image si présente
        if ($article->image_url) {
            $jsonLd['image'] = [
                '@type' => 'ImageObject',
                'url' => $article->image_url,
                'caption' => $translation->image_alt ?? $article->image_alt,
            ];
        }

        // Nombre de mots
        $jsonLd['wordCount'] = $article->word_count;

        // Temps de lecture
        if ($article->reading_time) {
            $jsonLd['timeRequired'] = "PT{$article->reading_time}M";
        }

        Log::debug("📄 JSON-LD Article généré", ['lang' => $lang]);

        return $jsonLd;
    }

    /**
     * Génère le JSON-LD FAQPage
     * 
     * @param array $faqs Tableau de FAQs ['question' => '', 'answer' => '']
     * @param string $pageUrl URL de la page
     * @return array JSON-LD FAQPage
     */
    public function generateJsonLdFaq(array $faqs, string $pageUrl = ''): array
    {
        if (empty($faqs)) {
            return [];
        }

        $mainEntity = [];

        foreach ($faqs as $faq) {
            $mainEntity[] = [
                '@type' => 'Question',
                'name' => strip_tags($faq['question']),
                'acceptedAnswer' => [
                    '@type' => 'Answer',
                    'text' => strip_tags($faq['answer']),
                ],
            ];
        }

        $jsonLd = [
            '@context' => 'https://schema.org',
            '@type' => 'FAQPage',
            'mainEntity' => $mainEntity,
        ];

        if ($pageUrl) {
            $jsonLd['url'] = $pageUrl;
        }

        Log::debug("❓ JSON-LD FAQPage généré", ['faqs_count' => count($faqs)]);

        return $jsonLd;
    }

    /**
     * Génère le JSON-LD Breadcrumb
     * 
     * @param Article $article Article source
     * @param string $lang Code langue
     * @return array JSON-LD BreadcrumbList
     */
    public function generateJsonLdBreadcrumb(Article $article, string $lang = 'fr'): array
    {
        $items = [];
        $position = 1;

        // Home
        $items[] = [
            '@type' => 'ListItem',
            'position' => $position++,
            'name' => 'Accueil',
            'item' => $this->getPlatformUrl($article->platform),
        ];

        // Pays
        if ($article->country) {
            $countryTranslation = $article->country->translations()
                ->whereHas('language', fn($q) => $q->where('code', $lang))
                ->first();

            $items[] = [
                '@type' => 'ListItem',
                'position' => $position++,
                'name' => $countryTranslation?->name ?? $article->country->name,
                'item' => $this->getPlatformUrl($article->platform) . '/pays/' . $article->country->slug,
            ];
        }

        // Thème
        if ($article->theme) {
            $themeTranslation = $article->theme->translations()
                ->whereHas('language', fn($q) => $q->where('code', $lang))
                ->first();

            $items[] = [
                '@type' => 'ListItem',
                'position' => $position++,
                'name' => $themeTranslation?->name ?? $article->theme->name,
                'item' => $this->getPlatformUrl($article->platform) . '/themes/' . $article->theme->slug,
            ];
        }

        // Article actuel
        $translation = $this->getTranslation($article, $lang);
        $items[] = [
            '@type' => 'ListItem',
            'position' => $position,
            'name' => $translation->title ?? $article->title,
            'item' => $this->generateCanonicalUrl($article, $lang),
        ];

        return [
            '@context' => 'https://schema.org',
            '@type' => 'BreadcrumbList',
            'itemListElement' => $items,
        ];
    }

    // =========================================================================
    // HREFLANG
    // =========================================================================

    /**
     * Génère les données hreflang pour toutes les langues
     * 
     * @param Article $article Article source
     * @return array Tableau de hreflang ['lang' => 'url']
     */
    public function generateHreflangData(Article $article): array
    {
        $hreflang = [];
        $platform = $article->platform;

        // Langue source
        $hreflang[$article->language->code] = $this->generateCanonicalUrl($article, $article->language->code);

        // Traductions
        foreach ($article->translations as $translation) {
            $lang = $translation->language->code;
            $hreflang[$lang] = $this->generateCanonicalUrl($article, $lang);
        }

        // x-default (langue par défaut pour trafic international)
        $defaultLang = config('languages.default', 'fr');
        if (isset($hreflang[$defaultLang])) {
            $hreflang['x-default'] = $hreflang[$defaultLang];
        }

        Log::debug("🌍 Hreflang généré", ['languages' => array_keys($hreflang)]);

        return $hreflang;
    }

    /**
     * Génère les balises hreflang HTML
     * 
     * @param Article $article Article source
     * @return string HTML des balises hreflang
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
    // CANONICAL URL
    // =========================================================================

    /**
     * Génère l'URL canonique d'un article
     * 
     * @param Article $article Article source
     * @param string $lang Code langue
     * @return string URL canonique
     */
    public function generateCanonicalUrl(Article $article, string $lang = 'fr'): string
    {
        $platform = $article->platform;
        $baseUrl = $this->getPlatformUrl($platform);
        
        $translation = $this->getTranslation($article, $lang);
        $slug = $translation->slug ?? $article->slug;

        // Structure URL selon plateforme
        if ($lang === config('languages.default', 'fr')) {
            return "{$baseUrl}/articles/{$slug}";
        }

        return "{$baseUrl}/{$lang}/articles/{$slug}";
    }

    // =========================================================================
    // OPEN GRAPH
    // =========================================================================

    /**
     * Génère les meta tags OpenGraph
     * 
     * @param Article $article Article source
     * @param string $lang Code langue
     * @return array OpenGraph tags
     */
    public function generateOpenGraph(Article $article, string $lang = 'fr'): array
    {
        $translation = $this->getTranslation($article, $lang);
        $url = $this->generateCanonicalUrl($article, $lang);

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
            $og['og:image:width'] = '1200';
            $og['og:image:height'] = '630';
        }

        // Dates pour articles
        if ($article->published_at) {
            $og['article:published_time'] = $article->published_at->toIso8601String();
            $og['article:modified_time'] = $article->updated_at->toIso8601String();
        }

        // Auteur
        if ($article->author) {
            $og['article:author'] = $article->author->name;
        }

        // Langues alternatives
        $alternateLocales = $this->getOgAlternateLocales($article, $lang);
        foreach ($alternateLocales as $locale) {
            $og['og:locale:alternate'][] = $locale;
        }

        Log::debug("📘 OpenGraph généré", ['lang' => $lang]);

        return $og;
    }

    /**
     * Génère les balises OpenGraph HTML
     * 
     * @param Article $article Article source
     * @param string $lang Code langue
     * @return string HTML des balises OG
     */
    public function generateOpenGraphTags(Article $article, string $lang = 'fr'): string
    {
        $ogData = $this->generateOpenGraph($article, $lang);
        $tags = [];

        foreach ($ogData as $property => $content) {
            if (is_array($content)) {
                foreach ($content as $value) {
                    $tags[] = sprintf('<meta property="%s" content="%s" />', $property, htmlspecialchars($value));
                }
            } else {
                $tags[] = sprintf('<meta property="%s" content="%s" />', $property, htmlspecialchars($content));
            }
        }

        return implode("\n", $tags);
    }

    // =========================================================================
    // TWITTER CARD
    // =========================================================================

    /**
     * Génère les meta tags Twitter Card
     * 
     * @param Article $article Article source
     * @param string $lang Code langue
     * @return array Twitter Card tags
     */
    public function generateTwitterCard(Article $article, string $lang = 'fr'): array
    {
        $translation = $this->getTranslation($article, $lang);

        $twitter = [
            'twitter:card' => $article->image_url ? 'summary_large_image' : 'summary',
            'twitter:title' => $this->truncateForOg($translation->title ?? $article->title, 70),
            'twitter:description' => $this->truncateForOg($translation->excerpt ?? $article->excerpt, 200),
        ];

        // Image
        if ($article->image_url) {
            $twitter['twitter:image'] = $article->image_url;
            $twitter['twitter:image:alt'] = strip_tags($translation->image_alt ?? $article->image_alt ?? '');
        }

        // Site Twitter si configuré
        $twitterHandle = config('platforms.twitter_handle', '@SOSExpat');
        if ($twitterHandle) {
            $twitter['twitter:site'] = $twitterHandle;
            $twitter['twitter:creator'] = $twitterHandle;
        }

        Log::debug("🐦 Twitter Card généré", ['lang' => $lang]);

        return $twitter;
    }

    /**
     * Génère les balises Twitter Card HTML
     * 
     * @param Article $article Article source
     * @param string $lang Code langue
     * @return string HTML des balises Twitter
     */
    public function generateTwitterCardTags(Article $article, string $lang = 'fr'): string
    {
        $twitterData = $this->generateTwitterCard($article, $lang);
        $tags = [];

        foreach ($twitterData as $name => $content) {
            $tags[] = sprintf('<meta name="%s" content="%s" />', $name, htmlspecialchars($content));
        }

        return implode("\n", $tags);
    }

    // =========================================================================
    // MÉTHODE TOUT-EN-UN
    // =========================================================================

    /**
     * Génère TOUTES les métadonnées SEO d'un coup
     * 
     * @param Article $article Article source
     * @param string $lang Code langue
     * @return array Toutes les métadonnées
     */
    public function generateAllMeta(Article $article, string $lang = 'fr'): array
    {
        return [
            'basic' => $this->generateMeta($article, $lang),
            'canonical' => $this->generateCanonicalUrl($article, $lang),
            'json_ld' => [
                'article' => $this->generateJsonLdArticle($article, $lang),
                'breadcrumb' => $this->generateJsonLdBreadcrumb($article, $lang),
            ],
            'hreflang' => $this->generateHreflangData($article),
            'opengraph' => $this->generateOpenGraph($article, $lang),
            'twitter' => $this->generateTwitterCard($article, $lang),
        ];
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Récupère la traduction d'un article
     */
    protected function getTranslation(Article $article, string $lang): Article|ArticleTranslation
    {
        if ($article->language->code === $lang) {
            return $article;
        }

        return $article->translations()
            ->whereHas('language', fn($q) => $q->where('code', $lang))
            ->first() ?? $article;
    }

    /**
     * Tronque un texte pour OpenGraph
     */
    protected function truncateForOg(string $text, int $maxLength): string
    {
        $text = strip_tags($text);
        
        if (mb_strlen($text) <= $maxLength) {
            return $text;
        }

        $text = mb_substr($text, 0, $maxLength - 3);
        $lastSpace = mb_strrpos($text, ' ');
        
        if ($lastSpace !== false) {
            $text = mb_substr($text, 0, $lastSpace);
        }

        return trim($text) . '...';
    }

    /**
     * Obtient le locale OpenGraph
     */
    protected function getOgLocale(string $lang): string
    {
        $locales = [
            'fr' => 'fr_FR',
            'en' => 'en_US',
            'de' => 'de_DE',
            'es' => 'es_ES',
            'pt' => 'pt_PT',
            'ru' => 'ru_RU',
            'zh' => 'zh_CN',
            'ar' => 'ar_AR',
            'hi' => 'hi_IN',
        ];

        return $locales[$lang] ?? 'fr_FR';
    }

    /**
     * Obtient les locales alternatives pour OpenGraph
     */
    protected function getOgAlternateLocales(Article $article, string $currentLang): array
    {
        $alternates = [];

        foreach ($article->translations as $translation) {
            $lang = $translation->language->code;
            if ($lang !== $currentLang) {
                $alternates[] = $this->getOgLocale($lang);
            }
        }

        return $alternates;
    }

    /**
     * Obtient l'URL de base d'une plateforme
     */
    protected function getPlatformUrl(?Platform $platform): string
    {
        return $platform?->url ?? config('app.url', 'https://sos-expat.com');
    }

    /**
     * Obtient l'URL du logo d'une plateforme
     */
    protected function getPlatformLogoUrl(?Platform $platform): string
    {
        return $platform?->logo_url ?? config('app.url') . '/images/logo.png';
    }
}