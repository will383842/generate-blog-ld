<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Author;

class AuthorController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $authors = Author::orderBy('name', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $authors,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $author = Author::findOrFail($id);
        
        return response()->json([
            'success' => true,
            'data' => $author,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:authors,slug',
            'email' => 'nullable|email',
            'bio' => 'nullable|string',
            'avatar' => 'nullable|url',
            'is_active' => 'nullable|boolean',
        ]);

        $author = Author::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Auteur créé avec succès',
            'data' => $author,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $author = Author::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255|unique:authors,slug,' . $id,
            'email' => 'nullable|email',
            'bio' => 'nullable|string',
            'avatar' => 'nullable|url',
            'is_active' => 'nullable|boolean',
        ]);

        $author->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Auteur modifié avec succès',
            'data' => $author,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $author = Author::findOrFail($id);
        $author->delete();

        return response()->json([
            'success' => true,
            'message' => 'Auteur supprimé avec succès',
        ]);
    }
}

/**
 * AffiliateController - Gestion des liens affiliés
 */