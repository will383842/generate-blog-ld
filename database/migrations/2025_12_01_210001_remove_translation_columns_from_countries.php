<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Supprime les colonnes de traduction de countries
     * 
     * Ces colonnes ne doivent PAS être dans la table principale car
     * le modèle Country utilise HasTranslations et une table
     * country_translations séparée.
     * 
     * ARCHITECTURE CORRECTE:
     * - name_fr et name_en dans countries (table principale)
     * - Autres langues dans country_translations
     */
    public function up(): void
    {
        Schema::table('countries', function (Blueprint $table) {
            // Supprimer les colonnes de traduction qui ne devraient pas être ici
            if (Schema::hasColumn('countries', 'name_de')) {
                $table->dropColumn('name_de');
            }
            if (Schema::hasColumn('countries', 'name_es')) {
                $table->dropColumn('name_es');
            }
            if (Schema::hasColumn('countries', 'name_pt')) {
                $table->dropColumn('name_pt');
            }
            if (Schema::hasColumn('countries', 'name_ru')) {
                $table->dropColumn('name_ru');
            }
            if (Schema::hasColumn('countries', 'name_zh')) {
                $table->dropColumn('name_zh');
            }
            if (Schema::hasColumn('countries', 'name_ar')) {
                $table->dropColumn('name_ar');
            }
            if (Schema::hasColumn('countries', 'name_hi')) {
                $table->dropColumn('name_hi');
            }
        });
    }

    public function down(): void
    {
        Schema::table('countries', function (Blueprint $table) {
            // Restaurer les colonnes si nécessaire (rollback)
            $table->string('name_de')->nullable();
            $table->string('name_es')->nullable();
            $table->string('name_pt')->nullable();
            $table->string('name_ru')->nullable();
            $table->string('name_zh')->nullable();
            $table->string('name_ar')->nullable();
            $table->string('name_hi')->nullable();
        });
    }
};