<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prompt_templates', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 100)->unique();
            $table->string('name', 100);
            $table->enum('type', ['article', 'landing', 'comparative', 'translation', 'meta', 'faq', 'image']);
            $table->foreignId('theme_id')->nullable()->constrained()->onDelete('set null');
            $table->char('language_code', 2)->default('fr');
            $table->text('system_prompt'); // Prompt système
            $table->text('user_prompt'); // Prompt utilisateur avec variables
            $table->json('variables')->nullable(); // Variables disponibles
            $table->json('config')->nullable(); // Configuration additionnelle
            $table->string('model', 50)->default('gpt-4'); // Modèle IA
            $table->integer('max_tokens')->default(4000);
            $table->decimal('temperature', 2, 1)->default(0.7);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            $table->index(['type', 'is_active']);
            $table->index(['theme_id', 'language_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prompt_templates');
    }
};
