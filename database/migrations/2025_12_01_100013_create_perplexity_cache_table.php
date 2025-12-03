<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('perplexity_cache', function (Blueprint $table) {
            $table->id();
            $table->string('cache_key', 100)->unique(); // SHA256(country+theme+lang+query)
            $table->char('country_code', 2)->nullable();
            $table->string('theme', 50)->nullable();
            $table->char('language_code', 2)->nullable();
            $table->string('query', 255)->nullable();
            $table->json('sources'); // [{url, title, domain, type, snippet}]
            $table->json('raw_response')->nullable(); // Réponse brute Perplexity
            $table->integer('hit_count')->default(0); // Nombre d'utilisations
            $table->timestamp('expires_at');
            $table->timestamps();
            
            $table->index(['country_code', 'theme', 'language_code']);
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('perplexity_cache');
    }
};
