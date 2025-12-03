<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('generation_queues', function (Blueprint $table) {
            $table->id();
            $table->uuid('batch_uuid')->index();
            $table->foreignId('platform_id')->constrained()->onDelete('cascade');
            $table->foreignId('country_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['article', 'landing']);
            $table->string('theme_type')->nullable();
            $table->unsignedBigInteger('theme_id')->nullable();
            $table->json('languages')->nullable();
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->integer('priority')->default(0);
            $table->integer('attempts')->default(0);
            $table->text('error_message')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            
            $table->index(['status', 'priority', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('generation_queues');
    }
};