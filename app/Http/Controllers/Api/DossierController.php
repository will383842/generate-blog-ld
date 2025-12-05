<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PressDossier;
use App\Models\DossierSection;
use App\Models\DossierMedia;
use App\Services\Press\PressDossierGenerator;
use App\Services\Press\DossierChartService;
use App\Services\Press\DossierExportService;
use App\Services\Press\CsvParserService;
use App\Http\Requests\StoreDossierRequest;
use App\Http\Requests\UpdateDossierRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

/**
 * DossierController - API REST complète pour les dossiers de presse
 * 
 * Endpoints :
 * - CRUD dossiers
 * - CRUD sections
 * - Gestion médias
 * - Génération graphiques depuis CSV
 * - Export PDF/Word/Excel
 * - Réorganisation sections
 * 
 * @package App\Http\Controllers\Api
 */
class DossierController extends Controller
{
    protected PressDossierGenerator $generator;
    protected DossierChartService $chartService;
    protected DossierExportService $exportService;
    protected CsvParserService $csvParser;

    public function __construct(
        PressDossierGenerator $generator,
        DossierChartService $chartService,
        DossierExportService $exportService,
        CsvParserService $csvParser
    ) {
        $this->generator = $generator;
        $this->chartService = $chartService;
        $this->exportService = $exportService;
        $this->csvParser = $csvParser;
    }

    // ============================================
    // CRUD DOSSIERS
    // ============================================

    /**
     * Liste des dossiers
     * GET /api/dossiers
     */
    public function index(Request $request)
    {
        $query = PressDossier::with(['platform', 'sections', 'media']);

        // Filtres
        if ($request->has('platform_id')) {
            $query->where('platform_id', $request->platform_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('language_code')) {
            $query->where('language_code', $request->language_code);
        }

        if ($request->has('template_type')) {
            $query->where('template_type', $request->template_type);
        }

        // Tri
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 20);
        $dossiers = $query->paginate($perPage);

        return response()->json($dossiers);
    }

    /**
     * Afficher un dossier
     * GET /api/dossiers/{id}
     */
    public function show($id)
    {
        $dossier = PressDossier::with(['platform', 'sections.media', 'media', 'exports'])
            ->findOrFail($id);

        return response()->json($dossier);
    }

    /**
     * Créer un dossier (génération automatique)
     * POST /api/dossiers
     */
    public function store(StoreDossierRequest $request)
    {
        try {
            $dossier = $this->generator->generate($request->validated());

            return response()->json([
                'message' => 'Dossier généré avec succès',
                'dossier' => $dossier->load(['sections', 'media']),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erreur lors de la génération du dossier',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mettre à jour un dossier
     * PUT /api/dossiers/{id}
     */
    public function update(UpdateDossierRequest $request, $id)
    {
        $dossier = PressDossier::findOrFail($id);

        $dossier->update($request->validated());

        return response()->json([
            'message' => 'Dossier mis à jour',
            'dossier' => $dossier->fresh(['sections', 'media']),
        ]);
    }

    /**
     * Supprimer un dossier
     * DELETE /api/dossiers/{id}
     */
    public function destroy($id)
    {
        $dossier = PressDossier::findOrFail($id);
        $dossier->delete();

        return response()->json(['message' => 'Dossier supprimé'], 200);
    }

    // ============================================
    // CRUD SECTIONS
    // ============================================

    /**
     * Ajouter une section
     * POST /api/dossiers/{id}/sections/add
     */
    public function addSection(Request $request, $id)
    {
        $dossier = PressDossier::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'section_type' => 'required|in:cover,intro,chapter,conclusion,methodology,table_of_contents,appendix,bibliography',
            'title' => 'required|string|max:255',
            'content' => 'nullable|string',
            'order_index' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Si order_index n'est pas fourni, ajouter à la fin
        $orderIndex = $request->order_index ?? $dossier->sections()->max('order_index') + 1;

        $section = DossierSection::create([
            'dossier_id' => $dossier->id,
            'section_type' => $request->section_type,
            'title' => $request->title,
            'content' => $request->content,
            'order_index' => $orderIndex,
        ]);

        return response()->json([
            'message' => 'Section ajoutée',
            'section' => $section,
        ], 201);
    }

    /**
     * Modifier le contenu d'une section
     * PUT /api/dossiers/{dossierId}/sections/{sectionId}/content
     */
    public function updateSectionContent(Request $request, $dossierId, $sectionId)
    {
        $section = DossierSection::where('dossier_id', $dossierId)
            ->findOrFail($sectionId);

        $validator = Validator::make($request->all(), [
            'content' => 'required|string',
            'title' => 'sometimes|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $section->update($request->only(['content', 'title']));

        return response()->json([
            'message' => 'Section mise à jour',
            'section' => $section->fresh(),
        ]);
    }

    /**
     * Réordonner une section
     * POST /api/dossiers/{dossierId}/sections/{sectionId}/reorder
     */
    public function reorderSection(Request $request, $dossierId, $sectionId)
    {
        $section = DossierSection::where('dossier_id', $dossierId)
            ->findOrFail($sectionId);

        $validator = Validator::make($request->all(), [
            'direction' => 'required|in:up,down',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $success = $request->direction === 'up' 
            ? $section->moveUp() 
            : $section->moveDown();

        if (!$success) {
            return response()->json([
                'message' => 'Impossible de déplacer la section dans cette direction',
            ], 400);
        }

        return response()->json([
            'message' => 'Section réordonnée',
            'sections' => $section->dossier->sections()->ordered()->get(),
        ]);
    }

    /**
     * Supprimer une section
     * DELETE /api/dossiers/{dossierId}/sections/{sectionId}
     */
    public function deleteSection($dossierId, $sectionId)
    {
        $section = DossierSection::where('dossier_id', $dossierId)
            ->findOrFail($sectionId);
        
        $section->delete();

        return response()->json(['message' => 'Section supprimée'], 200);
    }

    // ============================================
    // GESTION MÉDIAS
    // ============================================

    /**
     * Ajouter une photo
     * POST /api/dossiers/{id}/sections/{sectionId}/add-photo
     */
    public function addPhoto(Request $request, $id, $sectionId = null)
    {
        $dossier = PressDossier::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'photo' => 'required|image|max:10240', // 10MB max
            'caption' => 'nullable|string|max:500',
            'media_type' => 'sometimes|in:photo,logo,infographic',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Upload de la photo
        $file = $request->file('photo');
        $path = $file->store('dossiers/media/' . $dossier->id, 'public');

        // Obtenir les dimensions
        $image = getimagesize($file->getRealPath());
        $width = $image[0] ?? null;
        $height = $image[1] ?? null;

        // Créer l'entrée média
        $media = DossierMedia::create([
            'dossier_id' => $dossier->id,
            'section_id' => $sectionId,
            'media_type' => $request->media_type ?? 'photo',
            'file_path' => 'public/' . $path,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'width' => $width,
            'height' => $height,
            'caption' => $request->caption,
        ]);

        return response()->json([
            'message' => 'Photo ajoutée',
            'media' => $media,
        ], 201);
    }

    /**
     * Générer un graphique depuis CSV
     * POST /api/dossiers/{id}/sections/{sectionId}/generate-chart
     */
    public function generateChart(Request $request, $id, $sectionId = null)
    {
        $dossier = PressDossier::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'csv_file' => 'required|file|mimes:csv,txt',
            'label_column' => 'required|string',
            'value_column' => 'required|string',
            'chart_type' => 'required|in:bar,line,pie,doughnut',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            // Upload du CSV
            $file = $request->file('csv_file');
            $csvPath = $file->store('dossiers/temp', 'public');

            // Générer le graphique
            $result = $this->chartService->createChartFromCSV(
                'public/' . $csvPath,
                $request->label_column,
                $request->value_column,
                $request->chart_type
            );

            // Créer l'entrée média
            $media = DossierMedia::create([
                'dossier_id' => $dossier->id,
                'section_id' => $sectionId,
                'media_type' => 'chart',
                'file_path' => $result['chart_path'],
                'chart_config' => $result['chart_config'],
                'caption' => $result['chart_config']['data']['title'] ?? null,
            ]);

            // Supprimer le CSV temporaire
            Storage::delete('public/' . $csvPath);

            return response()->json([
                'message' => 'Graphique généré',
                'media' => $media,
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erreur lors de la génération du graphique',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // ============================================
    // EXPORTS
    // ============================================

    /**
     * Exporter en PDF
     * POST /api/dossiers/{id}/export-pdf
     */
    public function exportPdf(Request $request, $id)
    {
        $dossier = PressDossier::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'language_code' => 'sometimes|in:fr,en,es,de,it,pt,ar,zh,hi',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $lang = $request->language_code ?? $dossier->language_code;
            $export = $this->exportService->exportToPdf($dossier, $lang);

            return response()->json([
                'message' => 'Export PDF créé',
                'export' => $export,
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erreur lors de l\'export PDF',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Exporter en Word
     * POST /api/dossiers/{id}/export-word
     */
    public function exportWord(Request $request, $id)
    {
        $dossier = PressDossier::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'language_code' => 'sometimes|in:fr,en,es,de,it,pt,ar,zh,hi',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $lang = $request->language_code ?? $dossier->language_code;
            $export = $this->exportService->exportToWord($dossier, $lang);

            return response()->json([
                'message' => 'Export Word créé',
                'export' => $export,
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erreur lors de l\'export Word',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Exporter datasets en Excel
     * POST /api/dossiers/{id}/export-excel
     */
    public function exportExcel($id)
    {
        $dossier = PressDossier::findOrFail($id);

        try {
            $export = $this->exportService->exportDatasetToExcel($dossier);

            return response()->json([
                'message' => 'Export Excel créé',
                'export' => $export,
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erreur lors de l\'export Excel',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Télécharger un export
     * GET /api/dossiers/exports/{exportId}/download
     */
    public function downloadExport($exportId)
    {
        $export = \App\Models\DossierExport::findOrFail($exportId);

        if (!$export->isReady()) {
            return response()->json([
                'error' => 'Export non disponible',
                'status' => $export->status,
            ], 400);
        }

        $export->incrementDownloads();

        return Storage::download($export->file_path, $export->filename);
    }

    // ============================================
    // STATISTIQUES
    // ============================================

    /**
     * Statistiques globales
     * GET /api/dossiers/stats
     */
    public function stats(Request $request)
    {
        $platformId = $request->get('platform_id');

        $query = PressDossier::query();
        
        if ($platformId) {
            $query->where('platform_id', $platformId);
        }

        $stats = [
            'total' => $query->count(),
            'by_status' => $query->selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status'),
            'by_template' => $query->selectRaw('template_type, COUNT(*) as count')
                ->groupBy('template_type')
                ->pluck('count', 'template_type'),
            'total_pages' => $query->sum('total_pages'),
            'total_cost' => $query->sum('generation_cost'),
            'recent' => $query->where('created_at', '>=', now()->subDays(30))->count(),
        ];

        return response()->json($stats);
    }
}