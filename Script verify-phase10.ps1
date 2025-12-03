# 🔍 SCRIPT DE VÉRIFICATION AUTOMATIQUE - PHASE 10
# Execute dans le dossier du projet : C:\Users\simon\Documents\Projets\generate-blog-ld

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "🔍 VÉRIFICATION AUTOMATIQUE - PHASE 10" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

$errors = 0
$warnings = 0

# ===== NIVEAU 1 : VÉRIFICATIONS DE BASE =====
Write-Host "📁 NIVEAU 1 : Vérifications de base..." -ForegroundColor Yellow
Write-Host ""

# 1.1 Compter les controllers
Write-Host "  → Comptage des controllers..." -NoNewline
$controllerCount = (Get-ChildItem app\Http\Controllers\Api\*.php -ErrorAction SilentlyContinue).Count
if ($controllerCount -eq 19) {
    Write-Host " ✅ $controllerCount controllers" -ForegroundColor Green
} else {
    Write-Host " ❌ $controllerCount controllers (attendu: 19)" -ForegroundColor Red
    $errors++
}

# 1.2 Vérifier absence de fichiers groupés
Write-Host "  → Vérification fichiers groupés..." -NoNewline
$groupedFiles = @(
    "app\Http\Controllers\Api\CoverageStatsControllers.php",
    "app\Http\Controllers\Api\LandingComparativeControllers.php",
    "app\Http\Controllers\Api\TranslationBatchControllers.php",
    "app\Http\Controllers\Api\ResourceControllers.php",
    "app\Http\Controllers\Api\SettingsExportControllers.php"
)
$foundGrouped = 0
foreach ($file in $groupedFiles) {
    if (Test-Path $file) {
        $foundGrouped++
    }
}
if ($foundGrouped -eq 0) {
    Write-Host " ✅ Aucun fichier groupé" -ForegroundColor Green
} else {
    Write-Host " ❌ $foundGrouped fichiers groupés trouvés (à supprimer !)" -ForegroundColor Red
    $errors++
}

# 1.3 Vérifier taille des fichiers corrigés
Write-Host "  → Vérification fichiers corrigés..." -NoNewline
$criticalFiles = @{
    "app\Http\Controllers\Api\CoverageController.php" = 250
    "app\Http\Controllers\Api\StatsController.php" = 200
    "app\Http\Controllers\Api\SettingsController.php" = 150
    "app\Http\Controllers\Api\ExportController.php" = 200
}
$fileErrors = 0
foreach ($file in $criticalFiles.Keys) {
    if (Test-Path $file) {
        $lineCount = (Get-Content $file).Count
        if ($lineCount -lt $criticalFiles[$file]) {
            $fileErrors++
        }
    } else {
        $fileErrors++
    }
}
if ($fileErrors -eq 0) {
    Write-Host " ✅ Tous les fichiers corrects" -ForegroundColor Green
} else {
    Write-Host " ❌ $fileErrors fichiers incomplets" -ForegroundColor Red
    $errors++
}

Write-Host ""

# ===== NIVEAU 2 : VÉRIFICATIONS LARAVEL =====
Write-Host "⚙️  NIVEAU 2 : Vérifications Laravel..." -ForegroundColor Yellow
Write-Host ""

# 2.1 Vérifier l'autoload
Write-Host "  → Test autoload Composer..." -NoNewline
$autoloadOutput = composer dump-autoload 2>&1 | Out-String
if ($autoloadOutput -like "*does not comply with psr-4*") {
    Write-Host " ❌ Erreurs PSR-4 détectées !" -ForegroundColor Red
    $errors++
} else {
    Write-Host " ✅ Autoload OK" -ForegroundColor Green
}

# 2.2 Clear cache
Write-Host "  → Clear cache Laravel..." -NoNewline
php artisan config:clear *>$null
php artisan route:clear *>$null
php artisan cache:clear *>$null
Write-Host " ✅ Cache cleared" -ForegroundColor Green

# 2.3 Compter les routes
Write-Host "  → Comptage des routes..." -NoNewline
$routeOutput = php artisan route:list --path=api 2>&1
$routeCount = ($routeOutput | Measure-Object -Line).Lines
if ($routeCount -ge 70 -and $routeCount -le 90) {
    Write-Host " ✅ $routeCount routes" -ForegroundColor Green
} else {
    Write-Host " ⚠️  $routeCount routes (attendu: 75-85)" -ForegroundColor Yellow
    $warnings++
}

Write-Host ""

# ===== NIVEAU 3 : TESTS API =====
Write-Host "🌐 NIVEAU 3 : Tests API..." -ForegroundColor Yellow
Write-Host ""

Write-Host "  → Vérification serveur..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -TimeoutSec 2 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host " ✅ Serveur accessible" -ForegroundColor Green
        
        # Test quelques endpoints
        Write-Host "  → Test /api/articles..." -NoNewline
        $articlesResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/articles" -TimeoutSec 2 -ErrorAction Stop
        if ($articlesResponse.StatusCode -eq 200) {
            Write-Host " ✅" -ForegroundColor Green
        } else {
            Write-Host " ❌" -ForegroundColor Red
            $errors++
        }
        
        Write-Host "  → Test /api/coverage/by-platform..." -NoNewline
        $coverageResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/coverage/by-platform" -TimeoutSec 2 -ErrorAction Stop
        if ($coverageResponse.StatusCode -eq 200) {
            Write-Host " ✅" -ForegroundColor Green
        } else {
            Write-Host " ❌" -ForegroundColor Red
            $errors++
        }
        
        Write-Host "  → Test /api/stats/dashboard..." -NoNewline
        $statsResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/stats/dashboard" -TimeoutSec 2 -ErrorAction Stop
        if ($statsResponse.StatusCode -eq 200) {
            Write-Host " ✅" -ForegroundColor Green
        } else {
            Write-Host " ❌" -ForegroundColor Red
            $errors++
        }
        
        Write-Host "  → Test /api/settings..." -NoNewline
        $settingsResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/settings" -TimeoutSec 2 -ErrorAction Stop
        if ($settingsResponse.StatusCode -eq 200) {
            Write-Host " ✅" -ForegroundColor Green
        } else {
            Write-Host " ❌" -ForegroundColor Red
            $errors++
        }
    }
} catch {
    Write-Host " ⚠️  Serveur non démarré" -ForegroundColor Yellow
    Write-Host "     Démarrer avec: php artisan serve" -ForegroundColor Gray
    $warnings++
}

Write-Host ""

# ===== RÉSUMÉ =====
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "📊 RÉSUMÉ DE LA VÉRIFICATION" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

if ($errors -eq 0 -and $warnings -eq 0) {
    Write-Host "🎉 PARFAIT ! Aucun problème détecté !" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Niveau 1 : Fichiers OK" -ForegroundColor Green
    Write-Host "✅ Niveau 2 : Laravel OK" -ForegroundColor Green
    Write-Host "✅ Niveau 3 : API OK" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Phase 10 est 100% fonctionnelle !" -ForegroundColor Green
} elseif ($errors -eq 0) {
    Write-Host "⚠️  Vérification OK avec $warnings avertissement(s)" -ForegroundColor Yellow
    Write-Host ""
    if ($warnings -gt 0) {
        Write-Host "Pour tester les API, démarrer le serveur:" -ForegroundColor Yellow
        Write-Host "  php artisan serve" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ $errors erreur(s) et $warnings avertissement(s) détecté(s)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Actions recommandées:" -ForegroundColor Yellow
    Write-Host "  1. Supprimer les fichiers groupés si présents" -ForegroundColor Gray
    Write-Host "  2. Vérifier que les 4 fichiers corrigés sont complets" -ForegroundColor Gray
    Write-Host "  3. Relancer: composer dump-autoload" -ForegroundColor Gray
    Write-Host "  4. Consulter: GUIDE_VERIFICATION_COMPLETE.md" -ForegroundColor Gray
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Retourner le code d'erreur
if ($errors -gt 0) {
    exit 1
} else {
    exit 0
}