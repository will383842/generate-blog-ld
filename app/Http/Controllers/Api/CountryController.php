<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Country;

class CountryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Country::query();

        if ($request->has('search')) {
            $query->where('name', 'LIKE', '%' . $request->search . '%');
        }

        $countries = $query->orderBy('name', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $countries,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $country = Country::with('languages')->findOrFail($id);
        
        return response()->json([
            'success' => true,
            'data' => $country,
        ]);
    }
}

/**
 * LanguageController - Liste des langues
 */