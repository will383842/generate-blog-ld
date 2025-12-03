<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * VERSION VARCHAR - Plus flexible pour ajouter de nouveaux types à l'avenir
     */
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            // Passer de ENUM à VARCHAR(50)
            $table->string('type', 50)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            // Retourner à ENUM si besoin
            $table->enum('type', ['guide', 'listicle', 'tutorial', 'faq', 'news', 'review'])->change();
        });
    }
};