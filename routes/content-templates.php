<?php

/**
 * Routes API pour la gestion des Content Templates
 *
 * Inclus dans le groupe /api/admin/ de routes/api.php
 * Hérite du middleware auth:sanctum et admin.auth du groupe parent
 */

use App\Http\Controllers\Api\ContentTemplateController;

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT TEMPLATES
// Routes disponibles sous /api/admin/content-templates/...
// ═══════════════════════════════════════════════════════════════════════════════

Route::prefix('content-templates')->group(function () {
    // Routes publiques (lecture seule)
    Route::get('/constants', [ContentTemplateController::class, 'constants']);

    // Liste et recherche
    Route::get('/', [ContentTemplateController::class, 'index']);
    Route::get('/grouped', [ContentTemplateController::class, 'grouped']);
    Route::get('/stats', [ContentTemplateController::class, 'stats']);
    Route::get('/coverage/{type}', [ContentTemplateController::class, 'coverage']);

    // CRUD
    Route::get('/{id}', [ContentTemplateController::class, 'show'])->where('id', '[0-9]+');
    Route::get('/slug/{slug}', [ContentTemplateController::class, 'showBySlug']);

    // Actions nécessitant le rôle admin
    Route::middleware('admin.auth:admin')->group(function () {
        Route::post('/', [ContentTemplateController::class, 'store']);
        Route::put('/{id}', [ContentTemplateController::class, 'update']);
        Route::post('/{id}/duplicate', [ContentTemplateController::class, 'duplicate']);
        Route::post('/{id}/set-default', [ContentTemplateController::class, 'setDefault']);
        Route::post('/{id}/preview', [ContentTemplateController::class, 'preview']);

        // Versions
        Route::get('/{id}/versions', [ContentTemplateController::class, 'versions']);
        Route::post('/{id}/restore/{version}', [ContentTemplateController::class, 'restoreVersion']);

        // Import/Export
        Route::get('/{id}/export', [ContentTemplateController::class, 'export']);
        Route::post('/import', [ContentTemplateController::class, 'import']);

        // Cache
        Route::post('/clear-cache', [ContentTemplateController::class, 'clearCache']);
    });

    // Suppression - super_admin uniquement
    Route::delete('/{id}', [ContentTemplateController::class, 'destroy'])->middleware('admin.auth:super_admin');
});
