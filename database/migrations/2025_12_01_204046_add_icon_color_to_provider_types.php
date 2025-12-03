<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('provider_types', function (Blueprint $table) {
            // Vérifier si les colonnes n'existent pas avant de les ajouter
            if (!Schema::hasColumn('provider_types', 'icon')) {
                $table->string('icon', 100)->after('slug')->nullable();
            }
            
            if (!Schema::hasColumn('provider_types', 'color')) {
                $table->string('color', 20)->after('icon')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('provider_types', function (Blueprint $table) {
            if (Schema::hasColumn('provider_types', 'icon')) {
                $table->dropColumn('icon');
            }
            
            if (Schema::hasColumn('provider_types', 'color')) {
                $table->dropColumn('color');
            }
        });
    }
};