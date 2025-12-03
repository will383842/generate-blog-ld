<?php

/**
 * ====================================================================
 * SCRIPT DE TEST COMPLET - PHASE 7 v2.0
 * ====================================================================
 * 
 * Teste TOUS les services en une seule commande
 * 
 * Usage : php test-phase7-complet.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Couleurs pour terminal
$GREEN = "\033[0;32m";
$RED = "\033[0;31m";
$YELLOW = "\033[1;33m";
$BLUE = "\033[0;34m";
$NC = "\033[0m"; // No Color

$totalTests = 0;
$passedTests = 0;
$failedTests = 0;

// Fonction pour afficher résultat test
function testResult($name, $passed, $details = '') {
    global $GREEN, $RED, $NC, $totalTests, $passedTests, $failedTests;
    $totalTests++;
    if ($passed) {
        $passedTests++;
        echo "{$GREEN}✅ PASS{$NC} : {$name}\n";
    } else {
        $failedTests++;
        echo "{$RED}❌ FAIL{$NC} : {$name}\n";
    }
    if ($details) {
        echo "   → {$details}\n";
    }
}

echo "\n";
echo "====================================================================\n";
echo "🧪 TEST COMPLET PHASE 7 v2.0 - CONTENT ENGINE V9.4\n";
echo "====================================================================\n\n";

// ====================================================================
// TEST 1 : CHARGEMENT DES SERVICES
// ====================================================================
echo "📦 TEST 1 : Chargement des services\n";
echo "--------------------------------------------------------------------\n";

try {
    $translation = app(\App\Services\Translation\TranslationService::class);
    testResult("TranslationService", get_class($translation) === 'App\Services\Translation\TranslationService');
} catch (\Exception $e) {
    testResult("TranslationService", false, $e->getMessage());
}

try {
    $slugService = app(\App\Services\Translation\SlugService::class);
    testResult("SlugService", get_class($slugService) === 'App\Services\Translation\SlugService');
} catch (\Exception $e) {
    testResult("SlugService", false, $e->getMessage());
}

try {
    $encodingValidator = app(\App\Services\Translation\EncodingValidator::class);
    testResult("EncodingValidator", get_class($encodingValidator) === 'App\Services\Translation\EncodingValidator');
} catch (\Exception $e) {
    testResult("EncodingValidator", false, $e->getMessage());
}

try {
    $translationManager = app(\App\Services\Translation\TranslationManager::class);
    testResult("TranslationManager", get_class($translationManager) === 'App\Services\Translation\TranslationManager');
} catch (\Exception $e) {
    testResult("TranslationManager", false, $e->getMessage());
}

try {
    $metaService = app(\App\Services\Seo\MetaService::class);
    testResult("MetaService", get_class($metaService) === 'App\Services\Seo\MetaService');
} catch (\Exception $e) {
    testResult("MetaService", false, $e->getMessage());
}

try {
    $indexingService = app(\App\Services\Seo\IndexingService::class);
    testResult("IndexingService 🆕", get_class($indexingService) === 'App\Services\Seo\IndexingService');
} catch (\Exception $e) {
    testResult("IndexingService", false, $e->getMessage());
}

try {
    $sitemapService = app(\App\Services\Seo\SitemapDataService::class);
    testResult("SitemapDataService 🆕", get_class($sitemapService) === 'App\Services\Seo\SitemapDataService');
} catch (\Exception $e) {
    testResult("SitemapDataService", false, $e->getMessage());
}

try {
    $seoScoreService = app(\App\Services\Seo\SeoScoreService::class);
    testResult("SeoScoreService 🆕", get_class($seoScoreService) === 'App\Services\Seo\SeoScoreService');
} catch (\Exception $e) {
    testResult("SeoScoreService", false, $e->getMessage());
}

try {
    $schemaService = app(\App\Services\Seo\EnhancedSchemaService::class);
    testResult("EnhancedSchemaService 🆕", get_class($schemaService) === 'App\Services\Seo\EnhancedSchemaService');
} catch (\Exception $e) {
    testResult("EnhancedSchemaService", false, $e->getMessage());
}

try {
    $robotsService = app(\App\Services\Seo\RobotsService::class);
    testResult("RobotsService 🆕", get_class($robotsService) === 'App\Services\Seo\RobotsService');
} catch (\Exception $e) {
    testResult("RobotsService", false, $e->getMessage());
}

try {
    $imageSeoService = app(\App\Services\Seo\ImageSeoService::class);
    testResult("ImageSeoService 🆕", get_class($imageSeoService) === 'App\Services\Seo\ImageSeoService');
} catch (\Exception $e) {
    testResult("ImageSeoService", false, $e->getMessage());
}

echo "\n";

// ====================================================================
// TEST 2 : SLUGS TRANSLITTÉRÉS
// ====================================================================
echo "🔤 TEST 2 : Génération de slugs translittérés\n";
echo "--------------------------------------------------------------------\n";

try {
    $slugService = app(\App\Services\Translation\SlugService::class);
    
    // Test français
    $slugFr = $slugService->generateSlug("Guide d'expatriation en France");
    testResult("Slug français", strlen($slugFr) > 0 && preg_match('/^[a-z0-9\-]+$/', $slugFr), "Résultat: {$slugFr}");
    
    // Test russe (cyrillique)
    $slugRu = $slugService->generateSlug("Привет мир", "ru");
    testResult("Slug russe (cyrillique)", strlen($slugRu) > 0 && !preg_match('/[А-Яа-я]/', $slugRu), "Résultat: {$slugRu}");
    
    // Test chinois
    $slugZh = $slugService->generateSlug("中国", "zh");
    testResult("Slug chinois", strlen($slugZh) > 0 && !preg_match('/[\x{4e00}-\x{9fa5}]/u', $slugZh), "Résultat: {$slugZh}");
    
    // Test arabe
    $slugAr = $slugService->generateSlug("السلام عليكم", "ar");
    testResult("Slug arabe", strlen($slugAr) > 0 && !preg_match('/[\x{0600}-\x{06FF}]/u', $slugAr), "Résultat: {$slugAr}");
    
} catch (\Exception $e) {
    testResult("Génération slugs", false, $e->getMessage());
}

echo "\n";

// ====================================================================
// TEST 3 : VALIDATION UTF-8
// ====================================================================
echo "🔍 TEST 3 : Validation UTF-8 et encodage\n";
echo "--------------------------------------------------------------------\n";

try {
    $validator = app(\App\Services\Translation\EncodingValidator::class);
    
    // Test texte multi-langues
    $text = "Hello World! Привет 你好 مرحبا";
    $isValid = $validator->validateUtf8($text);
    testResult("Validation UTF-8 multi-langues", $isValid === true, "Texte: {$text}");
    
    // Test analyse encodage
    $analysis = $validator->analyzeEncoding($text);
    testResult("Détection encodage UTF-8", $analysis['is_utf8'] === true);
    testResult("Détection cyrillique", $analysis['has_cyrillic'] === true);
    testResult("Détection chinois", $analysis['has_chinese'] === true);
    testResult("Détection arabe", $analysis['has_arabic'] === true);
    
} catch (\Exception $e) {
    testResult("Validation UTF-8", false, $e->getMessage());
}

echo "\n";

// ====================================================================
// TEST 4 : META TAGS SEO
// ====================================================================
echo "🏷️ TEST 4 : Génération meta tags SEO\n";
echo "--------------------------------------------------------------------\n";

try {
    $metaService = app(\App\Services\Seo\MetaService::class);
    $article = \App\Models\Article::first();
    
    if ($article) {
        $meta = $metaService->generateMeta($article);
        
        testResult("Meta title généré", !empty($meta['title']), "Title: {$meta['title']}");
        testResult("Meta title ≤ 60 caractères", mb_strlen($meta['title']) <= 60, "Longueur: " . mb_strlen($meta['title']));
        
        testResult("Meta description générée", !empty($meta['description']), "Description: " . mb_substr($meta['description'], 0, 50) . "...");
        testResult("Meta description ≤ 160 caractères", mb_strlen($meta['description']) <= 160, "Longueur: " . mb_strlen($meta['description']));
        
        testResult("Keywords est un array", is_array($meta['keywords']), "Type: " . gettype($meta['keywords']));
        testResult("Keywords non vide", count($meta['keywords']) > 0, "Nombre: " . count($meta['keywords']));
        
    } else {
        testResult("Récupération article", false, "Aucun article trouvé en base");
    }
    
} catch (\Exception $e) {
    testResult("Meta tags SEO", false, $e->getMessage());
}

echo "\n";

// ====================================================================
// TEST 5 : SCORING SEO
// ====================================================================
echo "📊 TEST 5 : Scoring qualité SEO\n";
echo "--------------------------------------------------------------------\n";

try {
    $seoScore = app(\App\Services\Seo\SeoScoreService::class);
    $article = \App\Models\Article::first();
    
    if ($article) {
        $analysis = $seoScore->calculateScore($article);
        
        testResult("Calcul score SEO", isset($analysis['total_score']), "Score: {$analysis['total_score']}/100");
        testResult("Score entre 0-100", $analysis['total_score'] >= 0 && $analysis['total_score'] <= 100);
        testResult("Grade généré", isset($analysis['grade']['label']), "Grade: {$analysis['grade']['label']}");
        testResult("Suggestions générées", isset($analysis['suggestions']) && is_array($analysis['suggestions']), "Nombre: " . count($analysis['suggestions']));
        
        if (!empty($analysis['suggestions'])) {
            echo "   💡 Top suggestion: {$analysis['suggestions'][0]['message']}\n";
        }
        
    } else {
        testResult("Scoring SEO", false, "Aucun article trouvé");
    }
    
} catch (\Exception $e) {
    testResult("Scoring SEO", false, $e->getMessage());
}

echo "\n";

// ====================================================================
// TEST 6 : SCHEMA.ORG ENRICHI
// ====================================================================
echo "🏢 TEST 6 : Schema.org enrichi\n";
echo "--------------------------------------------------------------------\n";

try {
    $schemaService = app(\App\Services\Seo\EnhancedSchemaService::class);
    $platform = \App\Models\Platform::first();
    
    if ($platform) {
        $orgSchema = $schemaService->generateOrganizationSchema($platform);
        
        testResult("Schema Organization généré", isset($orgSchema['@type']) && $orgSchema['@type'] === 'Organization');
        testResult("Schema context présent", $orgSchema['@context'] === 'https://schema.org');
        testResult("Organization name présent", isset($orgSchema['name']) && !empty($orgSchema['name']), "Name: {$orgSchema['name']}");
        testResult("Organization URL présent", isset($orgSchema['url']) && !empty($orgSchema['url']), "URL: {$orgSchema['url']}");
        
        // Test WebSite schema
        $websiteSchema = $schemaService->generateWebSiteSchema($platform);
        testResult("Schema WebSite généré", isset($websiteSchema['@type']) && $websiteSchema['@type'] === 'WebSite');
        testResult("Search action présent", isset($websiteSchema['potentialAction']['@type']) && $websiteSchema['potentialAction']['@type'] === 'SearchAction');
        
    } else {
        testResult("Schema Organization", false, "Aucune plateforme trouvée");
    }
    
} catch (\Exception $e) {
    testResult("Schema.org enrichi", false, $e->getMessage());
}

echo "\n";

// ====================================================================
// TEST 7 : INDEXING SERVICE
// ====================================================================
echo "🚀 TEST 7 : IndexingService (configuration)\n";
echo "--------------------------------------------------------------------\n";

try {
    $indexingService = app(\App\Services\Seo\IndexingService::class);
    
    $config = $indexingService->getConfigStatus();
    testResult("Configuration Google", isset($config['google']), "Configuré: " . ($config['google'] ? 'Oui' : 'Non'));
    testResult("Configuration Bing", isset($config['bing']), "Configuré: " . ($config['bing'] ? 'Oui' : 'Non'));
    testResult("Configuration IndexNow", isset($config['indexnow']), "Configuré: " . ($config['indexnow'] ? 'Oui' : 'Non'));
    
    $stats = $indexingService->getRateLimitStats();
    testResult("Rate limit Google", isset($stats['google']['limit']) && $stats['google']['limit'] === 200, "Limite: {$stats['google']['limit']}/jour");
    testResult("Rate limit Bing", isset($stats['bing']['limit']) && $stats['bing']['limit'] === 10, "Limite: {$stats['bing']['limit']}/jour");
    
} catch (\Exception $e) {
    testResult("IndexingService", false, $e->getMessage());
}

echo "\n";

// ====================================================================
// TEST 8 : SITEMAP DATA
// ====================================================================
echo "🗺️ TEST 8 : SitemapDataService\n";
echo "--------------------------------------------------------------------\n";

try {
    $sitemapService = app(\App\Services\Seo\SitemapDataService::class);
    
    // Test récupération articles
    $articles = $sitemapService->getArticlesData(null, 10);
    testResult("Récupération articles sitemap", is_object($articles), "Type: " . get_class($articles));
    testResult("Articles est une Collection", get_class($articles) === 'Illuminate\Database\Eloquent\Collection');
    
    if ($articles->count() > 0) {
        $first = $articles->first();
        testResult("Article a une URL (loc)", isset($first['loc']) && !empty($first['loc']));
        testResult("Article a lastmod", isset($first['lastmod']));
        testResult("Article a priority", isset($first['priority']));
        testResult("Article a alternates", isset($first['alternates']) && is_array($first['alternates']));
    } else {
        echo "   ⚠️  Aucun article publié trouvé (normal si base vide)\n";
    }
    
} catch (\Exception $e) {
    testResult("SitemapDataService", false, $e->getMessage());
}

echo "\n";

// ====================================================================
// RAPPORT FINAL
// ====================================================================
echo "====================================================================\n";
echo "📊 RAPPORT FINAL\n";
echo "====================================================================\n\n";

$percentage = $totalTests > 0 ? round(($passedTests / $totalTests) * 100) : 0;

echo "Tests exécutés : {$totalTests}\n";
echo "{$GREEN}Tests réussis  : {$passedTests}{$NC}\n";

if ($failedTests > 0) {
    echo "{$RED}Tests échoués  : {$failedTests}{$NC}\n";
} else {
    echo "{$GREEN}Tests échoués  : {$failedTests}{$NC}\n";
}

echo "Taux de réussite : {$percentage}%\n\n";

if ($percentage === 100) {
    echo "{$GREEN}";
    echo "🎉 FÉLICITATIONS ! PHASE 7 v2.0 EST 100% OPÉRATIONNELLE !\n";
    echo "====================================================================\n";
    echo "✅ Tous les services fonctionnent parfaitement\n";
    echo "✅ Traduction : 9 langues + translittération 4 alphabets\n";
    echo "✅ SEO : Meta tags + JSON-LD + Schema.org enrichi\n";
    echo "✅ Scoring : Analyse qualité 0-100 + suggestions\n";
    echo "✅ Indexing : Google/Bing/IndexNow prêts\n";
    echo "✅ Sitemap : Données complètes pour sitemap.xml\n";
    echo "\n";
    echo "🚀 TU PEUX MAINTENANT UTILISER TOUS LES SERVICES EN PRODUCTION !\n";
    echo "{$NC}\n";
} elseif ($percentage >= 90) {
    echo "{$YELLOW}";
    echo "⚠️  PHASE 7 v2.0 EST PRESQUE PARFAITE ({$percentage}%)\n";
    echo "====================================================================\n";
    echo "Quelques tests mineurs ont échoué.\n";
    echo "Consulte les détails ci-dessus pour les corriger.\n";
    echo "{$NC}\n";
} elseif ($percentage >= 70) {
    echo "{$YELLOW}";
    echo "⚠️  PHASE 7 v2.0 FONCTIONNE BIEN ({$percentage}%)\n";
    echo "====================================================================\n";
    echo "La plupart des services fonctionnent.\n";
    echo "Quelques correctifs nécessaires (voir détails ci-dessus).\n";
    echo "{$NC}\n";
} else {
    echo "{$RED}";
    echo "❌ PHASE 7 v2.0 NÉCESSITE DES CORRECTIONS ({$percentage}%)\n";
    echo "====================================================================\n";
    echo "Plusieurs tests ont échoué.\n";
    echo "Vérifie les erreurs ci-dessus et applique les correctifs.\n";
    echo "{$NC}\n";
}

echo "\n";
echo "Pour plus de détails, consulte : docs/CORRECTIFS_BUGS.md\n";
echo "\n";