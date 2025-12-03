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
        Schema::create('press_release_media', function (Blueprint $table) {
            $table->id();
            
            // Relation
            $table->foreignId('press_release_id')->constrained('press_releases')->onDelete('cascade');
            
            // Type de média
            $table->enum('media_type', ['photo', 'logo', 'chart', 'infographic'])->index();
            
            // Fichier
            $table->string('file_path');
            $table->string('caption')->nullable();
            $table->string('source')->nullable();
            $table->json('metadata')->nullable();
            
            // Ordre d'affichage
            $table->unsignedTinyInteger('order_index')->default(0);
            
            $table->timestamps();
            
            // Index
            $table->index(['press_release_id', 'order_index']);
            $table->index(['press_release_id', 'media_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('press_release_media');
    }
};