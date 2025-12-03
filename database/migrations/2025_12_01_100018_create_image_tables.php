<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Banque d'images
        Schema::create('image_library', function (Blueprint $table) {
            $table->id();
            $table->string('filename', 255);
            $table->string('original_filename', 255)->nullable();
            $table->string('path', 500);
            $table->string('url', 500);
            $table->string('cdn_url', 500)->nullable();
            $table->enum('source', ['upload', 'unsplash', 'pexels', 'pixabay', 'dalle']);
            $table->string('source_id', 100)->nullable(); // ID source externe
            $table->string('source_url', 500)->nullable(); // URL source
            $table->string('photographer', 100)->nullable();
            $table->string('photographer_url', 500)->nullable();
            $table->string('mime_type', 50);
            $table->integer('width')->unsigned();
            $table->integer('height')->unsigned();
            $table->integer('file_size')->unsigned(); // En octets
            $table->json('tags')->nullable(); // ["thailand", "lawyer", "office"]
            $table->char('country_code', 2)->nullable();
            $table->string('theme', 50)->nullable();
            $table->integer('usage_count')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index(['source', 'is_active']);
            $table->index(['country_code', 'theme']);
            $table->index('usage_count');
        });

        // Images alt texts multilingues
        Schema::create('image_alt_texts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('image_id')->constrained('image_library')->onDelete('cascade');
            $table->char('language_code', 2);
            $table->string('alt_text', 255);
            $table->string('title', 255)->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
            
            $table->unique(['image_id', 'language_code']);
        });

        // Historique des générations DALL-E
        Schema::create('image_generations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('image_id')->nullable()->constrained('image_library')->onDelete('set null');
            $table->foreignId('article_id')->nullable()->constrained()->onDelete('set null');
            $table->text('prompt');
            $table->string('revised_prompt', 1000)->nullable(); // Prompt révisé par DALL-E
            $table->string('model', 50)->default('dall-e-3');
            $table->string('size', 20)->default('1792x1024'); // 1024x1024, 1792x1024, 1024x1792
            $table->string('quality', 20)->default('standard'); // standard, hd
            $table->string('style', 20)->default('natural'); // natural, vivid
            $table->decimal('cost', 8, 4);
            $table->enum('status', ['pending', 'completed', 'failed'])->default('pending');
            $table->text('error_message')->nullable();
            $table->timestamps();
            
            $table->index(['status', 'created_at']);
            $table->index('article_id');
        });

        // Configuration des images par type de contenu
        Schema::create('image_configs', function (Blueprint $table) {
            $table->id();
            $table->enum('content_type', ['article', 'landing', 'comparative']);
            $table->foreignId('platform_id')->nullable()->constrained()->onDelete('cascade');
            $table->enum('source_priority', ['library', 'free', 'dalle', 'mixed'])->default('mixed');
            $table->integer('width')->default(1200);
            $table->integer('height')->default(675);
            $table->string('format', 10)->default('webp');
            $table->integer('quality')->default(85);
            $table->boolean('generate_alt_text')->default(true);
            $table->text('dalle_prompt_template')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->unique(['content_type', 'platform_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('image_configs');
        Schema::dropIfExists('image_generations');
        Schema::dropIfExists('image_alt_texts');
        Schema::dropIfExists('image_library');
    }
};
