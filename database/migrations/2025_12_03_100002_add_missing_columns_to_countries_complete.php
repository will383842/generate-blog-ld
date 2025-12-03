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
        Schema::table('countries', function (Blueprint $table) {
            // Code alpha-3
            if (!Schema::hasColumn('countries', 'code_alpha3')) {
                $table->string('code_alpha3', 3)->nullable()->after('code');
            }
            
            // Slugs multilingues
            $languages = ['fr', 'en', 'de', 'es', 'pt', 'ru', 'zh', 'ar', 'hi'];
            foreach ($languages as $lang) {
                $column = "slug_{$lang}";
                if (!Schema::hasColumn('countries', $column)) {
                    $table->string($column)->nullable()->after('slug');
                    $table->index($column);
                }
            }
            
            // Timezone par défaut
            if (!Schema::hasColumn('countries', 'timezone')) {
                $table->string('timezone')->nullable()->after('timezone_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('countries', function (Blueprint $table) {
            $columns = ['code_alpha3', 'timezone'];
            $languages = ['fr', 'en', 'de', 'es', 'pt', 'ru', 'zh', 'ar', 'hi'];
            
            foreach ($languages as $lang) {
                $columns[] = "slug_{$lang}";
            }
            
            $table->dropColumn($columns);
        });
    }
};