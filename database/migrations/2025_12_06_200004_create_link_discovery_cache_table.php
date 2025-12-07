<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 27 - Fichier 4: Table link_discovery_cache
 * Cache pour les liens découverts via Perplexity (TTL 7 jours)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('link_discovery_cache', function (Blueprint $table) {
            $table->id();
            $table->string('cache_key', 64)->unique()->comment('Hash unique topic+country+lang');
            $table->string('topic', 200);
            $table->char('country_code', 2)->nullable();
            $table->char('language_code', 2)->default('fr');
            $table->json('discovered_links')->comment('URLs découvertes avec métadonnées');
            $table->unsignedInteger('hits')->default(0)->comment('Nombre utilisations cache');
            $table->timestamp('expires_at');
            $table->timestamps();
            
            $table->index(['country_code', 'language_code'], 'link_cache_country_lang_idx');
            $table->index('expires_at', 'link_cache_expires_idx');
            $table->index('topic', 'link_cache_topic_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('link_discovery_cache');
    }
};
