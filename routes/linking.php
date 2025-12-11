<?php

use App\Http\Controllers\Api\LinkingController;
use App\Http\Controllers\Api\LinkingRulesController;
use Illuminate\Support\Facades\Route;

/**
 * LINKING ROUTES
 * Routes pour la gestion du maillage interne et externe
 */

// =============================================================================
// LINKING - Gestion du maillage
// =============================================================================

Route::prefix('linking')->group(function () {
    
    // =========================================================================
    // ANALYSE ET STATS (lecture pour tous)
    // =========================================================================
    
    // Statistiques d'une plateforme
    Route::get('/platforms/{platform}/stats', [LinkingController::class, 'stats']);
    
    // Statistiques détaillées d'une plateforme
    Route::get('/platforms/{platform}/stats-detailed', [LinkingController::class, 'platformStats']);
    
    // Analyse complète d'une plateforme
    Route::get('/platforms/{platform}/analyze', [LinkingController::class, 'analyzePlatform']);
    
    // Rapport d'une plateforme
    Route::get('/platforms/{platform}/report', [LinkingController::class, 'platformReport']);
    
    // Articles orphelins (sans liens entrants)
    Route::get('/platforms/{platform}/orphans', [LinkingController::class, 'orphans']);
    
    // Articles en impasse (sans liens sortants)
    Route::get('/platforms/{platform}/dead-ends', [LinkingController::class, 'deadEnds']);
    
    // PageRank d'une plateforme
    Route::get('/platforms/{platform}/pagerank', [LinkingController::class, 'pageRank']);
    
    // Stats PageRank d'une plateforme
    Route::get('/platforms/{platform}/pagerank-stats', [LinkingController::class, 'getPageRankStats']);
    
    // Santé d'un article
    Route::get('/articles/{article}/health', [LinkingController::class, 'articleHealth']);
    
    // Analyse d'un article
    Route::get('/articles/{article}/analyze', [LinkingController::class, 'analyzeArticle']);
    
    // Suggestions de liens pour un article
    Route::get('/articles/{article}/suggestions', [LinkingController::class, 'suggestions']);
    
    // Liens internes d'un article
    Route::get('/articles/{article}/internal-links', [LinkingController::class, 'getInternalLinks']);
    
    // Liens externes d'un article
    Route::get('/articles/{article}/external-links', [LinkingController::class, 'getExternalLinks']);
    
    // =========================================================================
    // ACTIONS (admin et super_admin)
    // =========================================================================
    
    Route::middleware('admin.auth:admin')->group(function () {
        
        // Générer des liens pour un article
        Route::post('/articles/{article}/generate', [LinkingController::class, 'generateForArticle'])
            ->middleware('throttle:30,1');
        
        // Générer des liens pour une plateforme complète
        Route::post('/platforms/{platform}/generate', [LinkingController::class, 'generateForPlatform'])
            ->middleware('throttle:5,1');
        
        // Génération en batch
        Route::post('/platforms/{platform}/generate-batch', [LinkingController::class, 'generateBatch'])
            ->middleware('throttle:5,1');
        
        // Réparation automatique des liens
        Route::post('/platforms/{platform}/auto-repair', [LinkingController::class, 'autoRepair'])
            ->middleware('throttle:10,1');
        
        // Recalculer le PageRank
        Route::post('/platforms/{platform}/recalculate-pagerank', [LinkingController::class, 'recalculatePageRank'])
            ->middleware('throttle:5,1');
        
        // Mettre à jour les liens pillar
        Route::put('/articles/{article}/pillar-links', [LinkingController::class, 'updatePillarLinks']);
        
        // Ajouter un lien interne
        Route::post('/articles/{article}/internal-links', [LinkingController::class, 'addInternalLink']);
        
        // Supprimer un lien interne
        Route::delete('/internal-links/{link}', [LinkingController::class, 'removeInternalLink']);
        
        // Vérifier les liens externes
        Route::post('/articles/{article}/verify-external-links', [LinkingController::class, 'verifyExternalLinks'])
            ->middleware('throttle:20,1');
    });
});

// =============================================================================
// LINKING RULES - Règles de maillage
// =============================================================================

Route::prefix('linking-rules')->group(function () {
    
    // =========================================================================
    // LECTURE (tous les utilisateurs actifs)
    // =========================================================================
    
    // Liste toutes les règles
    Route::get('/', [LinkingRulesController::class, 'index']);
    
    // Règle par ID
    Route::get('/{rule}', [LinkingRulesController::class, 'show']);
    
    // Règles d'une plateforme
    Route::get('/platforms/{platform}', [LinkingRulesController::class, 'forPlatform']);
    
    // =========================================================================
    // ÉCRITURE (admin et super_admin)
    // =========================================================================
    
    Route::middleware('admin.auth:admin')->group(function () {
        
        // Créer une règle
        Route::post('/', [LinkingRulesController::class, 'store'])
            ->middleware('throttle:30,1');
        
        // Mettre à jour les règles d'une plateforme
        Route::put('/platforms/{platform}', [LinkingRulesController::class, 'update']);
        
        // Copier les règles d'une plateforme à une autre
        Route::post('/platforms/{platform}/copy', [LinkingRulesController::class, 'copy'])
            ->middleware('throttle:10,1');
        
        // Dupliquer une règle
        Route::post('/{rule}/duplicate', [LinkingRulesController::class, 'duplicate'])
            ->middleware('throttle:10,1');
        
        // Valider une configuration de règles
        Route::post('/validate', [LinkingRulesController::class, 'validate']);
    });
    
    // =========================================================================
    // SUPPRESSION (super_admin uniquement)
    // =========================================================================
    
    Route::middleware('admin.auth:super_admin')->group(function () {
        // Supprimer toutes les règles d'une plateforme
        Route::delete('/platforms/{platform}', [LinkingRulesController::class, 'destroy']);
    });
});
