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
        Schema::create('pillar_research_sources', function (Blueprint $table) {
            $table->id();
            
            // Relation article
            $table->foreignId('article_id')->constrained('articles')->onDelete('cascade');
            
            // Type de source
            $table->enum('source_type', ['perplexity', 'news_api', 'manual'])->default('perplexity');
            
            // Informations source
            $table->text('source_url')->nullable();
            $table->string('source_title')->nullable();
            $table->date('source_date')->nullable();
            
            // Qualité et pertinence
            $table->integer('relevance_score')->default(0); // 0-100
            
            // Contenu
            $table->text('content_excerpt')->nullable();
            
            $table->timestamp('created_at')->useCurrent();
            
            // Index pour performance
            $table->index(['article_id', 'source_type']);
            $table->index(['relevance_score'], 'idx_relevance_desc');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pillar_research_sources');
    }
};
