<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UlixaiService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class UlixaiServiceController extends Controller
{
    /**
     * Liste des services Ulixai (structure arbre)
     */
    public function index(Request $request): JsonResponse
    {
        $query = UlixaiService::query();

        // Option : arbre complet ou liste plate
        if ($request->has('tree') && $request->tree === 'true') {
            // Arbre hiérarchique
            $services = UlixaiService::with('children.children')
                ->whereNull('parent_id')
                ->orderBy('order')
                ->get();
        } else {
            // Liste plate
            if ($request->has('parent_id')) {
                $query->where('parent_id', $request->parent_id);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name_fr', 'LIKE', "%{$search}%")
                      ->orWhere('name_en', 'LIKE', "%{$search}%");
                });
            }

            if ($request->has('active') && $request->active === 'true') {
                $query->where('is_active', true);
            }

            $services = $request->has('paginate') && $request->paginate === 'false'
                ? $query->orderBy('order')->get()
                : $query->orderBy('order')->paginate($request->get('per_page', 50));
        }

        return response()->json([
            'success' => true,
            'data' => $services,
        ]);
    }

    /**
     * Détail d'un service
     */
    public function show(int $id): JsonResponse
    {
        $service = UlixaiService::with(['parent', 'children'])->findOrFail($id);
        
        return response()->json([
            'success' => true,
            'data' => $service,
        ]);
    }

    /**
     * Créer un service
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'parent_id' => 'nullable|integer|exists:ulixai_services,id',
            'name_fr' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
            'name_es' => 'nullable|string|max:255',
            'name_de' => 'nullable|string|max:255',
            'name_pt' => 'nullable|string|max:255',
            'name_ru' => 'nullable|string|max:255',
            'name_zh' => 'nullable|string|max:255',
            'name_ar' => 'nullable|string|max:255',
            'name_hi' => 'nullable|string|max:255',
            'slug' => 'required|string|max:255|unique:ulixai_services',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        // Si pas d'ordre spécifié, mettre à la fin
        if (!isset($validated['order'])) {
            $validated['order'] = UlixaiService::where('parent_id', $validated['parent_id'] ?? null)
                ->max('order') + 1;
        }

        $service = UlixaiService::create($validated);

        return response()->json([
            'success' => true,
            'data' => $service,
            'message' => 'Service créé avec succès',
        ], 201);
    }

    /**
     * Mettre à jour un service
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $service = UlixaiService::findOrFail($id);

        $validated = $request->validate([
            'parent_id' => 'nullable|integer|exists:ulixai_services,id',
            'name_fr' => 'sometimes|required|string|max:255',
            'name_en' => 'sometimes|required|string|max:255',
            'name_es' => 'nullable|string|max:255',
            'name_de' => 'nullable|string|max:255',
            'name_pt' => 'nullable|string|max:255',
            'name_ru' => 'nullable|string|max:255',
            'name_zh' => 'nullable|string|max:255',
            'name_ar' => 'nullable|string|max:255',
            'name_hi' => 'nullable|string|max:255',
            'slug' => 'sometimes|required|string|max:255|unique:ulixai_services,slug,' . $id,
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $service->update($validated);

        return response()->json([
            'success' => true,
            'data' => $service,
            'message' => 'Service mis à jour avec succès',
        ]);
    }

    /**
     * Réorganiser l'ordre des services
     */
    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'services' => 'required|array',
            'services.*.id' => 'required|integer|exists:ulixai_services,id',
            'services.*.order' => 'required|integer',
        ]);

        foreach ($validated['services'] as $item) {
            UlixaiService::where('id', $item['id'])->update(['order' => $item['order']]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Ordre mis à jour avec succès',
        ]);
    }

    /**
     * Supprimer un service
     */
    public function destroy(int $id): JsonResponse
    {
        $service = UlixaiService::findOrFail($id);
        
        // Vérifier qu'il n'a pas d'enfants
        if ($service->children()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer un service qui a des sous-services',
            ], 422);
        }

        $service->delete();

        return response()->json([
            'success' => true,
            'message' => 'Service supprimé avec succès',
        ]);
    }
}