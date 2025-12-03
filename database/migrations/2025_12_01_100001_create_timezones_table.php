<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('timezones', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50)->unique(); // Europe/Paris
            $table->string('offset_utc', 10); // +01:00
            $table->integer('offset_minutes'); // 60
            $table->string('abbreviation', 10)->nullable(); // CET
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('timezones');
    }
};
