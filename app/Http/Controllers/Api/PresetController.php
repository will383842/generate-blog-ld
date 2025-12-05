<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Preset;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class PresetController extends Controller
{
    /**
     * GET /api/presets
     * Liste des presets avec filtres
     */
    public function index(Request $request): JsonResponse
    {
        $query = Preset::with(['platform', 'creator'])
            ->active();

        // Filtres
        if ($request->filled('platform_id')) {
            $query->forPlatform($request->platform_id);
        } else {
            $query->whereNull('platform_id'); // Global presets par défaut
        }

        if ($request->filled('type')) {
            $query->ofType($request->type);
        }

        if ($request->boolean('system_only')) {
            $query->systemPresets();
        } elseif ($request->boolean('user_only')) {
            $query->userPresets();
        }

        if ($request->boolean('defaults_only')) {
            $query->default();
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('description', 'like', "%{$request->search}%");
            });
        }

        // Tri par usage par défaut
        $sortField = $request->get('sort', 'usage_count');
        $sortDir = $request->get('direction', 'desc');
        $query->orderBy($sortField, $sortDir);

        $presets = $query->get();

        // Grouper par type si demandé
        if ($request->boolean('grouped')) {
            $grouped = $presets->groupBy('type');
            return response()->json([
                'presets' => $grouped,
                'types' => [
                    Preset::TYPE_CONTENT => 'Types de contenu',
                    Preset::TYPE_GEOGRAPHIC => 'Géographique',
                    Preset::TYPE_GENERATION => 'Options de génération',
                    Preset::TYPE_PUBLICATION => 'Publication',
                    Preset::TYPE_FULL_PROGRAM => 'Programme complet',
                ],
            ]);
        }

        return response()->json(['presets' => $presets]);
    }

    /**
     * POST /api/presets
     * Créer un preset
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'platform_id' => 'nullable|exists:platforms,id',
            'type' => ['required', Rule::in([
                Preset::TYPE_CONTENT,
                Preset::TYPE_GEOGRAPHIC,
                Preset::TYPE_GENERATION,
                Preset::TYPE_PUBLICATION,
                Preset::TYPE_FULL_PROGRAM,
            ])],
            'config' => 'required|array',
            'is_default' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $data['created_by'] = auth()->id();
        $data['is_system'] = false;

        // Valider la config selon le type
        $configErrors = $this->validateConfig($data['type'], $data['config']);
        if (!empty($configErrors)) {
            return response()->json(['errors' => ['config' => $configErrors]], 422);
        }

        $preset = Preset::create($data);

        // Définir comme défaut si demandé
        if ($data['is_default'] ?? false) {
            $preset->setAsDefault();
        }

        return response()->json([
            'message' => 'Preset créé avec succès',
            'preset' => $preset->load(['platform', 'creator']),
        ], 201);
    }

    /**
     * GET /api/presets/{id}
     * Détail d'un preset
     */
    public function show(int $id): JsonResponse
    {
        $preset = Preset::with(['platform', 'creator'])->findOrFail($id);

        return response()->json([
            'preset' => $preset,
            'default_config' => Preset::getDefaultConfig($preset->type),
        ]);
    }

    /**
     * PUT /api/presets/{id}
     * Mettre à jour un preset
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $preset = Preset::findOrFail($id);

        // Ne pas modifier les presets système
        if ($preset->is_system) {
            return response()->json([
                'error' => 'Les presets système ne peuvent pas être modifiés',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'platform_id' => 'nullable|exists:platforms,id',
            'config' => 'sometimes|array',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        // Valider la config si modifiée
        if (isset($data['config'])) {
            $configErrors = $this->validateConfig($preset->type, $data['config']);
            if (!empty($configErrors)) {
                return response()->json(['errors' => ['config' => $configErrors]], 422);
            }
        }

        $preset->update($data);

        // Gérer le défaut
        if (isset($data['is_default']) && $data['is_default']) {
            $preset->setAsDefault();
        }

        return response()->json([
            'message' => 'Preset mis à jour',
            'preset' => $preset->fresh(['platform', 'creator']),
        ]);
    }

    /**
     * DELETE /api/presets/{id}
     * Supprimer un preset
     */
    public function destroy(int $id): JsonResponse
    {
        $preset = Preset::findOrFail($id);

        if ($preset->is_system) {
            return response()->json([
                'error' => 'Les presets système ne peuvent pas être supprimés',
            ], 403);
        }

        $preset->delete();

        return response()->json([
            'message' => 'Preset supprimé',
        ]);
    }

    /**
     * POST /api/presets/{id}/duplicate
     * Dupliquer un preset
     */
    public function duplicate(int $id, Request $request): JsonResponse
    {
        $original = Preset::findOrFail($id);

        $clone = $original->replicate(['is_default', 'is_system', 'usage_count']);
        $clone->name = $request->get('name', $original->name . ' (copie)');
        $clone->is_default = false;
        $clone->is_system = false;
        $clone->usage_count = 0;
        $clone->created_by = auth()->id();
        $clone->save();

        return response()->json([
            'message' => 'Preset dupliqué',
            'preset' => $clone->load(['platform', 'creator']),
        ], 201);
    }

    /**
     * POST /api/presets/{id}/set-default
     * Définir comme preset par défaut
     */
    public function setDefault(int $id): JsonResponse
    {
        $preset = Preset::findOrFail($id);
        $preset->setAsDefault();

        return response()->json([
            'message' => 'Preset défini comme défaut',
            'preset' => $preset->fresh(),
        ]);
    }

    /**
     * GET /api/presets/defaults
     * Récupérer tous les presets par défaut (un par type)
     */
    public function defaults(Request $request): JsonResponse
    {
        $platformId = $request->get('platform_id');

        $defaults = [];
        $types = [
            Preset::TYPE_CONTENT,
            Preset::TYPE_GEOGRAPHIC,
            Preset::TYPE_GENERATION,
            Preset::TYPE_PUBLICATION,
        ];

        foreach ($types as $type) {
            $preset = Preset::ofType($type)
                ->forPlatform($platformId)
                ->active()
                ->default()
                ->first();

            if (!$preset) {
                // Retourner la config par défaut si pas de preset
                $defaults[$type] = [
                    'preset' => null,
                    'config' => Preset::getDefaultConfig($type),
                ];
            } else {
                $defaults[$type] = [
                    'preset' => $preset,
                    'config' => $preset->config,
                ];
            }
        }

        return response()->json(['defaults' => $defaults]);
    }

    /**
     * GET /api/presets/types
     * Liste des types de presets avec configs par défaut
     */
    public function types(): JsonResponse
    {
        return response()->json([
            'types' => [
                [
                    'value' => Preset::TYPE_CONTENT,
                    'label' => 'Types de contenu',
                    'description' => 'Configuration des types de contenu et thématiques',
                    'default_config' => Preset::getDefaultConfig(Preset::TYPE_CONTENT),
                ],
                [
                    'value' => Preset::TYPE_GEOGRAPHIC,
                    'label' => 'Géographique',
                    'description' => 'Sélection des pays, régions et langues',
                    'default_config' => Preset::getDefaultConfig(Preset::TYPE_GEOGRAPHIC),
                ],
                [
                    'value' => Preset::TYPE_GENERATION,
                    'label' => 'Options de génération',
                    'description' => 'Paramètres IA (ton, FAQ, images, recherche)',
                    'default_config' => Preset::getDefaultConfig(Preset::TYPE_GENERATION),
                ],
                [
                    'value' => Preset::TYPE_PUBLICATION,
                    'label' => 'Publication',
                    'description' => 'Traduction, publication, SEO',
                    'default_config' => Preset::getDefaultConfig(Preset::TYPE_PUBLICATION),
                ],
                [
                    'value' => Preset::TYPE_FULL_PROGRAM,
                    'label' => 'Programme complet',
                    'description' => 'Toutes les options combinées',
                    'default_config' => Preset::getDefaultConfig(Preset::TYPE_FULL_PROGRAM),
                ],
            ],
        ]);
    }

    /**
     * Valider la configuration selon le type
     */
    protected function validateConfig(string $type, array $config): array
    {
        $errors = [];

        switch ($type) {
            case Preset::TYPE_CONTENT:
                if (empty($config['content_types'])) {
                    $errors[] = 'Au moins un type de contenu est requis';
                }
                break;

            case Preset::TYPE_GEOGRAPHIC:
                // Pas de validation obligatoire, null = tous
                break;

            case Preset::TYPE_GENERATION:
                if (isset($config['quality_threshold'])) {
                    if ($config['quality_threshold'] < 0 || $config['quality_threshold'] > 100) {
                        $errors[] = 'Le seuil de qualité doit être entre 0 et 100';
                    }
                }
                if (isset($config['faq_count']) && $config['faq_count'] > 10) {
                    $errors[] = 'Maximum 10 FAQ par article';
                }
                break;

            case Preset::TYPE_PUBLICATION:
                // Pas de validation spécifique
                break;

            case Preset::TYPE_FULL_PROGRAM:
                if (empty($config['content_types'])) {
                    $errors[] = 'Au moins un type de contenu est requis';
                }
                break;
        }

        return $errors;
    }
}