<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * ✅ CORRECTION: Ajout colonnes SEO Press Release
     */
    public function up(): void
    {
        Schema::table('press_releases', function (Blueprint $table) {
            $table->string('slug')->unique()->after('title');
            $table->string('meta_title', 70)->nullable()->after('slug');
            $table->text('meta_description')->nullable()->after('meta_title');
            $table->json('keywords')->nullable()->after('meta_description');
        });
    }

    public function down(): void
    {
        Schema::table('press_releases', function (Blueprint $table) {
            $table->dropColumn(['slug', 'meta_title', 'meta_description', 'keywords']);
        });
    }
};
