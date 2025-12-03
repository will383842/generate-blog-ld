<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('title_histories', function (Blueprint $table) {
            if (!Schema::hasColumn('title_histories', 'language_id')) {
                $table->unsignedBigInteger('language_id')->nullable()->after('title_hash');
                $table->foreign('language_id')->references('id')->on('languages')->onDelete('cascade');
            }
            
            // Supprimer language_code si elle existe (on utilisera language_id)
            if (Schema::hasColumn('title_histories', 'language_code')) {
                $table->dropColumn('language_code');
            }
            
            // Ajouter theme_id si manquant
            if (!Schema::hasColumn('title_histories', 'theme_id')) {
                $table->unsignedBigInteger('theme_id')->nullable();
                $table->foreign('theme_id')->references('id')->on('themes')->onDelete('set null');
            }
        });
    }

    public function down(): void
    {
        Schema::table('title_histories', function (Blueprint $table) {
            $table->dropForeign(['language_id']);
            $table->dropColumn('language_id');
            $table->dropForeign(['theme_id']);
            $table->dropColumn('theme_id');
        });
    }
};
