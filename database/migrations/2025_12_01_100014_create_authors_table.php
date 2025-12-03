<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('authors', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 100)->unique();
            $table->string('name', 100);
            $table->string('email', 255)->nullable();
            $table->string('photo_url', 255)->nullable();
            $table->json('credentials')->nullable(); // ["Avocat", "Expert fiscal", "10 ans d'expérience"]
            $table->json('countries')->nullable(); // ["TH", "VN", "SG"]
            $table->json('specialties')->nullable(); // ["immigration", "fiscal", "famille"]
            $table->json('themes')->nullable(); // ["expatriation", "affiliation"]
            $table->string('linkedin_url', 255)->nullable();
            $table->string('twitter_url', 255)->nullable();
            $table->string('website_url', 255)->nullable();
            $table->integer('article_count')->default(0);
            $table->boolean('is_default')->default(false); // Auteur par défaut (ex: SOS-Expat)
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index('is_active');
            $table->index('is_default');
        });

        // Traductions des bios d'auteurs
        Schema::create('author_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('author_id')->constrained()->onDelete('cascade');
            $table->char('language_code', 2);
            $table->text('bio'); // Biographie courte
            $table->string('job_title', 100)->nullable(); // Avocat spécialisé en immigration
            $table->timestamps();
            
            $table->unique(['author_id', 'language_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('author_translations');
        Schema::dropIfExists('authors');
    }
};
