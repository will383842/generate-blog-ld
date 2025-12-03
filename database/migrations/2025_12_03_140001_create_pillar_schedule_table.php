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
        Schema::create('pillar_schedule', function (Blueprint $table) {
            $table->id();
            
            // Relations
            $table->foreignId('platform_id')->constrained('platforms')->onDelete('cascade');
            $table->foreignId('country_id')->constrained('countries')->onDelete('cascade');
            $table->foreignId('theme_id')->constrained('themes')->onDelete('cascade');
            
            // Configuration
            $table->string('template_type', 50); // guide_ultime, analyse_marche, etc.
            $table->string('title');
            
            // Planification
            $table->date('scheduled_date');
            $table->enum('status', ['planned', 'generating', 'completed', 'failed'])->default('planned');
            $table->integer('priority')->default(50); // 0-100
            
            // Résultat
            $table->foreignId('article_id')->nullable()->constrained('articles')->onDelete('set null');
            $table->text('error_message')->nullable();
            
            $table->timestamps();
            
            // Index pour performance
            $table->index(['platform_id', 'scheduled_date']);
            $table->index(['status', 'scheduled_date']);
            $table->index('priority');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pillar_schedule');
    }
};
