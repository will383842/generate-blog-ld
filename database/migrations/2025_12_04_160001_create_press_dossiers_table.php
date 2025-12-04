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
        Schema::create('press_dossiers', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->index();
            
            // Relations
            $table->foreignId('platform_id')->constrained('platforms')->onDelete('cascade');
            $table->string('template_type', 50)->index(); // press_kit_entreprise, rapport_annuel, etude_barometre, case_study, position_paper
            
            // Contenu principal
            $table->string('title', 255);
            $table->string('subtitle', 255)->nullable();
            $table->integer('total_pages')->default(0);
            
            // Localisation
            $table->char('language_code', 2)->index();
            
            // Statut
            $table->enum('status', ['draft', 'generating', 'review', 'published', 'failed'])->default('draft')->index();
            $table->string('error_message', 500)->nullable();
            $table->timestamp('published_at')->nullable();
            
            // Coûts et performance
            $table->decimal('generation_cost', 8, 4)->default(0);
            $table->integer('generation_time_seconds')->nullable(); // Temps de génération en secondes
            
            // Metadata
            $table->json('metadata')->nullable(); // Données additionnelles (auteur, date événement, etc.)
            
            $table->timestamps();
            
            // Index composés pour performance
            $table->index(['platform_id', 'template_type']);
            $table->index(['platform_id', 'language_code']);
            $table->index(['status', 'published_at']);
            $table->index(['created_at', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('press_dossiers');
    }
};