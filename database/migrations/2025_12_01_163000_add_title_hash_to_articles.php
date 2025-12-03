<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            // Ajouter title_hash pour vérifier l'unicité des titres
            $table->string('title_hash', 64)->nullable()->after('title');
            
            // Index unique pour performance et unicité
            $table->unique('title_hash');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->dropUnique(['title_hash']);
            $table->dropColumn('title_hash');
        });
    }
};