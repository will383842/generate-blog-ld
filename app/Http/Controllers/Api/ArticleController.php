<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreArticleRequest;
use App\Http\Requests\Api\UpdateArticleRequest;
use App\Http\Resources\Api\ArticleResource;
use App\Http\Resources\Api\ArticleCollection;
use App\Models\Article;
use App\Services\Content\ArticleGenerator;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * ArticleController - CRUD complet des articles
 * 
 * Endpoints :
 * - GET    /api/articles          - Liste paginée
 * - GET    /api/articles/{id}     - Détail article
 * - POST   /api/articles          - Créer article
 * - PUT    /api/articles/{id}     - Modifier article
 * - DELETE /api/articles/{id}     - Supprimer article
 * - POST   /api/articles/{id}/publish - Publier article
 */
class ArticleController extends Controller
{
    protected ArticleGenerator $articleGenerator;

    public function __construct(ArticleGenerator $articleGenerator)
    {
        $this->articleGenerator = $articleGenerator;
    }

    /**
     * Liste paginée des articles
     * 
     * @param Request $request
     * @return ArticleCollection
     * 
     * Query params :
     * - per_page: int (défaut 15)
     * - page: int
     * - platform_id: int
     * - country_id: int
     * - language_code: string
     * - status: string (draft|pending|published|archived)
     * - type: string (article|landing|comparative)
     * - search: string (recherche titre/contenu)
     */
    public function index(Request $request): ArticleCollection
    {
        $query = Article::query()
            ->with(['platform', 'country', 'language', 'theme']);

        // Filtres
        if ($request->has('platform_id')) {
            $query->where('platform_id', $request->platform_id);
        }

        if ($request->has('country_id')) {
            $query->where('country_id', $request->country_id);
        }

        if ($request->has('language_code')) {
            $query->whereHas('language', function ($q) use ($request) {
                $q->where('code', $request->language_code);
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'LIKE', "%{$search}%")
                  ->orWhere('content', 'LIKE', "%{$search}%")
                  ->orWhere('excerpt', 'LIKE', "%{$search}%");
            });
        }

        // Tri
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir);

        // Pagination
        $perPage = min($request->get('per_page', 15), 100);
        $articles = $query->paginate($perPage);

        return new ArticleCollection($articles);
    }

    /**
     * Détail d'un article
     * 
     * @param int $id
     * @param Request $request
     * @return ArticleResource
     * 
     * Query params :
     * - full: 1 (inclure le contenu complet)
     * - stats: 1 (inclure les statistiques)
     */
    public function show(int $id, Request $request): ArticleResource
    {
        $article = Article::with([
            'platform',
            'country',
            'language',
            'theme',
            'faqs',
            'translations.language',
            'internalLinks',
            'externalLinks',
        ])->findOrFail($id);

        return new ArticleResource($article);
    }

    /**
     * Créer un article
     * 
     * @param StoreArticleRequest $request
     * @return JsonResponse
     */
    public function store(StoreArticleRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Si pas de contenu fourni, on génère automatiquement
            if (!$request->has('content')) {
                $article = $this->articleGenerator->generate($request->validated());
                
                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Article généré avec succès',
                    'data' => new ArticleResource($article->load([
                        'platform', 'country', 'language', 'theme'
                    ])),
                ], 201);
            }

            // Sinon, création manuelle
            $article = Article::create($request->validated());

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Article créé avec succès',
                'data' => new ArticleResource($article->load([
                    'platform', 'country', 'language', 'theme'
                ])),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur création article', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de l\'article',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Modifier un article
     * 
     * @param UpdateArticleRequest $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(UpdateArticleRequest $request, int $id): JsonResponse
    {
        try {
            $article = Article::findOrFail($id);

            $article->update($request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Article modifié avec succès',
                'data' => new ArticleResource($article->load([
                    'platform', 'country', 'language', 'theme'
                ])),
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur modification article', [
                'article_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la modification de l\'article',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Supprimer un article
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $article = Article::findOrFail($id);

            // Soft delete
            $article->delete();

            return response()->json([
                'success' => true,
                'message' => 'Article supprimé avec succès',
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur suppression article', [
                'article_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de l\'article',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Publier un article
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function publish(int $id): JsonResponse
    {
        try {
            $article = Article::findOrFail($id);

            $article->update([
                'status' => Article::STATUS_PUBLISHED,
                'published_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Article publié avec succès',
                'data' => new ArticleResource($article->load([
                    'platform', 'country', 'language', 'theme'
                ])),
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur publication article', [
                'article_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la publication de l\'article',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Dépublier un article
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function unpublish(int $id): JsonResponse
    {
        try {
            $article = Article::findOrFail($id);

            $article->update([
                'status' => Article::STATUS_DRAFT,
                'published_at' => null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Article dépublié avec succès',
                'data' => new ArticleResource($article),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la dépublication',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Dupliquer un article
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function duplicate(int $id): JsonResponse
    {
        try {
            $original = Article::findOrFail($id);

            $duplicate = $original->replicate();
            $duplicate->title = $original->title . ' (Copie)';
            $duplicate->slug = $original->slug . '-copie-' . time();
            $duplicate->status = Article::STATUS_DRAFT;
            $duplicate->published_at = null;
            $duplicate->save();

            return response()->json([
                'success' => true,
                'message' => 'Article dupliqué avec succès',
                'data' => new ArticleResource($duplicate),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la duplication',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
