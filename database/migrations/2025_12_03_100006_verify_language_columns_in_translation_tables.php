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
        $translationTables = [
            'country_translations',
            'provider_type_translations',
            'theme_translations',
            'lawyer_specialty_translations',
            'expat_domain_translations',
            'ulixai_service_translations',
            'author_translations',
            'testimonial_translations',
        ];
        
        foreach ($translationTables as $table) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $blueprint) use ($table) {
                    // Vérifier si language_id ou language_code existe
                    $hasLanguageId = Schema::hasColumn($table, 'language_id');
                    $hasLanguageCode = Schema::hasColumn($table, 'language_code');
                    
                    // Si aucune des deux n'existe, ajouter language_id
                    if (!$hasLanguageId && !$hasLanguageCode) {
                        $blueprint->foreignId('language_id')->after('id')
                            ->constrained('languages')->onDelete('cascade');
                        $blueprint->index(['language_id']);
                    }
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $translationTables = [
            'country_translations',
            'provider_type_translations',
            'theme_translations',
            'lawyer_specialty_translations',
            'expat_domain_translations',
            'ulixai_service_translations',
            'author_translations',
            'testimonial_translations',
        ];
        
        foreach ($translationTables as $table) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $blueprint) use ($table) {
                    if (Schema::hasColumn($table, 'language_id')) {
                        $blueprint->dropForeign(['language_id']);
                        $blueprint->dropColumn('language_id');
                    }
                });
            }
        }
    }
};
