<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('country_settings')) {
            return;
        }

        Schema::create('country_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('country_id')->constrained('countries')->onDelete('cascade');
            $table->foreignId('platform_id')->constrained('platforms')->onDelete('cascade');
            $table->enum('priority', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->boolean('is_active')->default(true);
            $table->string('generation_frequency')->default('weekly');
            $table->boolean('auto_publish')->default(false);
            $table->json('seo_settings')->nullable();
            $table->json('content_settings')->nullable();
            $table->timestamps();

            $table->unique(['country_id', 'platform_id']);
            $table->index(['platform_id', 'priority']);
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('country_settings');
    }
};
