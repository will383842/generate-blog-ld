<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Table affiliate_links - Liens affiliés avec ciblage géographique
     * 
     * Permet de cibler les partenaires par :
     * - Région (europe, asia, africa, middle_east, north_america, latin_america, oceania)
     * - Pays spécifiques (codes ISO 2 lettres)
     * - Global (disponible partout)
     */
    public function up(): void
    {
        Schema::create('affiliate_links', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('category'); // transfer, insurance, housing, moving, bank, language, vpn, telecom, community
            $table->string('url');
            $table->string('anchor_text');
            $table->text('description')->nullable();
            
            // Ciblage géographique
            $table->boolean('is_global')->default(false); // Disponible partout
            $table->json('regions')->nullable(); // ['europe', 'asia', 'africa', ...]
            $table->json('countries')->nullable(); // ['FR', 'US', 'TH', ...] codes ISO
            $table->json('excluded_countries')->nullable(); // Pays exclus
            
            // Ciblage plateforme
            $table->foreignId('platform_id')->nullable()->constrained()->onDelete('set null');
            
            // Matching contenu
            $table->json('keywords')->nullable(); // Mots-clés pour insertion auto
            
            // Commission et tracking
            $table->string('commission_type')->default('percentage'); // percentage, fixed, cpa, cpl
            $table->decimal('commission_rate', 8, 2)->nullable();
            $table->string('commission_currency', 3)->default('EUR');
            $table->integer('cookie_duration_days')->default(30);
            
            // Stats
            $table->integer('usage_count')->default(0);
            $table->integer('click_count')->default(0);
            $table->decimal('revenue_total', 12, 2)->default(0);
            
            // Statut
            $table->boolean('is_active')->default(true);
            $table->integer('priority')->default(0); // Pour trier si plusieurs matchs
            
            $table->timestamps();
            
            // Index
            $table->index('category');
            $table->index('is_global');
            $table->index('is_active');
            $table->index('priority');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('affiliate_links');
    }
};