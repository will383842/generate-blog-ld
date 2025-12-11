<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PlatformSetting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class PlatformSettingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PlatformSetting::with('platform');
        
        if ($request->has('platform_id')) {
            $query->where('platform_id', $request->platform_id);
        }
        if ($request->has('key')) {
            $query->where('key', $request->key);
        }
        if ($request->has('is_public')) {
            $query->where('is_public', $request->boolean('is_public'));
        }

        $settings = $query->get();
        return response()->json(['success' => true, 'data' => $settings]);
    }

    public function show(int $id): JsonResponse
    {
        $setting = PlatformSetting::with('platform')->findOrFail($id);
        return response()->json(['success' => true, 'data' => $setting]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'platform_id' => 'required|exists:platforms,id',
            'key' => 'required|string|max:255',
            'value' => 'required|array',
            'type' => 'required|string|in:string,number,boolean,json,array',
            'description' => 'nullable|string',
            'is_public' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $setting = PlatformSetting::create($validator->validated());
        return response()->json(['success' => true, 'data' => $setting, 'message' => 'Paramètre créé'], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $setting = PlatformSetting::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'value' => 'sometimes|required|array',
            'description' => 'nullable|string',
            'is_public' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $setting->update($validator->validated());
        return response()->json(['success' => true, 'data' => $setting, 'message' => 'Paramètre mis à jour']);
    }

    public function destroy(int $id): JsonResponse
    {
        $setting = PlatformSetting::findOrFail($id);
        $setting->delete();
        return response()->json(['success' => true, 'message' => 'Paramètre supprimé']);
    }
}
