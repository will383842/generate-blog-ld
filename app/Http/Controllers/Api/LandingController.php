<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\ArticleResource;
use App\Http\Resources\Api\ArticleCollection;
use App\Models\Article;
use App\Services\Content\LandingGenerator;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * LandingController - Gestion des landing pages
 */
class LandingController extends Controller
{
    protected LandingGenerator $landingGenerator;

    public function __construct(LandingGenerator $landingGenerator)
    {
        $this->landingGenerator = $landingGenerator;
    }

    /**
     * Liste des landing pages
     */
    public function index(Request $request): ArticleCollection
    {
        $query = Article::where('type', 'landing')
            ->with(['platform', 'country', 'language']);

        // Filtres
        if ($request->has('platform_id')) {
            $query->where('platform_id', $request->platform_id);
        }

        if ($request->has('country_id')) {
            $query->where('country_id', $request->country_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $perPage = min($request->get('per_page', 15), 100);
        $landings = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return new ArticleCollection($landings);
    }

    /**
     * Détail d'une landing page
     */
    public function show(int $id): ArticleResource
    {
        $landing = Article::where('type', 'landing')
            ->with([
                'platform', 'country', 'language',
                'faqs', 'translations'
            ])
            ->findOrFail($id);

        return new ArticleResource($landing);
    }

    /**
     * Générer une landing page
     */
    public function generate(Request $request): JsonResponse
    {
        $request->validate([
            'platform_id' => 'required|integer|exists:platforms,id',
            'country_id' => 'required|integer|exists:countries,id',
            'language_id' => 'required|integer|exists:languages,id',
            'service' => 'required|string',
        ]);

        try {
            DB::beginTransaction();

            $landing = $this->landingGenerator->generate($request->all());

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Landing page générée avec succès',
                'data' => new ArticleResource($landing),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur génération landing', [
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
