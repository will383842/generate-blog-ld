<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\LinkingController;
use App\Http\Controllers\Api\AuthorityDomainsController;
use App\Http\Controllers\Api\LinkingRulesController;

/*
|--------------------------------------------------------------------------
| Phase 27 - Routes API pour le module de maillage
|--------------------------------------------------------------------------
|
| Inclus dans le groupe /api/admin/ de routes/api.php
| Hérite du middleware auth:sanctum et admin.auth du groupe parent
| Routes disponibles sous /api/admin/linking/...
|
*/

// Linking routes
Route::prefix('linking')->group(function () {
    // Analyse (lecture)
    Route::get('/articles/{article}/analyze', [LinkingController::class, 'analyzeArticle']);
    Route::get('/platforms/{platform}/stats', [LinkingController::class, 'platformStats']);
    Route::get('/platforms/{platform}/report', [LinkingController::class, 'platformReport']);
    Route::get('/articles/{article}/internal-links', [LinkingController::class, 'getInternalLinks']);
    Route::get('/articles/{article}/external-links', [LinkingController::class, 'getExternalLinks']);
    Route::get('/platforms/{platform}/pagerank', [LinkingController::class, 'getPageRankStats']);

    // Actions (admin+)
    Route::middleware('admin.auth:admin')->group(function () {
        Route::post('/articles/{article}/generate', [LinkingController::class, 'generateForArticle']);
        Route::post('/platforms/{platform}/generate-batch', [LinkingController::class, 'generateBatch']);
        Route::post('/articles/{article}/update-pillar-links', [LinkingController::class, 'updatePillarLinks']);
        Route::post('/articles/{article}/internal-links', [LinkingController::class, 'addInternalLink']);
        Route::delete('/internal-links/{link}', [LinkingController::class, 'removeInternalLink']);
        Route::post('/articles/{article}/external-links/verify', [LinkingController::class, 'verifyExternalLinks']);
        Route::post('/platforms/{platform}/pagerank/recalculate', [LinkingController::class, 'recalculatePageRank']);
    });
});

// Authority Domains
Route::prefix('authority-domains')->group(function () {
    Route::get('/', [AuthorityDomainsController::class, 'index']);
    Route::get('/stats', [AuthorityDomainsController::class, 'stats']);
    Route::get('/search', [AuthorityDomainsController::class, 'search']);
    Route::get('/export', [AuthorityDomainsController::class, 'export'])->name('api.authority-domains.export');
    Route::get('/download/{filename}', [AuthorityDomainsController::class, 'download'])->name('api.authority-domains.download');
    Route::get('/{domain}', [AuthorityDomainsController::class, 'show']);

    Route::middleware('admin.auth:admin')->group(function () {
        Route::post('/', [AuthorityDomainsController::class, 'store']);
        Route::post('/import', [AuthorityDomainsController::class, 'import']);
        Route::put('/{domain}', [AuthorityDomainsController::class, 'update']);
        Route::post('/{domain}/verify', [AuthorityDomainsController::class, 'verify']);
    });

    Route::delete('/{domain}', [AuthorityDomainsController::class, 'destroy'])->middleware('admin.auth:super_admin');
});

// Linking Rules
Route::prefix('linking-rules')->group(function () {
    Route::get('/', [LinkingRulesController::class, 'index']);
    Route::get('/platforms/{platform}', [LinkingRulesController::class, 'forPlatform']);
    Route::get('/{rule}', [LinkingRulesController::class, 'show']);

    Route::middleware('admin.auth:admin')->group(function () {
        Route::post('/', [LinkingRulesController::class, 'store']);
        Route::put('/{rule}', [LinkingRulesController::class, 'update']);
        Route::post('/{rule}/duplicate', [LinkingRulesController::class, 'duplicate']);
    });

    Route::delete('/{rule}', [LinkingRulesController::class, 'destroy'])->middleware('admin.auth:super_admin');
});
