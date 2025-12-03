<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ajoute les colonnes manquantes à la table platforms
     * 
     * Colonnes ajoutées :
     * - description : description de la plateforme (text)
     * - domain : nom de domaine (ex: sos-expat.com)
     * - logo_url : URL du logo
     * - primary_color : couleur principale au format hexadécimal (#007bff)
     * 
     * Ces colonnes sont utilisées par le model Platform mais absentes de la migration initiale.
     */
    public function up(): void
    {
        Schema::table('platforms', function (Blueprint $table) {
            // Vérification de sécurité : ne pas ajouter si existe déjà
            if (!Schema::hasColumn('platforms', 'description')) {
                $table->text('description')->nullable()->after('slug');
            }
            if (!Schema::hasColumn('platforms', 'domain')) {
                $table->string('domain')->nullable()->after('description');
            }
            if (!Schema::hasColumn('platforms', 'logo_url')) {
                $table->string('logo_url')->nullable()->after('domain');
            }
            if (!Schema::hasColumn('platforms', 'primary_color')) {
                $table->string('primary_color', 7)->default('#007bff')->after('logo_url');
            }
        });
    }

    public function down(): void
    {
        Schema::table('platforms', function (Blueprint $table) {
            $table->dropColumn(['description', 'domain', 'logo_url', 'primary_color']);
        });
    }
};