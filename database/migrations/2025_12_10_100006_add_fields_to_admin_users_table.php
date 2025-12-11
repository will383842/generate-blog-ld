<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admin_users', function (Blueprint $table) {
            if (!Schema::hasColumn('admin_users', 'avatar')) {
                $table->string('avatar')->nullable()->after('password');
            }
            if (!Schema::hasColumn('admin_users', 'phone')) {
                $table->string('phone')->nullable()->after('avatar');
            }
            if (!Schema::hasColumn('admin_users', 'timezone')) {
                $table->string('timezone')->default('Europe/Paris')->after('phone');
            }
            if (!Schema::hasColumn('admin_users', 'locale')) {
                $table->string('locale')->default('fr')->after('timezone');
            }
            if (!Schema::hasColumn('admin_users', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    public function down(): void
    {
        Schema::table('admin_users', function (Blueprint $table) {
            $columns = ['avatar', 'phone', 'timezone', 'locale', 'deleted_at'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('admin_users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
