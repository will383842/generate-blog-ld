<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('title_histories', function (Blueprint $table) {
            // Vérifier si la colonne existe déjà
            if (!Schema::hasColumn('title_histories', 'article_id')) {
                $table->unsignedBigInteger('article_id')->nullable()->after('id');
                $table->foreign('article_id')->references('id')->on('articles')->onDelete('cascade');
            }
        });
    }

    public function down(): void
    {
        Schema::table('title_histories', function (Blueprint $table) {
            $table->dropForeign(['article_id']);
            $table->dropColumn('article_id');
        });
    }
};