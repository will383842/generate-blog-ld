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
        Schema::create('dossier_exports', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->index();
            
            // Relations
            $table->foreignId('dossier_id')->constrained('press_dossiers')->onDelete('cascade');
            
            // Format d'export
            $table->enum('export_format', ['pdf', 'word', 'excel', 'powerpoint'])->index();
            
            // Localisation
            $table->char('language_code', 2)->index();
            
            // Fichier
            $table->string('file_path', 500);
            $table->string('filename', 255);
            $table->integer('file_size')->nullable(); // En bytes
            
            // Statut
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending')->index();
            $table->string('error_message', 500)->nullable();
            
            // Performance
            $table->integer('generation_time_seconds')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            
            // Options d'export
            $table->json('export_options')->nullable(); // Options spécifiques (qualité, compression, etc.)
            
            // Statistiques
            $table->integer('download_count')->default(0);
            $table->timestamp('last_downloaded_at')->nullable();
            
            $table->timestamps();
            
            // Index composés
            $table->index(['dossier_id', 'export_format', 'language_code']);
            $table->index(['status', 'created_at']);
            $table->index(['export_format', 'completed_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dossier_exports');
    }
};