<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('research_cache', function (Blueprint $table) {
            $table->id();
            $table->string('cache_key', 32)->unique();
            $table->text('query_text');
            $table->string('language_code', 2);
            $table->json('results');
            $table->integer('hit_count')->default(0);
            $table->timestamp('expires_at');
            $table->timestamps();
            
            // Index
            $table->index('cache_key');
            $table->index('expires_at');
            $table->index('language_code');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('research_cache');
    }
};