<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\ArticleResource;
use App\Http\Resources\Api\ArticleCollection;
use App\Models\Article;
use App\Services\Content\ComparativeGenerator;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * ComparativeController - Gestion des articles comparatifs
 */
class ComparativeController extends Controller
{
    protected ComparativeGenerator $comparativeGenerator;

    public function __construct(ComparativeGenerator $comparativeGenerator)
    {
        $this->comparativeGenerator = $comparativeGenerator;
    }

    /**
     * Liste des comparatifs
     */
    public function index(Request $request): ArticleCollection
    {
        $query = Article::where('type', 'comparative')
            ->with(['platform', 'country', 'language']);

        // Filtres
        if ($request->has('platform_id')) {
            $query->where('platform_id', $request->platform_id);
        }

        if ($request->has('country_id')) {
            $query->where('country_id', $request->country_id);
        }

        $perPage = min($request->get('per_page', 15), 100);
        $comparatives = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return new ArticleCollection($comparatives);
    }

    /**
     * Détail d'un comparatif
     */
    public function show(int $id): ArticleResource
    {
        $comparative = Article::where('type', 'comparative')
            ->with([
                'platform', 'country', 'language',
                'faqs', 'translations'
            ])
            ->findOrFail($id);

        return new ArticleResource($comparative);
    }

    /**
     * Générer un comparatif
     */
    public function generate(Request $request): JsonResponse
    {
        $request->validate([
            'platform_id' => 'required|integer|exists:platforms,id',
            'country_id' => 'required|integer|exists:countries,id',
            'language_code' => 'required|string|exists:languages,code',
            'service_type' => 'required|string',
            'competitors_count' => 'nullable|integer|min:3|max:10',
        ]);

        try {
            DB::beginTransaction();

            $comparative = $this->comparativeGenerator->generate($request->all());

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Comparatif généré avec succès',
                'data' => new ArticleResource($comparative),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur génération comparatif', [
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
}
