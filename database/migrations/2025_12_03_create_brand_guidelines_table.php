<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('brand_guidelines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('platform_id')->constrained()->onDelete('cascade');
            $table->string('category'); // tone, vocabulary, structure, formatting
            $table->string('rule_type'); // required, forbidden, preferred
            $table->text('description');
            $table->json('examples')->nullable();
            $table->json('forbidden_terms')->nullable();
            $table->json('preferred_terms')->nullable();
            $table->integer('severity')->default(50); // 1-100
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['platform_id', 'category']);
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('brand_guidelines');
    }
};