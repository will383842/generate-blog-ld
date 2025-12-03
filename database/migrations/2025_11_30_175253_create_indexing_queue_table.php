<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('indexing_queue', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained()->onDelete('cascade');
            $table->string('url');
            $table->enum('type', ['google', 'bing', 'yandex', 'indexnow'])->default('google');
            $table->enum('action', ['index', 'update', 'delete'])->default('index');
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->integer('attempts')->default(0);
            $table->text('response')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'type', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('indexing_queue');
    }
};