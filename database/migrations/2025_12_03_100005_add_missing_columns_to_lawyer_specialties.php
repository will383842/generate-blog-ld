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
        Schema::table('lawyer_specialties', function (Blueprint $table) {
            if (!Schema::hasColumn('lawyer_specialties', 'provider_type_id')) {
                $table->foreignId('provider_type_id')->nullable()->after('id')
                    ->constrained('provider_types')->onDelete('cascade');
            }
            if (!Schema::hasColumn('lawyer_specialties', 'category_code')) {
                $table->string('category_code', 50)->nullable()->after('code');
            }
            if (!Schema::hasColumn('lawyer_specialties', 'code')) {
                $table->string('code', 50)->unique()->after('id');
            }
            if (!Schema::hasColumn('lawyer_specialties', 'icon')) {
                $table->string('icon')->nullable()->after('code');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lawyer_specialties', function (Blueprint $table) {
            $table->dropForeign(['provider_type_id']);
            $table->dropColumn([
                'provider_type_id',
                'category_code',
                'code',
                'icon'
            ]);
        });
    }
};