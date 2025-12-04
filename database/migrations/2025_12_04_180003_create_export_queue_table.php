<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('export_queue', function (Blueprint $table) {
            $table->id();
            $table->string('content_type'); // Article, PillarArticle, PressRelease, PressDossier
            $table->unsignedBigInteger('content_id');
            $table->enum('export_format', ['pdf', 'word'])->default('pdf');
            $table->string('language_code', 2);
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->string('file_path')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();

            $table->index(['content_type', 'content_id']);
            $table->index(['language_code']);
            $table->index(['status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('export_queue');
    }
};