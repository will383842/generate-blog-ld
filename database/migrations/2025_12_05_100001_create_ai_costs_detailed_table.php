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
        Schema::create('ai_costs_detailed', function (Blueprint $table) {
            $table->id();
            
            // Relations
            $table->foreignId('platform_id')->constrained('platforms')->onDelete('cascade');
            
            // Content tracking
            $table->string('content_type', 50); // Article, PillarArticle, PressRelease, etc.
            $table->unsignedBigInteger('content_id')->nullable();
            
            // Model & Task
            $table->string('model_used', 50); // gpt-4, gpt-4o, gpt-4o-mini
            $table->string('task_type', 50); // generation, translation, meta, faq, research, image_prompt
            
            // Token usage
            $table->integer('input_tokens')->unsigned();
            $table->integer('output_tokens')->unsigned();
            
            // Costs (in dollars)
            $table->decimal('input_cost', 10, 6);
            $table->decimal('output_cost', 10, 6);
            $table->decimal('total_cost', 10, 6);
            
            // Context
            $table->string('language_code', 2)->nullable();
            $table->text('notes')->nullable(); // Additional context
            
            // Timestamps
            $table->timestamp('created_at')->useCurrent();
            
            // Indexes for fast queries
            $table->index('platform_id');
            $table->index('model_used');
            $table->index('task_type');
            $table->index('created_at');
            $table->index(['content_type', 'content_id']);
            $table->index(['platform_id', 'created_at']);
            $table->index(['model_used', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_costs_detailed');
    }
};
