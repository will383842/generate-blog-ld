<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Table centralisée pour tous les templates de génération de contenu
     * - Contenus en ligne (articles, pillar, landing, comparative)
     * - Contenus PDF (press_release, dossier)
     */
    public function up(): void
    {
        Schema::create('content_templates', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            
            // Catégorie et type
            $table->enum('category', ['content', 'press'])->default('content');
            $table->string('type', 50); // article, pillar, landing, comparative, press_release, dossier
            $table->string('slug', 100)->unique();
            $table->string('name', 200);
            $table->text('description')->nullable();
            
            // Langue
            $table->string('language_code', 5); // fr, en, de, es, pt, ru, zh, ar, hi
            
            // Format de sortie
            $table->enum('output_format', ['html', 'pdf'])->default('html');
            
            // Prompts GPT
            $table->text('system_prompt'); // Instructions système pour GPT
            $table->text('user_prompt'); // Template avec variables {title}, {country}, etc.
            
            // Configuration structure
            $table->json('structure')->nullable(); // sections, word_count, faq_count, etc.
            $table->json('variables')->nullable(); // Liste des variables disponibles
            
            // Configuration génération
            $table->string('model', 50)->default('gpt-4o'); // Modèle GPT à utiliser
            $table->integer('max_tokens')->default(4000);
            $table->decimal('temperature', 2, 1)->default(0.7);
            
            // Word count
            $table->integer('word_count_min')->nullable();
            $table->integer('word_count_target')->nullable();
            $table->integer('word_count_max')->nullable();
            
            // FAQ
            $table->integer('faq_count')->default(0);
            
            // Statut
            $table->boolean('is_default')->default(false); // Template par défaut pour ce type/langue
            $table->boolean('is_active')->default(true);
            $table->integer('version')->default(1);
            $table->integer('usage_count')->default(0); // Compteur d'utilisation
            
            // Audit
            $table->foreignId('created_by')->nullable()->constrained('admin_users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('admin_users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            
            // Index
            $table->index(['category', 'type', 'language_code']);
            $table->index(['type', 'language_code', 'is_default']);
            $table->index(['is_active', 'category']);
        });

        // Table pour l'historique des versions de templates
        Schema::create('content_template_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('content_templates')->cascadeOnDelete();
            $table->integer('version');
            $table->text('system_prompt');
            $table->text('user_prompt');
            $table->json('structure')->nullable();
            $table->json('variables')->nullable();
            $table->string('change_note')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('admin_users')->nullOnDelete();
            $table->timestamp('created_at');
            
            $table->index(['template_id', 'version']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('content_template_versions');
        Schema::dropIfExists('content_templates');
    }
};
