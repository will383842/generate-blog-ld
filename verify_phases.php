<?php

echo "\n";
echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║     CONTENT ENGINE V9.4 - VERIFICATION PHASES 1 & 2       ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n\n";

$errors = [];
$warnings = [];

// ═══════════════════════════════════════════════════════════════
// PHASE 1 : INFRASTRUCTURE DE BASE
// ═══════════════════════════════════════════════════════════════
echo "═══════════════════════════════════════════════════════════════\n";
echo "                    PHASE 1 : INFRASTRUCTURE\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

// 1.1 Tables système Laravel
echo "📦 1.1 Tables système Laravel\n";
$systemTables = ['users', 'cache', 'cache_locks', 'jobs', 'job_batches', 'failed_jobs', 'sessions', 'password_reset_tokens'];
foreach ($systemTables as $table) {
    if (Schema::hasTable($table)) {
        echo "   ✅ $table\n";
    } else {
        echo "   ❌ $table MANQUANTE\n";
        $errors[] = "Table système manquante: $table";
    }
}

// 1.2 Tables Spatie Permissions
echo "\n📦 1.2 Tables Spatie Permissions\n";
$permissionTables = ['permissions', 'roles', 'model_has_permissions', 'model_has_roles', 'role_has_permissions'];
foreach ($permissionTables as $table) {
    if (Schema::hasTable($table)) {
        $count = DB::table($table)->count();
        echo "   ✅ $table ($count)\n";
    } else {
        echo "   ❌ $table MANQUANTE\n";
        $errors[] = "Table permission manquante: $table";
    }
}

// 1.3 Tables admin
echo "\n📦 1.3 Tables administration\n";
$adminTables = ['admin_users', 'personal_access_tokens', 'settings'];
foreach ($adminTables as $table) {
    if (Schema::hasTable($table)) {
        $count = DB::table($table)->count();
        echo "   ✅ $table ($count)\n";
    } else {
        echo "   ❌ $table MANQUANTE\n";
        $errors[] = "Table admin manquante: $table";
    }
}

// 1.4 Vérification AdminUser
echo "\n👤 1.4 Utilisateur Admin\n";
$admin = App\Models\AdminUser::first();
if ($admin) {
    echo "   ✅ Admin: {$admin->name} ({$admin->email})\n";
    $roles = $admin->roles->pluck('name')->implode(', ');
    if ($roles) {
        echo "   ✅ Rôles: $roles\n";
    } else {
        echo "   ⚠️ Aucun rôle assigné\n";
        $warnings[] = "Admin sans rôle";
    }
} else {
    echo "   ❌ Aucun admin créé\n";
    $errors[] = "Aucun utilisateur admin";
}

// ═══════════════════════════════════════════════════════════════
// PHASE 2 : DONNÉES DE RÉFÉRENCE
// ═══════════════════════════════════════════════════════════════
echo "\n═══════════════════════════════════════════════════════════════\n";
echo "                 PHASE 2 : DONNÉES DE RÉFÉRENCE\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

// 2.1 Tables de référence géographique
echo "🌍 2.1 Données géographiques\n";
$geoData = [
    'languages' => ['min' => 9, 'label' => 'Langues'],
    'regions' => ['min' => 5, 'label' => 'Régions'],
    'currencies' => ['min' => 30, 'label' => 'Devises'],
    'countries' => ['min' => 50, 'label' => 'Pays'],
    'timezones' => ['min' => 40, 'label' => 'Fuseaux horaires'],
    'country_language' => ['min' => 100, 'label' => 'Relations pays-langues'],
];
foreach ($geoData as $table => $config) {
    if (Schema::hasTable($table)) {
        $count = DB::table($table)->count();
        $status = $count >= $config['min'] ? '✅' : '⚠️';
        echo "   $status {$config['label']}: $count\n";
        if ($count < $config['min']) {
            $warnings[] = "{$config['label']}: seulement $count (attendu >= {$config['min']})";
        }
    } else {
        echo "   ❌ {$config['label']}: TABLE MANQUANTE\n";
        $errors[] = "Table manquante: $table";
    }
}

// 2.2 Tables plateformes
echo "\n🏢 2.2 Plateformes\n";
if (Schema::hasTable('platforms')) {
    $platforms = DB::table('platforms')->get();
    echo "   ✅ Plateformes: {$platforms->count()}\n";
    foreach ($platforms as $p) {
        echo "      - {$p->name} ({$p->slug})\n";
    }
} else {
    echo "   ❌ Table platforms MANQUANTE\n";
    $errors[] = "Table platforms manquante";
}

// 2.3 Tables métier
echo "\n💼 2.3 Données métier\n";
$businessData = [
    'themes' => ['min' => 10, 'label' => 'Thèmes'],
    'provider_types' => ['min' => 10, 'label' => 'Types prestataires'],
    'lawyer_specialties' => ['min' => 50, 'label' => 'Spécialités avocats'],
    'expat_domains' => ['min' => 20, 'label' => 'Domaines expat'],
    'ulixai_services' => ['min' => 200, 'label' => 'Services Ulixai'],
];
foreach ($businessData as $table => $config) {
    if (Schema::hasTable($table)) {
        $count = DB::table($table)->count();
        $status = $count >= $config['min'] ? '✅' : '⚠️';
        echo "   $status {$config['label']}: $count\n";
        if ($count < $config['min']) {
            $warnings[] = "{$config['label']}: seulement $count (attendu >= {$config['min']})";
        }
    } else {
        echo "   ❌ {$config['label']}: TABLE MANQUANTE\n";
        $errors[] = "Table manquante: $table";
    }
}

// 2.4 Structure hiérarchique Ulixai
echo "\n🛠️ 2.4 Hiérarchie Services Ulixai\n";
if (Schema::hasTable('ulixai_services')) {
    $l1 = DB::table('ulixai_services')->whereNull('parent_id')->count();
    $l2 = DB::table('ulixai_services')->where('level', 2)->count();
    $l3 = DB::table('ulixai_services')->where('level', 3)->count();
    echo "   ✅ Level 1 (catégories): $l1\n";
    echo "   ✅ Level 2 (sous-catégories): $l2\n";
    echo "   ✅ Level 3 (services): $l3\n";
}

// 2.5 Templates
echo "\n📝 2.5 Templates\n";
$templateData = [
    'templates' => ['min' => 5, 'label' => 'Templates articles'],
    'title_templates' => ['min' => 20, 'label' => 'Templates titres'],
    'prompt_templates' => ['min' => 5, 'label' => 'Prompts IA'],
    'cta_templates' => ['min' => 30, 'label' => 'Templates CTA'],
];
foreach ($templateData as $table => $config) {
    if (Schema::hasTable($table)) {
        $count = DB::table($table)->count();
        $status = $count >= $config['min'] ? '✅' : '⚠️';
        echo "   $status {$config['label']}: $count\n";
    } else {
        echo "   ❌ {$config['label']}: TABLE MANQUANTE\n";
        $errors[] = "Table manquante: $table";
    }
}

// 2.6 Monétisation
echo "\n💰 2.6 Monétisation & Auteurs\n";
$monetData = [
    'affiliate_links' => ['min' => 50, 'label' => 'Liens affiliés'],
    'authors' => ['min' => 3, 'label' => 'Auteurs E-E-A-T'],
];
foreach ($monetData as $table => $config) {
    if (Schema::hasTable($table)) {
        $count = DB::table($table)->count();
        $status = $count >= $config['min'] ? '✅' : '⚠️';
        echo "   $status {$config['label']}: $count\n";
    } else {
        echo "   ❌ {$config['label']}: TABLE MANQUANTE\n";
        $errors[] = "Table manquante: $table";
    }
}

// 2.7 Tables articles (structure)
echo "\n📰 2.7 Structure Articles\n";
$articleTables = ['articles', 'article_translations', 'article_faqs', 'internal_links', 'external_links', 'article_sources'];
foreach ($articleTables as $table) {
    if (Schema::hasTable($table)) {
        echo "   ✅ $table\n";
    } else {
        echo "   ❌ $table MANQUANTE\n";
        $errors[] = "Table article manquante: $table";
    }
}

// 2.8 Tables génération
echo "\n⚙️ 2.8 Tables Génération\n";
$genTables = ['generation_logs', 'generation_queues', 'api_costs', 'coverage_progress', 'indexing_queue'];
foreach ($genTables as $table) {
    if (Schema::hasTable($table)) {
        echo "   ✅ $table\n";
    } else {
        echo "   ❌ $table MANQUANTE\n";
        $errors[] = "Table génération manquante: $table";
    }
}

// 2.9 Tables traductions
echo "\n🌐 2.9 Tables Traductions\n";
$transTables = ['country_translations', 'theme_translations', 'provider_type_translations', 'lawyer_specialty_translations', 'expat_domain_translations', 'ulixai_service_translations'];
foreach ($transTables as $table) {
    if (Schema::hasTable($table)) {
        echo "   ✅ $table\n";
    } else {
        echo "   ❌ $table MANQUANTE\n";
        $errors[] = "Table traduction manquante: $table";
    }
}

// 2.10 Test relations
echo "\n🔗 2.10 Test Relations\n";
try {
    $france = App\Models\Country::where('code', 'FR')->first();
    if ($france) {
        echo "   ✅ France trouvée: {$france->name_fr}\n";
        $langs = $france->languages->pluck('code')->implode(', ');
        echo "   ✅ Langues France: $langs\n";
        echo "   ✅ Région: {$france->region->name}\n";
        echo "   ✅ Devise: {$france->currency->code}\n";
    }
} catch (Exception $e) {
    echo "   ❌ Erreur relations: {$e->getMessage()}\n";
    $errors[] = "Erreur relations Country: {$e->getMessage()}";
}

// ═══════════════════════════════════════════════════════════════
// RÉSUMÉ
// ═══════════════════════════════════════════════════════════════
echo "\n═══════════════════════════════════════════════════════════════\n";
echo "                         RÉSUMÉ\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

$totalTables = count(DB::select('SHOW TABLES'));
echo "📊 Total tables: $totalTables\n\n";

if (empty($errors) && empty($warnings)) {
    echo "╔════════════════════════════════════════════════════════════╗\n";
    echo "║          ✅ PHASES 1 & 2 : 100% VALIDÉES                  ║\n";
    echo "╚════════════════════════════════════════════════════════════╝\n";
} else {
    if (!empty($errors)) {
        echo "❌ ERREURS (" . count($errors) . "):\n";
        foreach ($errors as $e) {
            echo "   - $e\n";
        }
        echo "\n";
    }
    if (!empty($warnings)) {
        echo "⚠️ AVERTISSEMENTS (" . count($warnings) . "):\n";
        foreach ($warnings as $w) {
            echo "   - $w\n";
        }
    }
}

echo "\n";