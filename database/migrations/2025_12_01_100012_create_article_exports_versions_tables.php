<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Exports d'articles (PDF, DOCX, etc.)
        Schema::create('article_exports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained()->onDelete('cascade');
            $table->char('language_code', 2);
            $table->enum('format', ['docx', 'pdf', 'md', 'html', 'json']);
            $table->string('file_path', 255);
            $table->string('file_name', 255);
            $table->integer('file_size')->unsigned()->nullable(); // En octets
            $table->integer('download_count')->default(0);
            $table->timestamp('generated_at');
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            
            $table->index(['article_id', 'language_code', 'format']);
            $table->index('expires_at');
        });

        // Versions d'articles (historique des modifications)
        Schema::create('article_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained()->onDelete('cascade');
            $table->char('language_code', 2);
            $table->integer('version_number');
            $table->string('title', 255);
            $table->text('content');
            $table->json('metadata')->nullable(); // Stockage des autres champs
            $table->string('change_summary', 255)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('admin_users')->onDelete('set null');
            $table->timestamps();
            
            $table->unique(['article_id', 'language_code', 'version_number']);
            $table->index(['article_id', 'language_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('article_versions');
        Schema::dropIfExists('article_exports');
    }
};
