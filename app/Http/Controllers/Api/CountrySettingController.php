<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CountrySetting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class CountrySettingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = CountrySetting::with(['country', 'platform']);
        
        if ($request->has('country_id')) {
            $query->where('country_id', $request->country_id);
        }
        if ($request->has('platform_id')) {
            $query->where('platform_id', $request->platform_id);
        }
        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $settings = $query->get();
        return response()->json(['success' => true, 'data' => $settings]);
    }

    public function show(int $id): JsonResponse
    {
        $setting = CountrySetting::with(['country', 'platform'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $setting]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'country_id' => 'required|exists:countries,id',
            'platform_id' => 'required|exists:platforms,id',
            'priority' => 'required|string|in:low,medium,high,critical',
            'is_active' => 'sometimes|boolean',
            'generation_frequency' => 'sometimes|string|in:daily,weekly,monthly,custom',
            'auto_publish' => 'sometimes|boolean',
            'seo_settings' => 'sometimes|array',
            'content_settings' => 'sometimes|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $setting = CountrySetting::create($validator->validated());
        return response()->json(['success' => true, 'data' => $setting, 'message' => 'Paramètre pays créé'], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $setting = CountrySetting::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'priority' => 'sometimes|required|string|in:low,medium,high,critical',
            'is_active' => 'sometimes|boolean',
            'generation_frequency' => 'sometimes|string|in:daily,weekly,monthly,custom',
            'auto_publish' => 'sometimes|boolean',
            'seo_settings' => 'sometimes|array',
            'content_settings' => 'sometimes|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $setting->update($validator->validated());
        return response()->json(['success' => true, 'data' => $setting, 'message' => 'Paramètre pays mis à jour']);
    }

    public function destroy(int $id): JsonResponse
    {
        $setting = CountrySetting::findOrFail($id);
        $setting->delete();
        return response()->json(['success' => true, 'message' => 'Paramètre pays supprimé']);
    }
}
