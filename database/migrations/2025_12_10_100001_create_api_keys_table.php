<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('api_keys')) {
            return;
        }

        Schema::create('api_keys', function (Blueprint $table) {
            $table->id();
            $table->string('service');
            $table->string('name');
            $table->text('key');
            $table->string('status')->default('active');
            $table->timestamp('last_tested_at')->nullable();
            $table->json('test_result')->nullable();
            $table->timestamps();

            $table->index(['service', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('api_keys');
    }
};
