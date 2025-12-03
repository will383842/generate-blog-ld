<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Theme;

class ThemeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Theme::query();

        if ($request->has('search')) {
            $query->where('name', 'LIKE', '%' . $request->search . '%');
        }

        $themes = $request->has('paginate') && $request->paginate === 'false'
            ? $query->get()
            : $query->paginate($request->get('per_page', 50));

        return response()->json([
            'success' => true,
            'data' => $themes,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $theme = Theme::findOrFail($id);
        
        return response()->json([
            'success' => true,
            'data' => $theme,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:themes,slug',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:7',
            'is_active' => 'nullable|boolean',
        ]);

        $theme = Theme::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Thème créé avec succès',
            'data' => $theme,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $theme = Theme::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255|unique:themes,slug,' . $id,
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:7',
            'is_active' => 'nullable|boolean',
        ]);

        $theme->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Thème modifié avec succès',
            'data' => $theme,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $theme = Theme::findOrFail($id);
        $theme->delete();

        return response()->json([
            'success' => true,
            'message' => 'Thème supprimé avec succès',
        ]);
    }
}

/**
 * ProviderTypeController - Gestion des types de prestataires
 */