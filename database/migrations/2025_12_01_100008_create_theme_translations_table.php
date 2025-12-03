<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('theme_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('theme_id')->constrained()->onDelete('cascade');
            $table->char('language_code', 2);
            $table->string('name', 100); // Expatriation, 海外移居
            $table->string('slug', 100); // expatriation
            $table->text('description')->nullable();
            $table->timestamps();
            
            $table->unique(['theme_id', 'language_code']);
            $table->index('language_code');
            $table->index('slug');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('theme_translations');
    }
};
