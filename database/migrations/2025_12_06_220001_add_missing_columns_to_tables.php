<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration pour ajouter les colonnes manquantes identifiées lors de l'audit
 *
 * Tables concernées:
 * - linking_rules: 9 colonnes
 * - affiliate_links: renommages + 8 colonnes
 * - manual_titles: 2 colonnes
 * - link_discovery_cache: 4 colonnes
 */
return new class extends Migration
{
    public function up(): void
    {
        // ================================================================
        // 1. LINKING_RULES - Renommages + Colonnes manquantes
        // ================================================================

        // Renommer les colonnes pour correspondre au Model
        Schema::table('linking_rules', function (Blueprint $table) {
            if (Schema::hasColumn('linking_rules', 'affiliate_max_per_article') &&
                !Schema::hasColumn('linking_rules', 'max_affiliate_per_article')) {
                $table->renameColumn('affiliate_max_per_article', 'max_affiliate_per_article');
            }
            if (Schema::hasColumn('linking_rules', 'auto_affiliate_injection') &&
                !Schema::hasColumn('linking_rules', 'enable_affiliate_injection')) {
                $table->renameColumn('auto_affiliate_injection', 'enable_affiliate_injection');
            }
        });

        // Ajouter les colonnes manquantes
        Schema::table('linking_rules', function (Blueprint $table) {
            if (!Schema::hasColumn('linking_rules', 'language_code')) {
                $table->string('language_code', 5)->nullable()->after('platform_id')
                      ->comment('Code langue pour règles spécifiques');
            }

            if (!Schema::hasColumn('linking_rules', 'exclude_intro')) {
                $table->boolean('exclude_intro')->default(true)->after('max_links_per_paragraph')
                      ->comment('Exclure intro des liens');
            }

            if (!Schema::hasColumn('linking_rules', 'exclude_conclusion')) {
                $table->boolean('exclude_conclusion')->default(true)->after('exclude_intro')
                      ->comment('Exclure conclusion des liens');
            }

            if (!Schema::hasColumn('linking_rules', 'allowed_anchor_types')) {
                $table->json('allowed_anchor_types')->nullable()->after('exclude_conclusion')
                      ->comment('Types ancres autorisées');
            }

            if (!Schema::hasColumn('linking_rules', 'min_authority_score')) {
                $table->unsignedTinyInteger('min_authority_score')->default(60)->after('allowed_anchor_types')
                      ->comment('Score minimum domaine');
            }

            if (!Schema::hasColumn('linking_rules', 'enable_pillar_linking')) {
                $table->boolean('enable_pillar_linking')->default(true)->after('min_authority_score')
                      ->comment('Activer maillage piliers');
            }

            if (!Schema::hasColumn('linking_rules', 'enable_auto_discovery')) {
                $table->boolean('enable_auto_discovery')->default(true)->after('enable_affiliate_injection')
                      ->comment('Activer découverte auto');
            }

            if (!Schema::hasColumn('linking_rules', 'custom_rules')) {
                $table->json('custom_rules')->nullable()->after('enable_auto_discovery')
                      ->comment('Règles personnalisées JSON');
            }

            if (!Schema::hasColumn('linking_rules', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('custom_rules')
                      ->comment('Statut actif');
            }
        });

        // ================================================================
        // 2. AFFILIATE_LINKS - Colonnes manquantes + renommages
        // ================================================================
        Schema::table('affiliate_links', function (Blueprint $table) {
            // Renommer les colonnes si elles existent avec anciens noms
            if (Schema::hasColumn('affiliate_links', 'name') && !Schema::hasColumn('affiliate_links', 'service_name')) {
                $table->renameColumn('name', 'service_name');
            }
            if (Schema::hasColumn('affiliate_links', 'slug') && !Schema::hasColumn('affiliate_links', 'service_slug')) {
                $table->renameColumn('slug', 'service_slug');
            }
            if (Schema::hasColumn('affiliate_links', 'url') && !Schema::hasColumn('affiliate_links', 'tracking_url')) {
                $table->renameColumn('url', 'tracking_url');
            }
            if (Schema::hasColumn('affiliate_links', 'click_count') && !Schema::hasColumn('affiliate_links', 'clicks')) {
                $table->renameColumn('click_count', 'clicks');
            }
            if (Schema::hasColumn('affiliate_links', 'revenue_total') && !Schema::hasColumn('affiliate_links', 'revenue')) {
                $table->renameColumn('revenue_total', 'revenue');
            }
        });

        // Ajouter les nouvelles colonnes (dans un second appel pour éviter conflits avec renommages)
        Schema::table('affiliate_links', function (Blueprint $table) {
            if (!Schema::hasColumn('affiliate_links', 'landing_url')) {
                $table->string('landing_url')->nullable()->after('tracking_url');
            }

            if (!Schema::hasColumn('affiliate_links', 'conversions')) {
                $table->unsignedInteger('conversions')->default(0)->after('clicks');
            }

            if (!Schema::hasColumn('affiliate_links', 'logo_url')) {
                $table->string('logo_url')->nullable()->after('conversions');
            }

            if (!Schema::hasColumn('affiliate_links', 'themes')) {
                $table->json('themes')->nullable()->after('logo_url')
                      ->comment('Thèmes applicables');
            }

            if (!Schema::hasColumn('affiliate_links', 'custom_anchors')) {
                $table->json('custom_anchors')->nullable()->after('anchor_templates')
                      ->comment('Ancres personnalisées par langue');
            }

            if (!Schema::hasColumn('affiliate_links', 'starts_at')) {
                $table->timestamp('starts_at')->nullable()->after('custom_anchors')
                      ->comment('Date début validité');
            }

            if (!Schema::hasColumn('affiliate_links', 'expires_at')) {
                $table->timestamp('expires_at')->nullable()->after('starts_at')
                      ->comment('Date expiration');
            }

            if (!Schema::hasColumn('affiliate_links', 'last_performance_update')) {
                $table->timestamp('last_performance_update')->nullable()->after('expires_at')
                      ->comment('Dernière MAJ performance');
            }
        });

        // ================================================================
        // 3. MANUAL_TITLES - Colonnes manquantes
        // ================================================================
        Schema::table('manual_titles', function (Blueprint $table) {
            if (!Schema::hasColumn('manual_titles', 'batch_uuid')) {
                $table->uuid('batch_uuid')->nullable()->after('status')
                      ->comment('UUID du batch de génération');
            }

            if (!Schema::hasColumn('manual_titles', 'scheduled_at')) {
                $table->timestamp('scheduled_at')->nullable()->after('batch_uuid')
                      ->comment('Date planifiée de génération');
            }

            // Ajouter index pour scheduled_at
            $table->index('scheduled_at');
        });

        // ================================================================
        // 4. LINK_DISCOVERY_CACHE - Colonnes manquantes
        // ================================================================
        Schema::table('link_discovery_cache', function (Blueprint $table) {
            if (!Schema::hasColumn('link_discovery_cache', 'query_hash')) {
                $table->string('query_hash', 64)->nullable()->after('cache_key')
                      ->comment('Hash de la requête');
            }

            if (!Schema::hasColumn('link_discovery_cache', 'query_params')) {
                $table->json('query_params')->nullable()->after('query_hash')
                      ->comment('Paramètres de requête');
            }

            if (!Schema::hasColumn('link_discovery_cache', 'source')) {
                $table->string('source', 50)->nullable()->after('query_params')
                      ->comment('Source: perplexity, government, etc.');
            }

            if (!Schema::hasColumn('link_discovery_cache', 'theme')) {
                $table->string('theme', 100)->nullable()->after('source')
                      ->comment('Thème de la recherche');
            }

            // Index pour les nouvelles colonnes
            $table->index('source');
            $table->index('theme');
        });
    }

    public function down(): void
    {
        // Rollback linking_rules
        Schema::table('linking_rules', function (Blueprint $table) {
            $columns = ['language_code', 'exclude_intro', 'exclude_conclusion', 'allowed_anchor_types',
                        'min_authority_score', 'enable_pillar_linking', 'enable_auto_discovery',
                        'custom_rules', 'is_active'];
            foreach ($columns as $col) {
                if (Schema::hasColumn('linking_rules', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        // Rollback affiliate_links (nouvelles colonnes seulement, pas les renommages)
        Schema::table('affiliate_links', function (Blueprint $table) {
            $columns = ['landing_url', 'conversions', 'logo_url', 'themes', 'custom_anchors',
                        'starts_at', 'expires_at', 'last_performance_update'];
            foreach ($columns as $col) {
                if (Schema::hasColumn('affiliate_links', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        // Rollback manual_titles
        Schema::table('manual_titles', function (Blueprint $table) {
            $table->dropIndex(['scheduled_at']);
            if (Schema::hasColumn('manual_titles', 'batch_uuid')) {
                $table->dropColumn('batch_uuid');
            }
            if (Schema::hasColumn('manual_titles', 'scheduled_at')) {
                $table->dropColumn('scheduled_at');
            }
        });

        // Rollback link_discovery_cache
        Schema::table('link_discovery_cache', function (Blueprint $table) {
            $table->dropIndex(['source']);
            $table->dropIndex(['theme']);
            $columns = ['query_hash', 'query_params', 'source', 'theme'];
            foreach ($columns as $col) {
                if (Schema::hasColumn('link_discovery_cache', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
