<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * =============================================================================
 * PHASE 13 - FICHIER 1/14 : Migration quality_checks
 * =============================================================================
 * 
 * EMPLACEMENT : database/migrations/2025_12_05_130001_create_quality_checks_table.php
 * 
 * DESCRIPTION : Table pour stocker l'historique détaillé des validations qualité
 * Enregistre les 6 critères de validation + score global pondéré
 * 
 * =============================================================================
 */

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('quality_checks', function (Blueprint $table) {
            $table->id();
            
            // Relation polymorphique vers le contenu validé
            $table->morphs('checkable'); // checkable_type (Article, Landing, etc.) + checkable_id
            
            // Type de contenu (pour requêtes optimisées)
            $table->enum('content_type', [
                'article', 
                'landing', 
                'comparative', 
                'pillar', 
                'press'
            ])->index();
            
            // Contexte plateforme/langue
            $table->foreignId('platform_id')->constrained()->onDelete('cascade');
            $table->string('language_code', 2)->index();
            
            // ============================================================
            // SCORES PAR CRITÈRE (0.00 - 100.00)
            // ============================================================
            
            // 1. Knowledge Compliance (30%) - PlatformKnowledgeService
            $table->decimal('knowledge_score', 5, 2)->default(0)->comment('Chiffres clés, services, vocabulaire plateforme');
            
            // 2. Brand Compliance (25%) - BrandValidationService
            $table->decimal('brand_score', 5, 2)->default(0)->comment('Tutoiement, phrases, émojis, style');
            
            // 3. SEO Quality (15%)
            $table->decimal('seo_score', 5, 2)->default(0)->comment('Meta title/desc, keywords, H1/H2, images alt');
            
            // 4. Readability (15%)
            $table->decimal('readability_score', 5, 2)->default(0)->comment('Flesch-Kincaid, paragraphes, transitions');
            
            // 5. Structure Quality (10%)
            $table->decimal('structure_score', 5, 2)->default(0)->comment('Intro, sections, conclusion, FAQs, listes');
            
            // 6. Originality (5%)
            $table->decimal('originality_score', 5, 2)->default(0)->comment('Similarité vs existant, phrases génériques');
            
            // Score global pondéré
            // overall = knowledge×0.3 + brand×0.25 + seo×0.15 + readability×0.15 + structure×0.1 + originality×0.05
            $table->decimal('overall_score', 5, 2)->default(0)->index()->comment('Score final pondéré 0-100');
            
            // ============================================================
            // STATUT VALIDATION
            // ============================================================
            
            $table->enum('status', ['passed', 'warning', 'failed'])->default('passed')->index();
            // - passed  : overall_score ≥ 70 ET tous critères ≥ 60
            // - warning : overall_score ≥ 60 OU un critère < 60
            // - failed  : overall_score < 60
            
            // ============================================================
            // DÉTAILS VALIDATION (JSON)
            // ============================================================
            
            // Détails complets de la validation
            $table->json('validation_details')->nullable()->comment('Détails techniques de chaque critère');
            
            // Erreurs bloquantes
            $table->json('errors')->nullable()->comment('Liste erreurs critiques (array)');
            
            // Avertissements non-bloquants
            $table->json('warnings')->nullable()->comment('Liste avertissements (array)');
            
            // Suggestions d'amélioration
            $table->json('suggestions')->nullable()->comment('Recommandations pour améliorer score');
            
            // ============================================================
            // METADATA
            // ============================================================
            
            $table->timestamp('checked_at')->useCurrent()->comment('Date/heure de la validation');
            $table->timestamps();
            
            // ============================================================
            // INDEX POUR PERFORMANCE
            // ============================================================
            
            // Index pour requêtes par plateforme/type/statut
            $table->index(['platform_id', 'content_type', 'status'], 'quality_platform_type_status_idx');
            
            // Index pour tendances qualité (graphiques)
            $table->index(['overall_score', 'checked_at'], 'quality_score_time_idx');
            
            // Index pour analyses par langue
            $table->index(['language_code', 'content_type', 'overall_score'], 'quality_lang_type_score_idx');
        });
        
        echo "✅ Table 'quality_checks' créée avec succès\n";
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quality_checks');
        echo "✅ Table 'quality_checks' supprimée\n";
    }
};