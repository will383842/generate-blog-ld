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

// NOUVEAUX CONTROLLERS
use App\Http\Controllers\Api\Admin\WorkersController;
use App\Http\Controllers\Api\Analytics\AnalyticsController;
use App\Http\Controllers\Api\Coverage\CoverageController;
use App\Http\Controllers\Api\Live\LiveController;
use App\Http\Controllers\Api\Press\PressController;
use App\Http\Controllers\Api\Profile\ProfileController;
use App\Http\Controllers\Api\Settings\SettingsController;

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
    // WORKERS (NOUVEAU)
    // =====================================================================
    Route::get('/workers', [WorkersController::class, 'index']);
    Route::post('/workers/stop-all', [WorkersController::class, 'stopAll']);
    Route::post('/workers/start-all', [WorkersController::class, 'startAll']);

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
    // QUEUE
    // =====================================================================
    Route::prefix('queue')->group(function () {
        Route::get('/', [QueueController::class, 'index']);
        Route::get('/stats', [QueueController::class, 'stats']);
        Route::get('/{id}', [QueueController::class, 'show']);

        Route::middleware('admin.auth:admin')->group(function () {
            Route::post('/{id}/retry', [QueueController::class, 'retry']);
            Route::post('/{id}/cancel', [QueueController::class, 'cancel']);
            Route::delete('/{id}', [QueueController::class, 'destroy']);
        });
    });

    // =====================================================================
    // PILLAR ARTICLES
    // =====================================================================
    Route::prefix('pillars')->group(function () {
        Route::get('/', [PillarController::class, 'index']);
        Route::get('/{id}', [PillarController::class, 'show']);

        Route::middleware('admin.auth:admin')->group(function () {
            Route::post('/', [PillarController::class, 'store'])->middleware('throttle:10,1');
            Route::put('/{id}', [PillarController::class, 'update']);
            Route::post('/{id}/link-articles', [PillarController::class, 'linkArticles']);
        });
    });

    // =====================================================================
    // DOSSIERS DE PRESSE
    // =====================================================================
    Route::prefix('dossiers')->group(function () {
        Route::get('/', [DossierController::class, 'index']);
        Route::get('/{id}', [DossierController::class, 'show']);

        Route::middleware('admin.auth:admin')->group(function () {
            Route::post('/', [DossierController::class, 'store']);
            Route::put('/{id}', [DossierController::class, 'update']);
            Route::post('/{id}/publish', [DossierController::class, 'publish']);
        });
    });

    // =====================================================================
    // QUALITY CHECK
    // =====================================================================
    Route::prefix('quality')->group(function () {
        Route::post('/check', [QualityController::class, 'check']);
        Route::post('/batch-check', [QualityController::class, 'batchCheck']);
        Route::get('/stats', [QualityController::class, 'stats']);
    });

    // =====================================================================
    // BRAND VALIDATION
    // =====================================================================
    Route::prefix('brand')->group(function () {
        Route::post('/validate', [BrandValidationController::class, 'validate']);
        Route::get('/guidelines', [BrandValidationController::class, 'guidelines']);
    });

    // =====================================================================
    // GOLDEN EXAMPLES (Apprentissage)
    // =====================================================================
    Route::prefix('golden-examples')->group(function () {
        Route::get('/', [GoldenExamplesController::class, 'index']);
        Route::get('/{id}', [GoldenExamplesController::class, 'show']);

        Route::middleware('admin.auth:admin')->group(function () {
            Route::post('/', [GoldenExamplesController::class, 'store']);
            Route::put('/{id}', [GoldenExamplesController::class, 'update']);
            Route::delete('/{id}', [GoldenExamplesController::class, 'destroy']);
        });
    });

    // =====================================================================
    // FEEDBACK
    // =====================================================================
    Route::post('/feedback', [FeedbackController::class, 'store']);
    Route::get('/feedback', [FeedbackController::class, 'index'])->middleware('admin.auth:admin');

    // =====================================================================
    // PLATFORM KNOWLEDGE
    // =====================================================================
    Route::prefix('platform-knowledge')->group(function () {
        Route::get('/', [PlatformKnowledgeController::class, 'index']);
        Route::get('/{platformId}', [PlatformKnowledgeController::class, 'show']);

        Route::middleware('admin.auth:admin')->group(function () {
            Route::put('/{platformId}', [PlatformKnowledgeController::class, 'update']);
        });
    });

    // =====================================================================
    // MANUAL TITLES
    // =====================================================================
    Route::prefix('manual-titles')->group(function () {
        Route::get('/', [ManualTitleController::class, 'index']);

        Route::middleware('admin.auth:admin')->group(function () {
            Route::post('/', [ManualTitleController::class, 'store']);
            Route::put('/{id}', [ManualTitleController::class, 'update']);
            Route::delete('/{id}', [ManualTitleController::class, 'destroy']);
        });
    });

    // =====================================================================
    // KNOWLEDGE BASE
    // =====================================================================
    Route::prefix('knowledge')->group(function () {
        Route::get('/', [KnowledgeController::class, 'index']);
        Route::get('/{id}', [KnowledgeController::class, 'show']);

        Route::middleware('admin.auth:admin')->group(function () {
            Route::post('/', [KnowledgeController::class, 'store']);
            Route::put('/{id}', [KnowledgeController::class, 'update']);
            Route::delete('/{id}', [KnowledgeController::class, 'destroy']);
        });
    });

    // =====================================================================
    // EXPORT
    // =====================================================================
    Route::prefix('export')->group(function () {
        Route::get('/configs', [ExportApiController::class, 'configs']);
        Route::get('/configs/{id}', [ExportApiController::class, 'showConfig']);
        Route::post('/configs', [ExportApiController::class, 'createConfig'])->middleware('admin.auth:admin');
        Route::post('/export', [ExportApiController::class, 'export'])->middleware('admin.auth:admin');
        Route::get('/history', [ExportApiController::class, 'history']);
    });

    // =====================================================================
    // RESEARCH
    // =====================================================================
    Route::prefix('research')->group(function () {
        Route::post('/search', [ResearchController::class, 'search']);
        Route::get('/sources', [ResearchController::class, 'sources']);
    });

    // =====================================================================
    // MONITORING
    // =====================================================================
    Route::prefix('monitoring')->group(function () {
        Route::get('/costs', [MonitoringController::class, 'costs']);
        Route::get('/performance', [MonitoringController::class, 'performance']);
        Route::get('/usage', [MonitoringController::class, 'usage']);
        Route::get('/alerts', [MonitoringController::class, 'alerts']);
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
            Route::delete('/{id}', [PresetController::class, 'destroy']);
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
            Route::post('/{id}/publish', [PublicationQueueController::class, 'publish']);
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
            Route::post('/batch', [IndexingQueueController::class, 'batch']);
            Route::post('/{id}/submit', [IndexingQueueController::class, 'submit']);
        });
    });

    // =====================================================================
    // AUTOMATION SETTINGS
    // =====================================================================
    Route::prefix('automation')->group(function () {
        Route::get('/settings', [AutomationSettingsController::class, 'index']);

        Route::middleware('admin.auth:admin')->group(function () {
            Route::put('/settings', [AutomationSettingsController::class, 'update']);
        });
    });

    // =====================================================================
    // MEDIA (Placeholder routes)
    // =====================================================================
    Route::prefix('media')->group(function () {
        // Liste
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
    // COVERAGE FILTERS (NOUVEAU)
    // =====================================================================
    Route::prefix('coverage')->group(function () {
        Route::get('/filters', [CoverageController::class, 'filters']);
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

        // Schema - Articles without schema (NOUVEAU)
        Route::get('/articles-without-schema', [SeoController::class, 'articlesWithoutSchema']);
        Route::get('/schema-stats', [SeoController::class, 'schemaStats']);

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

    // =====================================================================
    // SETTINGS (NOUVEAU)
    // =====================================================================
    Route::prefix('settings')->group(function () {
        Route::get('/images', [SettingsController::class, 'imagesSettings']);
        Route::put('/images', [SettingsController::class, 'updateImagesSettings']);
    });

    // =====================================================================
    // ANALYTICS (NOUVEAU)
    // =====================================================================
    Route::prefix('analytics')->group(function () {
        Route::get('/benchmarks', [AnalyticsController::class, 'benchmarks']);
        Route::get('/top-performers', [AnalyticsController::class, 'topPerformers']);
        Route::get('/dashboard', [AnalyticsController::class, 'dashboard']);
        Route::get('/traffic', [AnalyticsController::class, 'traffic']);
        Route::get('/insights', [AnalyticsController::class, 'insights']);
        Route::get('/historical', [AnalyticsController::class, 'historical']);
    });

    // =====================================================================
    // LIVE MONITORING (NOUVEAU)
    // =====================================================================
    Route::prefix('live')->group(function () {
        Route::get('/generation', [LiveController::class, 'generation']);
    });

    // =====================================================================
    // PRESS ANALYTICS (NOUVEAU)
    // =====================================================================
    Route::prefix('press')->group(function () {
        Route::get('/analytics', [PressController::class, 'analytics']);
    });

    // =====================================================================
    // PROFILE (NOUVEAU)
    // =====================================================================
    Route::prefix('profile')->group(function () {
        Route::get('/sessions', [ProfileController::class, 'sessions']);
        Route::get('/login-history', [ProfileController::class, 'loginHistory']);
        Route::delete('/sessions/{sessionId}', [ProfileController::class, 'revokeSession']);
        Route::post('/sessions/revoke-all', [ProfileController::class, 'revokeAllSessions']);
    });
});
