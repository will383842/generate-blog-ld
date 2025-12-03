<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expat_domain_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('expat_domain_id')->constrained()->onDelete('cascade');
            $table->char('language_code', 2);
            $table->string('name', 100); // Assistance administrative urgente
            $table->string('slug', 100); // assistance-administrative-urgente
            $table->text('description')->nullable();
            $table->timestamps();
            
            $table->unique(['expat_domain_id', 'language_code'], 'expat_domain_trans_unique');
            $table->index('language_code');
            $table->index('slug');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expat_domain_translations');
    }
};
