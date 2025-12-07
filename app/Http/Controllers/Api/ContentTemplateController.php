<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContentTemplate;
use App\Services\Content\TemplateManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * ContentTemplateController - API pour la gestion des templates
 */
class ContentTemplateController extends Controller
{
    protected TemplateManager $templateManager;

    public function __construct(TemplateManager $templateManager)
    {
        $this->templateManager = $templateManager;
    }

    /**
     * Liste tous les templates avec filtres
     * 
     * GET /api/content-templates
     */
    public function index(Request $request): JsonResponse
    {
        $query = ContentTemplate::query();

        // Filtres
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('language_code')) {
            $query->where('language_code', $request->language_code);
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->filled('is_default')) {
            $query->where('is_default', $request->boolean('is_default'));
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Tri
        $sortField = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortField, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 20);
        $templates = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $templates->items(),
            'meta' => [
                'current_page' => $templates->currentPage(),
                'last_page' => $templates->lastPage(),
                'per_page' => $templates->perPage(),
                'total' => $templates->total(),
            ],
        ]);
    }

    /**
     * Récupérer tous les templates groupés
     * 
     * GET /api/content-templates/grouped
     */
    public function grouped(): JsonResponse
    {
        $grouped = $this->templateManager->getAllGrouped();

        return response()->json([
            'success' => true,
            'data' => $grouped,
        ]);
    }

    /**
     * Récupérer un template spécifique
     * 
     * GET /api/content-templates/{id}
     */
    public function show(int $id): JsonResponse
    {
        $template = ContentTemplate::with('versions')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $template,
            'meta' => [
                'required_variables' => $template->getRequiredVariables(),
            ],
        ]);
    }

    /**
     * Récupérer un template par son slug
     * 
     * GET /api/content-templates/slug/{slug}
     */
    public function showBySlug(string $slug): JsonResponse
    {
        $template = ContentTemplate::where('slug', $slug)->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $template,
            'meta' => [
                'required_variables' => $template->getRequiredVariables(),
            ],
        ]);
    }

    /**
     * Créer un nouveau template
     * 
     * POST /api/content-templates
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|string|in:article,pillar,landing,comparative,press_release,dossier',
            'name' => 'required|string|max:200',
            'description' => 'nullable|string',
            'language_code' => 'required|string|in:fr,en,de,es,pt,ru,zh,ar,hi',
            'system_prompt' => 'required|string|min:50',
            'user_prompt' => 'required|string|min:100',
            'structure' => 'nullable|array',
            'variables' => 'nullable|array',
            'model' => 'nullable|string',
            'max_tokens' => 'nullable|integer|min:500|max:16000',
            'temperature' => 'nullable|numeric|min:0|max:2',
            'word_count_min' => 'nullable|integer|min:100',
            'word_count_target' => 'nullable|integer|min:100',
            'word_count_max' => 'nullable|integer|min:100',
            'faq_count' => 'nullable|integer|min:0|max:20',
            'is_default' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $userId = $request->user()?->id;
        $template = $this->templateManager->create($request->all(), $userId);

        return response()->json([
            'success' => true,
            'message' => 'Template créé avec succès',
            'data' => $template,
        ], 201);
    }

    /**
     * Mettre à jour un template
     * 
     * PUT /api/content-templates/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $template = ContentTemplate::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:200',
            'description' => 'nullable|string',
            'system_prompt' => 'sometimes|string|min:50',
            'user_prompt' => 'sometimes|string|min:100',
            'structure' => 'nullable|array',
            'variables' => 'nullable|array',
            'model' => 'nullable|string',
            'max_tokens' => 'nullable|integer|min:500|max:16000',
            'temperature' => 'nullable|numeric|min:0|max:2',
            'word_count_min' => 'nullable|integer|min:100',
            'word_count_target' => 'nullable|integer|min:100',
            'word_count_max' => 'nullable|integer|min:100',
            'faq_count' => 'nullable|integer|min:0|max:20',
            'is_default' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'change_note' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $userId = $request->user()?->id;
        $changeNote = $request->input('change_note');
        
        $template = $this->templateManager->update(
            $template,
            $request->except('change_note'),
            $userId,
            $changeNote
        );

        return response()->json([
            'success' => true,
            'message' => 'Template mis à jour avec succès',
            'data' => $template,
        ]);
    }

    /**
     * Supprimer un template (soft delete)
     * 
     * DELETE /api/content-templates/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $template = ContentTemplate::findOrFail($id);
        
        // Vérifier que ce n'est pas le seul template par défaut
        if ($template->is_default) {
            $otherDefault = ContentTemplate::where('type', $template->type)
                ->where('language_code', $template->language_code)
                ->where('id', '!=', $template->id)
                ->where('is_active', true)
                ->exists();

            if (!$otherDefault) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer le seul template par défaut. Définissez d\'abord un autre template par défaut.',
                ], 422);
            }
        }

        $template->delete();

        $this->templateManager->clearCache($template->type, $template->language_code);

        return response()->json([
            'success' => true,
            'message' => 'Template supprimé avec succès',
        ]);
    }

    /**
     * Dupliquer un template
     * 
     * POST /api/content-templates/{id}/duplicate
     */
    public function duplicate(Request $request, int $id): JsonResponse
    {
        $template = ContentTemplate::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'nullable|string|max:200',
            'target_language' => 'nullable|string|in:fr,en,de,es,pt,ru,zh,ar,hi',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $newTemplate = $this->templateManager->duplicate(
            $template,
            $request->input('name'),
            $request->input('target_language')
        );

        return response()->json([
            'success' => true,
            'message' => 'Template dupliqué avec succès',
            'data' => $newTemplate,
        ], 201);
    }

    /**
     * Définir comme template par défaut
     * 
     * POST /api/content-templates/{id}/set-default
     */
    public function setDefault(int $id): JsonResponse
    {
        $template = ContentTemplate::findOrFail($id);

        if (!$template->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Un template inactif ne peut pas être défini par défaut',
            ], 422);
        }

        $this->templateManager->setAsDefault($template);

        return response()->json([
            'success' => true,
            'message' => 'Template défini par défaut',
            'data' => $template->fresh(),
        ]);
    }

    /**
     * Prévisualiser un prompt
     * 
     * POST /api/content-templates/{id}/preview
     */
    public function preview(Request $request, int $id): JsonResponse
    {
        $template = ContentTemplate::findOrFail($id);
        $testData = $request->input('test_data', []);

        $preview = $this->templateManager->previewPrompt($template, $testData);

        return response()->json([
            'success' => true,
            'data' => $preview,
        ]);
    }

    /**
     * Obtenir l'historique des versions
     * 
     * GET /api/content-templates/{id}/versions
     */
    public function versions(int $id): JsonResponse
    {
        $template = ContentTemplate::findOrFail($id);
        $versions = $template->versions()->with('creator')->get();

        return response()->json([
            'success' => true,
            'data' => $versions,
        ]);
    }

    /**
     * Restaurer une version précédente
     * 
     * POST /api/content-templates/{id}/restore/{version}
     */
    public function restoreVersion(Request $request, int $id, int $version): JsonResponse
    {
        $template = ContentTemplate::findOrFail($id);
        $userId = $request->user()?->id;

        $template = $this->templateManager->restoreVersion($template, $version, $userId);

        return response()->json([
            'success' => true,
            'message' => "Version {$version} restaurée avec succès",
            'data' => $template,
        ]);
    }

    /**
     * Exporter un template
     * 
     * GET /api/content-templates/{id}/export
     */
    public function export(int $id): JsonResponse
    {
        $template = ContentTemplate::findOrFail($id);
        $exported = $this->templateManager->export($template);

        return response()->json([
            'success' => true,
            'data' => $exported,
        ]);
    }

    /**
     * Importer un template
     * 
     * POST /api/content-templates/import
     */
    public function import(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'template' => 'required|array',
            'template.type' => 'required|string',
            'template.name' => 'required|string',
            'template.language_code' => 'required|string',
            'template.system_prompt' => 'required|string',
            'template.user_prompt' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $userId = $request->user()?->id;
        $template = $this->templateManager->import($request->input('template'), $userId);

        return response()->json([
            'success' => true,
            'message' => 'Template importé avec succès',
            'data' => $template,
        ], 201);
    }

    /**
     * Obtenir les statistiques
     * 
     * GET /api/content-templates/stats
     */
    public function stats(): JsonResponse
    {
        $stats = $this->templateManager->getStats();

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Vérifier la couverture des langues
     * 
     * GET /api/content-templates/coverage/{type}
     */
    public function coverage(string $type): JsonResponse
    {
        $coverage = $this->templateManager->checkLanguageCoverage($type);

        return response()->json([
            'success' => true,
            'data' => $coverage,
        ]);
    }

    /**
     * Obtenir les constantes (types, langues, etc.)
     * 
     * GET /api/content-templates/constants
     */
    public function constants(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'categories' => [
                    ContentTemplate::CATEGORY_CONTENT => 'Contenu en ligne',
                    ContentTemplate::CATEGORY_PRESS => 'Presse (PDF)',
                ],
                'types' => [
                    'content' => [
                        ContentTemplate::TYPE_ARTICLE => 'Article',
                        ContentTemplate::TYPE_PILLAR => 'Article Pilier',
                        ContentTemplate::TYPE_LANDING => 'Landing Page',
                        ContentTemplate::TYPE_COMPARATIVE => 'Comparatif',
                    ],
                    'press' => [
                        ContentTemplate::TYPE_PRESS_RELEASE => 'Communiqué de Presse',
                        ContentTemplate::TYPE_DOSSIER => 'Dossier de Presse',
                    ],
                ],
                'languages' => ContentTemplate::LANGUAGES,
                'models' => [
                    'gpt-4o' => 'GPT-4o (Recommandé)',
                    'gpt-4o-mini' => 'GPT-4o Mini (Économique)',
                    'gpt-4-turbo' => 'GPT-4 Turbo',
                ],
            ],
        ]);
    }

    /**
     * Vider le cache des templates
     * 
     * POST /api/content-templates/clear-cache
     */
    public function clearCache(): JsonResponse
    {
        $this->templateManager->clearAllCache();

        return response()->json([
            'success' => true,
            'message' => 'Cache des templates vidé',
        ]);
    }
}
