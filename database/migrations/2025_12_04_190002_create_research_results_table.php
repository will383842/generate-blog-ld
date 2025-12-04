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
        Schema::create('research_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('query_id')->constrained('research_queries')->onDelete('cascade');
            $table->enum('source_type', ['perplexity', 'news_api']);
            $table->string('title', 500);
            $table->text('url');
            $table->text('excerpt')->nullable();
            $table->timestamp('published_date')->nullable();
            $table->integer('relevance_score')->default(0); // 0-100
            $table->timestamps();
            
            // Index
            $table->index('query_id');
            $table->index('source_type');
            $table->index('relevance_score');
            $table->index('published_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('research_results');
    }
};