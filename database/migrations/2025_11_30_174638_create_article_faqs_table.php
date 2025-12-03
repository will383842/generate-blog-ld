<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('article_faqs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained()->onDelete('cascade');
            $table->foreignId('language_id')->constrained()->onDelete('cascade');
            $table->text('question');
            $table->text('answer');
            $table->integer('order')->default(0);
            $table->timestamps();
            
            $table->index(['article_id', 'language_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('article_faqs');
    }
};