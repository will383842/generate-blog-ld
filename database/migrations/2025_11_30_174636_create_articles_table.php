<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('platform_id')->constrained()->onDelete('cascade');
            $table->foreignId('country_id')->constrained()->onDelete('cascade');
            $table->foreignId('language_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['article', 'landing'])->default('article');
            
            // Contenu
            $table->string('title');
            $table->string('slug');
            $table->text('excerpt')->nullable();
            $table->longText('content');
            $table->integer('word_count')->default(0);
            
            // SEO
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->string('canonical_url')->nullable();
            $table->json('json_ld')->nullable();
            
            // Image
            $table->string('image_url')->nullable();
            $table->string('image_alt')->nullable();
            
            // Relations thématiques
            $table->string('theme_type')->nullable();
            $table->unsignedBigInteger('theme_id')->nullable();
            
            // Qualité et statut
            $table->integer('quality_score')->default(0);
            $table->enum('status', ['draft', 'pending', 'published', 'failed'])->default('draft');
            $table->timestamp('published_at')->nullable();
            
            // Coûts
            $table->decimal('generation_cost', 10, 4)->default(0);
            
            $table->timestamps();
            
            $table->index(['platform_id', 'country_id', 'language_id']);
            $table->index(['status', 'created_at']);
            $table->unique(['slug', 'platform_id', 'country_id', 'language_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};