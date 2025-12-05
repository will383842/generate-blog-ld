<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dossier_section_translations', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('dossier_section_id')
                  ->constrained('dossier_sections')
                  ->onDelete('cascade');
            $table->string('language_code', 2);
            $table->foreign('language_code')
                  ->references('code')
                  ->on('languages')
                  ->onDelete('cascade');
            
            $table->string('title');
            $table->longText('content')->nullable();
            
            $table->enum('translation_status', [
                'pending', 'completed', 'reviewed'
            ])->default('pending');
            $table->integer('word_count')->default(0);
            
            $table->timestamps();
            
            // ✅ NOM COURT MANUEL
            $table->unique(['dossier_section_id', 'language_code'], 'dst_section_lang_unique');
            $table->index('language_code');
            $table->index('translation_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dossier_section_translations');
    }
};