<?php

use App\Http\Controllers\Api\PressReleaseController;
use Illuminate\Support\Facades\Route;

/**
 * Routes API - Communiqués de Presse
 * 
 * À inclure dans routes/api.php :
 * require __DIR__ . '/press_routes.php';
 */

Route::prefix('press-releases')->group(function () {
    
    // Liste et génération
    Route::post('/generate', [PressReleaseController::class, 'generate'])
        ->name('api.press-releases.generate');
    
    Route::get('/', [PressReleaseController::class, 'index'])
        ->name('api.press-releases.index');
    
    Route::get('/{pressRelease}', [PressReleaseController::class, 'show'])
        ->name('api.press-releases.show');
    
    // Médias
    Route::post('/{pressRelease}/generate-chart', [PressReleaseController::class, 'generateChart'])
        ->name('api.press-releases.generate-chart');
    
    Route::post('/{pressRelease}/add-photo', [PressReleaseController::class, 'addPhoto'])
        ->name('api.press-releases.add-photo');
    
    // Exports
    Route::post('/{pressRelease}/export-pdf', [PressReleaseController::class, 'exportPdf'])
        ->name('api.press-releases.export-pdf');
    
    Route::post('/{pressRelease}/export-word', [PressReleaseController::class, 'exportWord'])
        ->name('api.press-releases.export-word');
    
    Route::get('/{pressRelease}/download/{export}', [PressReleaseController::class, 'download'])
        ->name('api.press-releases.download');
    
    // Actions
    Route::post('/{pressRelease}/publish', [PressReleaseController::class, 'publish'])
        ->name('api.press-releases.publish');
    
    Route::delete('/{pressRelease}', [PressReleaseController::class, 'destroy'])
        ->name('api.press-releases.destroy');
});