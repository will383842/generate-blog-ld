<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('countries', function (Blueprint $table) {
            $table->id();
            $table->string('code', 2)->unique();
            $table->string('code_iso3', 3)->unique();
            $table->string('name')->nullable();
            $table->string('name_fr');
            $table->string('name_en');
            $table->string('name_de')->nullable();
            $table->string('name_es')->nullable();
            $table->string('name_pt')->nullable();
            $table->string('name_ru')->nullable();
            $table->string('name_zh')->nullable();
            $table->string('name_ar')->nullable();
            $table->string('name_hi')->nullable();
            $table->foreignId('region_id')->constrained()->onDelete('cascade');
            $table->foreignId('currency_id')->nullable()->constrained()->onDelete('set null');
            $table->string('phone_code', 10)->nullable();
            $table->string('flag_svg')->nullable();
            $table->integer('priority')->default(3);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('countries');
    }
};