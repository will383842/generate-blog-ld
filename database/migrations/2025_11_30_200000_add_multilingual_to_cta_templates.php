<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ajoute les colonnes multilingues manquantes à cta_templates
     * Pour supporter les 9 langues du système
     */
    public function up(): void
    {
        Schema::table('cta_templates', function (Blueprint $table) {
            // Colonnes content pour les 7 langues supplémentaires
            $table->text('content_es')->nullable()->after('content_en');
            $table->text('content_de')->nullable()->after('content_es');
            $table->text('content_pt')->nullable()->after('content_de');
            $table->text('content_ru')->nullable()->after('content_pt');
            $table->text('content_zh')->nullable()->after('content_ru');
            $table->text('content_ar')->nullable()->after('content_zh');
            $table->text('content_hi')->nullable()->after('content_ar');
            
            // Colonnes button_text pour les 7 langues supplémentaires
            $table->string('button_text_es')->nullable()->after('button_text_en');
            $table->string('button_text_de')->nullable()->after('button_text_es');
            $table->string('button_text_pt')->nullable()->after('button_text_de');
            $table->string('button_text_ru')->nullable()->after('button_text_pt');
            $table->string('button_text_zh')->nullable()->after('button_text_ru');
            $table->string('button_text_ar')->nullable()->after('button_text_zh');
            $table->string('button_text_hi')->nullable()->after('button_text_ar');
        });
    }

    public function down(): void
    {
        Schema::table('cta_templates', function (Blueprint $table) {
            $table->dropColumn([
                'content_es', 'content_de', 'content_pt', 'content_ru', 
                'content_zh', 'content_ar', 'content_hi',
                'button_text_es', 'button_text_de', 'button_text_pt', 'button_text_ru',
                'button_text_zh', 'button_text_ar', 'button_text_hi'
            ]);
        });
    }
};