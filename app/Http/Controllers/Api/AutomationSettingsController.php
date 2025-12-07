<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;

/**
 * AutomationSettingsController - Gestion des paramètres d'automatisation
 */
class AutomationSettingsController extends Controller
{
    /**
     * Récupérer tous les paramètres d'automatisation
     *
     * GET /api/automation/settings
     */
    public function index(): JsonResponse
    {
        try {
            $settings = [
                'content' => [
                    'auto_translate' => config('content.auto_translate', true),
                    'auto_generate_image' => config('content.auto_generate_image', true),
                    'auto_publish' => config('content.auto_publish', false),
                    'quality_min_score' => config('content.quality.min_score', 70),
                ],
                'seo' => [
                    'auto_submission_enabled' => config('seo.auto_submission.enabled', true),
                    'on_publish' => config('seo.auto_submission.on_publish', true),
                    'on_update' => config('seo.auto_submission.on_update', false),
                    'use_google' => config('seo.auto_submission.use_google', true),
                    'use_bing' => config('seo.auto_submission.use_bing', true),
                    'use_indexnow' => config('seo.auto_submission.use_indexnow', false),
                ],
                'publishing' => [
                    'google_indexing_enabled' => config('seo.google_indexing_enabled', true),
                    'bing_submission_enabled' => config('seo.bing_submission_enabled', true),
                    'indexnow_enabled' => config('seo.indexnow_enabled', false),
                ],
            ];

            return response()->json([
                'success' => true,
                'data' => $settings,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des paramètres',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mettre à jour les paramètres d'automatisation
     *
     * PUT /api/automation/settings
     */
    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'auto_translate' => 'nullable|boolean',
            'auto_generate_image' => 'nullable|boolean',
            'auto_publish' => 'nullable|boolean',
            'quality_min_score' => 'nullable|integer|min:0|max:100',
            'auto_submission_enabled' => 'nullable|boolean',
            'on_publish' => 'nullable|boolean',
            'use_google' => 'nullable|boolean',
            'use_bing' => 'nullable|boolean',
            'use_indexnow' => 'nullable|boolean',
        ]);

        try {
            // Ces paramètres sont gérés via .env
            // On peut les stocker en cache pour override temporaire
            // ou les persister dans une table settings

            $updates = [];

            if ($request->has('auto_translate')) {
                $updates['content.auto_translate'] = $request->auto_translate;
            }

            if ($request->has('auto_generate_image')) {
                $updates['content.auto_generate_image'] = $request->auto_generate_image;
            }

            if ($request->has('auto_publish')) {
                $updates['content.auto_publish'] = $request->auto_publish;
            }

            if ($request->has('quality_min_score')) {
                $updates['content.quality.min_score'] = $request->quality_min_score;
            }

            if ($request->has('auto_submission_enabled')) {
                $updates['seo.auto_submission.enabled'] = $request->auto_submission_enabled;
            }

            if ($request->has('on_publish')) {
                $updates['seo.auto_submission.on_publish'] = $request->on_publish;
            }

            if ($request->has('use_google')) {
                $updates['seo.auto_submission.use_google'] = $request->use_google;
            }

            if ($request->has('use_bing')) {
                $updates['seo.auto_submission.use_bing'] = $request->use_bing;
            }

            if ($request->has('use_indexnow')) {
                $updates['seo.auto_submission.use_indexnow'] = $request->use_indexnow;
            }

            // Stocker en cache (ou dans une table settings)
            foreach ($updates as $key => $value) {
                Cache::forever("settings.{$key}", $value);
            }

            return response()->json([
                'success' => true,
                'message' => 'Paramètres mis à jour',
                'data' => $updates,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Statut de l'automatisation
     *
     * GET /api/automation/status
     */
    public function status(): JsonResponse
    {
        try {
            $status = [
                'pipeline' => [
                    'generation' => true,
                    'translation' => config('content.auto_translate', true),
                    'image' => config('content.auto_generate_image', true),
                    'publication' => config('content.auto_publish', false),
                    'indexation' => config('seo.auto_submission.enabled', true),
                ],
                'quality_gate' => [
                    'enabled' => true,
                    'min_score' => config('content.quality.min_score', 70),
                ],
                'services' => [
                    'google_indexing' => [
                        'enabled' => config('seo.google_indexing_enabled', true),
                        'configured' => !empty(config('seo.google_indexing_credentials')),
                    ],
                    'bing' => [
                        'enabled' => config('seo.bing_submission_enabled', true),
                        'configured' => !empty(config('seo.bing_api_key')),
                    ],
                    'indexnow' => [
                        'enabled' => config('seo.indexnow_enabled', false),
                        'configured' => !empty(config('seo.indexnow_key')),
                    ],
                ],
            ];

            // Vérifier si le pipeline complet est actif
            $status['full_automation'] =
                $status['pipeline']['translation'] &&
                $status['pipeline']['image'] &&
                $status['pipeline']['publication'] &&
                $status['pipeline']['indexation'];

            return response()->json([
                'success' => true,
                'data' => $status,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du statut',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Activer l'automatisation complète
     *
     * POST /api/automation/enable-full
     */
    public function enableFull(): JsonResponse
    {
        try {
            $settings = [
                'content.auto_translate' => true,
                'content.auto_generate_image' => true,
                'content.auto_publish' => true,
                'seo.auto_submission.enabled' => true,
                'seo.auto_submission.on_publish' => true,
            ];

            foreach ($settings as $key => $value) {
                Cache::forever("settings.{$key}", $value);
            }

            return response()->json([
                'success' => true,
                'message' => 'Automatisation complète activée',
                'warning' => 'Les articles avec quality_score >= ' . config('content.quality.min_score', 70) . ' seront automatiquement publiés',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'activation',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Désactiver l'automatisation (mode manuel)
     *
     * POST /api/automation/disable
     */
    public function disable(): JsonResponse
    {
        try {
            $settings = [
                'content.auto_translate' => false,
                'content.auto_generate_image' => false,
                'content.auto_publish' => false,
                'seo.auto_submission.enabled' => false,
            ];

            foreach ($settings as $key => $value) {
                Cache::forever("settings.{$key}", $value);
            }

            return response()->json([
                'success' => true,
                'message' => 'Automatisation désactivée - Mode manuel actif',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la désactivation',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Réinitialiser aux valeurs par défaut
     *
     * POST /api/automation/reset
     */
    public function reset(): JsonResponse
    {
        try {
            // Supprimer les overrides en cache
            $keys = [
                'settings.content.auto_translate',
                'settings.content.auto_generate_image',
                'settings.content.auto_publish',
                'settings.content.quality.min_score',
                'settings.seo.auto_submission.enabled',
                'settings.seo.auto_submission.on_publish',
                'settings.seo.auto_submission.use_google',
                'settings.seo.auto_submission.use_bing',
                'settings.seo.auto_submission.use_indexnow',
            ];

            foreach ($keys as $key) {
                Cache::forget($key);
            }

            // Vider le cache de config
            Artisan::call('config:clear');

            return response()->json([
                'success' => true,
                'message' => 'Paramètres réinitialisés aux valeurs par défaut (.env)',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la réinitialisation',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Variables .env requises
     *
     * GET /api/automation/env-info
     */
    public function envInfo(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'required_env_vars' => [
                    'CONTENT_AUTO_TRANSLATE' => [
                        'description' => 'Auto-traduction après génération',
                        'default' => 'true',
                        'current' => config('content.auto_translate') ? 'true' : 'false',
                    ],
                    'CONTENT_AUTO_IMAGE' => [
                        'description' => 'Auto-génération image après génération',
                        'default' => 'true',
                        'current' => config('content.auto_generate_image') ? 'true' : 'false',
                    ],
                    'CONTENT_AUTO_PUBLISH' => [
                        'description' => 'Auto-publication si quality_score suffisant',
                        'default' => 'false',
                        'current' => config('content.auto_publish') ? 'true' : 'false',
                    ],
                    'CONTENT_MIN_QUALITY_SCORE' => [
                        'description' => 'Score minimum pour auto-publication',
                        'default' => '70',
                        'current' => (string) config('content.quality.min_score', 70),
                    ],
                    'AUTO_SUBMIT_ENABLED' => [
                        'description' => 'Auto-soumission SEO après publication',
                        'default' => 'true',
                        'current' => config('seo.auto_submission.enabled') ? 'true' : 'false',
                    ],
                ],
                'pipeline' => [
                    'description' => 'Génération → Traduction → Image → Publication → Indexation',
                    'activation' => 'CONTENT_AUTO_PUBLISH=true et AUTO_SUBMIT_ENABLED=true',
                ],
            ],
        ]);
    }
}
