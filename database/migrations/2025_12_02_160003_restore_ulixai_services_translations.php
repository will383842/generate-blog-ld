<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Restaure les colonnes de traduction dans ulixai_services
     * car le seeder les utilise encore
     */
    public function up(): void
    {
        Schema::table('ulixai_services', function (Blueprint $table) {
            // Restaurer les colonnes de traduction si elles n'existent pas
            if (!Schema::hasColumn('ulixai_services', 'name_de')) {
                $table->string('name_de')->nullable()->after('name_en');
            }
            if (!Schema::hasColumn('ulixai_services', 'name_es')) {
                $table->string('name_es')->nullable()->after('name_de');
            }
            if (!Schema::hasColumn('ulixai_services', 'name_pt')) {
                $table->string('name_pt')->nullable()->after('name_es');
            }
            if (!Schema::hasColumn('ulixai_services', 'name_ru')) {
                $table->string('name_ru')->nullable()->after('name_pt');
            }
            if (!Schema::hasColumn('ulixai_services', 'name_zh')) {
                $table->string('name_zh')->nullable()->after('name_ru');
            }
            if (!Schema::hasColumn('ulixai_services', 'name_ar')) {
                $table->string('name_ar')->nullable()->after('name_zh');
            }
            if (!Schema::hasColumn('ulixai_services', 'name_hi')) {
                $table->string('name_hi')->nullable()->after('name_ar');
            }
        });
    }

    public function down(): void
    {
        Schema::table('ulixai_services', function (Blueprint $table) {
            if (Schema::hasColumn('ulixai_services', 'name_de')) {
                $table->dropColumn('name_de');
            }
            if (Schema::hasColumn('ulixai_services', 'name_es')) {
                $table->dropColumn('name_es');
            }
            if (Schema::hasColumn('ulixai_services', 'name_pt')) {
                $table->dropColumn('name_pt');
            }
            if (Schema::hasColumn('ulixai_services', 'name_ru')) {
                $table->dropColumn('name_ru');
            }
            if (Schema::hasColumn('ulixai_services', 'name_zh')) {
                $table->dropColumn('name_zh');
            }
            if (Schema::hasColumn('ulixai_services', 'name_ar')) {
                $table->dropColumn('name_ar');
            }
            if (Schema::hasColumn('ulixai_services', 'name_hi')) {
                $table->dropColumn('name_hi');
            }
        });
    }
};