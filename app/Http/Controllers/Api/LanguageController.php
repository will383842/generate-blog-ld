<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Language;

class LanguageController extends Controller
{
    public function index(): JsonResponse
    {
        $languages = Language::orderBy('name', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $languages,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $language = Language::findOrFail($id);
        
        return response()->json([
            'success' => true,
            'data' => $language,
        ]);
    }
}