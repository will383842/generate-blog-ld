<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ulixai_service_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ulixai_service_id')->constrained()->onDelete('cascade');
            $table->char('language_code', 2);
            $table->string('name', 150); // Recherche de logement
            $table->string('slug', 150); // recherche-logement
            $table->text('description')->nullable();
            $table->timestamps();
            
            $table->unique(['ulixai_service_id', 'language_code'], 'ulixai_service_trans_unique');
            $table->index('language_code');
            $table->index('slug');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ulixai_service_translations');
    }
};
