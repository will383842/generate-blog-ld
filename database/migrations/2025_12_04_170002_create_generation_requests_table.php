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
        Schema::create('generation_requests', function (Blueprint $table) {
            $table->id();
            
            // Relation avec manual_title
            $table->foreignId('manual_title_id')->constrained('manual_titles')->onDelete('cascade');
            
            // Statut de génération
            $table->enum('status', [
                'pending',      // En attente de traitement
                'processing',   // En cours de génération
                'completed',    // Génération complétée
                'failed'        // Échec
            ])->default('pending');
            
            // Article généré (si succès)
            $table->foreignId('article_id')->nullable()->constrained('articles')->onDelete('set null');
            
            // Message d'erreur (si échec)
            $table->text('error_message')->nullable();
            
            // Métriques de temps
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->integer('processing_duration_seconds')->nullable(); // Durée en secondes
            
            // Coût de génération
            $table->decimal('generation_cost', 10, 4)->default(0); // Dollars
            
            // Tentatives de retry
            $table->integer('attempts')->default(0);
            
            $table->timestamps();
            
            // Index pour performance
            $table->index(['manual_title_id', 'status']);
            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('generation_requests');
    }
};