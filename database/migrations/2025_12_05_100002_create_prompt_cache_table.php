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
        Schema::create('prompt_cache', function (Blueprint $table) {
            $table->id();
            
            // Prompt identification
            $table->string('prompt_hash', 64)->unique(); // SHA256 hash
            $table->text('prompt_text'); // Store for reference
            $table->string('prompt_type', 50)->nullable(); // article, pillar, translation, etc.
            
            // Usage tracking
            $table->integer('cache_hits')->unsigned()->default(0);
            $table->integer('estimated_tokens')->unsigned()->nullable();
            $table->decimal('savings_estimated', 10, 6)->default(0); // Estimated $ saved
            
            // Timestamps
            $table->timestamp('first_used_at')->useCurrent();
            $table->timestamp('last_used_at')->useCurrent();
            $table->timestamp('created_at')->useCurrent();
            
            // Indexes
            $table->index('prompt_hash');
            $table->index('last_used_at');
            $table->index('cache_hits');
            $table->index('prompt_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('prompt_cache');
    }
};
