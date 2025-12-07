<?php

/**
 * ROUTES INTELLIGENT COVERAGE
 * 
 * À ajouter dans routes/api.php après les autres routes admin
 * 
 * Groupe: /api/admin/coverage/intelligent
 */

use App\Http\Controllers\Api\IntelligentCoverageController;

// =============================================================================
// AJOUTER CE BLOC DANS routes/api.php
// Dans le groupe Route::middleware(['auth:sanctum', 'admin.auth'])->prefix('admin')
// =============================================================================

/*

// Intelligent Coverage System
Route::prefix('coverage/intelligent')->group(function () {
    // Dashboard global
    Route::get('/dashboard', [IntelligentCoverageController::class, 'dashboard']);
    
    // Liste des pays
    Route::get('/countries', [IntelligentCoverageController::class, 'countries']);
    
    // Détails d'un pays
    Route::get('/countries/{countryId}', [IntelligentCoverageController::class, 'countryDetails']);
    Route::get('/countries/{countryId}/recruitment', [IntelligentCoverageController::class, 'countryRecruitment']);
    Route::get('/countries/{countryId}/awareness', [IntelligentCoverageController::class, 'countryAwareness']);
    Route::get('/countries/{countryId}/founder', [IntelligentCoverageController::class, 'countryFounder']);
    
    // Thème fondateur (Williams Jullin) - Cross-platform
    Route::get('/founder', [IntelligentCoverageController::class, 'founderGlobal']);
    
    // Statistiques par langue
    Route::get('/languages', [IntelligentCoverageController::class, 'languages']);
    
    // Liste des spécialités/services
    Route::get('/specialties', [IntelligentCoverageController::class, 'specialties']);
    
    // Recommandations globales
    Route::get('/recommendations', [IntelligentCoverageController::class, 'recommendations']);
    
    // Matrice pays × langues
    Route::get('/matrix', [IntelligentCoverageController::class, 'matrix']);
    
    // Génération de contenu
    Route::post('/generate', [IntelligentCoverageController::class, 'generate']);
    
    // Export
    Route::get('/export', [IntelligentCoverageController::class, 'export']);
    
    // Invalidation du cache
    Route::post('/invalidate-cache', [IntelligentCoverageController::class, 'invalidateCache']);
});

*/

// =============================================================================
// EXEMPLE COMPLET DU FICHIER routes/api.php AVEC L'INTÉGRATION
// =============================================================================

/*
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\IntelligentCoverageController;
// ... autres imports ...

// Routes publiques
Route::prefix('v1')->group(function () {
    // ... routes existantes ...
});

// Routes admin protégées
Route::middleware(['auth:sanctum', 'admin.auth'])->prefix('admin')->group(function () {
    
    // ... routes existantes ...
    
    // =========================================================================
    // INTELLIGENT COVERAGE SYSTEM - AJOUTER ICI
    // =========================================================================
    Route::prefix('coverage/intelligent')->group(function () {
        Route::get('/dashboard', [IntelligentCoverageController::class, 'dashboard']);
        Route::get('/countries', [IntelligentCoverageController::class, 'countries']);
        Route::get('/countries/{countryId}', [IntelligentCoverageController::class, 'countryDetails']);
        Route::get('/countries/{countryId}/recruitment', [IntelligentCoverageController::class, 'countryRecruitment']);
        Route::get('/countries/{countryId}/awareness', [IntelligentCoverageController::class, 'countryAwareness']);
        Route::get('/countries/{countryId}/founder', [IntelligentCoverageController::class, 'countryFounder']);
        Route::get('/founder', [IntelligentCoverageController::class, 'founderGlobal']);
        Route::get('/languages', [IntelligentCoverageController::class, 'languages']);
        Route::get('/specialties', [IntelligentCoverageController::class, 'specialties']);
        Route::get('/recommendations', [IntelligentCoverageController::class, 'recommendations']);
        Route::get('/matrix', [IntelligentCoverageController::class, 'matrix']);
        Route::post('/generate', [IntelligentCoverageController::class, 'generate']);
        Route::get('/export', [IntelligentCoverageController::class, 'export']);
        Route::post('/invalidate-cache', [IntelligentCoverageController::class, 'invalidateCache']);
    });
    
});
*/
