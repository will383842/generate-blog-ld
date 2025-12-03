<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('internal_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained()->onDelete('cascade');
            $table->foreignId('target_article_id')->constrained('articles')->onDelete('cascade');
            $table->string('anchor_text');
            $table->timestamps();
            
            $table->index(['article_id', 'target_article_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('internal_links');
    }
};