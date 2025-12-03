<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Renomme les colonnes de templates pour correspondre au seeder
     */
    public function up(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            // Renommer prompt_template en prompt (si prompt_template existe et prompt n'existe pas)
            if (Schema::hasColumn('templates', 'prompt_template') && !Schema::hasColumn('templates', 'prompt')) {
                $table->renameColumn('prompt_template', 'prompt');
            }
        });
        
        Schema::table('templates', function (Blueprint $table) {
            // Renommer variables en template_variables (si variables existe et template_variables n'existe pas)
            if (Schema::hasColumn('templates', 'variables') && !Schema::hasColumn('templates', 'template_variables')) {
                $table->renameColumn('variables', 'template_variables');
            }
        });
    }

    public function down(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            if (Schema::hasColumn('templates', 'prompt') && !Schema::hasColumn('templates', 'prompt_template')) {
                $table->renameColumn('prompt', 'prompt_template');
            }
        });
        
        Schema::table('templates', function (Blueprint $table) {
            if (Schema::hasColumn('templates', 'template_variables') && !Schema::hasColumn('templates', 'variables')) {
                $table->renameColumn('template_variables', 'variables');
            }
        });
    }
};