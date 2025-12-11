<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('brand_sections')) {
            return;
        }

        Schema::create('brand_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('platform_id')->constrained('platforms')->onDelete('cascade');
            $table->string('section');
            $table->json('content');
            $table->string('language', 5)->default('fr');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['platform_id', 'section', 'language']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('brand_sections');
    }
};
