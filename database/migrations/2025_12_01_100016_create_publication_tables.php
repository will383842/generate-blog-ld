<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Configuration du scheduler de publication par plateforme
        Schema::create('publication_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('platform_id')->constrained()->onDelete('cascade');
            $table->integer('articles_per_day')->default(100);
            $table->integer('max_per_hour')->default(15);
            $table->json('active_hours'); // [9,10,11,14,15,16,17]
            $table->json('active_days'); // [1,2,3,4,5] (lun-ven)
            $table->integer('min_interval_minutes')->default(6);
            $table->string('timezone', 50)->default('Europe/Paris');
            $table->boolean('is_active')->default(true);
            $table->boolean('pause_on_error')->default(true);
            $table->integer('max_errors_before_pause')->default(5);
            $table->timestamps();
            
            $table->unique('platform_id');
        });

        // File d'attente de publication
        Schema::create('publication_queue', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained()->onDelete('cascade');
            $table->foreignId('platform_id')->constrained()->onDelete('cascade');
            $table->enum('priority', ['high', 'default', 'low'])->default('default');
            $table->enum('status', ['pending', 'scheduled', 'publishing', 'published', 'failed', 'cancelled'])->default('pending');
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->integer('attempts')->default(0);
            $table->integer('max_attempts')->default(3);
            $table->text('error_message')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            
            $table->index(['platform_id', 'status', 'priority', 'scheduled_at']);
            $table->index(['status', 'scheduled_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('publication_queue');
        Schema::dropIfExists('publication_schedules');
    }
};
