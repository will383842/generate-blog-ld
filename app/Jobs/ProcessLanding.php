<?php

namespace App\Jobs;

use App\Models\Article;
use App\Models\Language;
use App\Models\GenerationLog;
use App\Services\Content\LandingGenerator;
use App\Services\Content\MultiLanguageGenerationService;
use App\Services\Seo\SeoOptimizationService;
use App\Services\Seo\LocaleSlugService;
use App\Services\Linking\LinkingOrchestrator;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

/**
 * Job de génération complète d'une landing page
 *
 * Pipeline landing page (17 étapes) :
 * 1. Validation paramètres
 * 2. Génération hero (titre H1 + CTA)
 * 3. Génération problème (3-4 douleurs)
 * 4. Génération solution (bénéfices)
 * 5. Génération avantages (5-7 points)
 * 6. Génération "Comment ça marche" (3-5 étapes)
 * 7. Génération preuves sociales (testimonials)
 * 8. Génération tarifs (optionnel)
 * 9. Génération FAQ (5-8 questions)
 * 10. Génération CTA final
 * 11. Génération meta SEO optimisés (title < 60, description < 160)
 * 12. Assemblage complet + sauvegarde
 * 13. SEO complet (meta, images, JSON-LD)
 * 14. Génération slugs locale-pays
 * 15. Traitement liens (internes, externes, affiliés)
 * 16. Dispatch traductions multi-langues
 * 17. Auto-publication si score OK
 */
class ProcessLanding implements ShouldQueue
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
     *   - language_id ou language_code (required)
     *   - service (required) - Service ou thème principal
     *   - target_audience (optional)
     *   - keywords (optional)
     *   - sections_enabled (optional)
     *   - languages[] (optional) - Langues cibles pour traductions auto
     *   - enable_full_seo (optional, default: true)
     *   - enable_affiliate_links (optional, default: true)
     *   - auto_publish (optional) - Publication auto si score OK
     *   - min_quality_score (optional, default: 75)
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
     * @param LandingGenerator $generator
     * @return void
     */
    public function handle(LandingGenerator $generator): void
    {
        $startTime = now();

        Log::info('🚀 Démarrage génération landing page', [
            'params' => $this->params,
            'attempt' => $this->attempts(),
        ]);

        DB::beginTransaction();

        try {
            // Étape 1-12 : Génération complète via LandingGenerator
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

            Log::info('✅ Landing page générée avec succès', [
                'article_id' => $article->id,
                'title' => $article->title,
                'service' => $this->params['service'] ?? 'N/A',
                'quality_score' => $article->quality_score,
                'duration' => $startTime->diffInSeconds(now()) . 's',
            ]);

            // ========== ÉTAPE 16: DISPATCH TRADUCTIONS MULTI-LANGUES ==========
            $this->dispatchTranslations($article);

            // Dispatch job image si configuré
            if ($this->params['generate_image'] ?? config('content.auto_generate_image', false)) {
                GenerateImage::dispatch($article->id)
                    ->onQueue('image-generation');
            }

            // ========== ÉTAPE 17: AUTO-PUBLICATION ==========
            $this->handleAutoPublish($article);

        } catch (\Exception $e) {
            DB::rollBack();

            // Log d'erreur
            $this->logGeneration(null, 'failed', $startTime, $e->getMessage());

            Log::error('❌ Échec génération landing page', [
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
                'service' => $this->params['service'] ?? $article->theme?->getName($lang) ?? '',
                'year' => date('Y'),
            ];

            // Optimiser meta title (< 60 caractères)
            $metaTitle = $seoService->generateMetaTitle(
                $article->title,
                'landing',
                $lang,
                $context
            );

            // Optimiser meta description (< 160 caractères)
            $metaDescription = $seoService->generateMetaDescription(
                $article->title,
                'landing',
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

            Log::debug('SEO complet appliqué (landing)', [
                'article_id' => $article->id,
                'meta_title_length' => mb_strlen($metaTitle),
                'meta_description_length' => mb_strlen($metaDescription),
            ]);

        } catch (\Exception $e) {
            Log::warning('Erreur application SEO (landing)', [
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

            Log::debug('Slugs locale-pays générés (landing)', [
                'article_id' => $article->id,
                'count' => $count,
            ]);

        } catch (\Exception $e) {
            Log::warning('Erreur génération slugs locale (landing)', [
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

            Log::debug('Liens traités (landing)', ['article_id' => $article->id]);

        } catch (\Exception $e) {
            Log::warning('Erreur traitement liens (landing)', [
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

            Log::info('Traductions multi-langues dispatchées (landing)', [
                'article_id' => $article->id,
                'languages' => $targetLanguages,
            ]);

        } elseif ($autoTranslate) {
            // Toutes les langues
            TranslateAllLanguages::dispatch($article->id)
                ->onQueue('translation');

            Log::info('TranslateAllLanguages dispatché (landing)', [
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

            Log::info('Landing auto-publiée', [
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
            'language_id' => $this->params['language_id'],
            'type' => 'landing',
            'status' => $status,
            'duration_seconds' => $startTime->diffInSeconds(now()),
            'tokens_used' => $article?->metadata['tokens_used'] ?? null,
            'cost' => $article?->generation_cost ?? 0,
            'error_message' => $errorMessage,
            'metadata' => [
                'params' => $this->params,
                'service' => $this->params['service'],
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
        Log::error('💥 Échec définitif génération landing page', [
            'params' => $this->params,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);

        // Logger l'échec définitif
        GenerationLog::create([
            'platform_id' => $this->params['platform_id'],
            'country_id' => $this->params['country_id'],
            'language_id' => $this->params['language_id'],
            'type' => 'landing',
            'status' => 'failed_permanent',
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
            'landing',
            'platform:' . $this->params['platform_id'],
            'country:' . $this->params['country_id'],
        ];
    }
}