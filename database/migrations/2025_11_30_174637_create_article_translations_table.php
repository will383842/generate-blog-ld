<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('article_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained()->onDelete('cascade');
            $table->foreignId('language_id')->constrained()->onDelete('cascade');
            
            // Contenu traduit
            $table->string('title');
            $table->string('slug');
            $table->text('excerpt')->nullable();
            $table->longText('content');
            
            // SEO traduit
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->string('canonical_url')->nullable();
            $table->json('json_ld')->nullable();
            
            // Image
            $table->string('image_alt')->nullable();
            
            // Statut
            $table->enum('status', ['pending', 'completed', 'failed'])->default('pending');
            $table->decimal('translation_cost', 10, 4)->default(0);
            
            $table->timestamps();
            
            $table->unique(['article_id', 'language_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('article_translations');
    }
};