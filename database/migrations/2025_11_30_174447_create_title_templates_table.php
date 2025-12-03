<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('title_templates', function (Blueprint $table) {
            $table->id();
            $table->string('template');
            $table->enum('type', ['article', 'landing']);
            $table->foreignId('platform_id')->nullable()->constrained()->onDelete('set null');
            $table->string('theme_type')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('usage_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('title_templates');
    }
};