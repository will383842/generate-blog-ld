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
        Schema::create('manual_titles', function (Blueprint $table) {
            $table->id();
            
            // Contenu principal
            $table->string('title', 500);
            $table->text('description')->nullable();
            
            // Relations
            $table->foreignId('platform_id')->constrained('platforms')->onDelete('cascade');
            $table->foreignId('country_id')->constrained('countries')->onDelete('cascade');
            $table->string('language_code', 2); // fr, en, es...
            
            // Template détecté/suggéré
            $table->string('suggested_template', 100)->nullable(); // guide_pratique, liste_top_n...
            
            // Contexte additionnel JSON
            $table->json('context')->nullable(); // { theme_type, theme_id, author_id, etc. }
            
            // Statut
            $table->enum('status', [
                'pending',      // En attente de génération
                'queued',       // Mis en queue
                'processing',   // En cours de génération
                'completed',    // Généré avec succès
                'failed'        // Échec de génération
            ])->default('pending');
            
            // Timestamps
            $table->timestamps();
            
            // Index pour performance
            $table->index(['platform_id', 'country_id', 'language_code']);
            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('manual_titles');
    }
};