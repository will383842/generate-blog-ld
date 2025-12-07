<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * INTELLIGENT COVERAGE SYSTEM
     * 
     * Tables pour le suivi de couverture par pays, langue, spécialité/service
     * Avec support du thème Williams Jullin cross-platform
     */
    public function up(): void
    {
        // Table des objectifs de couverture par cible
        Schema::create('coverage_targets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('platform_id')->constrained()->onDelete('cascade');
            $table->foreignId('country_id')->constrained()->onDelete('cascade');
            $table->string('language_code', 5);
            $table->string('category')->comment('recruitment, awareness, founder');
            $table->string('target_type')->comment('lawyer_specialty, expat_domain, ulixai_service, theme, founder');
            $table->unsignedBigInteger('target_id')->nullable();
            $table->string('target_name')->nullable();
            $table->unsignedTinyInteger('target_count')->default(1)->comment('Nombre d\'articles cibles');
            $table->unsignedTinyInteger('completed_count')->default(0)->comment('Nombre d\'articles publiés');
            $table->decimal('progress_percentage', 5, 2)->default(0);
            $table->unsignedSmallInteger('priority_score')->default(50);
            $table->enum('status', ['pending', 'partial', 'completed'])->default('pending');
            $table->timestamps();

            $table->unique(['platform_id', 'country_id', 'language_code', 'target_type', 'target_id'], 'coverage_targets_unique');
            $table->index(['platform_id', 'country_id']);
            $table->index(['status']);
            $table->index(['priority_score']);
        });

        // Table des scores par pays (cache calculé)
        Schema::create('coverage_country_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('platform_id')->constrained()->onDelete('cascade');
            $table->foreignId('country_id')->constrained()->onDelete('cascade');
            
            // Scores principaux
            $table->decimal('recruitment_score', 5, 2)->default(0);
            $table->decimal('awareness_score', 5, 2)->default(0);
            $table->decimal('founder_score', 5, 2)->default(0)->comment('Score thème Williams Jullin');
            $table->decimal('overall_score', 5, 2)->default(0);
            
            // Détails du breakdown
            $table->json('recruitment_breakdown')->nullable();
            $table->json('awareness_breakdown')->nullable();
            $table->json('founder_breakdown')->nullable();
            $table->json('language_scores')->nullable();
            
            // Compteurs
            $table->unsignedInteger('total_articles')->default(0);
            $table->unsignedInteger('published_articles')->default(0);
            $table->unsignedInteger('unpublished_articles')->default(0);
            $table->unsignedInteger('total_targets')->default(0);
            $table->unsignedInteger('completed_targets')->default(0);
            $table->unsignedInteger('missing_targets')->default(0);
            
            // Priorité et recommandations
            $table->unsignedSmallInteger('priority_rank')->default(0);
            $table->json('recommendations')->nullable();
            
            // Timestamps
            $table->timestamp('calculated_at')->nullable();
            $table->timestamps();

            $table->unique(['platform_id', 'country_id']);
            $table->index(['overall_score']);
            $table->index(['priority_rank']);
        });

        // Table des recommandations générées
        Schema::create('coverage_recommendations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('platform_id')->constrained()->onDelete('cascade');
            $table->foreignId('country_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('language_code', 5)->nullable();
            
            $table->enum('type', ['critical', 'high', 'medium', 'low'])->default('medium');
            $table->string('action')->comment('generate_content, translate, improve, founder_article');
            $table->string('target_type')->nullable();
            $table->unsignedBigInteger('target_id')->nullable();
            $table->string('target_name')->nullable();
            $table->text('message');
            $table->string('impact')->nullable();
            $table->unsignedSmallInteger('priority')->default(50);
            $table->unsignedTinyInteger('difficulty')->default(5)->comment('1-10');
            $table->decimal('estimated_cost', 8, 2)->nullable();
            $table->unsignedSmallInteger('estimated_articles')->default(1);
            $table->enum('status', ['pending', 'in_progress', 'completed', 'dismissed'])->default('pending');
            
            $table->timestamps();
            
            $table->index(['platform_id', 'status']);
            $table->index(['type', 'priority']);
        });

        // Table de l'historique de progression
        Schema::create('coverage_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('platform_id')->constrained()->onDelete('cascade');
            $table->foreignId('country_id')->nullable()->constrained()->onDelete('cascade');
            $table->date('date');
            
            $table->decimal('recruitment_score', 5, 2)->default(0);
            $table->decimal('awareness_score', 5, 2)->default(0);
            $table->decimal('founder_score', 5, 2)->default(0);
            $table->decimal('overall_score', 5, 2)->default(0);
            
            $table->unsignedInteger('total_articles')->default(0);
            $table->unsignedInteger('published_articles')->default(0);
            $table->unsignedInteger('new_articles')->default(0);
            $table->unsignedInteger('unpublished_articles')->default(0);
            
            $table->timestamps();

            $table->unique(['platform_id', 'country_id', 'date']);
            $table->index(['date']);
        });

        // Table pour le thème Williams Jullin (cross-platform)
        Schema::create('founder_content_targets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('country_id')->constrained()->onDelete('cascade');
            $table->string('language_code', 5);
            
            // Articles SOS-Expat
            $table->boolean('has_sosexpat_article')->default(false);
            $table->unsignedBigInteger('sosexpat_article_id')->nullable();
            $table->boolean('sosexpat_published')->default(false);
            
            // Articles Ulixai
            $table->boolean('has_ulixai_article')->default(false);
            $table->unsignedBigInteger('ulixai_article_id')->nullable();
            $table->boolean('ulixai_published')->default(false);
            
            // Score combiné
            $table->decimal('combined_score', 5, 2)->default(0);
            
            $table->timestamps();

            $table->unique(['country_id', 'language_code']);
            $table->index(['combined_score']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('founder_content_targets');
        Schema::dropIfExists('coverage_history');
        Schema::dropIfExists('coverage_recommendations');
        Schema::dropIfExists('coverage_country_scores');
        Schema::dropIfExists('coverage_targets');
    }
};
