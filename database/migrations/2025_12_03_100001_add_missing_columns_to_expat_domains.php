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
        Schema::table('expat_domains', function (Blueprint $table) {
            if (!Schema::hasColumn('expat_domains', 'platform_id')) {
                $table->foreignId('platform_id')->nullable()->after('id')
                    ->constrained('platforms')->onDelete('cascade');
            }
            if (!Schema::hasColumn('expat_domains', 'code')) {
                $table->string('code', 50)->unique()->after('platform_id');
            }
            if (!Schema::hasColumn('expat_domains', 'icon')) {
                $table->string('icon')->nullable()->after('code');
            }
            if (!Schema::hasColumn('expat_domains', 'requires_details')) {
                $table->boolean('requires_details')->default(false)->after('icon');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expat_domains', function (Blueprint $table) {
            $table->dropForeign(['platform_id']);
            $table->dropColumn([
                'platform_id',
                'code',
                'icon',
                'requires_details'
            ]);
        });
    }
};