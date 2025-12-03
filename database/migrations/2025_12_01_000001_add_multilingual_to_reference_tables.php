<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration additive pour ajouter le support des 9 langues aux tables de référence
 * 
 * Tables concernées :
 * - themes
 * - provider_types
 * - lawyer_specialties
 * - expat_domains
 * 
 * Langues ajoutées : ES, DE, PT, RU, ZH, AR, HI (FR et EN existent déjà)
 */
return new class extends Migration
{
    public function up(): void
    {
        // ═══════════════════════════════════════════════════════════════════════
        // TABLE : themes
        // ═══════════════════════════════════════════════════════════════════════
        Schema::table('themes', function (Blueprint $table) {
            $table->string('name_es')->nullable()->after('name_en');
            $table->string('name_de')->nullable()->after('name_es');
            $table->string('name_pt')->nullable()->after('name_de');
            $table->string('name_ru')->nullable()->after('name_pt');
            $table->string('name_zh')->nullable()->after('name_ru');
            $table->string('name_ar')->nullable()->after('name_zh');
            $table->string('name_hi')->nullable()->after('name_ar');
        });

        // ═══════════════════════════════════════════════════════════════════════
        // TABLE : provider_types
        // ═══════════════════════════════════════════════════════════════════════
        Schema::table('provider_types', function (Blueprint $table) {
            $table->string('name_es')->nullable()->after('name_en');
            $table->string('name_de')->nullable()->after('name_es');
            $table->string('name_pt')->nullable()->after('name_de');
            $table->string('name_ru')->nullable()->after('name_pt');
            $table->string('name_zh')->nullable()->after('name_ru');
            $table->string('name_ar')->nullable()->after('name_zh');
            $table->string('name_hi')->nullable()->after('name_ar');
        });

        // ═══════════════════════════════════════════════════════════════════════
        // TABLE : lawyer_specialties
        // ═══════════════════════════════════════════════════════════════════════
        Schema::table('lawyer_specialties', function (Blueprint $table) {
            $table->string('name_es')->nullable()->after('name_en');
            $table->string('name_de')->nullable()->after('name_es');
            $table->string('name_pt')->nullable()->after('name_de');
            $table->string('name_ru')->nullable()->after('name_pt');
            $table->string('name_zh')->nullable()->after('name_ru');
            $table->string('name_ar')->nullable()->after('name_zh');
            $table->string('name_hi')->nullable()->after('name_ar');
        });

        // ═══════════════════════════════════════════════════════════════════════
        // TABLE : expat_domains
        // ═══════════════════════════════════════════════════════════════════════
        Schema::table('expat_domains', function (Blueprint $table) {
            $table->string('name_es')->nullable()->after('name_en');
            $table->string('name_de')->nullable()->after('name_es');
            $table->string('name_pt')->nullable()->after('name_de');
            $table->string('name_ru')->nullable()->after('name_pt');
            $table->string('name_zh')->nullable()->after('name_ru');
            $table->string('name_ar')->nullable()->after('name_zh');
            $table->string('name_hi')->nullable()->after('name_ar');
        });
    }

    public function down(): void
    {
        Schema::table('themes', function (Blueprint $table) {
            $table->dropColumn(['name_es', 'name_de', 'name_pt', 'name_ru', 'name_zh', 'name_ar', 'name_hi']);
        });

        Schema::table('provider_types', function (Blueprint $table) {
            $table->dropColumn(['name_es', 'name_de', 'name_pt', 'name_ru', 'name_zh', 'name_ar', 'name_hi']);
        });

        Schema::table('lawyer_specialties', function (Blueprint $table) {
            $table->dropColumn(['name_es', 'name_de', 'name_pt', 'name_ru', 'name_zh', 'name_ar', 'name_hi']);
        });

        Schema::table('expat_domains', function (Blueprint $table) {
            $table->dropColumn(['name_es', 'name_de', 'name_pt', 'name_ru', 'name_zh', 'name_ar', 'name_hi']);
        });
    }
};