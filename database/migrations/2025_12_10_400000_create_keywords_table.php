<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('keywords', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('platform_id')->nullable();
            $table->unsignedBigInteger('language_id')->nullable();
            $table->string('value', 255);
            $table->string('slug', 255);
            $table->integer('search_volume')->default(0);
            $table->decimal('difficulty', 5, 2)->default(0);
            $table->decimal('cpc', 8, 2)->default(0);
            $table->string('category', 100)->nullable();
            $table->integer('priority')->default(50);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Index
            $table->index(['platform_id', 'language_id']);
            $table->index('slug');
            $table->index('is_active');
            $table->unique(['platform_id', 'language_id', 'value'], 'unique_keyword_per_platform_lang');
            
            // Foreign keys
            $table->foreign('platform_id')->references('id')->on('platforms')->onDelete('cascade');
            $table->foreign('language_id')->references('id')->on('languages')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('keywords');
    }
};
