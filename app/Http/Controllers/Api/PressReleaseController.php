<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PressRelease;
use App\Models\PressReleaseMedia;
use App\Services\Press\PressReleaseGenerator;
use App\Services\Press\ChartGeneratorService;
use App\Services\Press\UnsplashService;
use App\Services\Press\PressReleaseExportService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

/**
 * PressReleaseController - API REST pour communiqués de presse
 * 
 * @package App\Http\Controllers\Api
 */
class PressReleaseController extends Controller
{
    protected PressReleaseGenerator $generator;
    protected ChartGeneratorService $chartGenerator;
    protected UnsplashService $unsplashService;
    protected PressReleaseExportService $exportService;

    public function __construct(
        PressReleaseGenerator $generator,
        ChartGeneratorService $chartGenerator,
        UnsplashService $unsplashService,
        PressReleaseExportService $exportService
    ) {
        $this->generator = $generator;
        $this->chartGenerator = $chartGenerator;
        $this->unsplashService = $unsplashService;
        $this->exportService = $exportService;
    }

    /**
     * Liste paginée des communiqués
     * 
     * GET /api/press-releases
     */
    public function index(Request $request): JsonResponse
    {
        $query = PressRelease::query()->with(['platform', 'media', 'exports']);

        // Filtres
        if ($request->has('platform_id')) {
            $query->where('platform_id', $request->platform_id);
        }

        if ($request->has('language_code')) {
            $query->where('language_code', $request->language_code);
        }

        if ($request->has('template_type')) {
            $query->where('template_type', $request->template_type);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Tri
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir);

        // Pagination
        $perPage = min($request->get('per_page', 15), 100);
        $pressReleases = $query->paginate($perPage);

        return response()->json($pressReleases);
    }

    /**
     * Détail d'un communiqué
     * 
     * GET /api/press-releases/{id}
     */
    public function show(PressRelease $pressRelease): JsonResponse
    {
        $pressRelease->load(['platform', 'media', 'exports']);
        
        return response()->json([
            'success' => true,
            'data' => $pressRelease,
        ]);
    }

    /**
     * Générer un nouveau communiqué
     * 
     * POST /api/press-releases/generate
     */
    public function generate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'platform_id' => 'required|exists:platforms,id',
            'template_type' => 'required|in:lancement_produit,partenariat,resultats_milestone,evenement,nomination',
            'language_code' => 'required|in:fr,en,de,es,pt,ru,zh,ar,hi',
            'context' => 'sometimes|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $pressRelease = $this->generator->generate($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Communiqué généré avec succès',
                'data' => $pressRelease->load(['platform', 'media']),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Ajouter un graphique au communiqué
     * 
     * POST /api/press-releases/{pressRelease}/generate-chart
     */
    public function generateChart(Request $request, PressRelease $pressRelease): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'chart_type' => 'required|in:bar,line,pie,doughnut,radar,scatter',
            'data' => 'required|array',
            'data.labels' => 'required|array',
            'data.values' => 'required|array',
            'data.title' => 'sometimes|string',
            'data.label' => 'sometimes|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // Générer le graphique
            $chartPath = $this->chartGenerator->generateChart(
                $request->data,
                $request->chart_type
            );

            // Créer l'entrée média
            $media = PressReleaseMedia::create([
                'press_release_id' => $pressRelease->id,
                'media_type' => 'chart',
                'file_path' => $chartPath,
                'caption' => $request->data['title'] ?? 'Graphique',
                'source' => 'quickchart',
                'order_index' => $pressRelease->media()->count(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Graphique généré avec succès',
                'data' => $media,
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du graphique',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Ajouter une photo au communiqué
     * 
     * POST /api/press-releases/{pressRelease}/add-photo
     */
    public function addPhoto(Request $request, PressRelease $pressRelease): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'query' => 'required_without:photo_id|string',
            'photo_id' => 'sometimes|string',
            'orientation' => 'sometimes|in:landscape,portrait,squarish',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // Rechercher et télécharger la photo
            $result = $this->unsplashService->searchAndDownload(
                $request->query,
                $request->get('orientation', 'landscape')
            );

            if (!$result) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune photo trouvée',
                ], 404);
            }

            // Créer l'entrée média
            $media = PressReleaseMedia::create([
                'press_release_id' => $pressRelease->id,
                'media_type' => 'photo',
                'file_path' => $result['path'],
                'caption' => $result['caption'],
                'source' => 'unsplash',
                'metadata' => $result['metadata'] ?? [],
                'order_index' => $pressRelease->media()->count(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Photo ajoutée avec succès',
                'data' => $media,
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'ajout de la photo',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Exporter en PDF
     * 
     * POST /api/press-releases/{pressRelease}/export-pdf
     */
    public function exportPdf(Request $request, PressRelease $pressRelease): JsonResponse
    {
        try {
            $export = $this->exportService->exportToPdf(
                $pressRelease,
                $request->get('language_code')
            );

            return response()->json([
                'success' => true,
                'message' => 'PDF généré avec succès',
                'data' => $export,
                'download_url' => route('api.press-releases.download', [
                    'pressRelease' => $pressRelease->id,
                    'export' => $export->id
                ]),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export PDF',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Exporter en Word
     * 
     * POST /api/press-releases/{pressRelease}/export-word
     */
    public function exportWord(Request $request, PressRelease $pressRelease): JsonResponse
    {
        try {
            $export = $this->exportService->exportToWord(
                $pressRelease,
                $request->get('language_code')
            );

            return response()->json([
                'success' => true,
                'message' => 'Document Word généré avec succès',
                'data' => $export,
                'download_url' => route('api.press-releases.download', [
                    'pressRelease' => $pressRelease->id,
                    'export' => $export->id
                ]),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export Word',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Télécharger un export
     * 
     * GET /api/press-releases/{pressRelease}/download/{export}
     */
    public function download(PressRelease $pressRelease, int $exportId)
    {
        $export = $pressRelease->exports()->findOrFail($exportId);
        
        return $export->download();
    }

    /**
     * Publier un communiqué
     * 
     * POST /api/press-releases/{pressRelease}/publish
     */
    public function publish(PressRelease $pressRelease): JsonResponse
    {
        try {
            $pressRelease->publish();

            return response()->json([
                'success' => true,
                'message' => 'Communiqué publié avec succès',
                'data' => $pressRelease,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la publication',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Supprimer un communiqué
     * 
     * DELETE /api/press-releases/{pressRelease}
     */
    public function destroy(PressRelease $pressRelease): JsonResponse
    {
        try {
            $pressRelease->delete();

            return response()->json([
                'success' => true,
                'message' => 'Communiqué supprimé avec succès',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}