<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cta_templates', function (Blueprint $table) {
            // Ajouter language_id avec valeur par défaut
            $table->unsignedBigInteger('language_id')->default(1)->after('id');
            
            // Ajouter la clé étrangère si elle n'existe pas
            $table->foreign('language_id')
                  ->references('id')
                  ->on('languages')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('cta_templates', function (Blueprint $table) {
            $table->dropForeign(['language_id']);
            $table->dropColumn('language_id');
        });
    }
};