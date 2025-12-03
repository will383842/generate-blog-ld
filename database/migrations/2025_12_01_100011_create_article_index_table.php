<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('article_index', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained()->onDelete('cascade');
            $table->foreignId('platform_id')->constrained()->onDelete('cascade');
            $table->char('language_code', 2);
            $table->char('country_code', 2)->nullable();
            $table->string('title', 255);
            $table->string('slug', 255);
            $table->json('keywords')->nullable(); // Mots-clés pour recherche
            $table->string('category', 50)->nullable(); // Theme slug
            $table->foreignId('provider_type_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('specialty_id')->nullable()->constrained('lawyer_specialties')->onDelete('set null');
            $table->foreignId('service_id')->nullable()->constrained('ulixai_services')->onDelete('set null');
            $table->integer('incoming_links_count')->default(0); // Nombre de liens reçus
            $table->integer('outgoing_links_count')->default(0); // Nombre de liens sortants
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            
            $table->unique(['article_id', 'language_code']);
            $table->index(['platform_id', 'language_code', 'country_code']);
            $table->index(['platform_id', 'category']);
            $table->index('slug');
            $table->fullText(['title'], 'ft_article_index_title');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('article_index');
    }
};
