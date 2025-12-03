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
        Schema::table('title_templates', function (Blueprint $table) {
            // Ajouter language_code (CRITIQUE - manquant !)
            $table->string('language_code', 2)->after('platform_id')->default('fr');
            
            // Ajouter theme_id pour remplacer theme_type
            $table->foreignId('theme_id')->nullable()->after('language_code')->constrained()->onDelete('set null');
            
            // Ajouter provider_type_id (optionnel)
            $table->foreignId('provider_type_id')->nullable()->after('theme_id')->constrained()->onDelete('set null');
            
            // Ajouter lawyer_specialty_id (optionnel)
            $table->foreignId('lawyer_specialty_id')->nullable()->after('provider_type_id')->constrained()->onDelete('set null');
            
            // Ajouter description pour documentation
            $table->text('description')->nullable()->after('usage_count');
            
            // Index pour performance
            $table->index(['language_code', 'is_active']);
            $table->index(['platform_id', 'theme_id']);
        });
        
        // Optionnel : Supprimer theme_type si plus utilisé
        // Schema::table('title_templates', function (Blueprint $table) {
        //     $table->dropColumn('theme_type');
        // });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('title_templates', function (Blueprint $table) {
            $table->dropIndex(['language_code', 'is_active']);
            $table->dropIndex(['platform_id', 'theme_id']);
            
            $table->dropForeign(['theme_id']);
            $table->dropForeign(['provider_type_id']);
            $table->dropForeign(['lawyer_specialty_id']);
            
            $table->dropColumn([
                'language_code',
                'theme_id',
                'provider_type_id',
                'lawyer_specialty_id',
                'description',
            ]);
        });
    }
};