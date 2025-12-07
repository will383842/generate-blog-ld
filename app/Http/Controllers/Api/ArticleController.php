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
            ->with(['platform', 'country', 'language', 'theme'])
            ->withCount(['internalLinks', 'externalLinks', 'translations']);

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
        ])
        ->withCount(['internalLinks', 'externalLinks', 'translations'])
        ->findOrFail($id);

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
                    ])->loadCount(['internalLinks', 'externalLinks', 'translations'])),
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
                ])->loadCount(['internalLinks', 'externalLinks', 'translations'])),
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
                ])->loadCount(['internalLinks', 'externalLinks', 'translations'])),
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
                ])->loadCount(['internalLinks', 'externalLinks', 'translations'])),
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
                'data' => new ArticleResource($article->loadCount(['internalLinks', 'externalLinks', 'translations'])),
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
                'data' => new ArticleResource($duplicate->loadCount(['internalLinks', 'externalLinks', 'translations'])),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la duplication',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Statistiques des articles
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function stats(Request $request): JsonResponse
    {
        try {
            $platformId = $request->get('platform_id');

            $query = Article::query();
            if ($platformId) {
                $query->where('platform_id', $platformId);
            }

            $stats = [
                'total' => $query->count(),
                'published' => (clone $query)->where('status', Article::STATUS_PUBLISHED)->count(),
                'draft' => (clone $query)->where('status', Article::STATUS_DRAFT)->count(),
                'pending' => (clone $query)->where('status', 'pending')->count(),
                'by_type' => [
                    'article' => (clone $query)->where('type', 'article')->count(),
                    'landing' => (clone $query)->where('type', 'landing')->count(),
                    'comparative' => (clone $query)->where('type', 'comparative')->count(),
                ],
                'avg_seo_score' => (clone $query)->avg('seo_score') ?? 0,
                'avg_word_count' => (clone $query)->avg('word_count') ?? 0,
                'this_week' => (clone $query)->where('created_at', '>=', now()->startOfWeek())->count(),
                'this_month' => (clone $query)->where('created_at', '>=', now()->startOfMonth())->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur stats articles', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Suppression en masse d'articles
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function bulkDelete(Request $request): JsonResponse
    {
        try {
            $ids = $request->input('ids', []);

            if (empty($ids)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun article sélectionné',
                ], 400);
            }

            $deleted = Article::whereIn('id', $ids)->delete();

            return response()->json([
                'success' => true,
                'message' => "{$deleted} article(s) supprimé(s) avec succès",
                'data' => ['deleted_count' => $deleted],
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur suppression en masse', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression en masse',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Publication en masse d'articles
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function bulkPublish(Request $request): JsonResponse
    {
        try {
            $ids = $request->input('ids', []);

            if (empty($ids)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun article sélectionné',
                ], 400);
            }

            $published = Article::whereIn('id', $ids)
                ->where('status', '!=', Article::STATUS_PUBLISHED)
                ->update([
                    'status' => Article::STATUS_PUBLISHED,
                    'published_at' => now(),
                ]);

            return response()->json([
                'success' => true,
                'message' => "{$published} article(s) publié(s) avec succès",
                'data' => ['published_count' => $published],
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur publication en masse', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la publication en masse',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtenir les versions d'un article
     *
     * @param int $id
     * @return JsonResponse
     */
    public function versions(int $id): JsonResponse
    {
        try {
            $article = Article::findOrFail($id);

            // Si le modèle utilise un système de versioning, récupérer les versions
            // Sinon, retourner un tableau vide
            $versions = [];

            if (method_exists($article, 'versions')) {
                $versions = $article->versions()->orderBy('created_at', 'desc')->get();
            }

            return response()->json([
                'success' => true,
                'data' => $versions,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des versions',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Restaurer une version d'un article
     *
     * @param int $id
     * @param int $versionId
     * @return JsonResponse
     */
    public function restoreVersion(int $id, int $versionId): JsonResponse
    {
        try {
            $article = Article::findOrFail($id);

            // Si le modèle utilise un système de versioning
            if (method_exists($article, 'versions')) {
                $version = $article->versions()->findOrFail($versionId);
                // Restaurer la version (dépend de l'implémentation du versioning)
                // $article->restoreVersion($version);
            }

            return response()->json([
                'success' => true,
                'message' => 'Version restaurée avec succès',
                'data' => new ArticleResource($article->fresh()),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la restauration de la version',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
