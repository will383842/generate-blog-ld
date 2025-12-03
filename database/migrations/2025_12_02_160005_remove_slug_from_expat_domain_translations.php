<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Retire la colonne slug de expat_domain_translations
     * car le seeder ne l'utilise pas
     */
    public function up(): void
    {
        Schema::table('expat_domain_translations', function (Blueprint $table) {
            if (Schema::hasColumn('expat_domain_translations', 'slug')) {
                $table->dropIndex(['slug']); // Retirer l'index d'abord
                $table->dropColumn('slug');
            }
        });
    }

    public function down(): void
    {
        Schema::table('expat_domain_translations', function (Blueprint $table) {
            $table->string('slug', 100)->nullable();
            $table->index('slug');
        });
    }
};