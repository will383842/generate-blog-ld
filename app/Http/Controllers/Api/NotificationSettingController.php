<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NotificationSetting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class NotificationSettingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = NotificationSetting::with('adminUser');
        
        if ($request->has('admin_user_id')) {
            $query->where('admin_user_id', $request->admin_user_id);
        }
        if ($request->has('channel')) {
            $query->where('channel', $request->channel);
        }
        if ($request->has('event_type')) {
            $query->where('event_type', $request->event_type);
        }
        if ($request->has('is_enabled')) {
            $query->where('is_enabled', $request->boolean('is_enabled'));
        }

        $settings = $query->get();
        return response()->json(['success' => true, 'data' => $settings]);
    }

    public function show(int $id): JsonResponse
    {
        $setting = NotificationSetting::with('adminUser')->findOrFail($id);
        return response()->json(['success' => true, 'data' => $setting]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'admin_user_id' => 'required|exists:admin_users,id',
            'channel' => 'required|string|in:email,slack,webhook,in_app',
            'event_type' => 'required|string',
            'is_enabled' => 'sometimes|boolean',
            'settings' => 'sometimes|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $setting = NotificationSetting::create($validator->validated());
        return response()->json(['success' => true, 'data' => $setting, 'message' => 'Notification créée'], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $setting = NotificationSetting::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'is_enabled' => 'sometimes|boolean',
            'settings' => 'sometimes|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $setting->update($validator->validated());
        return response()->json(['success' => true, 'data' => $setting, 'message' => 'Notification mise à jour']);
    }

    public function destroy(int $id): JsonResponse
    {
        $setting = NotificationSetting::findOrFail($id);
        $setting->delete();
        return response()->json(['success' => true, 'message' => 'Notification supprimée']);
    }
}
