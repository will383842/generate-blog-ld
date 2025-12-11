<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Api\ArticleController;
use App\Http\Controllers\Api\GenerationController;
use App\Http\Controllers\Api\QueueController;
use App\Http\Controllers\Api\PlatformKnowledgeController;
use App\Http\Controllers\Api\BrandValidationController;
use App\Http\Controllers\Api\QualityController;
use App\Http\Controllers\Api\GoldenExamplesController;
use App\Http\Controllers\Api\FeedbackController;
use App\Http\Controllers\Api\PillarController;
use App\Http\Controllers\Api\PressReleaseController;
use App\Http\Controllers\Api\DossierController;
use App\Http\Controllers\Api\ManualTitleController;
use App\Http\Controllers\Api\KnowledgeController;
use App\Http\Controllers\Api\ExportApiController;
use App\Http\Controllers\Api\ResearchController;
use App\Http\Controllers\Api\MonitoringController;
use App\Http\Controllers\Api\ProgramController;
use App\Http\Controllers\Api\PresetController;
use App\Http\Controllers\Api\PublicationQueueController;
use App\Http\Controllers\Api\IndexingQueueController;
use App\Http\Controllers\Api\AutomationSettingsController;
use App\Http\Controllers\Api\SeoController;
use Illuminate\Support\Facades\Route;

// =========================================================================
// PUBLIC ROUTES (no auth required)
// =========================================================================

// Login avec rate limiting contre brute force (5 tentatives par minute)
Route::post('/admin/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1');

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'version' => '10.0',
        'timestamp' => now()->toIso8601String(),
    ]);
});

// =========================================================================
// ROUTES ADMIN AUTHENTIFIÉES
// Toutes les routes sous /api/admin/...
// =========================================================================
Route::middleware(['auth:sanctum', 'admin.auth'])->prefix('admin')->group(function () {

    // =====================================================================
    // AUTH ROUTES
    // =====================================================================
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // =====================================================================
    // ARTICLES
    // =====================================================================
    Route::prefix('articles')->group(function () {
        // Lecture - tous les utilisateurs actifs
        Route::get('/', [ArticleController::class, 'index']);
        Route::get('/stats', [ArticleController::class, 'stats']);
        Route::get('/{id}', [ArticleController::class, 'show']);
        Route::get('/{id}/versions', [ArticleController::class, 'versions']);
        Route::get('/{id}/missing-translations', [\App\Http\Controllers\Api\TranslationController::class, 'missing']);

        // Création/Modification - admin+
        Route::middleware('admin.auth:admin')->group(function () {
            Route::post('/', [ArticleController::class, 'store'])->middleware('throttle:30,1');
            Route::put('/{id}', [ArticleController::class, 'update']);
            Route::post('/{id}/publish', [ArticleController::class, 'publish']);
            Route::post('/{id}/unpublish', [ArticleController::class, 'unpublish']);
            Route::post('/{id}/duplicate', [ArticleController::class, 'duplicate'])->middleware('throttle:10,1');
            Route::post('/{id}/versions/{versionId}/restore', [ArticleController::class, 'restoreVersion']);
            Route::post('/bulk-publish', [ArticleController::class, 'bulkPublish']);
            Route::middleware('throttle:100,1')->group(function () {
                Route::post('/{id}/translate', [\App\Http\Controllers\Api\TranslationController::class, 'translate']);
                Route::post('/{id}/translate-all', [\App\Http\Controllers\Api\TranslationController::class, 'translateAll']);
            });
        });

        // Suppression - super_admin uniquement
        Route::delete('/{id}', [ArticleController::class, 'destroy'])->middleware('admin.auth:super_admin');
        Route::delete('/bulk-delete', [ArticleController::class, 'bulkDelete'])->middleware('admin.auth:super_admin');
    });

    // =====================================================================
    // LANDINGS
    // =====================================================================
    Route::prefix('landings')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\LandingController::class, 'index']);
        Route::get('/{id}', [\App\Http\Controllers\Api\LandingController::class, 'show']);
        Route::post('/generate', [\App\Http\Controllers\Api\LandingController::class, 'generate'])->middleware('admin.auth:admin');
    });

    // =====================================================================
    // COMPARATIVES
    // =====================================================================
    Route::prefix('comparatives')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\ComparativeController::class, 'index']);
        Route::get('/{id}', [\App\Http\Controllers\Api\ComparativeController::class, 'show']);
        Route::middleware('admin.auth:admin')->group(function () {
            Route::post('/generate', [\App\Http\Controllers\Api\ComparativeController::class, 'generate']);
            Route::put('/{id}', [\App\Http\Controllers\Api\ComparativeController::class, 'update']);
            Route::post('/{id}/publish', [\App\Http\Controllers\Api\ComparativeController::class, 'publish']);
        });
        Route::delete('/{id}', [\App\Http\Controllers\Api\ComparativeController::class, 'destroy'])->middleware('admin.auth:super_admin');
    });

    // =====================================================================
    // PRESS RELEASES
    // =====================================================================
    Route::prefix('press-releases')->group(function () {
        Route::get('/', [PressReleaseController::class, 'index']);
        Route::get('/{id}', [PressReleaseController::class, 'show']);
        Route::middleware('admin.auth:admin')->group(function () {
            Route::post('/', [PressReleaseController::class, 'store']);
            Route::put('/{id}', [PressReleaseController::class, 'update']);
            Route::post('/{id}/publish', [PressReleaseController::class, 'publish']);
        });
        Route::delete('/{id}', [PressReleaseController::class, 'destroy'])->middleware('admin.auth:super_admin');
    });

    // =====================================================================
    // GENERATION
    // =====================================================================
    Route::prefix('generation')->group(function () {
        Route::get('/', [GenerationController::class, 'index']);
        Route::get('/history', [GenerationController::class, 'history']);
        Route::get('/{id}', [GenerationController::class, 'show']);

        Route::middleware('admin.auth:admin')->group(function () {
            Route::post('/quick', [GenerationController::class, 'quick'])->middleware('throttle:20,1');
            Route::post('/batch', [\App\Http\Controllers\Api\BatchController::class, 'create'])->middleware('throttle:10,1');
            Route::post('/{id}/retry', [GenerationController::class, 'retry']);
            Route::post('/{id}/cancel', [GenerationController::class, 'cancel']);
        });
    });

    // =====================================================================
    // PROGRAMS (Automatisation)
    // =====================================================================
    Route::prefix('programs')->group(function () {
        Route::get('/', [ProgramController::class, 'index']);
        Route::get('/{id}', [ProgramController::class, 'show']);
        Route::get('/{id}/history', [ProgramController::class, 'history']);

        Route::middleware('admin.auth:admin')->group(function () {
            Route::post('/', [ProgramController::class, 'store']);
            Route::put('/{id}', [ProgramController::class, 'update']);
            Route::post('/{id}/start', [ProgramController::class, 'start']);
            Route::post('/{id}/stop', [ProgramController::class, 'stop']);
        });

        Route::delete('/{id}', [ProgramController::class, 'destroy'])->middleware('admin.auth:super_admin');
    });

    // =====================================================================
    // COVERAGE
    // =====================================================================
    Route::prefix('coverage')->group(function () {
        // Routes existantes (contrôleur réel)
        Route::get('/by-platform', [\App\Http\Controllers\Api\CoverageController::class, 'byPlatform']);
        Route::get('/by-country', [\App\Http\Controllers\Api\CoverageController::class, 'byCountry']);
        Route::get('/by-theme', [\App\Http\Controllers\Api\CoverageController::class, 'byTheme']);
        Route::get('/gaps', [\App\Http\Controllers\Api\CoverageController::class, 'gaps']);
        Route::get('/heatmap', [\App\Http\Controllers\Api\CoverageController::class, 'heatmap']);
        
        // Routes mock
        Route::get('/', function () {
            return response()->json([
                'success' => true,
                'data' => [
                    'total_countries' => 197,
                    'covered_countries' => 0,
                    'coverage_percentage' => 0,
                    'by_platform' => [],
                    'by_language' => [],
                    'gaps' => [],
                ],
            ]);
        });
        
        Route::get('/matrix', function () {
            return response()->json([
                'success' => true,
                'data' => [
                    'countries' => [],
                    'languages' => [],
                    'matrix' => [],
                ],
            ]);
        });
        
        Route::get('/languages', function () {
            return response()->json([
                'success' => true,
                'data' => [
                    ['code' => 'fr', 'name' => 'Français', 'coverage' => 0],
                    ['code' => 'en', 'name' => 'English', 'coverage' => 0],
                    ['code' => 'es', 'name' => 'Español', 'coverage' => 0],
                    ['code' => 'de', 'name' => 'Deutsch', 'coverage' => 0],
                    ['code' => 'it', 'name' => 'Italiano', 'coverage' => 0],
                    ['code' => 'pt', 'name' => 'Português', 'coverage' => 0],
                    ['code' => 'ar', 'name' => 'العربية', 'coverage' => 0],
                    ['code' => 'zh', 'name' => '中文', 'coverage' => 0],
                    ['code' => 'ja', 'name' => '日本語', 'coverage' => 0],
                ],
                'total' => 9,
            ]);
        });
        
        Route::get('/objectives', function () {
            return response()->json([
                'success' => true,
                'data' => [],
                'total' => 0,
                'completed' => 0,
                'in_progress' => 0,
                'pending' => 0,
            ]);
        });
        
        Route::get('/filters', function () {
            return response()->json([
                'success' => true,
                'data' => [
                    'countries' => [],
                    'languages' => [],
                    'platforms' => [],
                    'specialties' => [],
                ],
            ]);
        });
    });

    // =====================================================================
    // STATS
    // =====================================================================
    Route::prefix('stats')->group(function () {
        // Routes existantes (contrôleur réel)
        Route::get('/dashboard', [\App\Http\Controllers\Api\StatsController::class, 'dashboard']);
        Route::get('/costs', [\App\Http\Controllers\Api\StatsController::class, 'costs']);
        Route::get('/production', [\App\Http\Controllers\Api\StatsController::class, 'production']);
        Route::get('/quality', [\App\Http\Controllers\Api\StatsController::class, 'quality']);
        Route::get('/platform', [\App\Http\Controllers\Api\StatsController::class, 'platform']);
        
        // Route global corrigée
        Route::get('/global', function () {
            return response()->json([
                // Structure de génération
                'generation' => [
                    'processing' => 0,
                    'queued' => 0,
                    'completed_today' => 0,
                    'failed_today' => 0,
                ],
                
                // Structure de traduction
                'translation' => [
                    'processing' => 0,
                    'queued' => 0,
                    'completed_today' => 0,
                ],
                
                // Structure de publication
                'publishing' => [
                    'pending' => 0,
                    'publishing' => 0,
                    'published_today' => 0,
                ],
                
                // Alertes
                'alerts' => [],
                
                // Stats du jour
                'today' => [
                    'generated' => 0,
                    'published' => 0,
                    'targets' => [
                        'generated' => 100,
                        'published' => 100,
                    ],
                ],
                
                // Stats de la semaine
                'week' => [
                    'generated' => 0,
                    'published' => 0,
                ],
                
                // Stats du mois
                'month' => [
                    'generated' => 0,
                    'published' => 0,
                ],
                
                // Timestamp de dernière mise à jour
                'lastUpdated' => now()->toIso8601String(),
            ]);
        });
    });

    // =====================================================================
    // THEMES
    // =====================================================================
    Route::prefix('themes')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\ThemeController::class, 'index']);
        Route::get('/{id}', [\App\Http\Controllers\Api\ThemeController::class, 'show']);

        Route::middleware('admin.auth:admin')->group(function () {
            Route::post('/', [\App\Http\Controllers\Api\ThemeController::class, 'store']);
            Route::put('/{id}', [\App\Http\Controllers\Api\ThemeController::class, 'update']);
        });

        Route::delete('/{id}', [\App\Http\Controllers\Api\ThemeController::class, 'destroy'])->middleware('admin.auth:super_admin');
    });

    // =====================================================================
    // PROVIDER TYPES
    // =====================================================================
    Route::prefix('provider-types')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\ProviderTypeController::class, 'index']);
        Route::get('/{id}', [\App\Http\Controllers\Api\ProviderTypeController::class, 'show']);
    });

    // =====================================================================
    // AUTHORS
    // =====================================================================
    Route::prefix('authors')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\AuthorController::class, 'index']);
        Route::get('/{id}', [\App\Http\Controllers\Api\AuthorController::class, 'show']);

        Route::middleware('admin.auth:admin')->group(function () {
            Route::post('/', [\App\Http\Controllers\Api\AuthorController::class, 'store']);
            Route::put('/{id}', [\App\Http\Controllers\Api\AuthorController::class, 'update']);
        });

        Route::delete('/{id}', [\App\Http\Controllers\Api\AuthorController::class, 'destroy'])->middleware('admin.auth:super_admin');
    });

    // =====================================================================
    // AFFILIATES
    // =====================================================================
    Route::prefix('affiliates')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\AffiliateController::class, 'index']);
        Route::get('/{id}', [\App\Http\Controllers\Api\AffiliateController::class, 'show']);

        Route::middleware('admin.auth:admin')->group(function () {
            Route::post('/', [\App\Http\Controllers\Api\AffiliateController::class, 'store']);
            Route::put('/{id}', [\App\Http\Controllers\Api\AffiliateController::class, 'update']);
        });

        Route::delete('/{id}', [\App\Http\Controllers\Api\AffiliateController::class, 'destroy'])->middleware('admin.auth:super_admin');
    });

    // =====================================================================
    // PLATFORMS
    // =====================================================================
    Route::prefix('platforms')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\PlatformController::class, 'index']);
        Route::get('/{id}', [\App\Http\Controllers\Api\PlatformController::class, 'show']);
    });

    // =====================================================================
    // COUNTRIES
    // =====================================================================
    Route::prefix('countries')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\CountryController::class, 'index']);
        Route::get('/{id}', [\App\Http\Controllers\Api\CountryController::class, 'show']);
    });

    // =====================================================================
    // LANGUAGES
    // =====================================================================
    Route::prefix('languages')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\LanguageController::class, 'index']);
        Route::get('/{id}', [\App\Http\Controllers\Api\LanguageController::class, 'show']);
    });

    // =====================================================================
    // QUEUE
    // =====================================================================
    Route::prefix('queue')->group(function () {
        Route::get('/', [QueueController::class, 'index']);
        Route::get('/stats', [QueueController::class, 'stats']);
        Route::middleware('admin.auth:admin')->group(function () {
            Route::post('/{id}/retry', [QueueController::class, 'retry']);
            Route::post('/{id}/cancel', [QueueController::class, 'cancel']);
            Route::post('/clear-failed', [QueueController::class, 'clearFailed']);
        });
    });

    // =====================================================================
    // PUBLICATION QUEUE
    // =====================================================================
    Route::prefix('publication-queue')->group(function () {
        Route::get('/', [PublicationQueueController::class, 'index']);
        Route::get('/stats', [PublicationQueueController::class, 'stats']);
        Route::middleware('admin.auth:admin')->group(function () {
            Route::post('/', [PublicationQueueController::class, 'store']);
            Route::post('/{id}/publish-now', [PublicationQueueController::class, 'publishNow']);
            Route::put('/{id}', [PublicationQueueController::class, 'update']);
            Route::delete('/{id}', [PublicationQueueController::class, 'destroy']);
        });
    });

    // =====================================================================
    // INDEXING QUEUE
    // =====================================================================
    Route::prefix('indexing-queue')->group(function () {
        Route::get('/', [IndexingQueueController::class, 'index']);
        Route::get('/stats', [IndexingQueueController::class, 'stats']);
        Route::middleware('admin.auth:admin')->group(function () {
            Route::post('/', [IndexingQueueController::class, 'store']);
            Route::post('/{id}/retry', [IndexingQueueController::class, 'retry']);
        });
    });

    // =====================================================================
    // PILLARS
    // =====================================================================
    Route::prefix('pillars')->group(function () {
        Route::get('/', [PillarController::class, 'index']);
        Route::get('/{id}', [PillarController::class, 'show']);
        Route::middleware('admin.auth:admin')->group(function () {
            Route::post('/', [PillarController::class, 'store']);
            Route::put('/{id}', [PillarController::class, 'update']);
        });
        Route::delete('/{id}', [PillarController::class, 'destroy'])->middleware('admin.auth:super_admin');
    });

    // =====================================================================
    // MANUAL TITLES
    // =====================================================================
    Route::prefix('manual-titles')->group(function () {
        Route::get('/', [ManualTitleController::class, 'index']);
        Route::middleware('admin.auth:admin')->group(function () {
            Route::post('/', [ManualTitleController::class, 'store']);
            Route::post('/generate', [ManualTitleController::class, 'generate']);
        });
    });

    // =====================================================================
    // DOSSIERS
    // =====================================================================
    Route::prefix('dossiers')->group(function () {
        Route::get('/', [DossierController::class, 'index']);
        Route::get('/{id}', [DossierController::class, 'show']);
        Route::middleware('admin.auth:admin')->group(function () {
            Route::post('/', [DossierController::class, 'store']);
            Route::put('/{id}', [DossierController::class, 'update']);
        });
        Route::delete('/{id}', [DossierController::class, 'destroy'])->middleware('admin.auth:super_admin');
    });

    // =====================================================================
    // QUALITY
    // =====================================================================
    Route::prefix('quality')->group(function () {
        Route::get('/check', [QualityController::class, 'check']);
        Route::get('/{id}/history', [QualityController::class, 'history']);
    });

    // =====================================================================
    // GOLDEN EXAMPLES
    // =====================================================================
    Route::prefix('golden-examples')->group(function () {
        Route::get('/', [GoldenExamplesController::class, 'index']);
        Route::get('/{id}', [GoldenExamplesController::class, 'show']);
        Route::middleware('admin.auth:admin')->group(function () {
            Route::post('/', [GoldenExamplesController::class, 'store']);
            Route::post('/{id}/evaluate', [GoldenExamplesController::class, 'evaluate']);
        });
    });

    // =====================================================================
    // BRAND VALIDATION
    // =====================================================================
    Route::prefix('brand-validation')->group(function () {
        Route::post('/check', [BrandValidationController::class, 'check']);
        Route::get('/guidelines', [BrandValidationController::class, 'guidelines']);
    });

    // =====================================================================
    // FEEDBACK
    // =====================================================================
    Route::prefix('feedback')->group(function () {
        Route::get('/', [FeedbackController::class, 'index']);
        Route::post('/', [FeedbackController::class, 'store']);
    });

    // =====================================================================
    // PLATFORM KNOWLEDGE
    // =====================================================================
    Route::prefix('platform-knowledge')->group(function () {
        Route::get('/', [PlatformKnowledgeController::class, 'index']);
        Route::get('/{id}', [PlatformKnowledgeController::class, 'show']);
        Route::middleware('admin.auth:admin')->group(function () {
            Route::post('/', [PlatformKnowledgeController::class, 'store']);
            Route::put('/{id}', [PlatformKnowledgeController::class, 'update']);
        });
    });

    // =====================================================================
    // MONITORING
    // =====================================================================
    Route::prefix('monitoring')->group(function () {
        Route::get('/overview', [MonitoringController::class, 'overview']);
        Route::get('/realtime', [MonitoringController::class, 'realtime']);
        
        // Live Monitoring Routes (Phase 30)
        Route::prefix('live')->group(function () {
            Route::get('/overview', [MonitoringController::class, 'liveOverview']);
            Route::get('/generation', [MonitoringController::class, 'liveGeneration']);
            Route::get('/translation', [MonitoringController::class, 'liveTranslation']);
            Route::get('/publishing', [MonitoringController::class, 'livePublishing']);
            Route::get('/indexing', [MonitoringController::class, 'liveIndexing']);
            Route::get('/alerts', [MonitoringController::class, 'liveAlerts']);
        });
    });

    // =====================================================================
    // RESEARCH
    // =====================================================================
    Route::prefix('research')->group(function () {
        Route::get('/', [ResearchController::class, 'index']);
        Route::middleware('admin.auth:admin')->group(function () {
            Route::post('/search', [ResearchController::class, 'search']);
        });
    });

    // =====================================================================
    // PRESETS
    // =====================================================================
    Route::prefix('presets')->group(function () {
        Route::get('/', [PresetController::class, 'index']);
        Route::get('/{id}', [PresetController::class, 'show']);
        Route::middleware('admin.auth:admin')->group(function () {
            Route::post('/', [PresetController::class, 'store']);
            Route::put('/{id}', [PresetController::class, 'update']);
        });
        Route::delete('/{id}', [PresetController::class, 'destroy'])->middleware('admin.auth:super_admin');
    });

    // =====================================================================
    // EXPORT
    // =====================================================================
    Route::prefix('export')->group(function () {
        Route::get('/articles', [ExportApiController::class, 'articles']);
        Route::get('/stats', [ExportApiController::class, 'stats']);
        Route::get('/coverage', [ExportApiController::class, 'coverage']);
    });

    // =====================================================================
    // SETTINGS
    // =====================================================================
    Route::prefix('settings')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\SettingsController::class, 'index']);
        Route::middleware('admin.auth:admin')->group(function () {
            Route::put('/', [\App\Http\Controllers\Api\SettingsController::class, 'update']);
        });
    });

    // =====================================================================
    // AUTOMATION SETTINGS
    // =====================================================================
    Route::prefix('automation-settings')->group(function () {
        Route::get('/', [AutomationSettingsController::class, 'index']);
        Route::middleware('admin.auth:admin')->group(function () {
            Route::put('/', [AutomationSettingsController::class, 'update']);
            Route::post('/enable', [AutomationSettingsController::class, 'enable']);
            Route::post('/enable-full', [AutomationSettingsController::class, 'enableFull']);
            Route::post('/disable', [AutomationSettingsController::class, 'disable']);
            Route::post('/reset', [AutomationSettingsController::class, 'reset']);
            Route::get('/env-info', [AutomationSettingsController::class, 'envInfo']);
        });
    });

    // =====================================================================
    // MEDIA & ASSETS
    // =====================================================================
    Route::prefix('media')->group(function () {
        // Liste des médias avec pagination
        Route::get('/', function (Illuminate\Http\Request $request) {
            return response()->json([
                'success' => true,
                'data' => [],
                'total' => 0,
                'current_page' => (int)$request->get('page', 1),
                'per_page' => (int)$request->get('per_page', 24),
                'last_page' => 1,
            ]);
        });
        
        // Statistiques
        Route::get('/stats', function () {
            return response()->json([
                'success' => true,
                'data' => [
                    'total' => 0,
                    'by_type' => [
                        'image' => 0,
                        'video' => 0,
                        'document' => 0,
                        'audio' => 0,
                    ],
                    'total_size' => 0,
                    'recent_uploads' => 0,
                ],
            ]);
        });
        
        // Folders
        Route::get('/folders', function () {
            return response()->json([
                'success' => true,
                'data' => [
                    ['id' => 1, 'name' => 'Images', 'count' => 0],
                    ['id' => 2, 'name' => 'Documents', 'count' => 0],
                ],
            ]);
        });
        
        // Détails d'un média
        Route::get('/{id}', function ($id) {
            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $id,
                    'name' => 'Placeholder',
                    'type' => 'image',
                    'url' => '/placeholder.jpg',
                    'size' => 0,
                ],
            ]);
        });
        
        // Routes d'upload/modification (admin only)
        Route::middleware('admin.auth:admin')->group(function () {
            Route::post('/', function () {
                return response()->json([
                    'success' => false,
                    'message' => 'Upload endpoint not implemented yet',
                ], 501);
            });
            
            Route::put('/{id}', function ($id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Update endpoint not implemented yet',
                ], 501);
            });
            
            Route::delete('/{id}', function ($id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Delete endpoint not implemented yet',
                ], 501);
            });
        });
    });

    // =====================================================================
    // CONTENT TEMPLATES (include from separate file)
    // =====================================================================
    require __DIR__ . '/content-templates.php';

    // =====================================================================
    // LINKING (include from separate file)
    // =====================================================================
    require __DIR__ . '/linking.php';

    // =====================================================================
    // INTELLIGENT COVERAGE
    // =====================================================================
    Route::prefix('coverage/intelligent')->group(function () {
        Route::get('/dashboard', [\App\Http\Controllers\Api\IntelligentCoverageController::class, 'dashboard']);
        Route::get('/countries', [\App\Http\Controllers\Api\IntelligentCoverageController::class, 'countries']);
        Route::get('/countries/{countryId}', [\App\Http\Controllers\Api\IntelligentCoverageController::class, 'countryDetails']);
        Route::get('/countries/{countryId}/recruitment', [\App\Http\Controllers\Api\IntelligentCoverageController::class, 'countryRecruitment']);
        Route::get('/countries/{countryId}/awareness', [\App\Http\Controllers\Api\IntelligentCoverageController::class, 'countryAwareness']);
        Route::get('/countries/{countryId}/founder', [\App\Http\Controllers\Api\IntelligentCoverageController::class, 'countryFounder']);
        Route::get('/founder', [\App\Http\Controllers\Api\IntelligentCoverageController::class, 'founderGlobal']);
        Route::get('/languages', [\App\Http\Controllers\Api\IntelligentCoverageController::class, 'languages']);
        Route::get('/specialties', [\App\Http\Controllers\Api\IntelligentCoverageController::class, 'specialties']);
        Route::get('/recommendations', [\App\Http\Controllers\Api\IntelligentCoverageController::class, 'recommendations']);
        Route::get('/matrix', [\App\Http\Controllers\Api\IntelligentCoverageController::class, 'matrix']);

        Route::middleware('admin.auth:admin')->group(function () {
            Route::post('/generate', [\App\Http\Controllers\Api\IntelligentCoverageController::class, 'generate']);
            Route::get('/export', [\App\Http\Controllers\Api\IntelligentCoverageController::class, 'export']);
            Route::post('/invalidate-cache', [\App\Http\Controllers\Api\IntelligentCoverageController::class, 'invalidateCache']);
        });
    });

    // =====================================================================
    // SEO MODULE
    // =====================================================================
    Route::prefix('seo')->group(function () {
        // Dashboard
        Route::get('/dashboard', [SeoController::class, 'dashboard']);

        // Schema Markup
        Route::prefix('schema')->group(function () {
            Route::get('/templates', [SeoController::class, 'schemaTemplates']);
            Route::get('/article/{articleId}', [SeoController::class, 'articleSchema']);
            Route::post('/generate', [SeoController::class, 'generateSchema']);
            Route::post('/validate', [SeoController::class, 'validateSchema']);
            Route::put('/article/{articleId}', [SeoController::class, 'articleSchema']);
        });

        // Redirects
        Route::prefix('redirects')->group(function () {
            Route::get('/', [SeoController::class, 'redirects']);
            Route::get('/stats', [SeoController::class, 'redirectStats']);
            Route::middleware('admin.auth:admin')->group(function () {
                Route::post('/', [SeoController::class, 'createRedirect']);
                Route::put('/{id}', [SeoController::class, 'updateRedirect']);
                Route::delete('/{id}', [SeoController::class, 'deleteRedirect']);
            });
        });

        // Maillage (Internal Linking)
        Route::prefix('maillage')->group(function () {
            Route::get('/stats', [SeoController::class, 'maillageStats']);
            Route::get('/links', [SeoController::class, 'maillageLinks']);
            Route::get('/opportunities', [SeoController::class, 'linkOpportunities']);
        });

        // Technical SEO
        Route::prefix('technical')->group(function () {
            Route::get('/', [SeoController::class, 'technicalData']);
            Route::get('/issues', [SeoController::class, 'technicalIssues']);
        });

        // Indexing
        Route::prefix('indexing')->group(function () {
            Route::get('/stats', [SeoController::class, 'indexingStats']);
            Route::get('/queue', [SeoController::class, 'indexingQueue']);
            Route::get('/not-indexed', [SeoController::class, 'notIndexedArticles']);
        });
    });
});