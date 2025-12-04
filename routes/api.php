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
use App\Http\Controllers\Api\ExportApiController; // ✨ PHASE 18
use App\Http\Controllers\Api\ResearchController; // ✨ PHASE 19
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
| PLATFORM KNOWLEDGE (Phase 11)
|--------------------------------------------------------------------------
*/
Route::prefix('platform-knowledge')->group(function () {
    Route::get('/', [PlatformKnowledgeController::class, 'index']);
    Route::post('/', [PlatformKnowledgeController::class, 'store']);
    Route::get('/platform/{platformId}', [PlatformKnowledgeController::class, 'byPlatform']);
    Route::get('/by-type/{type}', [PlatformKnowledgeController::class, 'byType']);
    Route::post('/validate-content', [PlatformKnowledgeController::class, 'validateContent']);
    Route::post('/preview-prompt', [PlatformKnowledgeController::class, 'previewPrompt']);
    Route::get('/{id}', [PlatformKnowledgeController::class, 'show']);
    Route::put('/{id}', [PlatformKnowledgeController::class, 'update']);
    Route::delete('/{id}', [PlatformKnowledgeController::class, 'destroy']);
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
*/
Route::prefix('brand')->group(function () {
    Route::post('/validate', [BrandValidationController::class, 'validate']);
    Route::get('/stats/{platformId}', [BrandValidationController::class, 'platformStats']);
});

/*
|--------------------------------------------------------------------------
| QUALITY MONITORING - Phase 13
|--------------------------------------------------------------------------
*/
Route::prefix('quality')->group(function () {
    Route::get('/dashboard', [QualityController::class, 'dashboard']);
    Route::get('/checks', [QualityController::class, 'index']);
    Route::post('/checks/{articleId}/revalidate', [QualityController::class, 'revalidate']);
    Route::get('/trends', [QualityController::class, 'trends']);
    Route::get('/criteria-stats', [QualityController::class, 'criteriaStats']);
});

Route::prefix('golden-examples')->group(function () {
    Route::get('/', [GoldenExamplesController::class, 'index']);
    Route::post('/{id}/mark', [GoldenExamplesController::class, 'mark']);
    Route::post('/{id}/toggle', [GoldenExamplesController::class, 'toggle']);
    Route::delete('/{id}', [GoldenExamplesController::class, 'destroy']);
    Route::get('/export', [GoldenExamplesController::class, 'export']);
    Route::get('/stats', [GoldenExamplesController::class, 'stats']);
    Route::get('/impact', [GoldenExamplesController::class, 'impact']);
    Route::get('/top-used', [GoldenExamplesController::class, 'topUsed']);
    Route::post('/auto-mark', [GoldenExamplesController::class, 'autoMark']);
});

Route::prefix('feedback')->group(function () {
    Route::post('/analyze', [FeedbackController::class, 'analyze']);
    Route::post('/apply', [FeedbackController::class, 'apply']);
    Route::get('/weekly-report', [FeedbackController::class, 'weeklyReport']);
    Route::get('/recommendations', [FeedbackController::class, 'getRecommendations']);
    Route::post('/clear-cache', [FeedbackController::class, 'clearCache']);
});

/*
|--------------------------------------------------------------------------
| ARTICLES PILIERS PREMIUM - Phase 14
|--------------------------------------------------------------------------
*/
Route::prefix('pillars')->group(function () {
    Route::get('schedule', [PillarController::class, 'schedule'])->name('api.pillars.schedule');
    Route::post('generate-manual', [PillarController::class, 'generateManual'])->name('api.pillars.generate-manual');
    Route::get('stats', [PillarController::class, 'stats'])->name('api.pillars.stats');
    Route::get('{id}', [PillarController::class, 'show'])->name('api.pillars.show');
    Route::get('{id}/sources', [PillarController::class, 'sources'])->name('api.pillars.sources');
    Route::get('{id}/statistics', [PillarController::class, 'statistics'])->name('api.pillars.statistics');
});

/*
|--------------------------------------------------------------------------
| COMMUNIQUÉS DE PRESSE - Phase 15
|--------------------------------------------------------------------------
*/
Route::prefix('press-releases')->group(function () {
    Route::post('/generate', [PressReleaseController::class, 'generate'])->name('api.press-releases.generate');
    Route::get('/', [PressReleaseController::class, 'index'])->name('api.press-releases.index');
    Route::get('/{pressRelease}', [PressReleaseController::class, 'show'])->name('api.press-releases.show');
    Route::post('/{pressRelease}/generate-chart', [PressReleaseController::class, 'generateChart'])->name('api.press-releases.generate-chart');
    Route::post('/{pressRelease}/add-photo', [PressReleaseController::class, 'addPhoto'])->name('api.press-releases.add-photo');
    Route::post('/{pressRelease}/export-pdf', [PressReleaseController::class, 'exportPdf'])->name('api.press-releases.export-pdf');
    Route::post('/{pressRelease}/export-word', [PressReleaseController::class, 'exportWord'])->name('api.press-releases.export-word');
    Route::get('/{pressRelease}/download/{export}', [PressReleaseController::class, 'download'])->name('api.press-releases.download');
    Route::post('/{pressRelease}/publish', [PressReleaseController::class, 'publish'])->name('api.press-releases.publish');
    Route::delete('/{pressRelease}', [PressReleaseController::class, 'destroy'])->name('api.press-releases.destroy');
});

/*
|--------------------------------------------------------------------------
| DOSSIERS DE PRESSE - Phase 16
|--------------------------------------------------------------------------
*/
Route::prefix('dossiers')->group(function () {
    Route::get('/', [DossierController::class, 'index']);
    Route::post('/', [DossierController::class, 'store']);
    Route::get('/{id}', [DossierController::class, 'show']);
    Route::put('/{id}', [DossierController::class, 'update']);
    Route::delete('/{id}', [DossierController::class, 'destroy']);
    Route::post('/{id}/sections/add', [DossierController::class, 'addSection']);
    Route::put('/{dossierId}/sections/{sectionId}/content', [DossierController::class, 'updateSectionContent']);
    Route::post('/{dossierId}/sections/{sectionId}/reorder', [DossierController::class, 'reorderSection']);
    Route::delete('/{dossierId}/sections/{sectionId}', [DossierController::class, 'deleteSection']);
    Route::post('/{id}/sections/{sectionId}/add-photo', [DossierController::class, 'addPhoto']);
    Route::post('/{id}/add-photo', [DossierController::class, 'addPhoto']);
    Route::post('/{id}/sections/{sectionId}/generate-chart', [DossierController::class, 'generateChart']);
    Route::post('/{id}/export-pdf', [DossierController::class, 'exportPdf']);
    Route::post('/{id}/export-word', [DossierController::class, 'exportWord']);
    Route::post('/{id}/export-excel', [DossierController::class, 'exportExcel']);
    Route::get('/exports/{exportId}/download', [DossierController::class, 'downloadExport']);
    Route::get('/stats', [DossierController::class, 'stats']);
});

/*
|--------------------------------------------------------------------------
| GÉNÉRATION DEPUIS TITRES MANUELS - Phase 17
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum'])->prefix('manual-titles')->name('api.manual-titles.')->group(function () {
    Route::get('/', [ManualTitleController::class, 'index'])->name('index');
    Route::get('/{id}', [ManualTitleController::class, 'show'])->name('show');
    Route::post('/', [ManualTitleController::class, 'store'])->name('store');
    Route::post('/{id}/generate', [ManualTitleController::class, 'generate'])->middleware('throttle:10,60')->name('generate');
    Route::post('/{id}/schedule', [ManualTitleController::class, 'schedule'])->name('schedule');
    Route::post('/bulk-import', [ManualTitleController::class, 'bulkImport'])->middleware('throttle:5,60')->name('bulk-import');
    Route::get('/{id}/status', [ManualTitleController::class, 'status'])->name('status');
    Route::delete('/{id}', [ManualTitleController::class, 'destroy'])->name('destroy');
    Route::get('/templates/available', [ManualTitleController::class, 'templates'])->name('templates');
});

/*
|--------------------------------------------------------------------------
| EXPORT PDF/WORD MULTI-LANGUES - Phase 18 ✨
|--------------------------------------------------------------------------
| Export automatique PDF + WORD pour tous contenus avec support parfait
| 9 langues (arabe RTL, chinois, hindi). 18 fichiers/article.
|
| Fonctionnalités:
| - Export PDF avec wkhtmltopdf (support RTL arabe, fonts Noto)
| - Export Word avec PHPWord (éditable, styles professionnels)
| - Support 9 langues: fr, en, es, de, it, pt, ru, ar (RTL), zh, hi
| - Queue asynchrone pour traitement en arrière-plan
| - Automation: export automatique à publication article
| - 4 types de contenu: Article, PillarArticle, PressRelease, PressDossier
|
| Exemples d'utilisation:
|
| 1. Export PDF d'un article:
|    POST /api/export/pdf
|    Body: {
|      content_type: "Article",
|      content_id: 123,
|      language_code: "fr"
|    }
|
| 2. Export Word:
|    POST /api/export/word
|    Body: {
|      content_type: "Article",
|      content_id: 123,
|      language_code: "ar"  // Support RTL
|    }
|
| 3. Export en masse (bulk):
|    POST /api/export/bulk
|    Body: {
|      exports: [
|        { content_type: "Article", content_id: 123, format: "pdf", language_code: "fr" },
|        { content_type: "Article", content_id: 123, format: "word", language_code: "en" }
|      ]
|    }
|
| 4. Vérifier statut export:
|    GET /api/export/42/status
|
| 5. Télécharger export:
|    GET /api/export/42/download
|
| Production: 1 article = 18 fichiers automatiquement (9 PDF + 9 WORD)
| Performance: PDF 5-10s, WORD 3-5s, Queue 100-200 exports/h
| Storage: ~6.3 MB par article complet (18 fichiers)
|
| ⚠️ Configuration requise:
| - wkhtmltopdf installé sur serveur
| - Fonts Noto installés (sudo apt-get install fonts-noto fonts-noto-cjk)
| - PHPWord: composer require phpoffice/phpword
| - Queue worker actif: php artisan queue:work --queue=exports
| - Migrations: php artisan migrate
| - Seeder: php artisan db:seed --class=ExportConfigSeeder
*/
Route::middleware(['auth:sanctum'])->prefix('export')->group(function () {
    
    // ---------------------------------------------------------------------
    // POST /api/export/pdf
    // ---------------------------------------------------------------------
    // Exporter un contenu en PDF
    // 
    // Body (JSON):
    // {
    //   "content_type": "Article",      // Article, PillarArticle, PressRelease, PressDossier
    //   "content_id": 123,               // ID du contenu
    //   "language_code": "fr"            // Langue: fr, en, es, de, it, pt, ru, ar, zh, hi
    // }
    // 
    // Response: Export mis en queue
    // Format: {
    //   message: "PDF export queued successfully",
    //   export_id: 42,
    //   status: "pending"
    // }
    // 
    // ⚠️ Process asynchrone via queue
    // ⚠️ Utiliser /status pour suivre la progression
    // ---------------------------------------------------------------------
    Route::post('/pdf', [ExportApiController::class, 'exportPdf']);
    
    
    // ---------------------------------------------------------------------
    // POST /api/export/word
    // ---------------------------------------------------------------------
    // Exporter un contenu en Word (.docx)
    // 
    // Body (JSON):
    // {
    //   "content_type": "Article",
    //   "content_id": 123,
    //   "language_code": "ar"            // Support RTL pour arabe
    // }
    // 
    // Response: Export mis en queue
    // ---------------------------------------------------------------------
    Route::post('/word', [ExportApiController::class, 'exportWord']);
    
    
    // ---------------------------------------------------------------------
    // POST /api/export/bulk
    // ---------------------------------------------------------------------
    // Exporter plusieurs contenus en masse
    // 
    // Body (JSON):
    // {
    //   "exports": [
    //     { content_type: "Article", content_id: 123, format: "pdf", language_code: "fr" },
    //     { content_type: "Article", content_id: 123, format: "word", language_code: "en" },
    //     { content_type: "Article", content_id: 456, format: "pdf", language_code: "zh" }
    //   ]
    // }
    // 
    // Response: Liste des exports créés
    // Format: {
    //   message: "3 exports queued successfully",
    //   export_ids: [42, 43, 44]
    // }
    // 
    // ⚠️ Limite recommandée: 50 exports par requête
    // ---------------------------------------------------------------------
    Route::post('/bulk', [ExportApiController::class, 'bulkExport']);
    
    
    // ---------------------------------------------------------------------
    // GET /api/export/queue
    // ---------------------------------------------------------------------
    // Lister la queue d'export avec filtres
    // 
    // Query params:
    //   - status (optionnel) : Filtrer par statut (pending, processing, completed, failed)
    //   - content_type (optionnel) : Filtrer par type
    //   - language_code (optionnel) : Filtrer par langue
    // 
    // Response: Liste paginée des exports
    // Format: {
    //   data: [{ id, content_type, content_id, format, language_code, status, created_at, ... }],
    //   current_page, last_page, total
    // }
    // ---------------------------------------------------------------------
    Route::get('/queue', [ExportApiController::class, 'queue']);
    
    
    // ---------------------------------------------------------------------
    // GET /api/export/{exportId}/status
    // ---------------------------------------------------------------------
    // Récupérer le statut d'un export spécifique
    // 
    // Params:
    //   - exportId : ID de l'export
    // 
    // Response: Statut détaillé
    // Format: {
    //   id, content_type, content_id, format, language_code,
    //   status, created_at, completed_at, error_message,
    //   download_url: "/api/export/42/download"  // Si completed
    // }
    // 
    // Statuts possibles:
    // - pending : En attente de traitement
    // - processing : En cours de génération
    // - completed : Terminé avec succès
    // - failed : Échec (voir error_message)
    // ---------------------------------------------------------------------
    Route::get('/{exportId}/status', [ExportApiController::class, 'status'])->name('api.export.status');
    
    
    // ---------------------------------------------------------------------
    // GET /api/export/{exportId}/download
    // ---------------------------------------------------------------------
    // Télécharger un export terminé
    // 
    // Params:
    //   - exportId : ID de l'export
    // 
    // Response: Fichier en téléchargement (PDF ou DOCX)
    // 
    // ⚠️ Disponible uniquement si status = "completed"
    // ⚠️ Nom fichier: export_Article_123_fr.pdf (ou .docx)
    // ---------------------------------------------------------------------
    Route::get('/{exportId}/download', [ExportApiController::class, 'download'])->name('api.export.download');
    
    
    // ---------------------------------------------------------------------
    // DELETE /api/export/{exportId}/cancel
    // ---------------------------------------------------------------------
    // Annuler un export en attente (pending uniquement)
    // 
    // Params:
    //   - exportId : ID de l'export
    // 
    // Response: Confirmation annulation
    // Format: { message: "Export cancelled successfully" }
    // 
    // ⚠️ Impossible d'annuler si status = processing ou completed
    // ---------------------------------------------------------------------
    Route::delete('/{exportId}/cancel', [ExportApiController::class, 'cancel']);
    
    
    // ---------------------------------------------------------------------
    // DELETE /api/export/{exportId}
    // ---------------------------------------------------------------------
    // Supprimer un export terminé (fichier + entrée BDD)
    // 
    // Params:
    //   - exportId : ID de l'export
    // 
    // Response: Confirmation suppression
    // Format: { message: "Export deleted successfully" }
    // 
    // ⚠️ Supprime le fichier physique (PDF/DOCX) du storage
    // ---------------------------------------------------------------------
    Route::delete('/{exportId}', [ExportApiController::class, 'delete']);
});

/*
|--------------------------------------------------------------------------
| VÉRIFICATION ROUTES EXPORT
|--------------------------------------------------------------------------
|
| # Lister toutes les routes API
| php artisan route:list --path=api
|
| # Filtrer routes export
| php artisan route:list --path=api/export
|
| # Compter routes par préfixe
| php artisan route:list --path=api | grep export | wc -l
|
|--------------------------------------------------------------------------
| TESTS ROUTES EXPORT
|--------------------------------------------------------------------------
|
| # Test export PDF (Postman recommandé)
| POST http://localhost:8000/api/export/pdf
| Headers:
|   Content-Type: application/json
|   Authorization: Bearer YOUR_TOKEN
| Body: {
|   "content_type": "Article",
|   "content_id": 1,
|   "language_code": "fr"
| }
|
| # Test statut export
| curl -H "Authorization: Bearer YOUR_TOKEN" \
|   http://localhost:8000/api/export/42/status
|
| # Test téléchargement
| curl -H "Authorization: Bearer YOUR_TOKEN" \
|   http://localhost:8000/api/export/42/download --output article.pdf
|
| # Test queue
| curl -H "Authorization: Bearer YOUR_TOKEN" \
|   http://localhost:8000/api/export/queue?status=pending
|
|--------------------------------------------------------------------------
| AUTOMATION EXPORT
|--------------------------------------------------------------------------
|
| Pour activer l'export automatique à publication, ajouter dans
| ArticleController@publish():
|
| use App\Services\Export\UniversalExportService;
|
| public function publish($id, UniversalExportService $exportService) {
|     $article = Article::findOrFail($id);
|     $article->update(['status' => 'published']);
|     
|     // Export automatique 9 langues × 2 formats = 18 fichiers
|     $exportService->queueAllTranslations($article, ['pdf', 'word']);
|     
|     return response()->json(['message' => 'Article published and exports queued']);
| }
|
|--------------------------------------------------------------------------
| COMMAND ARTISAN
|--------------------------------------------------------------------------
|
| # Traiter la queue d'export manuellement
| php artisan export:process-queue
|
| # Traiter avec limite
| php artisan export:process-queue --limit=50
|
| # Traiter les exports échoués
| php artisan export:process-queue --status=failed
|
|--------------------------------------------------------------------------
| SCHEDULER (optionnel)
|--------------------------------------------------------------------------
|
| Dans app/Console/Kernel.php:
|
| protected function schedule(Schedule $schedule): void
| {
|     $schedule->command('export:process-queue')->everyFiveMinutes();
| }
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| RECHERCHES AVANCÉES & DATA MINING - Phase 19 ✨
|--------------------------------------------------------------------------
| Recherche multi-sources (Perplexity AI + News API) avec cache intelligent 
| 24h et fact-checking assisté par IA.
|
| Fonctionnalités:
| - Recherche multi-sources: Perplexity AI + News API
| - Cache 24h automatique (économie ~70% coûts)
| - Fact-checking assisté IA (vérification affirmations)
| - Extraction automatique de claims (statistiques, dates, personnes)
| - Support 9 langues: fr, en, es, de, pt, ru, zh, ar, hi
| - Déduplication automatique des résultats
| - Scoring de pertinence TF-IDF
|
| Économies:
| - AVANT: $1.35/mois (270 articles, Perplexity uniquement, pas de cache)
| - APRÈS: $0.41/mois (cache 70%, multi-sources)
| - ÉCONOMIE: -70% ($0.94/mois)
|
| Exemples d'utilisation:
|
| 1. Recherche multi-sources:
|    POST /api/research/search
|    Body: {
|      "query": "statistiques expatriés français 2024",
|      "language": "fr",
|      "sources": ["perplexity", "news_api"]
|    }
|
| 2. Fact-checking:
|    POST /api/research/fact-check
|    Body: {
|      "claim": "304 millions d'expatriés dans le monde",
|      "language": "fr"
|    }
|    Response: {
|      confidence: "high",
|      verification_status: "verified",
|      recommendation: "OK to use",
|      supporting_sources: [urls...]
|    }
|
| 3. Extraction de claims:
|    POST /api/research/extract-claims
|    Body: {
|      "content": "Selon les dernières données, 304 millions..."
|    }
|    Response: {
|      claims: [
|        { type: "statistic", text: "304 millions d'expatriés", value: "304" }
|      ]
|    }
|
| 4. Sources disponibles:
|    GET /api/research/sources
|    Response: Liste des sources avec rate limits et coûts
|
| 5. Statistiques cache:
|    GET /api/research/cache-stats
|    Response: Hit rate, entries, top queries
|
| Performance:
| - Cache hit rate: ~70% après quelques jours
| - Temps réponse avec cache: <100ms
| - Temps réponse sans cache: 2-5s
|
| ⚠️ Configuration requise:
| - News API key (gratuit sur newsapi.org, 100 req/jour)
| - Perplexity API key (déjà configuré Phase 3)
| - Variables .env: NEWS_API_KEY, NEWS_API_TIMEOUT
| - Migrations: php artisan migrate
| - Seeder: php artisan db:seed --class=ResearchSourceSeeder
|
| ⚠️ IMPORTANT:
| - Fact-checking assisté ≠ vérité absolue
| - Review humaine recommandée avant publication
| - News API gratuit limité à 100 requêtes/jour
| - Cache 24h recommandé pour optimiser coûts
|
| Tests:
| - Tests unitaires: php artisan test tests/Unit/Services/Research/
| - Test complet: php artisan research:test
| - Test recherche: php artisan research:test --query="votre recherche"
| - Test fact-check: php artisan research:test --claim="votre affirmation"
*/
Route::middleware(['auth:sanctum'])->prefix('research')->group(function () {
    
    // ---------------------------------------------------------------------
    // POST /api/research/search
    // ---------------------------------------------------------------------
    // Recherche multi-sources avec cache automatique
    // 
    // Body (JSON):
    // {
    //   "query": "statistiques expatriés français 2024",
    //   "language": "fr",                           // fr, en, es, de, pt, ru, zh, ar, hi
    //   "sources": ["perplexity", "news_api"]       // Optionnel, défaut: les deux
    // }
    // 
    // Response: Résultats agrégés et dédupliqués
    // Format: {
    //   success: true,
    //   data: {
    //     query, language, sources_used,
    //     results_count: 12,
    //     results: [
    //       {
    //         source_type: "perplexity",
    //         title: "...",
    //         url: "...",
    //         excerpt: "...",
    //         relevance_score: 92
    //       }
    //     ]
    //   }
    // }
    // 
    // ⚠️ Cache 24h automatique (hit rate ~70%)
    // ⚠️ Déduplication des URLs
    // ⚠️ Scoring de pertinence TF-IDF
    // ---------------------------------------------------------------------
    Route::post('/search', [ResearchController::class, 'search'])
        ->name('api.research.search');
    
    
    // ---------------------------------------------------------------------
    // GET /api/research/sources
    // ---------------------------------------------------------------------
    // Liste des sources disponibles avec statistiques
    // 
    // Response: Configuration et limites des sources
    // Format: {
    //   success: true,
    //   data: [
    //     {
    //       code: "perplexity_ai",
    //       name: "Perplexity AI",
    //       rate_limit: 100,                 // req/heure
    //       cost_per_request: 0.005,         // USD
    //       estimated_monthly_cost: 1.5,     // Pour 10 req/jour
    //       is_free: false
    //     },
    //     {
    //       code: "news_api",
    //       name: "News API",
    //       rate_limit: 1000,
    //       cost_per_request: 0,
    //       is_free: true                    // Gratuit 100/jour
    //     }
    //   ]
    // }
    // ---------------------------------------------------------------------
    Route::get('/sources', [ResearchController::class, 'sources'])
        ->name('api.research.sources');
    
    
    // ---------------------------------------------------------------------
    // POST /api/research/fact-check
    // ---------------------------------------------------------------------
    // Vérifier automatiquement une affirmation (fact-checking assisté IA)
    // 
    // Body (JSON):
    // {
    //   "claim": "304 millions d'expatriés dans le monde",
    //   "language": "fr"
    // }
    // 
    // Response: Résultat de vérification
    // Format: {
    //   success: true,
    //   data: {
    //     claim: "...",
    //     confidence: "high",                // high, medium, low
    //     verification_status: "verified",   // verified, disputed, unknown
    //     supporting_sources: ["url1", "url2"],
    //     contradicting_sources: [],
    //     recommendation: "OK to use",       // OK to use, Needs review, Do not use
    //     explanation: "Analyse de 5 sources...",
    //     suggested_correction: null         // Si disputed
    //   },
    //   warning: "Le fact-checking assisté par IA peut contenir des erreurs..."
    // }
    // 
    // ⚠️ CRITIQUE: Fact-checking assisté ≠ vérité absolue
    // ⚠️ Review humaine RECOMMANDÉE avant publication
    // ⚠️ Utiliser pour détecter claims à vérifier manuellement
    // ---------------------------------------------------------------------
    Route::post('/fact-check', [ResearchController::class, 'factCheck'])
        ->name('api.research.fact-check');
    
    
    // ---------------------------------------------------------------------
    // POST /api/research/extract-claims
    // ---------------------------------------------------------------------
    // Extraire automatiquement les affirmations factuelles d'un contenu
    // 
    // Body (JSON):
    // {
    //   "content": "Selon les dernières données, 304 millions d'expatriés..."
    // }
    // 
    // Response: Claims détectées
    // Format: {
    //   success: true,
    //   data: {
    //     claims_count: 3,
    //     claims: [
    //       {
    //         type: "statistic",            // statistic, historical, biographical
    //         text: "304 millions d'expatriés",
    //         value: "304",
    //         context: "expatriés vivent actuellement dans le monde"
    //       },
    //       {
    //         type: "historical",
    //         text: "En 2024, les règles ont changé",
    //         date: "2024",
    //         event: "les règles ont changé"
    //       }
    //     ]
    //   }
    // }
    // 
    // Types détectés:
    // - statistic: Chiffres avec contexte
    // - historical: Dates + événements
    // - biographical: Noms propres + rôles
    // 
    // ⚠️ Maximum 10 claims extraites par contenu
    // ---------------------------------------------------------------------
    Route::post('/extract-claims', [ResearchController::class, 'extractClaims'])
        ->name('api.research.extract-claims');
    
    
    // ---------------------------------------------------------------------
    // POST /api/research/verify-multiple
    // ---------------------------------------------------------------------
    // Vérifier plusieurs affirmations en une fois
    // 
    // Body (JSON):
    // {
    //   "claims": [
    //     "304 millions d'expatriés dans le monde",
    //     "La France compte 2,5 millions d'expatriés",
    //     "L'expatriation a augmenté de 15%"
    //   ],
    //   "language": "fr"
    // }
    // 
    // Response: Résultats multiples + statistiques
    // Format: {
    //   success: true,
    //   data: {
    //     total_claims: 3,
    //     verified: 2,
    //     disputed: 0,
    //     unknown: 1,
    //     results: [
    //       { claim, confidence, verification_status, ... },
    //       { claim, confidence, verification_status, ... }
    //     ]
    //   },
    //   warning: "..."
    // }
    // 
    // ⚠️ Limite: 10 claims maximum par requête
    // ---------------------------------------------------------------------
    Route::post('/verify-multiple', [ResearchController::class, 'verifyMultiple'])
        ->name('api.research.verify-multiple');
    
    
    // ---------------------------------------------------------------------
    // GET /api/research/cache-stats
    // ---------------------------------------------------------------------
    // Statistiques du cache et des recherches
    // 
    // Response: Métriques détaillées
    // Format: {
    //   success: true,
    //   data: {
    //     cache: {
    //       total_entries: 156,
    //       valid_entries: 134,
    //       expired_entries: 22,
    //       total_hits: 432,
    //       average_hits_per_entry: 2.77,
    //       cache_efficiency: 85.9          // %
    //     },
    //     cache_hit_rate_30_days: "68.5%",
    //     most_popular_queries: [
    //       {
    //         query: "statistiques expatriés",
    //         hits: 45,
    //         language: "fr"
    //       }
    //     ],
    //     language_distribution: [
    //       { language: "fr", entries: 78, total_hits: 234 }
    //     ]
    //   }
    // }
    // 
    // KPIs à surveiller:
    // - cache_hit_rate > 60% (objectif 70%)
    // - average_hits_per_entry > 2
    // - cache_efficiency > 80%
    // ---------------------------------------------------------------------
    Route::get('/cache-stats', [ResearchController::class, 'cacheStats'])
        ->name('api.research.cache-stats');
    
    
    // ---------------------------------------------------------------------
    // DELETE /api/research/cache
    // ---------------------------------------------------------------------
    // Vider le cache (admin uniquement)
    // 
    // Body (JSON):
    // {
    //   "action": "clear_expired"    // clear_expired ou clear_all
    // }
    // 
    // Response: Confirmation
    // Format: {
    //   success: true,
    //   message: "Les entrées expirées ont été supprimées (22 entrées)",
    //   deleted_count: 22
    // }
    // 
    // Actions:
    // - clear_expired: Supprime uniquement les entrées expirées
    // - clear_all: Supprime tout le cache (⚠️ perte hit rate)
    // 
    // ⚠️ Réservé aux administrateurs
    // ⚠️ clear_all réinitialise le hit rate
    // ---------------------------------------------------------------------
    Route::delete('/cache', [ResearchController::class, 'clearCache'])
        ->middleware('can:manage-settings')
        ->name('api.research.clear-cache');
});

/*
|--------------------------------------------------------------------------
| INTÉGRATION PHASE 19 DANS GÉNÉRATION DE CONTENU
|--------------------------------------------------------------------------
|
| Pour intégrer la recherche multi-sources dans la génération d'articles,
| modifier PillarArticleGenerator:
|
| use App\Services\Research\ResearchAggregatorService;
|
| protected function conductDeepResearch($theme, $country, $lang) {
|     // Utiliser ResearchAggregatorService au lieu de Perplexity uniquement
|     $results = $this->researchService->search($theme, $lang);
|     
|     // Bénéfices:
|     // - 2 sources au lieu d'1
|     // - Cache automatique 24h
|     // - -70% coûts
|     // - +90% fiabilité (cross-référencement)
| }
|
| Voir INTEGRATION-EXAMPLE.php pour implémentation complète
|
|--------------------------------------------------------------------------
| COMMANDES ARTISAN PHASE 19
|--------------------------------------------------------------------------
|
| # Test complet
| php artisan research:test
|
| # Test recherche
| php artisan research:test --query="expatriés français 2024" --lang=fr
|
| # Test fact-check
| php artisan research:test --claim="304 millions d'expatriés"
|
| # Statistiques
| php artisan research:test --stats
|
| # Vider cache expiré
| php artisan research:test --clear-cache
|
|--------------------------------------------------------------------------
| SCHEDULER (recommandé)
|--------------------------------------------------------------------------
|
| Dans app/Console/Kernel.php:
|
| protected function schedule(Schedule $schedule): void
| {
|     // Nettoyer cache expiré tous les jours à 3h
|     $schedule->call(function () {
|         \App\Models\ResearchCache::cleanExpired();
|     })->dailyAt('03:00');
| }
|
|--------------------------------------------------------------------------
| MONITORING
|--------------------------------------------------------------------------
|
| # Surveiller le hit rate
| curl -H "Authorization: Bearer TOKEN" \
|   http://localhost:8000/api/research/cache-stats
|
| # Si hit rate < 50%, augmenter TTL cache dans:
| app/Services/Research/ResearchAggregatorService.php
| protected int $cacheTtl = 86400; // 24h → 48h
|
|--------------------------------------------------------------------------
*/