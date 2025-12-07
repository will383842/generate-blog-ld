<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 27 - Fichier 1: Amélioration table internal_links
 * Ajoute les colonnes pour le maillage intelligent
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('internal_links', function (Blueprint $table) {
            // Renommer article_id en source_article_id si nécessaire
            if (Schema::hasColumn('internal_links', 'article_id') && !Schema::hasColumn('internal_links', 'source_article_id')) {
                $table->renameColumn('article_id', 'source_article_id');
            }
        });
        
        Schema::table('internal_links', function (Blueprint $table) {
            // Ajouter les nouvelles colonnes si elles n'existent pas
            if (!Schema::hasColumn('internal_links', 'anchor_type')) {
                $table->enum('anchor_type', ['exact_match', 'long_tail', 'generic', 'cta', 'question'])
                      ->default('exact_match')
                      ->after('anchor_text');
            }
            
            if (!Schema::hasColumn('internal_links', 'position_in_content')) {
                $table->unsignedInteger('position_in_content')->nullable()->after('anchor_type');
            }
            
            if (!Schema::hasColumn('internal_links', 'link_context')) {
                $table->enum('link_context', ['pillar_to_article', 'article_to_pillar', 'sibling', 'related'])
                      ->default('related')
                      ->after('position_in_content');
            }
            
            if (!Schema::hasColumn('internal_links', 'relevance_score')) {
                $table->unsignedTinyInteger('relevance_score')->default(50)->after('link_context');
            }
            
            if (!Schema::hasColumn('internal_links', 'clicks')) {
                $table->unsignedInteger('clicks')->default(0)->after('relevance_score');
            }
            
            if (!Schema::hasColumn('internal_links', 'is_automatic')) {
                $table->boolean('is_automatic')->default(true)->after('clicks');
            }
            
            // Index
            $table->index('link_context', 'internal_links_link_context_idx');
            $table->index('relevance_score', 'internal_links_relevance_score_idx');
            $table->index('is_automatic', 'internal_links_is_automatic_idx');
        });
    }

    public function down(): void
    {
        Schema::table('internal_links', function (Blueprint $table) {
            $table->dropIndex('internal_links_link_context_idx');
            $table->dropIndex('internal_links_relevance_score_idx');
            $table->dropIndex('internal_links_is_automatic_idx');
            
            $table->dropColumn([
                'anchor_type',
                'position_in_content',
                'link_context',
                'relevance_score',
                'clicks',
                'is_automatic',
            ]);
        });
        
        if (Schema::hasColumn('internal_links', 'source_article_id')) {
            Schema::table('internal_links', function (Blueprint $table) {
                $table->renameColumn('source_article_id', 'article_id');
            });
        }
    }
};
