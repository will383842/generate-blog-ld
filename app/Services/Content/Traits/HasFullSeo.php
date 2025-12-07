<?php

namespace App\Services\Content\Traits;

use App\Models\Article;
use App\Models\Country;
use App\Services\Seo\SeoOptimizationService;
use App\Services\Seo\LocaleSlugService;
use App\Services\Seo\MetaService;
use App\Services\Linking\LinkingOrchestrator;
use App\Services\Linking\AffiliateLinkService;
use Illuminate\Support\Facades\Log;

/**
 * Trait HasFullSeo - Ajoute le support SEO complet à tous les générateurs
 *
 * Fonctionnalités incluses:
 * - Meta title/description optimisés et traduits
 * - Génération des slugs locale-pays
 * - JSON-LD (Article, BreadcrumbList, FAQPage)
 * - Hreflang avec pays
 * - OpenGraph et Twitter Cards
 * - Attributs images (alt, aria-label, loading, srcset)
 * - Liens internes, externes et affiliés
 * - Publication automatique si score OK
 *
 * Usage:
 * ```php
 * class MyGenerator {
 *     use HasFullSeo;
 *
 *     public function generate() {
 *         // ... génération du contenu ...
 *         $this->applyFullSeo($article, $context);
 *     }
 * }
 * ```
 *
 * @package App\Services\Content\Traits
 */
trait HasFullSeo
{
    protected ?SeoOptimizationService $seoService = null;
    protected ?LocaleSlugService $localeSlugService = null;
    protected ?MetaService $metaService = null;
    protected ?LinkingOrchestrator $linkingOrchestrator = null;

    /**
     * Initialise les services SEO
     */
    protected function initSeoServices(): void
    {
        if ($this->seoService === null) {
            $this->seoService = app(SeoOptimizationService::class);
        }
        if ($this->localeSlugService === null) {
            $this->localeSlugService = app(LocaleSlugService::class);
        }
        if ($this->metaService === null) {
            $this->metaService = app(MetaService::class);
        }
        if ($this->linkingOrchestrator === null) {
            $this->linkingOrchestrator = app(LinkingOrchestrator::class);
        }
    }

    /**
     * Applique le SEO complet à un article
     *
     * @param Article $article Article à optimiser
     * @param array $context Contexte de génération
     * @param array $options Options (enable_links, enable_affiliate, auto_publish)
     * @return array Résultats de l'optimisation
     */
    protected function applyFullSeo(Article $article, array $context, array $options = []): array
    {
        $this->initSeoServices();

        $options = array_merge([
            'enable_internal_links' => true,
            'enable_external_links' => true,
            'enable_affiliate_links' => true,
            'enable_pillar_links' => true,
            'auto_publish' => config('content.auto_publish.enabled', false),
            'min_quality_score' => config('content.auto_publish.min_score', 75),
        ], $options);

        $results = [
            'meta_optimized' => false,
            'locale_slugs_generated' => 0,
            'json_ld_generated' => false,
            'hreflang_generated' => false,
            'links_processed' => [],
            'images_optimized' => 0,
            'auto_published' => false,
        ];

        try {
            // 1. Optimiser les meta title/description
            $results['meta_optimized'] = $this->optimizeMeta($article, $context);

            // 2. Générer les slugs locale-pays
            $results['locale_slugs_generated'] = $this->generateLocaleSlugs($article);

            // 3. Générer JSON-LD complet
            $results['json_ld_generated'] = $this->generateJsonLd($article, $context);

            // 4. Optimiser les images dans le contenu
            $results['images_optimized'] = $this->optimizeContentImages($article, $context);

            // 5. Générer les liens (internes, externes, affiliés)
            if ($options['enable_internal_links'] || $options['enable_external_links'] || $options['enable_affiliate_links']) {
                $results['links_processed'] = $this->processLinks($article, $options);
            }

            // 6. Publication automatique si score OK
            if ($options['auto_publish'] && $article->quality_score >= $options['min_quality_score']) {
                $results['auto_published'] = $this->autoPublish($article);
            }

            Log::info('HasFullSeo: SEO complet appliqué', [
                'article_id' => $article->id,
                'type' => $article->type,
                'results' => $results,
            ]);

        } catch (\Exception $e) {
            Log::error('HasFullSeo: Erreur application SEO', [
                'article_id' => $article->id,
                'error' => $e->getMessage(),
            ]);
        }

        return $results;
    }

    /**
     * Optimise les meta title et description
     */
    protected function optimizeMeta(Article $article, array $context): bool
    {
        $type = $article->type ?? 'article';
        $lang = $context['language']->code ?? 'fr';

        $metaContext = [
            'country' => $context['country']->getName($lang) ?? '',
            'platform' => $context['platform']->name ?? 'SOS-Expat',
            'service' => $context['service'] ?? $context['theme']->getName($lang) ?? '',
            'year' => date('Y'),
        ];

        // Générer meta title optimisé
        $metaTitle = $this->seoService->generateMetaTitle(
            $article->title,
            $type,
            $lang,
            $metaContext
        );

        // Générer meta description optimisée
        $metaDescription = $this->seoService->generateMetaDescription(
            $article->title,
            $type,
            $lang,
            $metaContext
        );

        // Mettre à jour l'article
        $article->update([
            'meta_title' => $metaTitle,
            'meta_description' => $metaDescription,
        ]);

        return true;
    }

    /**
     * Génère les slugs pour toutes les locales
     */
    protected function generateLocaleSlugs(Article $article): int
    {
        return $this->localeSlugService->saveLocaleSlugs($article);
    }

    /**
     * Génère le JSON-LD complet
     */
    protected function generateJsonLd(Article $article, array $context): bool
    {
        $lang = $context['language']->code ?? 'fr';

        // JSON-LD Article
        $articleSchema = $this->metaService->generateJsonLd($article, $lang);

        // JSON-LD BreadcrumbList
        $breadcrumbSchema = $this->metaService->generateJsonLdBreadcrumb($article, $lang);

        // JSON-LD FAQPage si FAQs présentes
        $faqSchema = null;
        if ($article->faqs()->exists()) {
            $faqSchema = $this->generateFaqSchema($article, $lang);
        }

        // Combiner tous les schemas
        $jsonLd = [
            '@context' => 'https://schema.org',
            '@graph' => array_filter([
                $articleSchema,
                $breadcrumbSchema,
                $faqSchema,
            ]),
        ];

        $article->update(['json_ld' => $jsonLd]);

        return true;
    }

    /**
     * Génère le schema FAQPage
     */
    protected function generateFaqSchema(Article $article, string $lang): array
    {
        $faqs = $article->faqs()
            ->whereHas('language', fn($q) => $q->where('code', $lang))
            ->orWhereNull('language_id')
            ->get();

        $mainEntity = [];
        foreach ($faqs as $faq) {
            $mainEntity[] = [
                '@type' => 'Question',
                'name' => $faq->question,
                'acceptedAnswer' => [
                    '@type' => 'Answer',
                    'text' => $faq->answer,
                ],
            ];
        }

        return [
            '@type' => 'FAQPage',
            'mainEntity' => $mainEntity,
        ];
    }

    /**
     * Optimise les images dans le contenu
     */
    protected function optimizeContentImages(Article $article, array $context): int
    {
        $lang = $context['language']->code ?? 'fr';
        $content = $article->content;
        $optimizedCount = 0;

        // Pattern pour trouver les images
        $pattern = '/<img([^>]*)>/i';

        $content = preg_replace_callback($pattern, function ($matches) use ($lang, $article, &$optimizedCount) {
            $attributes = $matches[1];

            // Extraire src existant
            preg_match('/src=["\']([^"\']+)["\']/', $attributes, $srcMatch);
            $src = $srcMatch[1] ?? '';

            if (empty($src)) {
                return $matches[0];
            }

            // Extraire alt existant ou générer
            preg_match('/alt=["\']([^"\']*)["\']/', $attributes, $altMatch);
            $existingAlt = $altMatch[1] ?? '';

            // Générer les attributs optimisés
            $newAttributes = $this->seoService->generateImageAttributes(
                $src,
                $existingAlt ?: $article->title,
                $lang,
                []
            );

            // Construire le nouveau tag img
            $attrString = collect($newAttributes)
                ->map(fn($value, $key) => $key . '="' . htmlspecialchars($value, ENT_QUOTES, 'UTF-8') . '"')
                ->implode(' ');

            // Conserver les classes existantes
            if (preg_match('/class=["\']([^"\']+)["\']/', $attributes, $classMatch)) {
                $attrString .= ' class="' . $classMatch[1] . '"';
            }

            $optimizedCount++;

            return "<img {$attrString}>";
        }, $content);

        // Optimiser l'image principale
        if ($article->image_url && empty($article->image_alt)) {
            $article->image_alt = $this->seoService->generateAltText($article->title, $lang);
        }

        $article->update([
            'content' => $content,
            'image_alt' => $article->image_alt,
        ]);

        return $optimizedCount;
    }

    /**
     * Traite les liens (internes, externes, affiliés)
     */
    protected function processLinks(Article $article, array $options): array
    {
        try {
            return $this->linkingOrchestrator->processArticle($article, [
                'internal' => $options['enable_internal_links'],
                'external' => $options['enable_external_links'],
                'affiliate' => $options['enable_affiliate_links'],
                'pillar' => $options['enable_pillar_links'],
                'inject_content' => true,
            ]);
        } catch (\Exception $e) {
            Log::warning('HasFullSeo: Erreur traitement liens', [
                'article_id' => $article->id,
                'error' => $e->getMessage(),
            ]);
            return ['error' => $e->getMessage()];
        }
    }

    /**
     * Publication automatique
     */
    protected function autoPublish(Article $article): bool
    {
        $article->update([
            'status' => 'published',
            'published_at' => now(),
        ]);

        // Dispatcher job d'indexation
        if (class_exists(\App\Jobs\RequestIndexing::class)) {
            \App\Jobs\RequestIndexing::dispatch($article->id);
        }

        Log::info('HasFullSeo: Article auto-publié', [
            'article_id' => $article->id,
            'quality_score' => $article->quality_score,
        ]);

        return true;
    }

    // =========================================================================
    // GÉNÉRATION MULTI-LANGUES
    // =========================================================================

    /**
     * Configure la génération pour plusieurs langues
     *
     * @param array $languages Langues cibles ['fr', 'en', 'de', ...]
     * @param int $articleId ID de l'article source
     * @return void
     */
    protected function dispatchMultiLanguageGeneration(array $languages, int $articleId): void
    {
        $sourceLang = $languages[0] ?? 'fr';
        $targetLanguages = array_slice($languages, 1);

        if (empty($targetLanguages)) {
            return;
        }

        // Dispatcher les traductions avec délai progressif
        $delay = 0;
        foreach ($targetLanguages as $lang) {
            \App\Jobs\TranslateArticle::dispatch($articleId, $lang)
                ->onQueue('translation')
                ->delay(now()->addSeconds($delay));

            $delay += 15; // 15 secondes entre chaque traduction
        }

        Log::info('HasFullSeo: Traductions multi-langues dispatchées', [
            'article_id' => $articleId,
            'source_lang' => $sourceLang,
            'target_languages' => $targetLanguages,
        ]);
    }

    /**
     * Applique le SEO après traduction
     */
    protected function applySeoAfterTranslation(Article $article, string $targetLang): void
    {
        $this->initSeoServices();

        // Mettre à jour les locale slugs
        $this->localeSlugService->updateAfterTranslation(
            $article,
            $article->translations()->latest()->first()
        );

        // Régénérer le JSON-LD avec les nouvelles traductions
        $article->refresh();
        $this->generateJsonLd($article, [
            'language' => $article->language,
            'country' => $article->country,
            'platform' => $article->platform,
            'theme' => $article->theme,
        ]);
    }

    // =========================================================================
    // VALIDATION SEO
    // =========================================================================

    /**
     * Valide le SEO d'un article
     */
    protected function validateSeo(Article $article): array
    {
        $this->initSeoServices();
        return $this->seoService->validateArticleSeo($article);
    }

    /**
     * Vérifie si l'article est prêt pour publication
     */
    protected function isReadyForPublication(Article $article, int $minScore = 75): bool
    {
        $validation = $this->validateSeo($article);

        return $validation['score'] >= $minScore
            && empty($validation['issues'])
            && $article->quality_score >= $minScore;
    }
}
