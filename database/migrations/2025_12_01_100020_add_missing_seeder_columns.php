<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('themes', function (Blueprint $table) {
            if (!Schema::hasColumn('themes', 'icon')) {
                $table->string('icon')->nullable();
            }
            if (!Schema::hasColumn('themes', 'color')) {
                $table->string('color')->nullable();
            }
        });

        Schema::table('provider_types', function (Blueprint $table) {
            if (!Schema::hasColumn('provider_types', 'icon')) {
                $table->string('icon')->nullable();
            }
        });

        Schema::table('lawyer_specialties', function (Blueprint $table) {
            if (!Schema::hasColumn('lawyer_specialties', 'category_code')) {
                $table->string('category_code')->nullable();
            }
            if (!Schema::hasColumn('lawyer_specialties', 'code')) {
                $table->string('code')->nullable();
            }
            if (!Schema::hasColumn('lawyer_specialties', 'icon')) {
                $table->string('icon')->nullable();
            }
        });

        Schema::table('expat_domains', function (Blueprint $table) {
            if (!Schema::hasColumn('expat_domains', 'code')) {
                $table->string('code')->nullable();
            }
            if (!Schema::hasColumn('expat_domains', 'icon')) {
                $table->string('icon')->nullable();
            }
            if (!Schema::hasColumn('expat_domains', 'requires_details')) {
                $table->boolean('requires_details')->default(false);
            }
        });

        Schema::table('templates', function (Blueprint $table) {
            if (!Schema::hasColumn('templates', 'prompt')) {
                $table->text('prompt')->nullable();
            }
            if (!Schema::hasColumn('templates', 'variables')) {
                $table->json('variables')->nullable();
            }
        });

        Schema::table('title_templates', function (Blueprint $table) {
            if (!Schema::hasColumn('title_templates', 'content_type')) {
                $table->string('content_type')->nullable();
            }
            if (!Schema::hasColumn('title_templates', 'template')) {
                $table->text('template')->nullable();
            }
            if (!Schema::hasColumn('title_templates', 'variables')) {
                $table->json('variables')->nullable();
            }
            if (!Schema::hasColumn('title_templates', 'weight')) {
                $table->integer('weight')->default(1);
            }
        });
    }

    public function down(): void
    {
        Schema::table('themes', function (Blueprint $table) {
            $table->dropColumn(['icon', 'color']);
        });
        Schema::table('provider_types', function (Blueprint $table) {
            $table->dropColumn('icon');
        });
        Schema::table('lawyer_specialties', function (Blueprint $table) {
            $table->dropColumn(['category_code', 'code', 'icon']);
        });
        Schema::table('expat_domains', function (Blueprint $table) {
            $table->dropColumn(['code', 'icon', 'requires_details']);
        });
        Schema::table('templates', function (Blueprint $table) {
            $table->dropColumn(['prompt', 'variables']);
        });
        Schema::table('title_templates', function (Blueprint $table) {
            $table->dropColumn(['content_type', 'template', 'variables', 'weight']);
        });
    }
};