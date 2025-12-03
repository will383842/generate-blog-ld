<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\Article;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

/**
 * SettingsController - Gestion des paramètres
 */
class SettingsController extends Controller
{
    /**
     * Récupérer tous les paramètres
     * 
     * GET /api/settings
     */
    public function index(Request $request): JsonResponse
    {
        $query = Setting::query();

        if ($request->has('group')) {
            $query->where('group', $request->group);
        }

        $settings = $query->get();

        // Formatter en clé-valeur si demandé
        if ($request->get('format') === 'keyvalue') {
            $formatted = $settings->pluck('value', 'key')->toArray();
            
            return response()->json([
                'success' => true,
                'data' => $formatted,
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    /**
     * Récupérer un paramètre
     * 
     * GET /api/settings/{key}
     */
    public function show(string $key): JsonResponse
    {
        $setting = Setting::where('key', $key)->first();

        if (!$setting) {
            return response()->json([
                'success' => false,
                'message' => 'Paramètre non trouvé',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $setting,
        ]);
    }

    /**
     * Mettre à jour un paramètre
     * 
     * PUT /api/settings/{key}
     */
    public function update(Request $request, string $key): JsonResponse
    {
        $request->validate([
            'value' => 'required',
        ]);

        $setting = Setting::where('key', $key)->first();

        if (!$setting) {
            // Créer si n'existe pas
            $setting = Setting::create([
                'key' => $key,
                'value' => $request->value,
                'group' => $request->get('group', 'general'),
                'type' => $request->get('type', 'string'),
            ]);
        } else {
            $setting->update(['value' => $request->value]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Paramètre mis à jour avec succès',
            'data' => $setting,
        ]);
    }

    /**
     * Mettre à jour plusieurs paramètres
     * 
     * POST /api/settings/bulk-update
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        $request->validate([
            'settings' => 'required|array',
        ]);

        $updated = [];
        
        foreach ($request->settings as $key => $value) {
            $setting = Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
            
            $updated[] = $setting;
        }

        return response()->json([
            'success' => true,
            'message' => count($updated) . ' paramètres mis à jour',
            'data' => $updated,
        ]);
    }

    /**
     * Paramètres de publication
     * 
     * GET /api/settings/publication
     */
    public function publication(): JsonResponse
    {
        $settings = Setting::where('group', 'publication')->get()->pluck('value', 'key');

        return response()->json([
            'success' => true,
            'data' => [
                'max_per_day' => $settings['max_per_day'] ?? 100,
                'max_per_hour' => $settings['max_per_hour'] ?? 10,
                'interval_minutes' => $settings['interval_minutes'] ?? 5,
                'randomization_minutes' => $settings['randomization_minutes'] ?? 10,
                'start_hour' => $settings['start_hour'] ?? 8,
                'end_hour' => $settings['end_hour'] ?? 22,
                'weekend_publishing' => $settings['weekend_publishing'] ?? true,
            ],
        ]);
    }

    /**
     * Paramètres de landing pages
     * 
     * GET /api/settings/landing
     */
    public function landing(): JsonResponse
    {
        $settings = Setting::where('group', 'landing')->get()->pluck('value', 'key');

        return response()->json([
            'success' => true,
            'data' => [
                'sections_enabled' => json_decode($settings['sections_enabled'] ?? '{}', true),
                'default_sections' => [
                    'hero' => true,
                    'problem' => true,
                    'solution' => true,
                    'benefits' => true,
                    'how_it_works' => true,
                    'testimonials' => false,
                    'pricing' => false,
                    'faq' => true,
                    'cta_final' => true,
                ],
            ],
        ]);
    }

    /**
     * Paramètres de génération d'images
     * 
     * GET /api/settings/images
     */
    public function images(): JsonResponse
    {
        $settings = Setting::where('group', 'images')->get()->pluck('value', 'key');

        return response()->json([
            'success' => true,
            'data' => [
                'enabled' => $settings['enabled'] ?? true,
                'quality' => $settings['quality'] ?? 'standard',
                'size' => $settings['size'] ?? '1024x1024',
                'style' => $settings['style'] ?? 'natural',
                'percentage' => $settings['percentage'] ?? 50,
            ],
        ]);
    }
}
