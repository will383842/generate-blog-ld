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
        Schema::create('research_queries', function (Blueprint $table) {
            $table->id();
            $table->text('query_text');
            $table->string('language_code', 2); // fr, en, es, de, it, pt, ar, zh, hi
            $table->string('cache_key', 32)->unique();
            $table->boolean('cache_hit')->default(false);
            $table->integer('results_count')->default(0);
            $table->timestamps();
            
            // Index
            $table->index('cache_key');
            $table->index('language_code');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('research_queries');
    }
};