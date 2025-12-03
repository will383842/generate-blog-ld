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
        Schema::create('press_release_exports', function (Blueprint $table) {
            $table->id();
            
            // Relation
            $table->foreignId('press_release_id')->constrained('press_releases')->onDelete('cascade');
            
            // Format d'export
            $table->enum('export_format', ['pdf', 'word', 'html'])->index();
            
            // Langue de l'export
            $table->char('language_code', 2);
            
            // Fichier généré
            $table->string('file_path');
            $table->string('file_name');
            $table->unsignedInteger('file_size')->default(0);
            
            // Métadonnées
            $table->json('export_options')->nullable();
            $table->string('generated_by')->nullable();
            
            // Téléchargements
            $table->unsignedInteger('download_count')->default(0);
            $table->timestamp('last_downloaded_at')->nullable();
            
            $table->timestamps();
            
            // Index
            $table->index(['press_release_id', 'export_format']);
            $table->index(['press_release_id', 'language_code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('press_release_exports');
    }
};