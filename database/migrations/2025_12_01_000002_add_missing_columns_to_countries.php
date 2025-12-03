<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration additive pour countries
 * 
 * Ajoute les colonnes manquantes :
 * - timezone
 * - slug_fr, slug_en, slug_es, slug_de, slug_pt, slug_ru, slug_zh, slug_ar, slug_hi
 * 
 * Renomme code_iso3 → code_alpha3 pour cohérence avec seeder
 * 
 * IMPORTANT : Nécessite doctrine/dbal pour renameColumn
 * Installer avec : composer require doctrine/dbal
 */
return new class extends Migration
{
    public function up(): void
    {
        // Étape 1 : Renommer la colonne (nécessite doctrine/dbal)
        Schema::table('countries', function (Blueprint $table) {
            $table->renameColumn('code_iso3', 'code_alpha3');
        });
        
        // Étape 2 : Ajouter les nouvelles colonnes
        Schema::table('countries', function (Blueprint $table) {
            // Ajouter timezone
            $table->string('timezone', 50)->nullable()->after('phone_code');
            
            // Ajouter slugs multilingues (après les noms)
            $table->string('slug_fr')->nullable()->after('name_hi');
            $table->string('slug_en')->nullable()->after('slug_fr');
            $table->string('slug_es')->nullable()->after('slug_en');
            $table->string('slug_de')->nullable()->after('slug_es');
            $table->string('slug_pt')->nullable()->after('slug_de');
            $table->string('slug_ru')->nullable()->after('slug_pt');
            $table->string('slug_zh')->nullable()->after('slug_ru');
            $table->string('slug_ar')->nullable()->after('slug_zh');
            $table->string('slug_hi')->nullable()->after('slug_ar');
            
            // Index sur les slugs pour le routing SEO
            $table->index('slug_fr');
            $table->index('slug_en');
        });
    }

    public function down(): void
    {
        Schema::table('countries', function (Blueprint $table) {
            $table->dropIndex(['slug_fr']);
            $table->dropIndex(['slug_en']);
            
            $table->dropColumn([
                'timezone',
                'slug_fr', 'slug_en', 'slug_es', 'slug_de', 'slug_pt',
                'slug_ru', 'slug_zh', 'slug_ar', 'slug_hi'
            ]);
        });
        
        Schema::table('countries', function (Blueprint $table) {
            $table->renameColumn('code_alpha3', 'code_iso3');
        });
    }
};