<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ajoute les colonnes icon et color à la table themes
     */
    public function up(): void
    {
        Schema::table('themes', function (Blueprint $table) {
            // Vérifier et ajouter icon seulement si elle n'existe pas
            if (!Schema::hasColumn('themes', 'icon')) {
                $table->string('icon')->nullable()->after('slug');
            }
            
            // Vérifier et ajouter color seulement si elle n'existe pas
            if (!Schema::hasColumn('themes', 'color')) {
                $table->string('color', 7)->nullable()->after('icon');
            }
        });
    }

    public function down(): void
    {
        Schema::table('themes', function (Blueprint $table) {
            if (Schema::hasColumn('themes', 'icon')) {
                $table->dropColumn('icon');
            }
            if (Schema::hasColumn('themes', 'color')) {
                $table->dropColumn('color');
            }
        });
    }
};