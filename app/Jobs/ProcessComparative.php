<?php

namespace App\Jobs;

use App\Models\Article;
use App\Models\Language;
use App\Models\GenerationLog;
use App\Services\Content\ComparativeGenerator;
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
 * Job de génération complète d'un article comparatif
 *
 * Pipeline comparatif (20 étapes) :
 * 1. Validation paramètres
 * 2. Recherche concurrents (Perplexity)
 * 3. Fetch données concurrents (prix, avis, features)
 * 4. Définition critères de comparaison (8 critères)
 * 5. Notation concurrents /10 par critère
 * 6. Génération titre comparatif
 * 7. Génération introduction
 * 8. Génération tableau comparatif HTML
 * 9. Génération graphique radar (Chart.js)
 * 10. Génération sections détaillées par critère
 * 11. Génération verdict final (avec notre plateforme #1)
 * 12. Génération FAQ comparatives
 * 13. Génération CTA vers inscription
 * 14. Génération meta SEO + JSON-LD Comparison schema
 * 15. Sauvegarde article
 * 16. SEO complet (meta < 60/160, images, JSON-LD)
 * 17. Génération slugs locale-pays
 * 18. Traitement liens (internes, externes, affiliés)
 * 19. Dispatch traductions multi-langues
 * 20. Auto-publication si score OK
 */
class ProcessComparative implements ShouldQueue
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
     * Timeout en secondes (comparatifs peuvent être longs)
     *
     * @var int
     */
    public int $timeout = 600; // 10 minutes

    /**
     * Délais entre tentatives (backoff exponentiel)
     * 1min, 3min, 5min (comparatifs longs)
     *
     * @return array<int>
     */
    public function backoff(): array
    {
        return [60, 180, 300];
    }

    /**
     * Créer une nouvelle instance du job
     *
     * @param array $params Paramètres de génération :
     *   - platform_id (required)
     *   - country_id (required)
     *   - language_code (required)
     *   - comparison_type (required) : 'platforms', 'services', 'providers'
     *   - competitors_count (optional, default: 5)
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

        // Queue configuration - priorité plus basse (moins urgent)
        $this->onQueue('content-generation-low');
    }

    /**
     * Exécuter le job
     *
     * @param ComparativeGenerator $generator
     * @return void
     */
    public function handle(ComparativeGenerator $generator): void
    {
        $startTime = now();

        Log::info('🚀 Démarrage génération article comparatif', [
            'params' => $this->params,
            'attempt' => $this->attempts(),
        ]);

        DB::beginTransaction();

        try {
            // Étape 1-15 : Génération complète via ComparativeGenerator
            $article = $generator->generate($this->params);

            DB::commit();

            // ========== ÉTAPE 16: SEO COMPLET ==========
            $this->applyFullSeo($article);

            // ========== ÉTAPE 17: SLUGS LOCALE-PAYS ==========
            $this->generateLocaleSlugs($article);

            // ========== ÉTAPE 18: LIENS (internes, externes, affiliés) ==========
            $this->processLinks($article);

            // Log de succès
            $this->logGeneration($article, 'completed', $startTime);

            Log::info('✅ Article comparatif généré avec succès', [
                'article_id' => $article->id,
                'title' => $article->title,
                'comparison_type' => $this->params['comparison_type'],
                'competitors' => $article->metadata['competitors_count'] ?? 0,
                'quality_score' => $article->quality_score,
                'duration' => $startTime->diffInSeconds(now()) . 's',
            ]);

            // ========== ÉTAPE 19: DISPATCH TRADUCTIONS MULTI-LANGUES ==========
            $this->dispatchTranslations($article);

            // Dispatch job image si configuré
            if ($this->params['generate_image'] ?? config('content.auto_generate_image', false)) {
                GenerateImage::dispatch($article->id)
                    ->onQueue('image-generation');
            }

            // ========== ÉTAPE 20: AUTO-PUBLICATION ==========
            $this->handleAutoPublish($article);

        } catch (\Exception $e) {
            DB::rollBack();

            // Log d'erreur
            $this->logGeneration(null, 'failed', $startTime, $e->getMessage());

            Log::error('❌ Échec génération article comparatif', [
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
                'service' => $this->params['comparison_type'] ?? 'comparatif',
                'year' => date('Y'),
            ];

            // Optimiser meta title (< 60 caractères)
            $metaTitle = $seoService->generateMetaTitle(
                $article->title,
                'comparative',
                $lang,
                $context
            );

            // Optimiser meta description (< 160 caractères)
            $metaDescription = $seoService->generateMetaDescription(
                $article->title,
                'comparative',
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

            Log::debug('SEO complet appliqué (comparative)', [
                'article_id' => $article->id,
                'meta_title_length' => mb_strlen($metaTitle),
                'meta_description_length' => mb_strlen($metaDescription),
            ]);

        } catch (\Exception $e) {
            Log::warning('Erreur application SEO (comparative)', [
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

            Log::debug('Slugs locale-pays générés (comparative)', [
                'article_id' => $article->id,
                'count' => $count,
            ]);

        } catch (\Exception $e) {
            Log::warning('Erreur génération slugs locale (comparative)', [
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

            Log::debug('Liens traités (comparative)', ['article_id' => $article->id]);

        } catch (\Exception $e) {
            Log::warning('Erreur traitement liens (comparative)', [
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

            Log::info('Traductions multi-langues dispatchées (comparative)', [
                'article_id' => $article->id,
                'languages' => $targetLanguages,
            ]);

        } elseif ($autoTranslate) {
            // Toutes les langues
            TranslateAllLanguages::dispatch($article->id)
                ->onQueue('translation');

            Log::info('TranslateAllLanguages dispatché (comparative)', [
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

            Log::info('Comparative auto-publiée', [
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
            'type' => 'comparative',
            'status' => $status,
            'duration_seconds' => $startTime->diffInSeconds(now()),
            'tokens_used' => $article?->metadata['tokens_used'] ?? null,
            'cost' => $article?->generation_cost ?? 0,
            'error_message' => $errorMessage,
            'metadata' => [
                'params' => $this->params,
                'comparison_type' => $this->params['comparison_type'],
                'competitors_count' => $article?->metadata['competitors_count'] ?? 0,
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
        Log::error('💥 Échec définitif génération article comparatif', [
            'params' => $this->params,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);

        // Logger l'échec définitif
        GenerationLog::create([
            'platform_id' => $this->params['platform_id'],
            'country_id' => $this->params['country_id'],
            'language_id' => Language::where('code', $this->params['language_code'])->first()?->id,
            'type' => 'comparative',
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
            'comparative',
            'platform:' . $this->params['platform_id'],
            'country:' . $this->params['country_id'],
        ];
    }
}