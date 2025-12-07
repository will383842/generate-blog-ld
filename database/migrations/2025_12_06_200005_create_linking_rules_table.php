<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 27 - Fichier 5: Table linking_rules
 * Règles de maillage par plateforme
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('linking_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('platform_id')->unique()->constrained()->onDelete('cascade');
            
            // Règles liens internes
            $table->unsignedTinyInteger('min_internal_links')->default(5);
            $table->unsignedTinyInteger('max_internal_links')->default(12);
            
            // Règles liens externes
            $table->unsignedTinyInteger('min_external_links')->default(2);
            $table->unsignedTinyInteger('max_external_links')->default(5);
            
            // Règles générales
            $table->unsignedTinyInteger('max_links_per_paragraph')->default(1);
            $table->boolean('pillar_link_required')->default(true);
            
            // Distribution des types d'ancres (JSON)
            $table->json('anchor_distribution')->nullable()->comment('% par type anchor');
            
            // Priorité sources externes (JSON)
            $table->json('external_source_priority')->nullable()->comment('Ordre priorité types');
            
            // Règles affiliés
            $table->boolean('auto_affiliate_injection')->default(true);
            $table->unsignedTinyInteger('affiliate_max_per_article')->default(3);
            
            $table->timestamps();
        });
        
        // Seed règles par défaut pour plateformes existantes
        $this->seedDefaultRules();
    }
    
    protected function seedDefaultRules(): void
    {
        $platforms = \DB::table('platforms')->pluck('id');
        
        $defaultAnchorDistribution = [
            'exact_match' => 30,
            'long_tail' => 25,
            'generic' => 20,
            'cta' => 15,
            'question' => 10,
        ];
        
        $defaultSourcePriority = ['government', 'organization', 'reference', 'news'];
        
        foreach ($platforms as $platformId) {
            \DB::table('linking_rules')->insertOrIgnore([
                'platform_id' => $platformId,
                'min_internal_links' => 5,
                'max_internal_links' => 12,
                'min_external_links' => 2,
                'max_external_links' => 5,
                'max_links_per_paragraph' => 1,
                'pillar_link_required' => true,
                'anchor_distribution' => json_encode($defaultAnchorDistribution),
                'external_source_priority' => json_encode($defaultSourcePriority),
                'auto_affiliate_injection' => true,
                'affiliate_max_per_article' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('linking_rules');
    }
};
