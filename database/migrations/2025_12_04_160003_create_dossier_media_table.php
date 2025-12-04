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
        Schema::create('dossier_media', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->index();
            
            // Relations
            $table->foreignId('dossier_id')->constrained('press_dossiers')->onDelete('cascade');
            $table->foreignId('section_id')->nullable()->constrained('dossier_sections')->onDelete('set null');
            
            // Type de média
            $table->enum('media_type', [
                'photo',          // Photo
                'logo',           // Logo
                'chart',          // Graphique (généré)
                'table',          // Tableau de données
                'infographic',    // Infographie
                'diagram',        // Diagramme
                'dataset'         // Dataset CSV/Excel brut
            ])->index();
            
            // Fichier
            $table->string('file_path', 500);
            $table->string('original_filename', 255)->nullable();
            $table->string('mime_type', 100)->nullable();
            $table->integer('file_size')->nullable(); // En bytes
            
            // Dimensions (si image)
            $table->integer('width')->nullable();
            $table->integer('height')->nullable();
            
            // Metadata
            $table->string('caption', 500)->nullable();
            $table->text('alt_text')->nullable(); // Pour accessibilité
            $table->string('source', 255)->nullable(); // Source/crédit de l'image
            
            // Position dans le dossier
            $table->integer('order_index')->default(0)->index();
            
            // Options d'affichage
            $table->enum('display_size', ['small', 'medium', 'large', 'full'])->default('medium');
            $table->enum('alignment', ['left', 'center', 'right'])->default('center');
            
            // Chart data (si type = chart/table)
            $table->json('chart_config')->nullable(); // Configuration du graphique
            $table->json('table_data')->nullable(); // Données du tableau
            
            $table->timestamps();
            
            // Index composés
            $table->index(['dossier_id', 'media_type']);
            $table->index(['dossier_id', 'section_id', 'order_index']);
            $table->index(['media_type', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dossier_media');
    }
};