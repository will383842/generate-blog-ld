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
        Schema::create('platform_knowledge', function (Blueprint $table) {
            $table->id();
            
            // Relation plateforme
            $table->foreignId('platform_id')
                ->constrained('platforms')
                ->onDelete('cascade');
            
            // Type de connaissance
            $table->string('knowledge_type', 50)->index();
            // about, services, values, tone, style, facts, differentiators, 
            // vocabulary, examples, donts
            
            // Contenu
            $table->string('title', 200);
            $table->text('content');
            
            // Langue
            $table->char('language_code', 2)->index();
            // fr, en, es, de, it, pt, ar, zh, hi
            
            // Priorité (contrôle l'importance dans les prompts)
            $table->integer('priority')->default(50)->index();
            // 0-100, plus élevé = plus important
            
            // Activation
            $table->boolean('is_active')->default(true)->index();
            
            // Utilisation par type de contenu
            $table->boolean('use_in_articles')->default(true);
            $table->boolean('use_in_landings')->default(true);
            $table->boolean('use_in_comparatives')->default(true);
            $table->boolean('use_in_pillars')->default(true);
            $table->boolean('use_in_press')->default(true);
            
            $table->timestamps();
            
            // Index composites pour performance
            $table->index(['platform_id', 'knowledge_type']);
            $table->index(['platform_id', 'language_code']);
            $table->index(['is_active', 'priority']);
        });
        
        // Commentaires pour documentation
        DB::statement("ALTER TABLE platform_knowledge COMMENT = 'Base de connaissance des plateformes pour génération de contenu IA'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('platform_knowledge');
    }
};