<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Api\ArticleController;
use App\Http\Controllers\Api\GenerationController;
use App\Http\Controllers\Api\QueueController;
use App\Http\Controllers\Api\PlatformKnowledgeController;
use App\Http\Controllers\Api\BrandValidationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes publiques (sans authentification)
|--------------------------------------------------------------------------
*/

Route::post('/admin/login', [AuthController::class, 'login']);

// Health check
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'version' => '9.5',
        'timestamp' => now()->toIso8601String(),
    ]);
});

/*
|--------------------------------------------------------------------------
| Routes protégées (authentification requise)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    
});

/*
|--------------------------------------------------------------------------
| Routes API Phase 10 - Content Engine
|--------------------------------------------------------------------------
| Toutes les routes de l'API Backend pour la gestion du contenu
*/

/*
|--------------------------------------------------------------------------
| ARTICLES CRUD
|--------------------------------------------------------------------------
*/
Route::prefix('articles')->group(function () {
    Route::get('/', [ArticleController::class, 'index']);
    Route::get('/{id}', [ArticleController::class, 'show']);
    Route::post('/', [ArticleController::class, 'store']);
    Route::put('/{id}', [ArticleController::class, 'update']);
    Route::delete('/{id}', [ArticleController::class, 'destroy']);
    
    // Actions spécifiques
    Route::post('/{id}/publish', [ArticleController::class, 'publish']);
    Route::post('/{id}/unpublish', [ArticleController::class, 'unpublish']);
    Route::post('/{id}/duplicate', [ArticleController::class, 'duplicate']);
    
    // Traductions
    Route::post('/{id}/translate', [\App\Http\Controllers\Api\TranslationController::class, 'translate']);
    Route::post('/{id}/translate-all', [\App\Http\Controllers\Api\TranslationController::class, 'translateAll']);
    Route::get('/{id}/missing-translations', [\App\Http\Controllers\Api\TranslationController::class, 'missing']);
});

/*
|--------------------------------------------------------------------------
| LANDING PAGES
|--------------------------------------------------------------------------
*/
Route::prefix('landings')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\LandingController::class, 'index']);
    Route::get('/{id}', [\App\Http\Controllers\Api\LandingController::class, 'show']);
    Route::post('/generate', [\App\Http\Controllers\Api\LandingController::class, 'generate']);
});

/*
|--------------------------------------------------------------------------
| COMPARATIFS
|--------------------------------------------------------------------------
*/
Route::prefix('comparatives')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\ComparativeController::class, 'index']);
    Route::get('/{id}', [\App\Http\Controllers\Api\ComparativeController::class, 'show']);
    Route::post('/generate', [\App\Http\Controllers\Api\ComparativeController::class, 'generate']);
});

/*
|--------------------------------------------------------------------------
| TRADUCTIONS
|--------------------------------------------------------------------------
*/
Route::prefix('translations')->group(function () {
    Route::post('/{id}/retranslate', [\App\Http\Controllers\Api\TranslationController::class, 'retranslate']);
});

/*
|--------------------------------------------------------------------------
| BATCHES (Lots de génération)
|--------------------------------------------------------------------------
*/
Route::prefix('batches')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\BatchController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\BatchController::class, 'create']);
    Route::get('/{id}', [\App\Http\Controllers\Api\BatchController::class, 'status']);
    Route::post('/{id}/cancel', [\App\Http\Controllers\Api\BatchController::class, 'cancel']);
});

/*
|--------------------------------------------------------------------------
| GÉNÉRATION IA
|--------------------------------------------------------------------------
*/
Route::prefix('generate')->group(function () {
    Route::post('/article', [GenerationController::class, 'generateArticle']);
    Route::post('/landing', [GenerationController::class, 'generateLanding']);
    Route::post('/comparative', [GenerationController::class, 'generateComparative']);
    Route::post('/bulk', [GenerationController::class, 'generateBulk']);
    Route::post('/estimate', [GenerationController::class, 'estimate']);
});

/*
|--------------------------------------------------------------------------
| QUEUE (File d'attente)
|--------------------------------------------------------------------------
*/
Route::prefix('queue')->group(function () {
    Route::get('/', [QueueController::class, 'index']);
    Route::get('/stats', [QueueController::class, 'stats']);
    Route::post('/{id}/prioritize', [QueueController::class, 'prioritize']);
    Route::post('/{id}/cancel', [QueueController::class, 'cancel']);
    Route::post('/{id}/retry', [QueueController::class, 'retry']);
});

/*
|--------------------------------------------------------------------------
| COVERAGE (Couverture géographique)
|--------------------------------------------------------------------------
*/
Route::prefix('coverage')->group(function () {
    Route::get('/by-platform', [\App\Http\Controllers\Api\CoverageController::class, 'byPlatform']);
    Route::get('/by-country', [\App\Http\Controllers\Api\CoverageController::class, 'byCountry']);
    Route::get('/by-theme', [\App\Http\Controllers\Api\CoverageController::class, 'byTheme']);
    Route::get('/gaps', [\App\Http\Controllers\Api\CoverageController::class, 'gaps']);
    Route::get('/heatmap', [\App\Http\Controllers\Api\CoverageController::class, 'heatmap']);
});

/*
|--------------------------------------------------------------------------
| STATISTIQUES
|--------------------------------------------------------------------------
*/
Route::prefix('stats')->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\Api\StatsController::class, 'dashboard']);
    Route::get('/costs', [\App\Http\Controllers\Api\StatsController::class, 'costs']);
    Route::get('/production', [\App\Http\Controllers\Api\StatsController::class, 'production']);
    Route::get('/quality', [\App\Http\Controllers\Api\StatsController::class, 'quality']);
});

/*
|--------------------------------------------------------------------------
| RESOURCES - Thèmes
|--------------------------------------------------------------------------
*/
Route::prefix('themes')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\ThemeController::class, 'index']);
    Route::get('/{id}', [\App\Http\Controllers\Api\ThemeController::class, 'show']);
    Route::post('/', [\App\Http\Controllers\Api\ThemeController::class, 'store']);
    Route::put('/{id}', [\App\Http\Controllers\Api\ThemeController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\ThemeController::class, 'destroy']);
});

/*
|--------------------------------------------------------------------------
| RESOURCES - Types de prestataires
|--------------------------------------------------------------------------
*/
Route::prefix('provider-types')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\ProviderTypeController::class, 'index']);
    Route::get('/{id}', [\App\Http\Controllers\Api\ProviderTypeController::class, 'show']);
});

/*
|--------------------------------------------------------------------------
| RESOURCES - Auteurs
|--------------------------------------------------------------------------
*/
Route::prefix('authors')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\AuthorController::class, 'index']);
    Route::get('/{id}', [\App\Http\Controllers\Api\AuthorController::class, 'show']);
    Route::post('/', [\App\Http\Controllers\Api\AuthorController::class, 'store']);
    Route::put('/{id}', [\App\Http\Controllers\Api\AuthorController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\AuthorController::class, 'destroy']);
});

/*
|--------------------------------------------------------------------------
| RESOURCES - Affiliés
|--------------------------------------------------------------------------
*/
Route::prefix('affiliates')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\AffiliateController::class, 'index']);
    Route::get('/{id}', [\App\Http\Controllers\Api\AffiliateController::class, 'show']);
    Route::post('/', [\App\Http\Controllers\Api\AffiliateController::class, 'store']);
    Route::put('/{id}', [\App\Http\Controllers\Api\AffiliateController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\AffiliateController::class, 'destroy']);
});

/*
|--------------------------------------------------------------------------
| RESOURCES - Plateformes
|--------------------------------------------------------------------------
*/
Route::prefix('platforms')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\PlatformController::class, 'index']);
    Route::get('/{id}', [\App\Http\Controllers\Api\PlatformController::class, 'show']);
});

/*
|--------------------------------------------------------------------------
| RESOURCES - Templates
|--------------------------------------------------------------------------
*/
Route::prefix('templates')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\TemplateController::class, 'index']);
    Route::get('/{id}', [\App\Http\Controllers\Api\TemplateController::class, 'show']);
    Route::post('/', [\App\Http\Controllers\Api\TemplateController::class, 'store']);
    Route::put('/{id}', [\App\Http\Controllers\Api\TemplateController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\TemplateController::class, 'destroy']);
});

/*
|--------------------------------------------------------------------------
| RESOURCES - Pays
|--------------------------------------------------------------------------
*/
Route::prefix('countries')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\CountryController::class, 'index']);
    Route::get('/{id}', [\App\Http\Controllers\Api\CountryController::class, 'show']);
});

/*
|--------------------------------------------------------------------------
| RESOURCES - Langues
|--------------------------------------------------------------------------
*/
Route::prefix('languages')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\LanguageController::class, 'index']);
    Route::get('/{id}', [\App\Http\Controllers\Api\LanguageController::class, 'show']);
});

/*
|--------------------------------------------------------------------------
| SETTINGS (Paramètres)
|--------------------------------------------------------------------------
*/
Route::prefix('settings')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\SettingsController::class, 'index']);
    Route::get('/{key}', [\App\Http\Controllers\Api\SettingsController::class, 'show']);
    Route::put('/{key}', [\App\Http\Controllers\Api\SettingsController::class, 'update']);
    Route::post('/bulk-update', [\App\Http\Controllers\Api\SettingsController::class, 'bulkUpdate']);
    
    // Configurations spécifiques
    Route::get('/publication/config', [\App\Http\Controllers\Api\SettingsController::class, 'publication']);
    Route::get('/landing/config', [\App\Http\Controllers\Api\SettingsController::class, 'landing']);
    Route::get('/images/config', [\App\Http\Controllers\Api\SettingsController::class, 'images']);
});

/*
|--------------------------------------------------------------------------
| PLATFORM KNOWLEDGE (Phase 11 - Base de connaissances par plateforme)
|--------------------------------------------------------------------------
| Gestion des connaissances spécifiques à chaque plateforme pour
| améliorer la génération de contenu par l'IA
| 
| Routes spéciales (platform, type, validate, preview) AVANT /{id} 
| pour éviter les conflits de routing
|
| Exemples d'utilisation:
| - Liste filtrée: GET /api/platform-knowledge?platform_id=1&language_code=fr
| - Par plateforme: GET /api/platform-knowledge/platform/1
| - Par type: GET /api/platform-knowledge/by-type/service_description
| - Créer: POST /api/platform-knowledge
| - Valider contenu: POST /api/platform-knowledge/validate-content
| - Preview prompt: POST /api/platform-knowledge/preview-prompt
| - Traduire: POST /api/platform-knowledge/123/translate
| - Tout traduire: POST /api/platform-knowledge/platform/1/translate-all
*/
Route::prefix('platform-knowledge')->group(function () {
    
    // Liste et création
    Route::get('/', [PlatformKnowledgeController::class, 'index']);
    Route::post('/', [PlatformKnowledgeController::class, 'store']);
    
    // Routes spécialisées (AVANT /{id} pour éviter conflits de routing)
    Route::get('/platform/{platformId}', [PlatformKnowledgeController::class, 'byPlatform']);
    Route::get('/by-type/{type}', [PlatformKnowledgeController::class, 'byType']);
    Route::post('/validate-content', [PlatformKnowledgeController::class, 'validateContent']);
    Route::post('/preview-prompt', [PlatformKnowledgeController::class, 'previewPrompt']);
    
    // CRUD standard (/{id} en dernier)
    Route::get('/{id}', [PlatformKnowledgeController::class, 'show']);
    Route::put('/{id}', [PlatformKnowledgeController::class, 'update']);
    Route::delete('/{id}', [PlatformKnowledgeController::class, 'destroy']);
    
    // Traductions
    Route::post('/{id}/translate', [PlatformKnowledgeController::class, 'translate']);
    Route::post('/platform/{platformId}/translate-all', [PlatformKnowledgeController::class, 'translateAllForPlatform']);
});

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/
Route::prefix('export')->group(function () {
    Route::post('/articles', [\App\Http\Controllers\Api\ExportController::class, 'articles']);
    Route::get('/download/{filename}', [\App\Http\Controllers\Api\ExportController::class, 'download']);
});

/*
|--------------------------------------------------------------------------
| BRAND VALIDATION API - Phase 12
|--------------------------------------------------------------------------
| Validation de la conformité du contenu généré avec les directives de
| marque spécifiques à chaque plateforme
|
| Exemples d'utilisation:
| - Valider un contenu: POST /api/brand/validate
|   Body: { platform_id: 1, content: "...", language_code: "fr", content_type: "article" }
| - Stats conformité: GET /api/brand/stats/1
|   Retourne le score moyen et les violations fréquentes pour la plateforme
*/
Route::prefix('brand')->group(function () {
    
    // Validation contenu temps réel
    Route::post('/validate', [BrandValidationController::class, 'validate']);
    
    // Statistiques conformité par plateforme
    Route::get('/stats/{platformId}', [BrandValidationController::class, 'platformStats']);
    
});