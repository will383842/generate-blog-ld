<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 27 - Fichier 2: Amélioration table external_links
 * Ajoute les colonnes pour la gestion intelligente des liens externes
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('external_links', function (Blueprint $table) {
            if (!Schema::hasColumn('external_links', 'domain')) {
                $table->string('domain', 200)->nullable()->after('url');
            }
            
            if (!Schema::hasColumn('external_links', 'source_type')) {
                $table->enum('source_type', ['government', 'organization', 'reference', 'news', 'authority'])
                      ->default('reference')
                      ->after('source');
            }
            
            if (!Schema::hasColumn('external_links', 'country_code')) {
                $table->char('country_code', 2)->nullable()->after('source_type');
            }
            
            if (!Schema::hasColumn('external_links', 'language_code')) {
                $table->char('language_code', 2)->default('fr')->after('country_code');
            }
            
            if (!Schema::hasColumn('external_links', 'authority_score')) {
                $table->unsignedTinyInteger('authority_score')->default(50)->after('language_code');
            }
            
            if (!Schema::hasColumn('external_links', 'is_nofollow')) {
                $table->boolean('is_nofollow')->default(false)->after('is_affiliate');
            }
            
            if (!Schema::hasColumn('external_links', 'is_sponsored')) {
                $table->boolean('is_sponsored')->default(false)->after('is_nofollow');
            }
            
            if (!Schema::hasColumn('external_links', 'is_automatic')) {
                $table->boolean('is_automatic')->default(true)->after('is_sponsored');
            }
            
            if (!Schema::hasColumn('external_links', 'last_verified_at')) {
                $table->timestamp('last_verified_at')->nullable()->after('is_automatic');
            }
            
            if (!Schema::hasColumn('external_links', 'is_broken')) {
                $table->boolean('is_broken')->default(false)->after('last_verified_at');
            }
            
            if (!Schema::hasColumn('external_links', 'clicks')) {
                $table->unsignedInteger('clicks')->default(0)->after('is_broken');
            }
            
            // Index
            $table->index('domain', 'external_links_domain_idx');
            $table->index('country_code', 'external_links_country_code_idx');
            $table->index('language_code', 'external_links_language_code_idx');
            $table->index('source_type', 'external_links_source_type_idx');
            $table->index('is_broken', 'external_links_is_broken_idx');
        });
    }

    public function down(): void
    {
        Schema::table('external_links', function (Blueprint $table) {
            $table->dropIndex('external_links_domain_idx');
            $table->dropIndex('external_links_country_code_idx');
            $table->dropIndex('external_links_language_code_idx');
            $table->dropIndex('external_links_source_type_idx');
            $table->dropIndex('external_links_is_broken_idx');
            
            $table->dropColumn([
                'domain',
                'source_type',
                'country_code',
                'language_code',
                'authority_score',
                'is_nofollow',
                'is_sponsored',
                'is_automatic',
                'last_verified_at',
                'is_broken',
                'clicks',
            ]);
        });
    }
};
