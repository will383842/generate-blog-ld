<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\GenerateArticleRequest;
use App\Http\Requests\Api\GenerateLandingRequest;
use App\Http\Requests\Api\GenerateComparativeRequest;
use App\Http\Requests\Api\GenerateBulkRequest;
use App\Http\Resources\Api\ArticleResource;
use App\Services\Content\ArticleGenerator;
use App\Services\Content\LandingGenerator;
use App\Services\Content\ComparativeGenerator;
use App\Jobs\ProcessArticle;
use App\Jobs\ProcessLanding;
use App\Jobs\ProcessComparative;
use App\Jobs\ProcessBatch;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * GenerationController - Génération de contenu via IA
 * 
 * Endpoints :
 * - POST /api/generate/article       - Générer un article
 * - POST /api/generate/landing       - Générer une landing page
 * - POST /api/generate/comparative   - Générer un comparatif
 * - POST /api/generate/bulk          - Génération en masse
 */
class GenerationController extends Controller
{
    protected ArticleGenerator $articleGenerator;
    protected LandingGenerator $landingGenerator;
    protected ComparativeGenerator $comparativeGenerator;

    public function __construct(
        ArticleGenerator $articleGenerator,
        LandingGenerator $landingGenerator,
        ComparativeGenerator $comparativeGenerator
    ) {
        $this->articleGenerator = $articleGenerator;
        $this->landingGenerator = $landingGenerator;
        $this->comparativeGenerator = $comparativeGenerator;
    }

    /**
     * Générer un article standard
     * 
     * POST /api/generate/article
     */
    public function generateArticle(GenerateArticleRequest $request): JsonResponse
    {
        try {
            $async = $request->get('async', false);

            if ($async) {
                // Génération asynchrone via job
                ProcessArticle::dispatch($request->validated())
                    ->onQueue($request->get('priority', 'default'));

                return response()->json([
                    'success' => true,
                    'message' => 'Article en cours de génération',
                    'data' => [
                        'status' => 'queued',
                        'platform_id' => $request->platform_id,
                        'country_id' => $request->country_id,
                        'language_code' => $request->language_code,
                    ],
                ], 202);
            }

            // Génération synchrone
            DB::beginTransaction();

            $article = $this->articleGenerator->generate($request->validated());

            // Auto-traduction si demandée
            if ($request->get('auto_translate', false)) {
                \App\Jobs\TranslateAllLanguages::dispatch($article->id);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Article généré avec succès',
                'data' => new ArticleResource($article->load([
                    'platform', 'country', 'language', 'author', 'theme', 'faqs'
                ])),
                'stats' => [
                    'word_count' => $article->word_count,
                    'reading_time' => $article->reading_time,
                    'generation_cost' => $article->generation_cost,
                    'quality_score' => $article->quality_score,
                ],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur génération article', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'params' => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération de l\'article',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Générer une landing page
     * 
     * POST /api/generate/landing
     */
    public function generateLanding(GenerateLandingRequest $request): JsonResponse
    {
        try {
            $async = $request->get('async', false);

            if ($async) {
                ProcessLanding::dispatch($request->validated())
                    ->onQueue($request->get('priority', 'default'));

                return response()->json([
                    'success' => true,
                    'message' => 'Landing page en cours de génération',
                    'data' => [
                        'status' => 'queued',
                        'service' => $request->service,
                    ],
                ], 202);
            }

            // Génération synchrone
            DB::beginTransaction();

            $landing = $this->landingGenerator->generate($request->validated());

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Landing page générée avec succès',
                'data' => new ArticleResource($landing->load([
                    'platform', 'country', 'language', 'faqs'
                ])),
                'stats' => [
                    'sections_count' => $landing->metadata['sections_count'] ?? 0,
                    'word_count' => $landing->word_count,
                    'generation_cost' => $landing->generation_cost,
                ],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur génération landing', [
                'error' => $e->getMessage(),
                'params' => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération de la landing page',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Générer un article comparatif
     * 
     * POST /api/generate/comparative
     */
    public function generateComparative(GenerateComparativeRequest $request): JsonResponse
    {
        try {
            $async = $request->get('async', false);

            if ($async) {
                ProcessComparative::dispatch($request->validated())
                    ->onQueue($request->get('priority', 'default'));

                return response()->json([
                    'success' => true,
                    'message' => 'Comparatif en cours de génération',
                    'data' => [
                        'status' => 'queued',
                        'service_type' => $request->service_type,
                        'competitors_count' => $request->get('competitors_count', 5),
                    ],
                ], 202);
            }

            // Génération synchrone
            DB::beginTransaction();

            $comparative = $this->comparativeGenerator->generate($request->validated());

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Comparatif généré avec succès',
                'data' => new ArticleResource($comparative->load([
                    'platform', 'country', 'language', 'faqs'
                ])),
                'stats' => [
                    'competitors_count' => $comparative->metadata['competitors_count'] ?? 0,
                    'criteria_count' => $comparative->metadata['criteria_count'] ?? 0,
                    'word_count' => $comparative->word_count,
                    'generation_cost' => $comparative->generation_cost,
                ],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur génération comparatif', [
                'error' => $e->getMessage(),
                'params' => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du comparatif',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Génération en masse (bulk)
     * 
     * POST /api/generate/bulk
     */
    public function generateBulk(GenerateBulkRequest $request): JsonResponse
    {
        try {
            $type = $request->type;
            $countries = $request->country_ids;
            $languages = $request->language_codes;
            $themes = $request->get('theme_ids', [1]);

            // Calculer le nombre total de contenus à générer
            if ($type === 'article') {
                $totalJobs = count($countries) * count($languages) * count($themes);
            } else {
                $totalJobs = count($countries) * count($languages);
            }

            // Créer l'entrée batch
            $batch = \App\Models\GenerationQueue::create([
                'type' => 'batch',
                'status' => 'pending',
                'priority' => $request->get('priority', 'default'),
                'total_items' => $totalJobs,
                'completed_items' => 0,
                'failed_items' => 0,
                'metadata' => [
                    'content_type' => $type,
                    'platform_id' => $request->platform_id,
                    'countries' => $countries,
                    'languages' => $languages,
                    'themes' => $themes,
                    'auto_translate' => $request->get('auto_translate', false),
                    'generate_images' => $request->get('generate_images', true),
                    'created_by' => auth()->id() ?? null,
                ],
            ]);

            // Dispatcher le job batch
            ProcessBatch::dispatch($batch->id);

            return response()->json([
                'success' => true,
                'message' => 'Génération en masse lancée avec succès',
                'data' => [
                    'batch_id' => $batch->id,
                    'type' => $type,
                    'total_items' => $totalJobs,
                    'status' => 'pending',
                    'estimated_duration_minutes' => ceil($totalJobs * 2),
                    'estimated_cost' => round($totalJobs * 0.10, 2),
                ],
            ], 202);

        } catch (\Exception $e) {
            Log::error('Erreur génération bulk', [
                'error' => $e->getMessage(),
                'params' => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du lancement de la génération en masse',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Estimer le coût d'une génération
     * 
     * POST /api/generate/estimate
     */
    public function estimate(GenerateArticleRequest $request): JsonResponse
    {
        try {
            $type = $request->get('type', 'article');
            $autoTranslate = $request->get('auto_translate', false);
            $generateImage = $request->get('generate_image', true);

            $costs = [
                'article' => [
                    'generation' => 0.08,
                    'image' => $generateImage ? 0.04 : 0,
                    'translation' => $autoTranslate ? 0.01 * 8 : 0, // 8 langues
                ],
                'landing' => [
                    'generation' => 0.12,
                    'image' => $generateImage ? 0.04 : 0,
                    'translation' => $autoTranslate ? 0.015 * 8 : 0,
                ],
                'comparative' => [
                    'generation' => 0.15,
                    'image' => 0, // Pas d'image pour comparatifs
                    'translation' => $autoTranslate ? 0.02 * 8 : 0,
                ],
            ];

            $typeCosts = $costs[$type] ?? $costs['article'];
            $totalCost = array_sum($typeCosts);

            return response()->json([
                'success' => true,
                'data' => [
                    'type' => $type,
                    'breakdown' => $typeCosts,
                    'total_cost_usd' => round($totalCost, 4),
                    'total_cost_formatted' => '$' . number_format($totalCost, 4),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'estimation',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
