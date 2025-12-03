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
        Schema::table('provider_types', function (Blueprint $table) {
            if (!Schema::hasColumn('provider_types', 'icon')) {
                $table->string('icon')->nullable()->after('code');
            }
            if (!Schema::hasColumn('provider_types', 'color')) {
                $table->string('color', 7)->nullable()->after('icon');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('provider_types', function (Blueprint $table) {
            $table->dropColumn(['icon', 'color']);
        });
    }
};
