<?php

use App\Http\Controllers\Api\ContentTemplateController;
use Illuminate\Support\Facades\Route;

/**
 * CONTENT TEMPLATES ROUTES
 * Routes pour la gestion des templates de contenu
 */

Route::prefix('content-templates')->group(function () {
    
    // =========================================================================
    // LECTURE (tous les utilisateurs actifs)
    // =========================================================================
    
    // Liste avec filtres et pagination
    Route::get('/', [ContentTemplateController::class, 'index']);
    
    // Templates groupés par catégorie
    Route::get('/grouped', [ContentTemplateController::class, 'grouped']);
    
    // Template par ID
    Route::get('/{id}', [ContentTemplateController::class, 'show'])
        ->where('id', '[0-9]+');
    
    // Template par slug
    Route::get('/slug/{slug}', [ContentTemplateController::class, 'showBySlug']);
    
    // Versions d'un template
    Route::get('/{id}/versions', [ContentTemplateController::class, 'versions'])
        ->where('id', '[0-9]+');
    
    // Statistiques globales
    Route::get('/stats', [ContentTemplateController::class, 'stats']);
    
    // Coverage par type
    Route::get('/coverage/{type}', [ContentTemplateController::class, 'coverage'])
        ->where('type', 'article|landing|comparative|press_release');
    
    // Constantes et variables disponibles
    Route::get('/constants', [ContentTemplateController::class, 'constants']);
    
    // =========================================================================
    // ÉCRITURE (admin et super_admin)
    // =========================================================================
    
    Route::middleware('admin.auth:admin')->group(function () {
        
        // Créer un template
        Route::post('/', [ContentTemplateController::class, 'store'])
            ->middleware('throttle:30,1');
        
        // Mettre à jour un template
        Route::put('/{id}', [ContentTemplateController::class, 'update'])
            ->where('id', '[0-9]+');
        
        // Dupliquer un template
        Route::post('/{id}/duplicate', [ContentTemplateController::class, 'duplicate'])
            ->where('id', '[0-9]+')
            ->middleware('throttle:10,1');
        
        // Définir comme template par défaut
        Route::post('/{id}/set-default', [ContentTemplateController::class, 'setDefault'])
            ->where('id', '[0-9]+');
        
        // Prévisualiser un template
        Route::post('/{id}/preview', [ContentTemplateController::class, 'preview'])
            ->where('id', '[0-9]+');
        
        // Restaurer une version
        Route::post('/{id}/versions/{version}/restore', [ContentTemplateController::class, 'restoreVersion'])
            ->where('id', '[0-9]+')
            ->where('version', '[0-9]+');
        
        // Exporter un template
        Route::get('/{id}/export', [ContentTemplateController::class, 'export'])
            ->where('id', '[0-9]+');
        
        // Importer un template
        Route::post('/import', [ContentTemplateController::class, 'import'])
            ->middleware('throttle:10,1');
        
        // Vider le cache des templates
        Route::post('/clear-cache', [ContentTemplateController::class, 'clearCache']);
    });
    
    // =========================================================================
    // SUPPRESSION (super_admin uniquement)
    // =========================================================================
    
    Route::middleware('admin.auth:super_admin')->group(function () {
        Route::delete('/{id}', [ContentTemplateController::class, 'destroy'])
            ->where('id', '[0-9]+');
    });
});
