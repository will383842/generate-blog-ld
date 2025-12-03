<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            // Vérifier et ajouter platform_id
            if (!Schema::hasColumn('templates', 'platform_id')) {
                $table->unsignedBigInteger('platform_id')->nullable();
                $table->foreign('platform_id')->references('id')->on('platforms')->onDelete('set null');
            }
            
            // Vérifier et ajouter prompt
            if (!Schema::hasColumn('templates', 'prompt')) {
                $table->text('prompt')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            if (Schema::hasColumn('templates', 'platform_id')) {
                $table->dropForeign(['platform_id']);
                $table->dropColumn('platform_id');
            }
            
            if (Schema::hasColumn('templates', 'prompt')) {
                $table->dropColumn('prompt');
            }
        });
    }
};