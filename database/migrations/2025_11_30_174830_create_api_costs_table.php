<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Table api_costs - Suivi des coûts API IA (agrégation par jour)
 * 
 * IMPORTANT: Cette migration remplace l'ancienne version.
 * - Utilise STRING au lieu de ENUM pour le champ 'type' (plus flexible)
 * - Précision 6 décimales pour les coûts (micro-centimes)
 * 
 * Une ligne par combinaison date/service/model/type
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('api_costs', function (Blueprint $table) {
            $table->id();
            $table->date('date')->index();
            $table->string('service');              // openai, perplexity, dalle
            $table->string('model')->nullable();    // gpt-4o, gpt-4o-mini, dall-e-3, etc.
            $table->string('type');                 // chat, translate, generate, search, meta, faqs, etc.
            $table->integer('requests_count')->default(0);
            $table->integer('input_tokens')->default(0);
            $table->integer('output_tokens')->default(0);
            $table->decimal('cost', 12, 6)->default(0);  // 6 décimales pour précision
            $table->timestamps();

            // Index unique pour updateOrCreate (agrégation)
            $table->unique(['date', 'service', 'model', 'type'], 'api_costs_unique');
            
            // Index pour les requêtes fréquentes
            $table->index('service');
            $table->index(['date', 'service']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('api_costs');
    }
};
