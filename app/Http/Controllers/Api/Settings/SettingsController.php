<?php

namespace App\Http\Controllers\Api\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SettingsController extends Controller
{
    public function imagesSettings(): JsonResponse
    {
        // Récupérer les settings depuis la base ou retourner des valeurs par défaut
        $settings = [
            'sources' => [
                ['id' => 'unsplash', 'name' => 'Unsplash', 'icon' => '📷', 'enabled' => true, 'priority' => 1],
                ['id' => 'dalle', 'name' => 'DALL-E', 'icon' => '🎨', 'enabled' => true, 'priority' => 2],
                ['id' => 'upload', 'name' => 'Upload manuel', 'icon' => '📤', 'enabled' => true, 'priority' => 3],
            ],
            'settings' => [
                'defaultSource' => 'unsplash',
                'dalle' => [
                    'style' => 'natural',
                    'size' => '1024x1024',
                    'quality' => 'standard',
                    'model' => 'dall-e-3',
                ],
                'unsplash' => [
                    'orientation' => 'landscape',
                    'color' => '',
                    'safeSearch' => true,
                ],
                'optimization' => [
                    'enabled' => true,
                    'maxWidth' => 1920,
                    'maxHeight' => 1080,
                    'quality' => 85,
                    'format' => 'webp',
                    'lazyLoading' => true,
                ],
                'attribution' => [
                    'enabled' => true,
                    'template' => 'Photo by {author} on {source}',
                    'position' => 'caption',
                ],
            ],
        ];

        return response()->json($settings);
    }

    public function updateImagesSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sources' => 'required|array',
            'settings' => 'required|array',
        ]);

        // Sauvegarder dans la base (implémenter selon votre structure)
        // Par exemple, dans une table settings avec des clés JSON
        
        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully',
        ]);
    }
}
