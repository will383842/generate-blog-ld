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
        Schema::create('press_releases', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->index();
            
            // Relations
            $table->foreignId('platform_id')->constrained('platforms')->onDelete('cascade');
            $table->string('template_type', 50)->index();
            
            // Contenu principal
            $table->string('title', 200);
            $table->text('lead');
            $table->text('body1');
            $table->text('body2')->nullable();
            $table->text('body3')->nullable();
            $table->text('quote')->nullable();
            $table->text('boilerplate');
            
            // Contact
            $table->json('contact')->nullable();
            
            // Localisation
            $table->char('language_code', 2)->index();
            
            // Statut et dates
            $table->enum('status', ['draft', 'review', 'published'])->default('draft')->index();
            $table->timestamp('published_at')->nullable();
            
            // Coûts
            $table->decimal('generation_cost', 8, 4)->default(0);
            
            $table->timestamps();
            
            // Index composés
            $table->index(['platform_id', 'template_type']);
            $table->index(['platform_id', 'language_code']);
            $table->index(['status', 'published_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('press_releases');
    }
};