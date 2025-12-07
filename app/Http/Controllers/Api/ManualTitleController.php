<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ManualTitle;
use App\Models\GenerationRequest;
use App\Jobs\ProcessManualTitle;
use App\Services\Content\TemplateDetectorService;
use App\Services\Content\ManualGenerationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Exception;

class ManualTitleController extends Controller
{
    protected TemplateDetectorService $templateDetector;
    protected ManualGenerationService $generationService;

    public function __construct(
        TemplateDetectorService $templateDetector,
        ManualGenerationService $generationService
    ) {
        $this->templateDetector = $templateDetector;
        $this->generationService = $generationService;
    }

    /**
     * Liste des titres manuels avec filtres
     *
     * GET /api/manual-titles
     */
    public function index(Request $request): JsonResponse
    {
        $query = ManualTitle::with(['platform', 'country', 'latestGenerationRequest']);

        // Filtres
        if ($request->has('platform_id')) {
            $query->where('platform_id', $request->platform_id);
        }

        if ($request->has('country_id')) {
            $query->where('country_id', $request->country_id);
        }

        if ($request->has('language_code')) {
            $query->where('language_code', $request->language_code);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('template')) {
            $query->where('suggested_template', $request->template);
        }

        // Recherche par titre
        if ($request->has('search')) {
            $search = $request->search;
            $query->where('title', 'like', "%{$search}%");
        }

        // Tri
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 20);
        $titles = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $titles,
        ]);
    }

    /**
     * Détail d'un titre manuel
     *
     * GET /api/manual-titles/{id}
     */
    public function show(int $id): JsonResponse
    {
        $title = ManualTitle::with([
            'platform',
            'country',
            'generationRequests' => function ($query) {
                $query->orderBy('created_at', 'desc');
            },
            'generationRequests.article'
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $title,
        ]);
    }

    /**
     * Créer un nouveau titre manuel avec auto-détection template
     *
     * POST /api/manual-titles
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:500',
            'description' => 'nullable|string',
            'platform_id' => 'required|exists:platforms,id',
            'country_id' => 'required|exists:countries,id',
            'language_code' => 'required|string|size:2',
            'suggested_template' => 'nullable|string|max:100',
            'context' => 'nullable|array',
            'auto_queue' => 'nullable|boolean', // Si true, mise en queue automatique
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $data = $validator->validated();

            // Auto-détection du template si non fourni
            if (empty($data['suggested_template'])) {
                $data['suggested_template'] = $this->templateDetector->detectOptimalTemplate(
                    $data['title'],
                    $data['description'] ?? null
                );
            }

            // Créer le titre manuel
            $manualTitle = ManualTitle::create($data);

            // Configuration du template détecté
            $templateConfig = $this->templateDetector->getTemplateConfig(
                $manualTitle->suggested_template
            );

            // Auto-queue si demandé
            if ($request->get('auto_queue', false)) {
                $manualTitle->markAsQueued();
                ProcessManualTitle::dispatch($manualTitle);
            }

            Log::info("Titre manuel créé", [
                'manual_title_id' => $manualTitle->id,
                'template' => $manualTitle->suggested_template,
                'auto_queued' => $request->get('auto_queue', false),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Titre manuel créé avec succès',
                'data' => [
                    'manual_title' => $manualTitle,
                    'template_config' => $templateConfig,
                ],
            ], 201);

        } catch (Exception $e) {
            Log::error("Erreur création titre manuel", [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du titre manuel',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Générer immédiatement un article depuis un titre manuel
     *
     * POST /api/manual-titles/{id}/generate
     */
    public function generate(int $id): JsonResponse
    {
        $manualTitle = ManualTitle::findOrFail($id);

        // Vérifier si déjà en cours de traitement
        if ($manualTitle->status === ManualTitle::STATUS_PROCESSING) {
            return response()->json([
                'success' => false,
                'message' => 'Ce titre est déjà en cours de génération',
            ], 409);
        }

        try {
            // Mise en queue immédiate
            $manualTitle->markAsQueued();
            ProcessManualTitle::dispatch($manualTitle);

            Log::info("Titre manuel mis en queue pour génération", [
                'manual_title_id' => $manualTitle->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Génération lancée avec succès',
                'data' => [
                    'manual_title' => $manualTitle->fresh(),
                    'status_url' => route('api.manual-titles.status', $id),
                ],
            ]);

        } catch (Exception $e) {
            Log::error("Erreur mise en queue titre manuel", [
                'manual_title_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise en queue',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Programmer une génération (scheduled_at)
     *
     * POST /api/manual-titles/{id}/schedule
     */
    public function schedule(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'scheduled_at' => 'required|date|after:now',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $manualTitle = ManualTitle::findOrFail($id);

        // Vérifier si déjà en cours de traitement
        if ($manualTitle->status === ManualTitle::STATUS_PROCESSING) {
            return response()->json([
                'success' => false,
                'message' => 'Ce titre est déjà en cours de génération',
            ], 409);
        }

        try {
            $scheduledAt = \Carbon\Carbon::parse($request->scheduled_at);
            $delay = now()->diffInSeconds($scheduledAt);

            // Marquer comme programmé avec la date
            $manualTitle->markAsScheduled($scheduledAt);

            // Dispatcher le job avec le délai calculé
            ProcessManualTitle::dispatch($manualTitle)
                ->delay($scheduledAt)
                ->onQueue('scheduled');

            Log::info("Titre manuel programmé", [
                'manual_title_id' => $manualTitle->id,
                'scheduled_at' => $scheduledAt->toIso8601String(),
                'delay_seconds' => $delay,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Génération programmée avec succès',
                'data' => [
                    'manual_title' => $manualTitle->fresh(),
                    'scheduled_at' => $scheduledAt->toIso8601String(),
                    'delay_seconds' => $delay,
                    'human_delay' => $this->humanReadableDelay($delay),
                ],
            ]);

        } catch (Exception $e) {
            Log::error("Erreur programmation titre manuel", [
                'manual_title_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la programmation',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Annuler une programmation
     *
     * DELETE /api/manual-titles/{id}/schedule
     */
    public function cancelSchedule(int $id): JsonResponse
    {
        $manualTitle = ManualTitle::findOrFail($id);

        if ($manualTitle->status !== ManualTitle::STATUS_SCHEDULED) {
            return response()->json([
                'success' => false,
                'message' => 'Ce titre n\'est pas programmé',
                'current_status' => $manualTitle->status,
            ], 400);
        }

        try {
            // Réinitialiser le statut
            $manualTitle->update([
                'status' => ManualTitle::STATUS_PENDING,
                'scheduled_at' => null,
            ]);

            Log::info("Programmation annulée", [
                'manual_title_id' => $manualTitle->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Programmation annulée avec succès',
                'data' => $manualTitle->fresh(),
            ]);

        } catch (Exception $e) {
            Log::error("Erreur annulation programmation", [
                'manual_title_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'annulation',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reprogrammer un titre
     *
     * PUT /api/manual-titles/{id}/schedule
     */
    public function reschedule(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'scheduled_at' => 'required|date|after:now',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $manualTitle = ManualTitle::findOrFail($id);

        // Vérifier si en cours de traitement
        if ($manualTitle->status === ManualTitle::STATUS_PROCESSING) {
            return response()->json([
                'success' => false,
                'message' => 'Ce titre est en cours de génération',
            ], 409);
        }

        try {
            $scheduledAt = \Carbon\Carbon::parse($request->scheduled_at);

            // Mettre à jour la programmation
            $manualTitle->markAsScheduled($scheduledAt);

            // Re-dispatcher le job avec la nouvelle date
            ProcessManualTitle::dispatch($manualTitle)
                ->delay($scheduledAt)
                ->onQueue('scheduled');

            Log::info("Titre manuel reprogrammé", [
                'manual_title_id' => $manualTitle->id,
                'new_scheduled_at' => $scheduledAt->toIso8601String(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Génération reprogrammée avec succès',
                'data' => [
                    'manual_title' => $manualTitle->fresh(),
                    'scheduled_at' => $scheduledAt->toIso8601String(),
                ],
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la reprogrammation',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lister les titres programmés
     *
     * GET /api/manual-titles/scheduled
     */
    public function scheduled(Request $request): JsonResponse
    {
        $query = ManualTitle::where('status', ManualTitle::STATUS_SCHEDULED)
            ->whereNotNull('scheduled_at')
            ->with(['platform', 'country'])
            ->orderBy('scheduled_at', 'asc');

        if ($request->has('platform_id')) {
            $query->where('platform_id', $request->platform_id);
        }

        $perPage = $request->get('per_page', 20);
        $titles = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $titles,
        ]);
    }

    /**
     * Convertir un délai en format lisible
     *
     * @param int $seconds
     * @return string
     */
    protected function humanReadableDelay(int $seconds): string
    {
        if ($seconds < 60) {
            return "{$seconds} secondes";
        }

        $minutes = floor($seconds / 60);
        if ($minutes < 60) {
            return "{$minutes} minutes";
        }

        $hours = floor($minutes / 60);
        $remainingMinutes = $minutes % 60;

        if ($hours < 24) {
            return "{$hours}h {$remainingMinutes}min";
        }

        $days = floor($hours / 24);
        $remainingHours = $hours % 24;

        return "{$days}j {$remainingHours}h";
    }

    /**
     * Import CSV en masse
     *
     * POST /api/manual-titles/bulk-import
     * Format CSV : title,description,platform,country,language
     */
    public function bulkImport(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:csv,txt|max:10240', // Max 10MB
            'auto_queue' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $file = $request->file('file');
            $autoQueue = $request->get('auto_queue', false);

            // Lire le CSV
            $csvData = array_map('str_getcsv', file($file->getRealPath()));
            $headers = array_shift($csvData); // Première ligne = headers

            $created = 0;
            $errors = [];

            foreach ($csvData as $index => $row) {
                try {
                    // Mapper les colonnes
                    $data = array_combine($headers, $row);

                    // Validation basique
                    if (empty($data['title']) || empty($data['platform']) || empty($data['country']) || empty($data['language'])) {
                        $errors[] = [
                            'line' => $index + 2, // +2 car header + index 0
                            'error' => 'Champs obligatoires manquants',
                        ];
                        continue;
                    }

                    // Résoudre les IDs (platform et country peuvent être codes ou IDs)
                    $platformId = is_numeric($data['platform']) 
                        ? $data['platform'] 
                        : \App\Models\Platform::where('code', $data['platform'])->value('id');

                    $countryId = is_numeric($data['country']) 
                        ? $data['country'] 
                        : \App\Models\Country::where('code', $data['country'])->value('id');

                    if (!$platformId || !$countryId) {
                        $errors[] = [
                            'line' => $index + 2,
                            'error' => 'Plateforme ou pays non trouvé',
                        ];
                        continue;
                    }

                    // Détecter template
                    $template = $this->templateDetector->detectOptimalTemplate(
                        $data['title'],
                        $data['description'] ?? null
                    );

                    // Créer le titre
                    $manualTitle = ManualTitle::create([
                        'title' => $data['title'],
                        'description' => $data['description'] ?? null,
                        'platform_id' => $platformId,
                        'country_id' => $countryId,
                        'language_code' => $data['language'],
                        'suggested_template' => $template,
                    ]);

                    // Auto-queue si demandé
                    if ($autoQueue) {
                        $manualTitle->markAsQueued();
                        ProcessManualTitle::dispatch($manualTitle);
                    }

                    $created++;

                } catch (Exception $e) {
                    $errors[] = [
                        'line' => $index + 2,
                        'error' => $e->getMessage(),
                    ];
                }
            }

            Log::info("Import CSV titres manuels", [
                'total_lines' => count($csvData),
                'created' => $created,
                'errors' => count($errors),
            ]);

            return response()->json([
                'success' => true,
                'message' => "Import terminé : {$created} titres créés",
                'data' => [
                    'created' => $created,
                    'errors_count' => count($errors),
                    'errors' => $errors,
                ],
            ]);

        } catch (Exception $e) {
            Log::error("Erreur import CSV", [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'import CSV',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Statut de génération en temps réel
     *
     * GET /api/manual-titles/{id}/status
     */
    public function status(int $id): JsonResponse
    {
        $manualTitle = ManualTitle::with([
            'latestGenerationRequest',
            'latestGenerationRequest.article'
        ])->findOrFail($id);

        $request = $manualTitle->latestGenerationRequest;

        return response()->json([
            'success' => true,
            'data' => [
                'manual_title_id' => $manualTitle->id,
                'title' => $manualTitle->title,
                'status' => $manualTitle->status,
                'template' => $manualTitle->suggested_template,
                'generation_request' => $request ? [
                    'id' => $request->id,
                    'status' => $request->status,
                    'attempts' => $request->attempts,
                    'started_at' => $request->started_at,
                    'completed_at' => $request->completed_at,
                    'duration' => $request->getFormattedDuration(),
                    'cost' => $request->getFormattedCost(),
                    'article_id' => $request->article_id,
                    'error_message' => $request->error_message,
                ] : null,
            ],
        ]);
    }

    /**
     * Supprimer un titre manuel
     *
     * DELETE /api/manual-titles/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $manualTitle = ManualTitle::findOrFail($id);

        // Vérifier si en cours de traitement
        if ($manualTitle->status === ManualTitle::STATUS_PROCESSING) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer un titre en cours de génération',
            ], 409);
        }

        $manualTitle->delete();

        return response()->json([
            'success' => true,
            'message' => 'Titre manuel supprimé avec succès',
        ]);
    }

    /**
     * Templates disponibles
     *
     * GET /api/manual-titles/templates
     */
    public function templates(): JsonResponse
    {
        $templates = [];
        
        foreach ($this->templateDetector->getAvailableTemplates() as $code) {
            $templates[] = array_merge(
                ['code' => $code],
                $this->templateDetector->getTemplateConfig($code)
            );
        }

        return response()->json([
            'success' => true,
            'data' => $templates,
        ]);
    }
}