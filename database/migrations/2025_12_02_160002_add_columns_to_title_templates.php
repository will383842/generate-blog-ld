<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ajoute les colonnes manquantes à title_templates
     */
    public function up(): void
    {
        Schema::table('title_templates', function (Blueprint $table) {
            // Ajouter template_variables
            if (!Schema::hasColumn('title_templates', 'template_variables')) {
                $table->json('template_variables')->nullable()->after('template');
            }
            
            // Ajouter weight pour la pondération
            if (!Schema::hasColumn('title_templates', 'weight')) {
                $table->integer('weight')->default(10)->after('theme_type');
            }
        });
        
        // Renommer type en content_type si nécessaire
        if (Schema::hasColumn('title_templates', 'type') && !Schema::hasColumn('title_templates', 'content_type')) {
            Schema::table('title_templates', function (Blueprint $table) {
                $table->renameColumn('type', 'content_type');
            });
        }
    }

    public function down(): void
    {
        Schema::table('title_templates', function (Blueprint $table) {
            if (Schema::hasColumn('title_templates', 'template_variables')) {
                $table->dropColumn('template_variables');
            }
            if (Schema::hasColumn('title_templates', 'weight')) {
                $table->dropColumn('weight');
            }
        });
        
        if (Schema::hasColumn('title_templates', 'content_type')) {
            Schema::table('title_templates', function (Blueprint $table) {
                $table->renameColumn('content_type', 'type');
            });
        }
    }
};