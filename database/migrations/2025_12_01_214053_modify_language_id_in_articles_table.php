<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            // Modifier language_id pour avoir une valeur par défaut
            $table->unsignedBigInteger('language_id')->default(1)->change();
        });
    }

    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            // Retirer la valeur par défaut
            $table->unsignedBigInteger('language_id')->default(null)->change();
        });
    }
};