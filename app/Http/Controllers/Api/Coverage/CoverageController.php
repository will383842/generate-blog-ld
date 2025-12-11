<?php

namespace App\Http\Controllers\Api\Coverage;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class CoverageController extends Controller
{
    public function filters(): JsonResponse
    {
        // Retourner les filtres de couverture depuis la base
        $filters = [];
        
        return response()->json($filters);
    }
}
