<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('countries', function (Blueprint $table) {
            // Ajouter SEULEMENT les 7 colonnes name_* manquantes
            // (name_fr et name_en existent déjà, tous les slug_* existent déjà)
            $table->string('name_de')->nullable()->after('name_en');
            $table->string('name_es')->nullable()->after('name_de');
            $table->string('name_pt')->nullable()->after('name_es');
            $table->string('name_ru')->nullable()->after('name_pt');
            $table->string('name_zh')->nullable()->after('name_ru');
            $table->string('name_ar')->nullable()->after('name_zh');
            $table->string('name_hi')->nullable()->after('name_ar');
        });
    }

    public function down(): void
    {
        Schema::table('countries', function (Blueprint $table) {
            $table->dropColumn([
                'name_de', 'name_es', 'name_pt', 
                'name_ru', 'name_zh', 'name_ar', 'name_hi',
            ]);
        });
    }
};