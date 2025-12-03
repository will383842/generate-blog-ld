<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('article_faqs', function (Blueprint $table) {
            // Vérifier si la colonne existe déjà
            if (!Schema::hasColumn('article_faqs', 'language_id')) {
                $table->unsignedBigInteger('language_id')->nullable()->after('article_id');
                $table->foreign('language_id')->references('id')->on('languages')->onDelete('cascade');
            } else {
                // Si elle existe mais n'est pas nullable, la modifier
                $table->unsignedBigInteger('language_id')->nullable()->change();
            }
        });
    }

    public function down(): void
    {
        Schema::table('article_faqs', function (Blueprint $table) {
            $table->dropForeign(['language_id']);
            $table->dropColumn('language_id');
        });
    }
};