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
        Schema::create('research_sources', function (Blueprint $table) {
            $table->id();
            $table->string('source_code', 50)->unique(); // perplexity_ai, news_api
            $table->string('name', 100);
            $table->string('api_endpoint', 500);
            $table->integer('rate_limit')->default(100); // Requêtes par heure
            $table->decimal('cost_per_request', 10, 6)->default(0); // En USD
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Index
            $table->index('source_code');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('research_sources');
    }
};