<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LawyerSpecialty;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class LawyerSpecialtyController extends Controller
{
    /**
     * Liste des spécialités d'avocats
     */
    public function index(Request $request): JsonResponse
    {
        $query = LawyerSpecialty::query();

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

        $specialties = $request->has('paginate') && $request->paginate === 'false'
            ? $query->get()
            : $query->paginate($request->get('per_page', 50));

        return response()->json([
            'success' => true,
            'data' => $specialties,
        ]);
    }

    /**
     * Détail d'une spécialité
     */
    public function show(int $id): JsonResponse
    {
        $specialty = LawyerSpecialty::findOrFail($id);
        
        return response()->json([
            'success' => true,
            'data' => $specialty,
        ]);
    }

    /**
     * Créer une spécialité
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
            'slug' => 'required|string|max:255|unique:lawyer_specialties',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'is_active' => 'nullable|boolean',
        ]);

        $specialty = LawyerSpecialty::create($validated);

        return response()->json([
            'success' => true,
            'data' => $specialty,
            'message' => 'Spécialité créée avec succès',
        ], 201);
    }

    /**
     * Mettre à jour une spécialité
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $specialty = LawyerSpecialty::findOrFail($id);

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
            'slug' => 'sometimes|required|string|max:255|unique:lawyer_specialties,slug,' . $id,
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'is_active' => 'nullable|boolean',
        ]);

        $specialty->update($validated);

        return response()->json([
            'success' => true,
            'data' => $specialty,
            'message' => 'Spécialité mise à jour avec succès',
        ]);
    }

    /**
     * Supprimer une spécialité
     */
    public function destroy(int $id): JsonResponse
    {
        $specialty = LawyerSpecialty::findOrFail($id);
        $specialty->delete();

        return response()->json([
            'success' => true,
            'message' => 'Spécialité supprimée avec succès',
        ]);
    }
}