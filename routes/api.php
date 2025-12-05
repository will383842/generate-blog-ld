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
use Illuminate\Support\Facades\Route;

Route::post('/admin/login', [AuthController::class, 'login']);

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'version' => '9.5',
        'timestamp' => now()->toIso8601String(),
    ]);
});

Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
});

Route::middleware(['auth:sanctum'])->prefix('articles')->group(function () {
    Route::get('/', [ArticleController::class, 'index']);
    Route::get('/{id}', [ArticleController::class, 'show']);
    Route::post('/', [ArticleController::class, 'store']);
    Route::put('/{id}', [ArticleController::class, 'update']);
    Route::delete('/{id}', [ArticleController::class, 'destroy']);
    Route::post('/{id}/publish', [ArticleController::class, 'publish']);
    Route::post('/{id}/unpublish', [ArticleController::class, 'unpublish']);
    Route::post('/{id}/duplicate', [ArticleController::class, 'duplicate']);
    Route::middleware('throttle:100,1')->group(function () {
        Route::post('/{id}/translate', [\App\Http\Controllers\Api\TranslationController::class, 'translate']);
        Route::post('/{id}/translate-all', [\App\Http\Controllers\Api\TranslationController::class, 'translateAll']);
    });
    Route::get('/{id}/missing-translations', [\App\Http\Controllers\Api\TranslationController::class, 'missing']);
});

Route::middleware(['auth:sanctum'])->prefix('landings')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\LandingController::class, 'index']);
    Route::get('/{id}', [\App\Http\Controllers\Api\LandingController::class, 'show']);
    Route::post('/generate', [\App\Http\Controllers\Api\LandingController::class, 'generate']);
});

Route::middleware(['auth:sanctum'])->prefix('comparatives')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\ComparativeController::class, 'index']);
    Route::get('/{id}', [\App\Http\Controllers\Api\ComparativeController::class, 'show']);
    Route::post('/generate', [\App\Http\Controllers\Api\ComparativeController::class, 'generate']);
});

Route::middleware(['auth:sanctum'])->prefix('knowledge')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\KnowledgeController::class, 'index']);
    Route::get('/{id}', [\App\Http\Controllers\Api\KnowledgeController::class, 'show']);
    Route::post('/', [\App\Http\Controllers\Api\KnowledgeController::class, 'store']);
    Route::put('/{id}', [\App\Http\Controllers\Api\KnowledgeController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\KnowledgeController::class, 'destroy']);
    Route::post('/{id}/publish', [\App\Http\Controllers\Api\KnowledgeController::class, 'publish']);
    Route::post('/generate', [\App\Http\Controllers\Api\KnowledgeController::class, 'generate']);
    Route::get('/stats', [\App\Http\Controllers\Api\KnowledgeController::class, 'stats']);
});

Route::middleware(['auth:sanctum'])->prefix('translations')->group(function () {
    Route::post('/{id}/retranslate', [\App\Http\Controllers\Api\TranslationController::class, 'retranslate']);
});

Route::middleware(['auth:sanctum'])->prefix('batches')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\BatchController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\BatchController::class, 'create']);
    Route::get('/{id}', [\App\Http\Controllers\Api\BatchController::class, 'status']);
    Route::post('/{id}/cancel', [\App\Http\Controllers\Api\BatchController::class, 'cancel']);
});

Route::middleware(['auth:sanctum'])->prefix('generate')->group(function () {
    Route::middleware('throttle:60,1')->group(function () {
        Route::post('/article', [GenerationController::class, 'generateArticle']);
        Route::post('/landing', [GenerationController::class, 'generateLanding']);
        Route::post('/comparative', [GenerationController::class, 'generateComparative']);
        Route::post('/bulk', [GenerationController::class, 'generateBulk']);
    });
    Route::post('/estimate', [GenerationController::class, 'estimate']);
});

Route::middleware(['auth:sanctum'])->prefix('queue')->group(function () {
    Route::get('/', [QueueController::class, 'index']);
    Route::get('/stats', [QueueController::class, 'stats']);
    Route::post('/{id}/prioritize', [QueueController::class, 'prioritize']);
    Route::post('/{id}/cancel', [QueueController::class, 'cancel']);
    Route::post('/{id}/retry', [QueueController::class, 'retry']);
});

Route::middleware(['auth:sanctum'])->prefix('coverage')->group(function () {
    Route::get('/by-platform', [\App\Http\Controllers\Api\CoverageController::class, 'byPlatform']);
    Route::get('/by-country', [\App\Http\Controllers\Api\CoverageController::class, 'byCountry']);
    Route::get('/by-theme', [\App\Http\Controllers\Api\CoverageController::class, 'byTheme']);
    Route::get('/gaps', [\App\Http\Controllers\Api\CoverageController::class, 'gaps']);
    Route::get('/heatmap', [\App\Http\Controllers\Api\CoverageController::class, 'heatmap']);
});

Route::middleware(['auth:sanctum'])->prefix('stats')->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\Api\StatsController::class, 'dashboard']);
    Route::get('/costs', [\App\Http\Controllers\Api\StatsController::class, 'costs']);
    Route::get('/production', [\App\Http\Controllers\Api\StatsController::class, 'production']);
    Route::get('/quality', [\App\Http\Controllers\Api\StatsController::class, 'quality']);
});

Route::middleware(['auth:sanctum'])->prefix('themes')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\ThemeController::class, 'index']);
    Route::get('/{id}', [\App\Http\Controllers\Api\ThemeController::class, 'show']);
    Route::post('/', [\App\Http\Controllers\Api\ThemeController::class, 'store']);
    Route::put('/{id}', [\App\Http\Controllers\Api\ThemeController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\ThemeController::class, 'destroy']);
});

Route::middleware(['auth:sanctum'])->prefix('provider-types')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\ProviderTypeController::class, 'index']);
    Route::get('/{id}', [\App\Http\Controllers\Api\ProviderTypeController::class, 'show']);
});

Route::middleware(['auth:sanctum'])->prefix('authors')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\AuthorController::class, 'index']);
    Route::get('/{id}', [\App\Http\Controllers\Api\AuthorController::class, 'show']);
    Route::post('/', [\App\Http\Controllers\Api\AuthorController::class, 'store']);
    Route::put('/{id}', [\App\Http\Controllers\Api\AuthorController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\AuthorController::class, 'destroy']);
});

Route::middleware(['auth:sanctum'])->prefix('affiliates')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\AffiliateController::class, 'index']);
    Route::get('/{id}', [\App\Http\Controllers\Api\AffiliateController::class, 'show']);
    Route::post('/', [\App\Http\Controllers\Api\AffiliateController::class, 'store']);
    Route::put('/{id}', [\App\Http\Controllers\Api\AffiliateController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\AffiliateController::class, 'destroy']);
});

Route::middleware(['auth:sanctum'])->prefix('platforms')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\PlatformController::class, 'index']);
    Route::get('/{id}', [\App\Http\Controllers\Api\PlatformController::class, 'show']);
});

Route::middleware(['auth:sanctum'])->prefix('templates')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\TemplateController::class, 'index']);
    Route::get('/{id}', [\App\Http\Controllers\Api\TemplateController::class, 'show']);
    Route::post('/', [\App\Http\Controllers\Api\TemplateController::class, 'store']);
    Route::put('/{id}', [\App\Http\Controllers\Api\TemplateController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\TemplateController::class, 'destroy']);
});

Route::middleware(['auth:sanctum'])->prefix('countries')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\CountryController::class, 'index']);
    Route::get('/{id}', [\App\Http\Controllers\Api\CountryController::class, 'show']);
});

Route::middleware(['auth:sanctum'])->prefix('languages')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\LanguageController::class, 'index']);
    Route::get('/{id}', [\App\Http\Controllers\Api\LanguageController::class, 'show']);
});

Route::middleware(['auth:sanctum'])->prefix('settings')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\SettingsController::class, 'index']);
    Route::get('/{key}', [\App\Http\Controllers\Api\SettingsController::class, 'show']);
    Route::put('/{key}', [\App\Http\Controllers\Api\SettingsController::class, 'update']);
    Route::post('/bulk-update', [\App\Http\Controllers\Api\SettingsController::class, 'bulkUpdate']);
    Route::get('/publication/config', [\App\Http\Controllers\Api\SettingsController::class, 'publication']);
    Route::get('/landing/config', [\App\Http\Controllers\Api\SettingsController::class, 'landing']);
    Route::get('/images/config', [\App\Http\Controllers\Api\SettingsController::class, 'images']);
});

Route::middleware(['auth:sanctum'])->prefix('platform-knowledge')->group(function () {
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

Route::middleware(['auth:sanctum'])->prefix('brand')->group(function () {
    Route::post('/validate', [BrandValidationController::class, 'validate']);
    Route::get('/stats/{platformId}', [BrandValidationController::class, 'platformStats']);
});

Route::middleware(['auth:sanctum'])->prefix('quality')->group(function () {
    Route::get('/dashboard', [QualityController::class, 'dashboard']);
    Route::get('/checks', [QualityController::class, 'index']);
    Route::post('/checks/{articleId}/revalidate', [QualityController::class, 'revalidate']);
    Route::get('/trends', [QualityController::class, 'trends']);
    Route::get('/criteria-stats', [QualityController::class, 'criteriaStats']);
});

Route::middleware(['auth:sanctum'])->prefix('golden-examples')->group(function () {
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

Route::middleware(['auth:sanctum'])->prefix('feedback')->group(function () {
    Route::post('/analyze', [FeedbackController::class, 'analyze']);
    Route::post('/apply', [FeedbackController::class, 'apply']);
    Route::get('/weekly-report', [FeedbackController::class, 'weeklyReport']);
    Route::get('/recommendations', [FeedbackController::class, 'getRecommendations']);
    Route::post('/clear-cache', [FeedbackController::class, 'clearCache']);
});

Route::middleware(['auth:sanctum'])->prefix('pillars')->group(function () {
    Route::get('schedule', [PillarController::class, 'schedule'])->name('api.pillars.schedule');
    Route::post('generate-manual', [PillarController::class, 'generateManual'])->name('api.pillars.generate-manual');
    Route::get('stats', [PillarController::class, 'stats'])->name('api.pillars.stats');
    Route::get('{id}', [PillarController::class, 'show'])->name('api.pillars.show');
    Route::get('{id}/sources', [PillarController::class, 'sources'])->name('api.pillars.sources');
    Route::get('{id}/statistics', [PillarController::class, 'statistics'])->name('api.pillars.statistics');
});

Route::middleware(['auth:sanctum'])->prefix('press-releases')->group(function () {
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

Route::middleware(['auth:sanctum'])->prefix('dossiers')->group(function () {
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

Route::middleware(['auth:sanctum'])->prefix('export')->group(function () {
    Route::post('/pdf', [ExportApiController::class, 'exportPdf']);
    Route::post('/word', [ExportApiController::class, 'exportWord']);
    Route::post('/bulk', [ExportApiController::class, 'bulkExport']);
    Route::get('/queue', [ExportApiController::class, 'queue']);
    Route::get('/{exportId}/status', [ExportApiController::class, 'status'])->name('api.export.status');
    Route::get('/{exportId}/download', [ExportApiController::class, 'download'])->name('api.export.download');
    Route::delete('/{exportId}/cancel', [ExportApiController::class, 'cancel']);
    Route::delete('/{exportId}', [ExportApiController::class, 'delete']);
});

Route::middleware(['auth:sanctum'])->prefix('research')->group(function () {
    Route::post('/search', [ResearchController::class, 'search'])->name('api.research.search');
    Route::get('/sources', [ResearchController::class, 'sources'])->name('api.research.sources');
    Route::post('/fact-check', [ResearchController::class, 'factCheck'])->name('api.research.fact-check');
    Route::post('/extract-claims', [ResearchController::class, 'extractClaims'])->name('api.research.extract-claims');
    Route::post('/verify-multiple', [ResearchController::class, 'verifyMultiple'])->name('api.research.verify-multiple');
    Route::get('/cache-stats', [ResearchController::class, 'cacheStats'])->name('api.research.cache-stats');
    Route::delete('/cache', [ResearchController::class, 'clearCache'])->middleware('can:manage-settings')->name('api.research.clear-cache');
});

Route::middleware(['auth:sanctum'])->prefix('monitoring')->group(function () {
    Route::get('/costs/daily', [MonitoringController::class, 'dailyCosts'])->name('api.monitoring.costs.daily');
    Route::get('/costs/monthly', [MonitoringController::class, 'monthlyCosts'])->name('api.monitoring.costs.monthly');
    Route::get('/costs/prediction', [MonitoringController::class, 'predictedCosts'])->name('api.monitoring.costs.prediction');
    Route::get('/costs/breakdown', [MonitoringController::class, 'costsBreakdown'])->name('api.monitoring.costs.breakdown');
    Route::get('/alerts', [MonitoringController::class, 'alerts'])->name('api.monitoring.alerts');
    Route::get('/anomalies', [MonitoringController::class, 'anomalies'])->name('api.monitoring.anomalies');
    Route::get('/savings', [MonitoringController::class, 'savings'])->name('api.monitoring.savings');
    Route::get('/performance', [MonitoringController::class, 'performance'])->name('api.monitoring.performance');
    Route::get('/queue', [MonitoringController::class, 'queue'])->name('api.monitoring.queue');
    Route::get('/errors', [MonitoringController::class, 'errors'])->name('api.monitoring.errors');
    Route::get('/health', [MonitoringController::class, 'systemHealth'])->name('api.monitoring.health');
    Route::get('/apis/health', [MonitoringController::class, 'apiHealth'])->name('api.monitoring.apis.health');
    Route::get('/resources', [MonitoringController::class, 'resources'])->name('api.monitoring.resources');
    Route::get('/dashboard', [MonitoringController::class, 'dashboard'])->name('api.monitoring.dashboard');
});

Route::middleware(['auth:sanctum'])->prefix('programs')->group(function () {
    Route::get('/content-types', [ProgramController::class, 'contentTypes']);
    Route::get('/calendar', [ProgramController::class, 'calendar']);
    Route::post('/estimate', [ProgramController::class, 'estimate']);
    Route::get('/', [ProgramController::class, 'index']);
    Route::post('/', [ProgramController::class, 'store']);
    Route::get('/{id}', [ProgramController::class, 'show']);
    Route::put('/{id}', [ProgramController::class, 'update']);
    Route::delete('/{id}', [ProgramController::class, 'destroy']);
    Route::post('/{id}/activate', [ProgramController::class, 'activate']);
    Route::post('/{id}/pause', [ProgramController::class, 'pause']);
    Route::post('/{id}/resume', [ProgramController::class, 'resume']);
    Route::post('/{id}/clone', [ProgramController::class, 'clone']);
    Route::post('/{id}/run', [ProgramController::class, 'run']);
    Route::get('/{id}/analytics', [ProgramController::class, 'analytics']);
    Route::get('/{id}/runs', [ProgramController::class, 'runs']);
    Route::post('/runs/{runId}/cancel', [ProgramController::class, 'cancelRun']);
});

Route::middleware(['auth:sanctum'])->prefix('presets')->group(function () {
    Route::get('/types', [PresetController::class, 'types']);
    Route::get('/defaults', [PresetController::class, 'defaults']);
    Route::get('/', [PresetController::class, 'index']);
    Route::post('/', [PresetController::class, 'store']);
    Route::get('/{id}', [PresetController::class, 'show']);
    Route::put('/{id}', [PresetController::class, 'update']);
    Route::delete('/{id}', [PresetController::class, 'destroy']);
    Route::post('/{id}/duplicate', [PresetController::class, 'duplicate']);
    Route::post('/{id}/set-default', [PresetController::class, 'setDefault']);
});

Route::middleware(['auth:sanctum'])->prefix('expat-domains')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\ExpatDomainController::class, 'index'])->name('api.expat-domains.index');
    Route::get('/{id}', [\App\Http\Controllers\Api\ExpatDomainController::class, 'show'])->name('api.expat-domains.show');
    Route::post('/', [\App\Http\Controllers\Api\ExpatDomainController::class, 'store'])->name('api.expat-domains.store');
    Route::put('/{id}', [\App\Http\Controllers\Api\ExpatDomainController::class, 'update'])->name('api.expat-domains.update');
    Route::delete('/{id}', [\App\Http\Controllers\Api\ExpatDomainController::class, 'destroy'])->name('api.expat-domains.destroy');
});

Route::middleware(['auth:sanctum'])->prefix('lawyer-specialties')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\LawyerSpecialtyController::class, 'index'])->name('api.lawyer-specialties.index');
    Route::get('/{id}', [\App\Http\Controllers\Api\LawyerSpecialtyController::class, 'show'])->name('api.lawyer-specialties.show');
    Route::post('/', [\App\Http\Controllers\Api\LawyerSpecialtyController::class, 'store'])->name('api.lawyer-specialties.store');
    Route::put('/{id}', [\App\Http\Controllers\Api\LawyerSpecialtyController::class, 'update'])->name('api.lawyer-specialties.update');
    Route::delete('/{id}', [\App\Http\Controllers\Api\LawyerSpecialtyController::class, 'destroy'])->name('api.lawyer-specialties.destroy');
});

Route::middleware(['auth:sanctum'])->prefix('testimonials')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\TestimonialController::class, 'index'])->name('api.testimonials.index');
    Route::get('/{id}', [\App\Http\Controllers\Api\TestimonialController::class, 'show'])->name('api.testimonials.show');
    Route::post('/', [\App\Http\Controllers\Api\TestimonialController::class, 'store'])->name('api.testimonials.store');
    Route::put('/{id}', [\App\Http\Controllers\Api\TestimonialController::class, 'update'])->name('api.testimonials.update');
    Route::delete('/{id}', [\App\Http\Controllers\Api\TestimonialController::class, 'destroy'])->name('api.testimonials.destroy');
    Route::post('/{id}/approve', [\App\Http\Controllers\Api\TestimonialController::class, 'approve'])->name('api.testimonials.approve');
    Route::post('/{id}/reject', [\App\Http\Controllers\Api\TestimonialController::class, 'reject'])->name('api.testimonials.reject');
});

Route::middleware(['auth:sanctum'])->prefix('ulixai-services')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\UlixaiServiceController::class, 'index'])->name('api.ulixai-services.index');
    Route::get('/{id}', [\App\Http\Controllers\Api\UlixaiServiceController::class, 'show'])->name('api.ulixai-services.show');
    Route::post('/', [\App\Http\Controllers\Api\UlixaiServiceController::class, 'store'])->name('api.ulixai-services.store');
    Route::put('/{id}', [\App\Http\Controllers\Api\UlixaiServiceController::class, 'update'])->name('api.ulixai-services.update');
    Route::delete('/{id}', [\App\Http\Controllers\Api\UlixaiServiceController::class, 'destroy'])->name('api.ulixai-services.destroy');
    Route::post('/{id}/activate', [\App\Http\Controllers\Api\UlixaiServiceController::class, 'activate'])->name('api.ulixai-services.activate');
    Route::post('/{id}/deactivate', [\App\Http\Controllers\Api\UlixaiServiceController::class, 'deactivate'])->name('api.ulixai-services.deactivate');
});