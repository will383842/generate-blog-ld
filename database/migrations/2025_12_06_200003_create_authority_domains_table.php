<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 27 - Fichier 3: Table authority_domains
 * Domaines autorité pré-configurés (~500 entrées)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('authority_domains', function (Blueprint $table) {
            $table->id();
            $table->string('domain', 200)->unique();
            $table->string('name', 200);
            $table->enum('source_type', ['government', 'organization', 'reference', 'news'])
                  ->default('reference');
            $table->char('country_code', 2)->nullable()->comment('null = international');
            $table->json('languages')->nullable()->comment('Langues supportées');
            $table->json('topics')->nullable()->comment('Thèmes couverts');
            $table->unsignedTinyInteger('authority_score')->default(70);
            $table->boolean('is_active')->default(true);
            $table->boolean('auto_discovered')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index('country_code', 'authority_domains_country_idx');
            $table->index('source_type', 'authority_domains_type_idx');
            $table->index('authority_score', 'authority_domains_score_idx');
            $table->index('is_active', 'authority_domains_active_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('authority_domains');
    }
};
