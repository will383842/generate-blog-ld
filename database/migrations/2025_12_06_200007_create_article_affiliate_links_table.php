<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 27 - Migration supplémentaire: Table pivot article_affiliate_links
 * Associe les articles aux liens affiliés avec contexte
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('article_affiliate_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained()->onDelete('cascade');
            $table->foreignId('affiliate_link_id')->constrained()->onDelete('cascade');
            $table->string('anchor_text', 255);
            $table->enum('position_hint', ['intro', 'middle', 'conclusion', 'cta'])->default('middle');
            $table->unsignedInteger('clicks')->default(0);
            $table->timestamps();

            // Index unique pour éviter les doublons
            $table->unique(['article_id', 'affiliate_link_id'], 'article_affiliate_unique');
            
            // Index pour les requêtes fréquentes
            $table->index('affiliate_link_id', 'article_affiliate_link_idx');
        });

        // Table optionnelle pour les métriques de linking (analytics)
        Schema::create('linking_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained()->onDelete('cascade');
            $table->foreignId('platform_id')->constrained()->onDelete('cascade');
            $table->unsignedSmallInteger('internal_links_created')->default(0);
            $table->unsignedSmallInteger('external_links_created')->default(0);
            $table->unsignedSmallInteger('affiliate_links_injected')->default(0);
            $table->boolean('content_updated')->default(false);
            $table->unsignedInteger('duration_ms')->default(0);
            $table->boolean('had_errors')->default(false);
            $table->timestamp('created_at')->useCurrent();

            // Index pour analytics
            $table->index(['platform_id', 'created_at'], 'linking_metrics_platform_date_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('linking_metrics');
        Schema::dropIfExists('article_affiliate_links');
    }
};
