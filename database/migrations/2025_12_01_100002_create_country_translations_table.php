<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('country_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('country_id')->constrained()->onDelete('cascade');
            $table->char('language_code', 2);
            $table->string('name', 100); // Thaïlande, Thailand, ประเทศไทย
            $table->string('name_in', 100)->nullable(); // en Thaïlande, in Thailand
            $table->string('name_from', 100)->nullable(); // de Thaïlande, from Thailand
            $table->string('adjective', 100)->nullable(); // thaïlandais, Thai
            $table->string('adjective_plural', 100)->nullable(); // thaïlandais, Thai
            $table->string('adjective_feminine', 100)->nullable(); // thaïlandaise
            $table->string('adjective_feminine_plural', 100)->nullable(); // thaïlandaises
            $table->string('slug', 100); // thailande, thailand
            $table->timestamps();
            
            $table->unique(['country_id', 'language_code']);
            $table->index('language_code');
            $table->index('slug');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('country_translations');
    }
};
