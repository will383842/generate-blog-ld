<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pdf_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('platform_id')->constrained('platforms')->onDelete('cascade');
            $table->string('content_type'); // Article, PillarArticle, PressRelease, PressDossier
            $table->string('logo_path')->nullable();
            $table->text('header_template')->nullable();
            $table->text('footer_template')->nullable();
            $table->json('fonts')->nullable(); // Configuration fonts par langue
            $table->json('colors')->nullable(); // Couleurs brand
            $table->timestamps();

            $table->index(['platform_id', 'content_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pdf_configs');
    }
};