<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Platform;

class PlatformController extends Controller
{
    public function index(): JsonResponse
    {
        $platforms = Platform::all();

        return response()->json([
            'success' => true,
            'data' => $platforms,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $platform = Platform::findOrFail($id);
        
        return response()->json([
            'success' => true,
            'data' => $platform,
        ]);
    }
}

/**
 * TemplateController - Gestion des templates
 */