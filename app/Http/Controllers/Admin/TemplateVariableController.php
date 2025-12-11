<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TemplateVariable;
use App\Services\Content\BulkUpdateService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class TemplateVariableController extends Controller
{
    protected BulkUpdateService $bulkUpdateService;

    public function __construct(BulkUpdateService $bulkUpdateService)
    {
        $this->bulkUpdateService = $bulkUpdateService;
    }

    /**
     * Liste toutes les variables
     */
    public function index(Request $request)
    {
        $query = TemplateVariable::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('key', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        $variables = $query->orderBy('key')->paginate(50);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'data' => $variables
            ]);
        }

        return view('admin.template-variables.index', compact('variables'));
    }

    /**
     * Affiche le formulaire de création
     */
    public function create()
    {
        return view('admin.template-variables.create');
    }

    /**
     * Crée une nouvelle variable
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'key' => 'required|string|max:100|unique:template_variables,key|regex:/^[A-Z_0-9]+$/',
            'value' => 'required|string',
            'type' => 'required|in:text,number,url,html,json',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $variable = TemplateVariable::create($validated);

        // Clear cache
        TemplateVariable::clearCache();

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Variable créée avec succès',
                'data' => $variable
            ], 201);
        }

        return redirect()
            ->route('admin.variables.index')
            ->with('success', 'Variable créée avec succès');
    }

    /**
     * Affiche une variable
     */
    public function show($id)
    {
        $variable = TemplateVariable::findOrFail($id);
        
        // Stats utilisation
        $usage = $this->bulkUpdateService->previewAffectedArticles($variable->key);

        if (request()->expectsJson()) {
            return response()->json([
                'success' => true,
                'data' => [
                    'variable' => $variable,
                    'usage' => $usage
                ]
            ]);
        }

        return view('admin.template-variables.show', compact('variable', 'usage'));
    }

    /**
     * Affiche le formulaire d'édition
     */
    public function edit($id)
    {
        $variable = TemplateVariable::findOrFail($id);
        
        // Preview articles affectés
        $affectedPreview = $this->bulkUpdateService->previewAffectedArticles($variable->key);

        return view('admin.template-variables.edit', compact('variable', 'affectedPreview'));
    }

    /**
     * Met à jour une variable
     */
    public function update(Request $request, $id): JsonResponse
    {
        $variable = TemplateVariable::findOrFail($id);

        $validated = $request->validate([
            'value' => 'required|string',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $oldValue = $variable->value;
        $newValue = $validated['value'];

        // Déterminer si on doit faire un bulk update
        $shouldBulkUpdate = $request->boolean('trigger_bulk_update', true) 
            && $oldValue !== $newValue
            && $variable->is_active;

        $variable->update($validated);
        
        // Clear cache
        TemplateVariable::clearCache($variable->key);

        $response = [
            'success' => true,
            'message' => 'Variable mise à jour avec succès',
            'data' => $variable
        ];

        // Lancer bulk update si nécessaire
        if ($shouldBulkUpdate) {
            $bulkUpdate = $this->bulkUpdateService->initiateBulkUpdate(
                $variable->key,
                $oldValue,
                $newValue
            );

            $response['bulk_update'] = [
                'id' => $bulkUpdate->id,
                'articles_affected' => $bulkUpdate->articles_affected,
                'status' => $bulkUpdate->status
            ];
            $response['message'] .= " Mise à jour en masse de {$bulkUpdate->articles_affected} articles lancée.";
        }

        return response()->json($response);
    }

    /**
     * Supprime une variable
     */
    public function destroy($id)
    {
        $variable = TemplateVariable::findOrFail($id);
        $key = $variable->key;
        
        $variable->delete();
        
        // Clear cache
        TemplateVariable::clearCache($key);

        if (request()->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Variable supprimée'
            ]);
        }

        return redirect()
            ->route('admin.variables.index')
            ->with('success', 'Variable supprimée');
    }

    /**
     * Preview du résultat avec une nouvelle valeur
     */
    public function preview(Request $request, $id): JsonResponse
    {
        $variable = TemplateVariable::findOrFail($id);
        
        $request->validate([
            'new_value' => 'required|string',
            'sample_content' => 'nullable|string'
        ]);

        $newValue = $request->new_value;
        $sampleContent = $request->sample_content ?? "Exemple: Commission {{$variable->key}}%";

        // Preview avec ancienne valeur
        $oldPreview = str_replace("{{{$variable->key}}}", $variable->value, $sampleContent);
        
        // Preview avec nouvelle valeur
        $newPreview = str_replace("{{{$variable->key}}}", $newValue, $sampleContent);

        return response()->json([
            'success' => true,
            'data' => [
                'variable_key' => $variable->key,
                'old_value' => $variable->value,
                'new_value' => $newValue,
                'old_preview' => $oldPreview,
                'new_preview' => $newPreview
            ]
        ]);
    }

    /**
     * Bulk actions
     */
    public function bulkAction(Request $request): JsonResponse
    {
        $request->validate([
            'action' => 'required|in:activate,deactivate,delete',
            'ids' => 'required|array',
            'ids.*' => 'exists:template_variables,id'
        ]);

        $count = match($request->action) {
            'activate' => TemplateVariable::whereIn('id', $request->ids)
                ->update(['is_active' => true]),
            'deactivate' => TemplateVariable::whereIn('id', $request->ids)
                ->update(['is_active' => false]),
            'delete' => TemplateVariable::whereIn('id', $request->ids)->delete(),
        };

        // Clear cache
        TemplateVariable::clearCache();

        return response()->json([
            'success' => true,
            'message' => "{$count} variable(s) traitée(s)",
            'count' => $count
        ]);
    }
}
