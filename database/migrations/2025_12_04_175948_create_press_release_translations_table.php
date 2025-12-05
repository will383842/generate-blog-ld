<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * ✅ CORRECTION BUG #1: Table traductions Press Release
     */
    public function up(): void
    {
        Schema::create('press_release_translations', function (Blueprint $table) {
            $table->id();
            
            // Relations
            $table->foreignId('press_release_id')
                  ->constrained('press_releases')
                  ->onDelete('cascade');
            $table->string('language_code', 2);
            $table->foreign('language_code')
                  ->references('code')
                  ->on('languages')
                  ->onDelete('cascade');
            
            // Contenu traduit
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('lead');
            $table->longText('body1')->nullable();
            $table->longText('body2')->nullable();
            $table->longText('body3')->nullable();
            $table->longText('boilerplate')->nullable();
            
            // SEO
            $table->string('meta_title', 70)->nullable();
            $table->text('meta_description')->nullable();
            $table->json('keywords')->nullable();
            
            // Contact traduit
            $table->string('contact_name')->nullable();
            $table->string('contact_title')->nullable();
            $table->string('contact_phone')->nullable();
            $table->string('contact_email')->nullable();
            
            // Status
            $table->enum('translation_status', [
                'pending', 'completed', 'reviewed'
            ])->default('pending');
            $table->integer('word_count')->default(0);
            
            $table->timestamps();
            
            // Indexes
            $table->unique(['press_release_id', 'language_code']);
            $table->index('language_code');
            $table->index('translation_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('press_release_translations');
    }
};
