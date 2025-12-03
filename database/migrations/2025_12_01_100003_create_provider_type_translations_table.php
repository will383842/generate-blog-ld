<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('provider_type_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('provider_type_id')->constrained()->onDelete('cascade');
            $table->char('language_code', 2);
            $table->string('singular', 100); // avocat, lawyer, 律师
            $table->string('plural', 100)->nullable(); // avocats, lawyers
            $table->string('article_singular', 20)->nullable(); // un, a, 一个
            $table->string('article_plural', 20)->nullable(); // des, some
            $table->string('slug', 100); // avocat, lawyer
            $table->text('description')->nullable();
            $table->timestamps();
            
            $table->unique(['provider_type_id', 'language_code']);
            $table->index('language_code');
            $table->index('slug');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('provider_type_translations');
    }
};
