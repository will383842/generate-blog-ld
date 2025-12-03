<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ajouter colonnes manquantes à articles
        Schema::table('articles', function (Blueprint $table) {
            if (!Schema::hasColumn('articles', 'author_id')) {
                $table->foreignId('author_id')->nullable()->after('theme_id')->constrained('authors')->nullOnDelete();
            }
            if (!Schema::hasColumn('articles', 'scheduled_at')) {
                $table->timestamp('scheduled_at')->nullable()->after('published_at');
            }
            if (!Schema::hasColumn('articles', 'indexed_at')) {
                $table->timestamp('indexed_at')->nullable()->after('scheduled_at');
            }
        });

        // Ajouter platform_id à expat_domains si manquant
        if (Schema::hasTable('expat_domains') && !Schema::hasColumn('expat_domains', 'platform_id')) {
            Schema::table('expat_domains', function (Blueprint $table) {
                $table->foreignId('platform_id')->nullable()->after('id')->constrained('platforms')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            if (Schema::hasColumn('articles', 'author_id')) {
                $table->dropConstrainedForeignId('author_id');
            }
            if (Schema::hasColumn('articles', 'scheduled_at')) {
                $table->dropColumn('scheduled_at');
            }
            if (Schema::hasColumn('articles', 'indexed_at')) {
                $table->dropColumn('indexed_at');
            }
        });

        if (Schema::hasColumn('expat_domains', 'platform_id')) {
            Schema::table('expat_domains', function (Blueprint $table) {
                $table->dropConstrainedForeignId('platform_id');
            });
        }
    }
};
