<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration pour ajouter des index de performance sur la table articles
 * 
 * Ces index optimisent les requêtes fréquentes :
 * - Filtrage par statut
 * - Tri par date de publication
 * - Recherche par pays/langue/plateforme
 * - Combinaisons courantes
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            // Index simples
            $table->index('status');
            $table->index('published_at');
            $table->index('type');
            $table->index('theme_type');
            
            // Index composites pour requêtes fréquentes
            $table->index(['platform_id', 'status'], 'idx_articles_platform_status');
            $table->index(['country_id', 'status'], 'idx_articles_country_status');
            $table->index(['platform_id', 'country_id', 'status'], 'idx_articles_platform_country_status');
            $table->index(['status', 'published_at'], 'idx_articles_status_published');
            
            // Index pour le SEO (recherche par slug)
            $table->index('slug');
            $table->index('uuid');
        });
    }

    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['published_at']);
            $table->dropIndex(['type']);
            $table->dropIndex(['theme_type']);
            $table->dropIndex('idx_articles_platform_status');
            $table->dropIndex('idx_articles_country_status');
            $table->dropIndex('idx_articles_platform_country_status');
            $table->dropIndex('idx_articles_status_published');
            $table->dropIndex(['slug']);
            $table->dropIndex(['uuid']);
        });
    }
};