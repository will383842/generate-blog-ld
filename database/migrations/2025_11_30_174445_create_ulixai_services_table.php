<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Table ulixai_services - Arbre hiérarchique sur 3 niveaux
     * 
     * Niveau 1 : 11 catégories principales
     * Niveau 2 : ~50 sous-catégories
     * Niveau 3 : ~150 services
     */
    public function up(): void
    {
        Schema::create('ulixai_services', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('slug')->unique();
            
            // Noms en 9 langues
            $table->string('name_fr');
            $table->string('name_en');
            $table->string('name_es')->nullable();
            $table->string('name_de')->nullable();
            $table->string('name_pt')->nullable();
            $table->string('name_ru')->nullable();
            $table->string('name_zh')->nullable();
            $table->string('name_ar')->nullable();
            $table->string('name_hi')->nullable();
            
            // Descriptions (optionnel, FR + EN seulement)
            $table->text('description_fr')->nullable();
            $table->text('description_en')->nullable();
            
            // Hiérarchie
            $table->foreignId('parent_id')->nullable()->constrained('ulixai_services')->onDelete('cascade');
            $table->integer('level')->default(1); // 1, 2 ou 3
            
            // Affichage
            $table->string('icon')->nullable();
            $table->integer('order')->default(0);
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            
            // Index
            $table->index('level');
            $table->index('parent_id');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ulixai_services');
    }
};