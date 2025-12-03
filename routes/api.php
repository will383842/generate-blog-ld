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
use App\Http\Controllers\Api\PillarController; // ✨ PHASE 14
use App\Http\Controllers\Api\PressReleaseController; // ✨ PHASE 15
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

/*
|--------------------------------------------------------------------------
| QUALITY MONITORING - Phase 13
|--------------------------------------------------------------------------
| Système de monitoring qualité, gestion des golden examples et
| analyse des feedbacks pour amélioration continue
|
| Exemples d'utilisation:
| - Dashboard qualité: GET /api/quality/dashboard
| - Revalider article: POST /api/quality/checks/123/revalidate
| - Marquer golden: POST /api/golden-examples/123/mark
| - Analyser feedback: POST /api/feedback/analyze
| - Rapport hebdo: GET /api/feedback/weekly-report
*/

// QUALITY MONITORING
Route::prefix('quality')->group(function () {
    Route::get('/dashboard', [QualityController::class, 'dashboard']);
    Route::get('/checks', [QualityController::class, 'index']);
    Route::post('/checks/{articleId}/revalidate', [QualityController::class, 'revalidate']);
    Route::get('/trends', [QualityController::class, 'trends']);
    Route::get('/criteria-stats', [QualityController::class, 'criteriaStats']);
});

// GOLDEN EXAMPLES
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

// FEEDBACK LOOP
Route::prefix('feedback')->group(function () {
    Route::post('/analyze', [FeedbackController::class, 'analyze']);
    Route::post('/apply', [FeedbackController::class, 'apply']);
    Route::get('/weekly-report', [FeedbackController::class, 'weeklyReport']);
    Route::get('/recommendations', [FeedbackController::class, 'getRecommendations']);
    Route::post('/clear-cache', [FeedbackController::class, 'clearCache']);
});

/*
|--------------------------------------------------------------------------
| ARTICLES PILIERS PREMIUM - Phase 14 ✨
|--------------------------------------------------------------------------
| Gestion des articles piliers premium 3000-5000 mots avec recherche
| approfondie Perplexity, traductions 9 langues et planification automatique
|
| Exemples d'utilisation:
| - Calendrier 30j: GET /api/pillars/schedule?days=30
| - Stats globales: GET /api/pillars/stats
| - Génération manuelle: POST /api/pillars/generate-manual
|   Body: { platform_id: 1, country_id: 215, theme_id: 5, language_id: 1, template_type: "guide_ultime" }
| - Détails article: GET /api/pillars/12345
| - Sources recherche: GET /api/pillars/12345/sources
| - Statistiques article: GET /api/pillars/12345/statistics
|
| Production attendue: 90 piliers/mois × 9 langues = 810 articles/mois
| Coût moyen: ~$28/mois ($0.93/jour)
| Génération automatique: Quotidien à 05:00 via scheduled task
*/
Route::prefix('pillars')->group(function () {
    
    // ---------------------------------------------------------------------
    // GET /api/pillars/schedule
    // ---------------------------------------------------------------------
    // Récupère le calendrier de planification des articles piliers
    // 
    // Query params:
    //   - days (optionnel, défaut: 30) : Nombre de jours à afficher
    // 
    // Response: Array de dates avec articles planifiés par jour
    // Format: [{ date, schedules: [{ id, platform, country, theme, template_type, status }], count }]
    // ---------------------------------------------------------------------
    Route::get('schedule', [PillarController::class, 'schedule'])
        ->name('api.pillars.schedule');
    
    
    // ---------------------------------------------------------------------
    // POST /api/pillars/generate-manual
    // ---------------------------------------------------------------------
    // Génère manuellement un article pilier (hors planning automatique)
    // 
    // Body (JSON):
    // {
    //   "platform_id": 1,           // ID plateforme (Ulixai, SOS-Expat, Ulysse.AI)
    //   "country_id": 215,          // ID pays (ex: 215 = Thailand)
    //   "theme_id": 5,              // ID thème (ex: 5 = Visa)
    //   "language_id": 1,           // ID langue source (1 = français)
    //   "template_type": "guide_ultime"  // Template: guide_ultime, analyse_marche, whitepaper, dossier_thematique, mega_guide_pays
    // }
    // 
    // Response: Article pilier généré avec URL
    // Format: { success, data: { article: {...}, url }, message }
    // 
    // ⚠️ IMPORTANT: Génération prend 3-5 minutes
    // ⚠️ COÛT: ~$0.93 par article (recherche + génération + traductions)
    // ---------------------------------------------------------------------
    Route::post('generate-manual', [PillarController::class, 'generateManual'])
        ->name('api.pillars.generate-manual');
    
    
    // ---------------------------------------------------------------------
    // GET /api/pillars/stats
    // ---------------------------------------------------------------------
    // Récupère les statistiques globales des articles piliers
    // 
    // Response: Statistiques complètes
    // Format: {
    //   schedule: { total, planned, generating, completed, failed },
    //   articles: { total, avg_word_count, total_translations },
    //   by_platform: { Ulixai: 5, "SOS-Expat": 4, "Ulysse.AI": 3 },
    //   recent_pillars: [...]
    // }
    // ---------------------------------------------------------------------
    Route::get('stats', [PillarController::class, 'stats'])
        ->name('api.pillars.stats');
    
    
    // ---------------------------------------------------------------------
    // GET /api/pillars/{id}
    // ---------------------------------------------------------------------
    // Récupère les détails complets d'un article pilier spécifique
    // 
    // Params:
    //   - id : ID de l'article pilier
    // 
    // Response: Détails article + research data
    // Format: {
    //   article: { id, title, content, word_count, platform, country, theme, ... },
    //   research: { sources_count, statistics_count }
    // }
    // ---------------------------------------------------------------------
    Route::get('{id}', [PillarController::class, 'show'])
        ->name('api.pillars.show');
    
    
    // ---------------------------------------------------------------------
    // GET /api/pillars/{id}/sources
    // ---------------------------------------------------------------------
    // Récupère les sources de recherche Perplexity/News utilisées
    // pour générer l'article pilier
    // 
    // Params:
    //   - id : ID de l'article pilier
    // 
    // Response: Liste des sources avec scores de pertinence
    // Format: {
    //   sources: [{ id, source_type, source_title, source_url, relevance_score, content_excerpt, created_at }],
    //   total: 3,
    //   highly_relevant: 2  // score > 80
    // }
    // ---------------------------------------------------------------------
    Route::get('{id}/sources', [PillarController::class, 'sources'])
        ->name('api.pillars.sources');
    
    
    // ---------------------------------------------------------------------
    // GET /api/pillars/{id}/statistics
    // ---------------------------------------------------------------------
    // Récupère les statistiques extraites et sourcées de l'article pilier
    // 
    // Params:
    //   - id : ID de l'article pilier
    // 
    // Response: Liste des statistiques sourcées
    // Format: {
    //   statistics: [{ id, stat_key, stat_value, stat_unit, source_url, verified, created_at }],
    //   total: 15,
    //   verified: 12  // stats avec source URL
    // }
    // ---------------------------------------------------------------------
    Route::get('{id}/statistics', [PillarController::class, 'statistics'])
        ->name('api.pillars.statistics');
});

/*
|--------------------------------------------------------------------------
| VÉRIFICATION ROUTES PILLARS
|--------------------------------------------------------------------------
|
| # Lister toutes les routes API
| php artisan route:list --path=api
|
| # Filtrer routes pillars
| php artisan route:list --path=api/pillars
|
| # Compter routes par préfixe
| php artisan route:list --path=api | grep pillars | wc -l
|
|--------------------------------------------------------------------------
| TESTS ROUTES PILLARS
|--------------------------------------------------------------------------
|
| # Test calendrier (local)
| curl http://localhost:8000/api/pillars/schedule?days=30
|
| # Test stats globales (local)
| curl http://localhost:8000/api/pillars/stats
|
| # Test génération manuelle (local - Postman recommandé)
| POST http://localhost:8000/api/pillars/generate-manual
| Headers: Content-Type: application/json
| Body: {
|   "platform_id": 1,
|   "country_id": 215,
|   "theme_id": 5,
|   "language_id": 1,
|   "template_type": "guide_ultime"
| }
|
| # Test détails article (local)
| curl http://localhost:8000/api/pillars/12345
|
| # Test sources (local)
| curl http://localhost:8000/api/pillars/12345/sources
|
| # Test statistiques (local)
| curl http://localhost:8000/api/pillars/12345/statistics
|
|--------------------------------------------------------------------------
| PROTECTION ROUTES (optionnel)
|--------------------------------------------------------------------------
|
| Si vous voulez protéger les routes pillars avec authentification:
|
| Route::middleware(['auth:sanctum'])->prefix('pillars')->group(function () {
|     // ... toutes les routes pillars ici
| });
|
| Ou uniquement la génération manuelle (pour éviter abus):
|
| Route::post('generate-manual', [PillarController::class, 'generateManual'])
|     ->middleware(['auth:sanctum', 'throttle:5,60'])  // 5 requêtes/heure max
|     ->name('api.pillars.generate-manual');
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| COMMUNIQUÉS DE PRESSE - Phase 15 ✨
|--------------------------------------------------------------------------
| Génération automatique de communiqués de presse multilingues 1-2 pages
| avec photos Unsplash, graphiques QuickChart et export PDF/Word
|
| Fonctionnalités:
| - Génération via GPT-4 avec templates enrichis (5 types × 9 langues)
| - Photos automatiques haute résolution via Unsplash API (gratuit 50 req/h)
| - Graphiques professionnels via QuickChart.io API (gratuit 60 req/min)
| - Export PDF avec DomPDF (design professionnel, support RTL arabe)
| - Export Word avec PHPWord (styles corporatifs, images intégrées)
| - Support complet 9 langues: fr, en, de, es, pt, ru, zh, ar, hi
|
| Types de communiqués:
| - lancement_produit : Annonce nouveau service/produit
| - partenariat : Partenariat stratégique
| - resultats_milestone : Chiffres clés, jalons atteints
| - evenement : Événement, conférence, webinar
| - nomination : Nomination RH, nouvelle recrue
|
| Exemples d'utilisation:
|
| 1. Générer communiqué:
|    POST /api/press-releases/generate
|    Body: {
|      platform_id: 1,
|      template_type: "lancement_produit",
|      language_code: "fr",
|      context: {
|        product_name: "Service Premium",
|        launch_date: "2024-12-15",
|        key_benefits: ["Support 24/7", "197 pays", "< 5 min"],
|        pricing: "Gratuit puis 29€/mois"
|      }
|    }
|
| 2. Ajouter graphique:
|    POST /api/press-releases/{id}/generate-chart
|    Body: {
|      chart_type: "bar",
|      data: {
|        labels: ["2022", "2023", "2024"],
|        values: [1000, 2500, 5000],
|        title: "Croissance utilisateurs"
|      }
|    }
|
| 3. Ajouter photo:
|    POST /api/press-releases/{id}/add-photo
|    Body: {
|      query: "business meeting expats",
|      orientation: "landscape"
|    }
|
| 4. Export PDF:
|    POST /api/press-releases/{id}/export-pdf
|    Response: { download_url: "..." }
|
| 5. Export Word:
|    POST /api/press-releases/{id}/export-word
|    Response: { download_url: "..." }
|
| Production: À la demande (pas de génération automatique quotidienne)
| Coût moyen: ~$0.03/communiqué (GPT-4)
| APIs externes: QuickChart.io (gratuit), Unsplash (gratuit)
| Templates: 45 (5 types × 9 langues) avec instructions qualité détaillées
|
| ⚠️ Configuration requise:
| - Composer: phpoffice/phpword, barryvdh/laravel-dompdf
| - .env: UNSPLASH_ACCESS_KEY (inscription gratuite sur unsplash.com/developers)
| - Migration: php artisan migrate
| - Seeder: php artisan db:seed --class=PressReleaseTemplateSeeder
*/
Route::prefix('press-releases')->group(function () {
    
    // ---------------------------------------------------------------------
    // POST /api/press-releases/generate
    // ---------------------------------------------------------------------
    // Génère un nouveau communiqué de presse à partir d'un template
    // 
    // Body (JSON):
    // {
    //   "platform_id": 1,                    // ID plateforme (Ulixai, SOS-Expat, Ulysse.AI)
    //   "template_type": "lancement_produit", // Type: lancement_produit, partenariat, resultats_milestone, evenement, nomination
    //   "language_code": "fr",                // Langue: fr, en, de, es, pt, ru, zh, ar, hi
    //   "context": {                          // Variables contextuelles
    //     "product_name": "Service Premium",
    //     "launch_date": "2024-12-15",
    //     "key_benefits": ["Bénéfice 1", "Bénéfice 2"],
    //     "pricing": "29€/mois",
    //     "country": "France"
    //   }
    // }
    // 
    // Response: Communiqué généré avec structure complète
    // Format: {
    //   success: true,
    //   message: "Communiqué généré avec succès",
    //   data: {
    //     id, uuid, title, lead, body1, body2, body3, quote,
    //     boilerplate, contact, language_code, status, word_count,
    //     generation_cost, platform, created_at
    //   }
    // }
    // 
    // ⚠️ Génération prend 5-15 secondes selon longueur
    // ⚠️ Coût: ~$0.03 par communiqué (GPT-4)
    // ---------------------------------------------------------------------
    Route::post('/generate', [PressReleaseController::class, 'generate'])
        ->name('api.press-releases.generate');
    
    
    // ---------------------------------------------------------------------
    // GET /api/press-releases
    // ---------------------------------------------------------------------
    // Liste paginée des communiqués avec filtres
    // 
    // Query params:
    //   - platform_id (optionnel) : Filtrer par plateforme
    //   - language_code (optionnel) : Filtrer par langue
    //   - template_type (optionnel) : Filtrer par type
    //   - status (optionnel) : Filtrer par statut (draft, review, published)
    //   - sort_by (optionnel, défaut: created_at) : Champ de tri
    //   - sort_dir (optionnel, défaut: desc) : Direction (asc, desc)
    //   - per_page (optionnel, défaut: 15, max: 100) : Résultats par page
    // 
    // Response: Liste paginée avec relations
    // Format: {
    //   data: [{ id, title, platform, media_count, exports_count, ... }],
    //   current_page, last_page, total, per_page
    // }
    // ---------------------------------------------------------------------
    Route::get('/', [PressReleaseController::class, 'index'])
        ->name('api.press-releases.index');
    
    
    // ---------------------------------------------------------------------
    // GET /api/press-releases/{id}
    // ---------------------------------------------------------------------
    // Détails complets d'un communiqué spécifique
    // 
    // Params:
    //   - id : ID du communiqué (ou UUID)
    // 
    // Response: Détails complets avec relations
    // Format: {
    //   success: true,
    //   data: {
    //     id, uuid, title, lead, body1, body2, body3, quote,
    //     boilerplate, contact, platform, media: [...], exports: [...]
    //   }
    // }
    // ---------------------------------------------------------------------
    Route::get('/{pressRelease}', [PressReleaseController::class, 'show'])
        ->name('api.press-releases.show');
    
    
    // ---------------------------------------------------------------------
    // POST /api/press-releases/{id}/generate-chart
    // ---------------------------------------------------------------------
    // Génère et ajoute un graphique au communiqué
    // 
    // Params:
    //   - id : ID du communiqué
    // 
    // Body (JSON):
    // {
    //   "chart_type": "bar",        // Type: bar, line, pie, doughnut, radar, scatter
    //   "data": {
    //     "labels": ["2022", "2023", "2024"],
    //     "values": [1000, 2500, 5000],
    //     "title": "Croissance utilisateurs",
    //     "label": "Nombre d'utilisateurs"
    //   }
    // }
    // 
    // Response: Media créé avec path du graphique
    // Format: {
    //   success: true,
    //   message: "Graphique généré avec succès",
    //   data: { id, media_type: "chart", file_path, caption, ... }
    // }
    // 
    // ⚠️ API QuickChart.io : 60 requêtes/minute (gratuit)
    // ---------------------------------------------------------------------
    Route::post('/{pressRelease}/generate-chart', [PressReleaseController::class, 'generateChart'])
        ->name('api.press-releases.generate-chart');
    
    
    // ---------------------------------------------------------------------
    // POST /api/press-releases/{id}/add-photo
    // ---------------------------------------------------------------------
    // Recherche et ajoute une photo Unsplash au communiqué
    // 
    // Params:
    //   - id : ID du communiqué
    // 
    // Body (JSON):
    // {
    //   "query": "business meeting expats",    // Mots-clés recherche
    //   "orientation": "landscape"              // orientation: landscape, portrait, squarish
    // }
    // 
    // Response: Media créé avec photo téléchargée
    // Format: {
    //   success: true,
    //   message: "Photo ajoutée avec succès",
    //   data: {
    //     id, media_type: "photo", file_path, caption,
    //     source: "unsplash", metadata: { photographer, ... }
    //   }
    // }
    // 
    // ⚠️ API Unsplash : 50 requêtes/heure (gratuit)
    // ⚠️ Attribution automatique du photographe dans caption
    // ---------------------------------------------------------------------
    Route::post('/{pressRelease}/add-photo', [PressReleaseController::class, 'addPhoto'])
        ->name('api.press-releases.add-photo');
    
    
    // ---------------------------------------------------------------------
    // POST /api/press-releases/{id}/export-pdf
    // ---------------------------------------------------------------------
    // Génère et exporte le communiqué en PDF professionnel
    // 
    // Params:
    //   - id : ID du communiqué
    // 
    // Body (JSON, optionnel):
    // {
    //   "language_code": "fr"  // Langue export (défaut: langue du communiqué)
    // }
    // 
    // Response: Export créé avec URL de téléchargement
    // Format: {
    //   success: true,
    //   message: "PDF généré avec succès",
    //   data: { id, file_name, file_size, file_path, ... },
    //   download_url: "/api/press-releases/{id}/download/{exportId}"
    // }
    // 
    // ⚠️ Support RTL pour arabe
    // ⚠️ Template professionnel : header, logo, sections espacées, footer
    // ⚠️ Images intégrées automatiquement
    // ---------------------------------------------------------------------
    Route::post('/{pressRelease}/export-pdf', [PressReleaseController::class, 'exportPdf'])
        ->name('api.press-releases.export-pdf');
    
    
    // ---------------------------------------------------------------------
    // POST /api/press-releases/{id}/export-word
    // ---------------------------------------------------------------------
    // Génère et exporte le communiqué en document Word (.docx)
    // 
    // Params:
    //   - id : ID du communiqué
    // 
    // Body (JSON, optionnel):
    // {
    //   "language_code": "fr"  // Langue export (défaut: langue du communiqué)
    // }
    // 
    // Response: Export créé avec URL de téléchargement
    // Format: {
    //   success: true,
    //   message: "Document Word généré avec succès",
    //   data: { id, file_name, file_size, file_path, ... },
    //   download_url: "/api/press-releases/{id}/download/{exportId}"
    // }
    // 
    // ⚠️ Support RTL pour arabe
    // ⚠️ Styles corporatifs : titres, paragraphes, citations
    // ⚠️ Images intégrées automatiquement
    // ---------------------------------------------------------------------
    Route::post('/{pressRelease}/export-word', [PressReleaseController::class, 'exportWord'])
        ->name('api.press-releases.export-word');
    
    
    // ---------------------------------------------------------------------
    // GET /api/press-releases/{id}/download/{export}
    // ---------------------------------------------------------------------
    // Télécharge un export (PDF ou Word) du communiqué
    // 
    // Params:
    //   - id : ID du communiqué
    //   - export : ID de l'export
    // 
    // Response: Fichier en download (PDF ou DOCX)
    // 
    // ⚠️ Incrémente automatiquement le compteur de téléchargements
    // ⚠️ Met à jour last_downloaded_at
    // ---------------------------------------------------------------------
    Route::get('/{pressRelease}/download/{export}', [PressReleaseController::class, 'download'])
        ->name('api.press-releases.download');
    
    
    // ---------------------------------------------------------------------
    // POST /api/press-releases/{id}/publish
    // ---------------------------------------------------------------------
    // Publie un communiqué (change status de draft à published)
    // 
    // Params:
    //   - id : ID du communiqué
    // 
    // Response: Communiqué mis à jour
    // Format: {
    //   success: true,
    //   message: "Communiqué publié avec succès",
    //   data: { id, status: "published", published_at, ... }
    // }
    // ---------------------------------------------------------------------
    Route::post('/{pressRelease}/publish', [PressReleaseController::class, 'publish'])
        ->name('api.press-releases.publish');
    
    
    // ---------------------------------------------------------------------
    // DELETE /api/press-releases/{id}
    // ---------------------------------------------------------------------
    // Supprime un communiqué et tous ses médias/exports associés
    // 
    // Params:
    //   - id : ID du communiqué
    // 
    // Response: Confirmation suppression
    // Format: {
    //   success: true,
    //   message: "Communiqué supprimé avec succès"
    // }
    // 
    // ⚠️ Suppression en cascade : médias et fichiers exports supprimés
    // ---------------------------------------------------------------------
    Route::delete('/{pressRelease}', [PressReleaseController::class, 'destroy'])
        ->name('api.press-releases.destroy');
});

/*
|--------------------------------------------------------------------------
| VÉRIFICATION ROUTES PRESS RELEASES
|--------------------------------------------------------------------------
|
| # Lister toutes les routes API
| php artisan route:list --path=api
|
| # Filtrer routes press-releases
| php artisan route:list --path=api/press-releases
|
| # Compter routes par préfixe
| php artisan route:list --path=api | grep press-releases | wc -l
|
|--------------------------------------------------------------------------
| TESTS ROUTES PRESS RELEASES
|--------------------------------------------------------------------------
|
| # Test liste communiqués (local)
| curl http://localhost:8000/api/press-releases
|
| # Test génération (Postman recommandé)
| POST http://localhost:8000/api/press-releases/generate
| Headers: Content-Type: application/json
| Body: {
|   "platform_id": 1,
|   "template_type": "lancement_produit",
|   "language_code": "fr",
|   "context": {
|     "product_name": "Service Premium",
|     "launch_date": "2024-12-15"
|   }
| }
|
| # Test ajout graphique (Postman)
| POST http://localhost:8000/api/press-releases/123/generate-chart
| Body: {
|   "chart_type": "bar",
|   "data": {
|     "labels": ["2022", "2023", "2024"],
|     "values": [1000, 2500, 5000],
|     "title": "Croissance"
|   }
| }
|
| # Test export PDF
| POST http://localhost:8000/api/press-releases/123/export-pdf
|
| # Test téléchargement
| curl http://localhost:8000/api/press-releases/123/download/456 --output communique.pdf
|
|--------------------------------------------------------------------------
| PROTECTION ROUTES (optionnel)
|--------------------------------------------------------------------------
|
| Si vous voulez protéger les routes press-releases avec authentification:
|
| Route::middleware(['auth:sanctum'])->prefix('press-releases')->group(function () {
|     // ... toutes les routes press-releases ici
| });
|
| Ou uniquement la génération (pour éviter abus):
|
| Route::post('/generate', [PressReleaseController::class, 'generate'])
|     ->middleware(['auth:sanctum', 'throttle:10,60'])  // 10 requêtes/heure max
|     ->name('api.press-releases.generate');
|
|--------------------------------------------------------------------------
*/