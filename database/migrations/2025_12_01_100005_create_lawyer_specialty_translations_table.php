<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lawyer_specialty_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lawyer_specialty_id')->constrained()->onDelete('cascade');
            $table->char('language_code', 2);
            $table->string('name', 100); // Immigration, 移民法
            $table->string('slug', 100); // immigration
            $table->text('description')->nullable();
            $table->timestamps();
            
            $table->unique(['lawyer_specialty_id', 'language_code'], 'lawyer_spec_trans_unique');
            $table->index('language_code');
            $table->index('slug');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lawyer_specialty_translations');
    }
};
