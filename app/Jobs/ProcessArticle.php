<?php

namespace App\Jobs;

use App\Models\Article;
use App\Models\Country;
use App\Models\Language;
use App\Models\Platform;
use App\Models\GenerationLog;
use App\Services\Content\ArticleGenerator;
use App\Services\Content\MultiLanguageGenerationService;
use App\Services\Seo\LocaleSlugService;
use App\Services\Seo\SeoOptimizationService;
use App\Services\Linking\LinkingOrchestrator;
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
 * Pipeline en 15 étapes :
 * 1. Validation paramètres
 * 2. Recherche sources (Perplexity)
 * 3. Génération titre (anti-doublon SHA256)
 * 4. Génération accroche
 * 5. Génération introduction
 * 6. Génération contenu (6-8 sections H2)
 * 7. Génération FAQs (8 questions)
 * 8. Génération meta optimisés (title < 60 chars, description < 160 chars)
 * 9. Génération JSON-LD (Article, BreadcrumbList, FAQPage)
 * 10. Ajout liens internes/externes
 * 11. Ajout liens affiliés
 * 12. Optimisation images (alt, aria-label, loading, srcset)
 * 13. Génération slugs locale-pays (fr-DE, en-DE, etc.)
 * 14. Calcul quality_score + sauvegarde
 * 15. Dispatch traductions multi-langues (si languages[] fourni)
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
     * Délais entre tentatives (backoff exponentiel)
     * 30s, 2min, 5min
     *
     * @return array<int>
     */
    public function backoff(): array
    {
        return [30, 120, 300];
    }

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

            DB::commit();

            // ========== ÉTAPE 13: SEO COMPLET ==========
            $this->applyFullSeo($article);

            // ========== ÉTAPE 14: SLUGS LOCALE-PAYS ==========
            $this->generateLocaleSlugs($article);

            // ========== ÉTAPE 15: LIENS (internes, externes, affiliés) ==========
            $this->processLinks($article);

            // Log de succès
            $this->logGeneration($article, 'completed', $startTime);

            Log::info('✅ Article généré avec succès', [
                'article_id' => $article->id,
                'title' => $article->title,
                'quality_score' => $article->quality_score,
                'duration' => $startTime->diffInSeconds(now()) . 's',
            ]);

            // ========== DISPATCH TRADUCTIONS MULTI-LANGUES ==========
            $this->dispatchTranslations($article);

            // Dispatch job image si configuré
            if ($this->params['generate_image'] ?? config('content.auto_generate_image', false)) {
                GenerateImage::dispatch($article->id)
                    ->onQueue('image-generation');
            }

            // ========== AUTO-PUBLICATION ==========
            $this->handleAutoPublish($article);

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
     * Applique le SEO complet (meta optimisés, JSON-LD, images)
     */
    protected function applyFullSeo(Article $article): void
    {
        if (!($this->params['enable_full_seo'] ?? true)) {
            return;
        }

        try {
            $seoService = app(SeoOptimizationService::class);
            $lang = $this->params['language_code'] ?? 'fr';

            // Contexte SEO
            $context = [
                'country' => $article->country?->getName($lang) ?? '',
                'platform' => $article->platform?->name ?? 'SOS-Expat',
                'service' => $article->theme?->getName($lang) ?? '',
                'year' => date('Y'),
            ];

            // Optimiser meta title (< 60 caractères)
            $metaTitle = $seoService->generateMetaTitle(
                $article->title,
                $article->type ?? 'article',
                $lang,
                $context
            );

            // Optimiser meta description (< 160 caractères)
            $metaDescription = $seoService->generateMetaDescription(
                $article->title,
                $article->type ?? 'article',
                $lang,
                $context
            );

            // Optimiser image alt si image présente
            $imageAlt = $article->image_alt;
            if ($article->image_url && empty($imageAlt)) {
                $imageAlt = $seoService->generateAltText($article->title, $lang);
            }

            // Mettre à jour l'article
            $article->update([
                'meta_title' => $metaTitle,
                'meta_description' => $metaDescription,
                'image_alt' => $imageAlt,
            ]);

            Log::debug('SEO complet appliqué', [
                'article_id' => $article->id,
                'meta_title_length' => mb_strlen($metaTitle),
                'meta_description_length' => mb_strlen($metaDescription),
            ]);

        } catch (\Exception $e) {
            Log::warning('Erreur application SEO', [
                'article_id' => $article->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Génère les slugs locale-pays
     */
    protected function generateLocaleSlugs(Article $article): void
    {
        try {
            $localeSlugService = app(LocaleSlugService::class);
            $count = $localeSlugService->saveLocaleSlugs($article);

            Log::debug('Slugs locale-pays générés', [
                'article_id' => $article->id,
                'count' => $count,
            ]);

        } catch (\Exception $e) {
            Log::warning('Erreur génération slugs locale', [
                'article_id' => $article->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Traite les liens (internes, externes, affiliés)
     */
    protected function processLinks(Article $article): void
    {
        $enableAffiliate = $this->params['enable_affiliate_links'] ?? true;

        try {
            $linkingOrchestrator = app(LinkingOrchestrator::class);

            $linkingOrchestrator->processArticle($article, [
                'internal' => true,
                'external' => true,
                'affiliate' => $enableAffiliate,
                'pillar' => true,
                'inject_content' => true,
            ]);

            Log::debug('Liens traités', ['article_id' => $article->id]);

        } catch (\Exception $e) {
            Log::warning('Erreur traitement liens', [
                'article_id' => $article->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Dispatch les traductions multi-langues si languages[] fourni
     */
    protected function dispatchTranslations(Article $article): void
    {
        // Nouvelles langues cibles fournies dans params
        $targetLanguages = $this->params['languages'] ?? [];

        // Ou auto_translate pour toutes les langues
        $autoTranslate = $this->params['auto_translate'] ?? config('content.auto_translate', false);

        if (!empty($targetLanguages)) {
            // Traductions spécifiques
            $multiLangService = app(MultiLanguageGenerationService::class);
            $multiLangService->generateTranslations($article, $targetLanguages, [
                'delay' => 15,
                'priority' => 'normal',
            ]);

            Log::info('Traductions multi-langues dispatchées', [
                'article_id' => $article->id,
                'languages' => $targetLanguages,
            ]);

        } elseif ($autoTranslate) {
            // Toutes les langues
            TranslateAllLanguages::dispatch($article->id)
                ->onQueue('translation');

            Log::info('TranslateAllLanguages dispatché', [
                'article_id' => $article->id,
            ]);
        }
    }

    /**
     * Gère l'auto-publication si configurée
     */
    protected function handleAutoPublish(Article $article): void
    {
        $autoPublish = $this->params['auto_publish'] ?? config('content.auto_publish', false);
        $minScore = $this->params['min_quality_score'] ?? config('content.quality.min_score', 75);

        if (!$autoPublish) {
            return;
        }

        if ($article->quality_score >= $minScore) {
            $article->update([
                'status' => 'published',
                'published_at' => now(),
            ]);

            // Dispatcher indexation Google/Bing
            if (class_exists(RequestIndexing::class)) {
                RequestIndexing::dispatch($article->id)
                    ->onQueue('indexing');
            }

            Log::info('Article auto-publié', [
                'article_id' => $article->id,
                'quality_score' => $article->quality_score,
            ]);
        } else {
            Log::debug('Auto-publish ignoré (score insuffisant)', [
                'article_id' => $article->id,
                'quality_score' => $article->quality_score,
                'min_required' => $minScore,
            ]);
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