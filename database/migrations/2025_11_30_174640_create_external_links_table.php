<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('external_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained()->onDelete('cascade');
            $table->string('url');
            $table->string('anchor_text');
            $table->string('source')->nullable();
            $table->boolean('is_affiliate')->default(false);
            $table->timestamps();
            
            $table->index('article_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('external_links');
    }
};