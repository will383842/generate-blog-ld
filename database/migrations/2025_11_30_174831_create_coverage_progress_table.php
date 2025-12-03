<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coverage_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('platform_id')->constrained()->onDelete('cascade');
            $table->foreignId('country_id')->constrained()->onDelete('cascade');
            $table->string('theme_type');
            $table->unsignedBigInteger('theme_id');
            $table->integer('articles_count')->default(0);
            $table->integer('landings_count')->default(0);
            $table->integer('translations_count')->default(0);
            $table->decimal('coverage_percent', 5, 2)->default(0);
            $table->timestamp('last_generated_at')->nullable();
            $table->timestamps();
            
            $table->unique(['platform_id', 'country_id', 'theme_type', 'theme_id'], 'coverage_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coverage_progress');
    }
};