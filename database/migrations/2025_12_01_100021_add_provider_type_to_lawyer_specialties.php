<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration pour ajouter la foreign key provider_type_id à lawyer_specialties
 * 
 * Cette colonne permet de lier les spécialités d'avocats à un type de prestataire
 * (ex: Avocat, Notaire, etc.)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lawyer_specialties', function (Blueprint $table) {
            if (!Schema::hasColumn('lawyer_specialties', 'provider_type_id')) {
                $table->foreignId('provider_type_id')
                      ->nullable()
                      ->after('id')
                      ->constrained('provider_types')
                      ->onDelete('set null');
            }
        });
    }

    public function down(): void
    {
        Schema::table('lawyer_specialties', function (Blueprint $table) {
            if (Schema::hasColumn('lawyer_specialties', 'provider_type_id')) {
                $table->dropConstrainedForeignId('provider_type_id');
            }
        });
    }
};