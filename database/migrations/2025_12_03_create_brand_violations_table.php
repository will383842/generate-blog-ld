<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('brand_violations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained()->onDelete('cascade');
            $table->foreignId('guideline_id')->constrained('brand_guidelines')->onDelete('cascade');
            $table->string('violation_type'); // tone, vocabulary, structure
            $table->text('context'); // Extrait où la violation a été détectée
            $table->text('suggestion')->nullable();
            $table->integer('severity'); // 1-100
            $table->string('status')->default('pending'); // pending, fixed, dismissed
            $table->timestamps();

            $table->index(['article_id', 'status']);
            $table->index('guideline_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('brand_violations');
    }
};