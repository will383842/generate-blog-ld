<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExpatDomain;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ExpatDomainController extends Controller
{
    /**
     * Liste des domaines d'expatriation
     */
    public function index(Request $request): JsonResponse
    {
        $query = ExpatDomain::query();

        // Recherche
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name_fr', 'LIKE', "%{$search}%")
                  ->orWhere('name_en', 'LIKE', "%{$search}%");
            });
        }

        // Actif uniquement
        if ($request->has('active') && $request->active === 'true') {
            $query->where('is_active', true);
        }

        $domains = $request->has('paginate') && $request->paginate === 'false'
            ? $query->get()
            : $query->paginate($request->get('per_page', 50));

        return response()->json([
            'success' => true,
            'data' => $domains,
        ]);
    }

    /**
     * Détail d'un domaine
     */
    public function show(int $id): JsonResponse
    {
        $domain = ExpatDomain::findOrFail($id);
        
        return response()->json([
            'success' => true,
            'data' => $domain,
        ]);
    }

    /**
     * Créer un domaine
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name_fr' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
            'name_es' => 'nullable|string|max:255',
            'name_de' => 'nullable|string|max:255',
            'name_pt' => 'nullable|string|max:255',
            'name_ru' => 'nullable|string|max:255',
            'name_zh' => 'nullable|string|max:255',
            'name_ar' => 'nullable|string|max:255',
            'name_hi' => 'nullable|string|max:255',
            'slug' => 'required|string|max:255|unique:expat_domains',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:7',
            'is_active' => 'nullable|boolean',
        ]);

        $domain = ExpatDomain::create($validated);

        return response()->json([
            'success' => true,
            'data' => $domain,
            'message' => 'Domaine créé avec succès',
        ], 201);
    }

    /**
     * Mettre à jour un domaine
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $domain = ExpatDomain::findOrFail($id);

        $validated = $request->validate([
            'name_fr' => 'sometimes|required|string|max:255',
            'name_en' => 'sometimes|required|string|max:255',
            'name_es' => 'nullable|string|max:255',
            'name_de' => 'nullable|string|max:255',
            'name_pt' => 'nullable|string|max:255',
            'name_ru' => 'nullable|string|max:255',
            'name_zh' => 'nullable|string|max:255',
            'name_ar' => 'nullable|string|max:255',
            'name_hi' => 'nullable|string|max:255',
            'slug' => 'sometimes|required|string|max:255|unique:expat_domains,slug,' . $id,
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:7',
            'is_active' => 'nullable|boolean',
        ]);

        $domain->update($validated);

        return response()->json([
            'success' => true,
            'data' => $domain,
            'message' => 'Domaine mis à jour avec succès',
        ]);
    }

    /**
     * Supprimer un domaine
     */
    public function destroy(int $id): JsonResponse
    {
        $domain = ExpatDomain::findOrFail($id);
        $domain->delete();

        return response()->json([
            'success' => true,
            'message' => 'Domaine supprimé avec succès',
        ]);
    }
}