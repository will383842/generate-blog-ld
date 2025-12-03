<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\ProviderType;

class ProviderTypeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ProviderType::with('translations');

        if ($request->has('platform_id')) {
            $query->whereHas('platforms', fn($q) => $q->where('platform_id', $request->platform_id));
        }

        $types = $query->get();

        return response()->json([
            'success' => true,
            'data' => $types,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $type = ProviderType::with('translations')->findOrFail($id);
        
        return response()->json([
            'success' => true,
            'data' => $type,
        ]);
    }
}

/**
 * AuthorController - Gestion des auteurs
 */