<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('platforms', 'code')) {
            Schema::table('platforms', function (Blueprint $table) {
                $table->string('code', 50)->nullable()->after('name');
                $table->unique('code');
            });
            
            // Remplir les codes pour les plateformes existantes
            DB::table('platforms')->where('name', 'SOS-Expat')->update(['code' => 'sos-expat']);
            DB::table('platforms')->where('name', 'Ulixai')->update(['code' => 'ulixai']);
            DB::table('platforms')->where('name', 'Ulysse.AI')->update(['code' => 'ulysse']);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('platforms', 'code')) {
            Schema::table('platforms', function (Blueprint $table) {
                $table->dropUnique(['code']);
                $table->dropColumn('code');
            });
        }
    }
};