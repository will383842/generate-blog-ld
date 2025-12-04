<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('word_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('platform_id')->constrained('platforms')->onDelete('cascade');
            $table->string('content_type'); // Article, PillarArticle, PressRelease, PressDossier
            $table->string('template_path')->nullable();
            $table->json('styles')->nullable(); // Styles PHPWord personnalisés
            $table->json('fonts')->nullable(); // Configuration fonts par langue
            $table->timestamps();

            $table->index(['platform_id', 'content_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('word_configs');
    }
};