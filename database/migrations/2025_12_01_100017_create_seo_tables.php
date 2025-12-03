<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Redirections 301/302
        Schema::create('redirects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('platform_id')->constrained()->onDelete('cascade');
            $table->string('from_url', 500);
            $table->string('to_url', 500);
            $table->enum('type', ['301', '302'])->default('301');
            $table->integer('hit_count')->default(0);
            $table->timestamp('last_hit_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index(['platform_id', 'from_url']);
            $table->index('is_active');
        });

        // Liens cassés détectés
        Schema::create('broken_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('platform_id')->constrained()->onDelete('cascade');
            $table->string('url', 500);
            $table->enum('link_type', ['internal', 'external', 'affiliate']);
            $table->integer('http_status')->nullable();
            $table->string('error_message', 255)->nullable();
            $table->enum('status', ['detected', 'fixed', 'ignored'])->default('detected');
            $table->timestamp('detected_at');
            $table->timestamp('fixed_at')->nullable();
            $table->timestamps();
            
            $table->index(['platform_id', 'status']);
            $table->index('detected_at');
        });

        // Entrées sitemap
        Schema::create('sitemap_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('platform_id')->constrained()->onDelete('cascade');
            $table->foreignId('article_id')->nullable()->constrained()->onDelete('cascade');
            $table->char('language_code', 2);
            $table->string('url', 500);
            $table->string('changefreq', 20)->default('weekly'); // always, hourly, daily, weekly, monthly, yearly, never
            $table->decimal('priority', 2, 1)->default(0.5); // 0.0 - 1.0
            $table->timestamp('lastmod')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->unique(['platform_id', 'url']);
            $table->index(['platform_id', 'language_code', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sitemap_entries');
        Schema::dropIfExists('broken_links');
        Schema::dropIfExists('redirects');
    }
};
