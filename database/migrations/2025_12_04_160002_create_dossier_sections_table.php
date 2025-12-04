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
        Schema::create('dossier_sections', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->index();
            
            // Relations
            $table->foreignId('dossier_id')->constrained('press_dossiers')->onDelete('cascade');
            
            // Type de section
            $table->enum('section_type', [
                'cover',           // Page de couverture
                'intro',           // Introduction
                'chapter',         // Chapitre principal
                'conclusion',      // Conclusion
                'methodology',     // Méthodologie
                'table_of_contents', // Table des matières
                'appendix',        // Annexe
                'bibliography'     // Bibliographie
            ])->index();
            
            // Contenu
            $table->string('title', 255);
            $table->text('content')->nullable(); // HTML ou markdown
            $table->integer('word_count')->default(0);
            
            // Organisation
            $table->integer('page_number')->nullable();
            $table->integer('order_index')->default(0)->index(); // Pour réordonner les sections
            
            // Options de rendu
            $table->boolean('show_in_toc')->default(true); // Afficher dans la table des matières
            $table->boolean('page_break_before')->default(false); // Saut de page avant
            $table->boolean('page_break_after')->default(false); // Saut de page après
            
            // Styling personnalisé
            $table->json('styling')->nullable(); // Couleurs, fonts, etc. spécifiques à la section
            
            $table->timestamps();
            
            // Index composés
            $table->index(['dossier_id', 'order_index']);
            $table->index(['dossier_id', 'section_type']);
            $table->index(['dossier_id', 'page_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dossier_sections');
    }
};