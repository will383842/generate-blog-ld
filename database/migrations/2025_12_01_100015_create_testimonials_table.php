<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('testimonials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('platform_id')->constrained()->onDelete('cascade');
            $table->string('first_name', 50);
            $table->string('last_name_initial', 5); // M., D., etc.
            $table->char('country_code', 2)->nullable();
            $table->string('city', 100)->nullable();
            $table->foreignId('service_id')->nullable()->constrained('ulixai_services')->onDelete('set null');
            $table->foreignId('specialty_id')->nullable()->constrained('lawyer_specialties')->onDelete('set null');
            $table->string('photo_url', 255)->nullable();
            $table->tinyInteger('rating')->unsigned()->nullable(); // 1-5 étoiles
            $table->enum('source', ['manual', 'api', 'generated'])->default('manual');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            $table->index(['platform_id', 'is_active']);
            $table->index(['country_code', 'is_active']);
            $table->index('is_featured');
        });

        // Traductions des témoignages
        Schema::create('testimonial_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('testimonial_id')->constrained()->onDelete('cascade');
            $table->char('language_code', 2);
            $table->text('quote'); // Le témoignage lui-même
            $table->string('service_used', 100)->nullable(); // Description du service utilisé
            $table->boolean('is_auto_translated')->default(false);
            $table->timestamps();
            
            $table->unique(['testimonial_id', 'language_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('testimonial_translations');
        Schema::dropIfExists('testimonials');
    }
};
