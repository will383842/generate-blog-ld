<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\ArticleResource;
use App\Http\Resources\Api\ArticleCollection;
use App\Models\Article;
use App\Services\Content\ArticleGenerator;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * KnowledgeController - Gestion des articles knowledge base
 * 
 * Base de connaissances : Articles détaillés, guides, tutoriels
 * pour aider les expatriés avec des contenus approfondis.
 */
class KnowledgeController extends Controller
{
    protected ArticleGenerator $articleGenerator;

    public function __construct(ArticleGenerator $articleGenerator)
    {
        $this->articleGenerator = $articleGenerator;
    }

    /**
     * Liste des articles knowledge
     */
    public function index(Request $request): ArticleCollection
    {
        $query = Article::where('type', Article::TYPE_KNOWLEDGE)
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

        $perPage = min($request->get('per_page', 15), 100);
        $knowledge = $query->paginate($perPage);

        return new ArticleCollection($knowledge);
    }

    /**
     * Détail d'un article knowledge
     */
    public function show(int $id): ArticleResource
    {
        $knowledge = Article::where('type', Article::TYPE_KNOWLEDGE)
            ->with([
                'platform', 'country', 'language', 'theme',
                'faqs', 'translations', 'sources'
            ])
            ->findOrFail($id);

        return new ArticleResource($knowledge);
    }

    /**
     * Créer un article knowledge
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'platform_id' => 'required|integer|exists:platforms,id',
            'country_id' => 'required|integer|exists:countries,id',
            'language_id' => 'required|integer|exists:languages,id',
            'theme_id' => 'required|integer|exists:themes,id',
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        try {
            DB::beginTransaction();

            $knowledge = Article::create([
                'platform_id' => $request->platform_id,
                'country_id' => $request->country_id,
                'language_id' => $request->language_id,
                'theme_id' => $request->theme_id,
                'type' => Article::TYPE_KNOWLEDGE,
                'title' => $request->title,
                'content' => $request->content,
                'excerpt' => $request->excerpt ?? substr(strip_tags($request->content), 0, 200),
                'status' => Article::STATUS_DRAFT,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Article knowledge créé avec succès',
                'data' => new ArticleResource($knowledge),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur création knowledge', [
                'error' => $e->getMessage(),
                'params' => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mettre à jour un article knowledge
     */
    public function update(int $id, Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'sometimes|string|max:255',
            'content' => 'sometimes|string',
            'excerpt' => 'sometimes|string',
            'status' => 'sometimes|in:draft,pending,published',
        ]);

        try {
            $knowledge = Article::where('type', Article::TYPE_KNOWLEDGE)
                ->findOrFail($id);

            $knowledge->update($request->only([
                'title', 'content', 'excerpt', 'status'
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Article knowledge mis à jour',
                'data' => new ArticleResource($knowledge->fresh()),
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur update knowledge', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Supprimer un article knowledge
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $knowledge = Article::where('type', Article::TYPE_KNOWLEDGE)
                ->findOrFail($id);

            $knowledge->delete();

            return response()->json([
                'success' => true,
                'message' => 'Article knowledge supprimé',
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur suppression knowledge', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Publier un article knowledge
     */
    public function publish(int $id): JsonResponse
    {
        try {
            $knowledge = Article::where('type', Article::TYPE_KNOWLEDGE)
                ->findOrFail($id);

            $knowledge->publish();

            return response()->json([
                'success' => true,
                'message' => 'Article knowledge publié',
                'data' => new ArticleResource($knowledge->fresh()),
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur publication knowledge', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la publication',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Générer un article knowledge avec IA
     */
    public function generate(Request $request): JsonResponse
    {
        $request->validate([
            'platform_id' => 'required|integer|exists:platforms,id',
            'country_id' => 'required|integer|exists:countries,id',
            'language_id' => 'required|integer|exists:languages,id',
            'theme_id' => 'required|integer|exists:themes,id',
            'topic' => 'required|string|max:255',
        ]);

        try {
            DB::beginTransaction();

            $params = array_merge($request->all(), [
                'type' => Article::TYPE_KNOWLEDGE,
            ]);

            $knowledge = $this->articleGenerator->generate($params);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Article knowledge généré avec succès',
                'data' => new ArticleResource($knowledge),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur génération knowledge', [
                'error' => $e->getMessage(),
                'params' => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Statistiques des articles knowledge
     */
    public function stats(Request $request): JsonResponse
    {
        $platformId = $request->get('platform_id');

        $query = Article::where('type', Article::TYPE_KNOWLEDGE);

        if ($platformId) {
            $query->where('platform_id', $platformId);
        }

        $stats = [
            'total' => $query->count(),
            'published' => (clone $query)->where('status', Article::STATUS_PUBLISHED)->count(),
            'draft' => (clone $query)->where('status', Article::STATUS_DRAFT)->count(),
            'by_language' => (clone $query)
                ->join('languages', 'articles.language_id', '=', 'languages.id')
                ->select('languages.code', DB::raw('count(*) as count'))
                ->groupBy('languages.code')
                ->get(),
            'avg_quality_score' => (clone $query)->avg('quality_score'),
            'recent' => (clone $query)
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get(['id', 'title', 'created_at']),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}