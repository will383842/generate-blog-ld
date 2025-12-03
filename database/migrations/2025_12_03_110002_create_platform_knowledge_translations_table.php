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
        Schema::create('platform_knowledge_translations', function (Blueprint $table) {
            $table->id();
            
            // Relation vers platform_knowledge
            $table->foreignId('knowledge_id')
                ->constrained('platform_knowledge')
                ->onDelete('cascade');
            
            // Langue de la traduction
            $table->char('language_code', 2)->index();
            
            // Contenu traduit
            $table->string('title', 200);
            $table->text('content');
            
            $table->timestamps();
            
            // Index composite pour recherche rapide
            $table->index(['knowledge_id', 'language_code']);
            
            // Contrainte d'unicité : une seule traduction par langue pour chaque knowledge
            $table->unique(['knowledge_id', 'language_code'], 'pk_trans_unique');
        });
        
        DB::statement("ALTER TABLE platform_knowledge_translations COMMENT = 'Traductions multilingues des connaissances plateforme'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('platform_knowledge_translations');
    }
};