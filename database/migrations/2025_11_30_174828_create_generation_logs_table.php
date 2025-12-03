<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('generation_logs', function (Blueprint $table) {
            $table->id();
            $table->uuid('batch_uuid')->nullable()->index();
            $table->foreignId('article_id')->nullable()->constrained()->onDelete('set null');
            $table->enum('type', ['article', 'landing', 'translation', 'image']);
            $table->enum('status', ['started', 'completed', 'failed']);
            $table->text('message')->nullable();
            $table->json('metadata')->nullable();
            $table->decimal('cost', 10, 4)->default(0);
            $table->integer('duration_ms')->nullable();
            $table->timestamps();
            
            $table->index(['type', 'status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('generation_logs');
    }
};