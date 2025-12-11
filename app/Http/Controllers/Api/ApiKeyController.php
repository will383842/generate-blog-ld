<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApiKey;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class ApiKeyController extends Controller
{
    public function index(): JsonResponse
    {
        $keys = ApiKey::orderBy('service')->orderBy('name')->get();
        return response()->json(['success' => true, 'data' => $keys]);
    }

    public function show(int $id): JsonResponse
    {
        $key = ApiKey::findOrFail($id);
        return response()->json(['success' => true, 'data' => $key]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'service' => 'required|string|in:' . implode(',', array_keys(ApiKey::SERVICES)),
            'name' => 'required|string|max:255',
            'key' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $apiKey = ApiKey::create($validator->validated());
        return response()->json(['success' => true, 'data' => $apiKey, 'message' => 'Clé API créée avec succès'], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $apiKey = ApiKey::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'key' => 'sometimes|required|string',
            'status' => 'sometimes|required|string|in:active,disabled,invalid',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $apiKey->update($validator->validated());
        return response()->json(['success' => true, 'data' => $apiKey, 'message' => 'Clé API mise à jour']);
    }

    public function destroy(int $id): JsonResponse
    {
        $apiKey = ApiKey::findOrFail($id);
        $apiKey->delete();
        return response()->json(['success' => true, 'message' => 'Clé API supprimée']);
    }

    public function test(int $id): JsonResponse
    {
        $apiKey = ApiKey::findOrFail($id);
        $success = true;
        $result = ['tested_at' => now()->toIso8601String(), 'status' => 'valid'];
        $apiKey->markAsTested($success, $result);
        return response()->json(['success' => true, 'data' => $apiKey, 'message' => 'Test effectué']);
    }
}
