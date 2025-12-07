<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 27 - Fichier 6: Amélioration table affiliate_links
 * Ajoute ciblage par pays/langue et templates d'ancres multilingues
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('affiliate_links', function (Blueprint $table) {
            if (!Schema::hasColumn('affiliate_links', 'country_codes')) {
                $table->json('country_codes')->nullable()->after('excluded_countries')
                      ->comment('Pays applicables (codes ISO)');
            }
            
            if (!Schema::hasColumn('affiliate_links', 'language_codes')) {
                $table->json('language_codes')->nullable()->after('country_codes')
                      ->comment('Langues applicables (codes ISO)');
            }
            
            if (!Schema::hasColumn('affiliate_links', 'max_per_article')) {
                $table->unsignedTinyInteger('max_per_article')->default(1)->after('language_codes');
            }
            
            if (!Schema::hasColumn('affiliate_links', 'anchor_templates')) {
                $table->json('anchor_templates')->nullable()->after('max_per_article')
                      ->comment('Templates ancre par langue');
            }
        });
    }

    public function down(): void
    {
        Schema::table('affiliate_links', function (Blueprint $table) {
            $table->dropColumn([
                'country_codes',
                'language_codes',
                'max_per_article',
                'anchor_templates',
            ]);
        });
    }
};
