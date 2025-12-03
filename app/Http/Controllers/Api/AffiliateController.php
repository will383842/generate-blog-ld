<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\AffiliateLink;

class AffiliateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AffiliateLink::query();

        if ($request->has('platform_id')) {
            $query->where('platform_id', $request->platform_id);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $links = $query->orderBy('priority', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $links,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $link = AffiliateLink::findOrFail($id);
        
        return response()->json([
            'success' => true,
            'data' => $link,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'platform_id' => 'required|integer|exists:platforms,id',
            'name' => 'required|string|max:255',
            'url' => 'required|url',
            'type' => 'required|in:product,service,partner',
            'priority' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $link = AffiliateLink::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Lien affilié créé avec succès',
            'data' => $link,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $link = AffiliateLink::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'url' => 'sometimes|url',
            'type' => 'sometimes|in:product,service,partner',
            'priority' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $link->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Lien affilié modifié avec succès',
            'data' => $link,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $link = AffiliateLink::findOrFail($id);
        $link->delete();

        return response()->json([
            'success' => true,
            'message' => 'Lien affilié supprimé avec succès',
        ]);
    }
}

/**
 * PlatformController - Gestion des plateformes
 */