<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('cta_templates', function (Blueprint $table) {
            // Ajouter language_code
            $table->string('language_code', 2)->after('platform_id')->default('fr');
            
            // Index pour performance
            $table->index(['language_code', 'is_active']);
        });
        
        // Mettre tous les templates existants en français par défaut
        DB::table('cta_templates')->update(['language_code' => 'fr']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cta_templates', function (Blueprint $table) {
            $table->dropIndex(['language_code', 'is_active']);
            $table->dropColumn('language_code');
        });
    }
};