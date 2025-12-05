<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * ✅ CORRECTION BUG #1: Table traductions Dossiers
     */
    public function up(): void
    {
        Schema::create('press_dossier_translations', function (Blueprint $table) {
            $table->id();
            
            // Relations
            $table->foreignId('press_dossier_id')
                  ->constrained('press_dossiers')
                  ->onDelete('cascade');
            $table->string('language_code', 2);
            $table->foreign('language_code')
                  ->references('code')
                  ->on('languages')
                  ->onDelete('cascade');
            
            // Contenu traduit
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            
            // SEO
            $table->string('meta_title', 70)->nullable();
            $table->text('meta_description')->nullable();
            $table->json('keywords')->nullable();
            
            // Status
            $table->enum('translation_status', [
                'pending', 'completed', 'reviewed'
            ])->default('pending');
            $table->integer('word_count')->default(0);
            
            $table->timestamps();
            
            // Indexes
            $table->unique(['press_dossier_id', 'language_code']);
            $table->index('language_code');
            $table->index('translation_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('press_dossier_translations');
    }
};
