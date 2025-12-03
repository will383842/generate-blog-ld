<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('platforms', function (Blueprint $table) {
            // Vérifier si les colonnes n'existent pas déjà
            if (!Schema::hasColumn('platforms', 'domain')) {
                $table->string('domain')->nullable()->after('code');
            }
            if (!Schema::hasColumn('platforms', 'description')) {
                $table->text('description')->nullable()->after('name');
            }
            if (!Schema::hasColumn('platforms', 'logo_url')) {
                $table->string('logo_url')->nullable()->after('description');
            }
            if (!Schema::hasColumn('platforms', 'primary_color')) {
                $table->string('primary_color', 7)->nullable()->after('logo_url');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('platforms', function (Blueprint $table) {
            $table->dropColumn([
                'domain',
                'description',
                'logo_url',
                'primary_color'
            ]);
        });
    }
};
