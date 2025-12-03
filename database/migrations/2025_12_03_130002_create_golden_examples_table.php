<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * =============================================================================
 * PHASE 13 - FICHIER 2/14 : Migration golden_examples
 * =============================================================================
 * 
 * EMPLACEMENT : database/migrations/2025_12_05_130002_create_golden_examples_table.php
 * 
 * DESCRIPTION : Table pour stocker les exemples de haute qualité (score ≥90)
 * Utilisés pour enrichir les prompts IA et améliorer la qualité des générations
 * 
 * =============================================================================
 */

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('golden_examples', function (Blueprint $table) {
            $table->id();
            
            // ============================================================
            // RELATIONS
            // ============================================================
            
            // Article source (nullable si supprimé)
            $table->foreignId('article_id')
                ->nullable()
                ->constrained('articles')
                ->onDelete('set null')
                ->comment('Article source de l\'exemple');
            
            // Plateforme et langue
            $table->foreignId('platform_id')->constrained()->onDelete('cascade');
            $table->string('language_code', 2)->index()->comment('fr, en, de, ru, zh, es, pt, ar, hi');
            
            // ============================================================
            // TYPE ET CATÉGORIE
            // ============================================================
            
            // Type de contenu source
            $table->enum('content_type', [
                'article', 
                'landing', 
                'comparative'
            ])->index()->comment('Type du contenu source');
            
            // Type d'exemple
            $table->enum('example_type', [
                'intro',           // Introduction exemplaire (100-150 mots)
                'conclusion',      // Conclusion exemplaire (80-120 mots)
                'section',         // Section H2 bien structurée
                'list',            // Liste bien formatée (UL/OL)
                'transition',      // Transition fluide entre sections
                'hook',            // Accroche percutante (20-40 mots)
                'full_article'     // Article complet référence
            ])->index()->comment('Type d\'extrait exemplaire');
            
            // Contexte thématique
            $table->string('category')->nullable()->index()->comment('Theme, specialty ou domain');
            $table->string('title')->nullable()->comment('Titre article source');
            
            // ============================================================
            // CONTENU EXEMPLAIRE
            // ============================================================
            
            // Extrait exemplaire (300-500 caractères)
            $table->text('excerpt')->comment('Extrait de haute qualité');
            
            // Nombre de mots de l'extrait
            $table->integer('word_count')->default(0)->comment('Nombre de mots extrait');
            
            // ============================================================
            // MÉTRIQUES QUALITÉ
            // ============================================================
            
            // Score qualité article source (≥90 pour golden)
            $table->decimal('quality_score', 5, 2)->index()->comment('Score article source (≥90.00)');
            
            // Compteur utilisation dans prompts
            $table->integer('times_used')->default(0)->comment('Nombre fois utilisé dans génération');
            
            // Impact mesure amélioration qualité
            $table->decimal('improvement_impact', 5, 2)->nullable()->comment('Impact mesuré sur qualité (+5.2%)');
            
            // ============================================================
            // GESTION ET ACTIVATION
            // ============================================================
            
            // Utiliser dans prompts
            $table->boolean('use_in_prompts')->default(true)->index()->comment('Activer pour enrichissement prompts');
            
            // Marqué automatiquement ou manuellement
            $table->enum('marked_by', ['auto', 'manual'])->default('auto')->comment('Auto-marking ou manuel');
            
            // Utilisateur ayant marqué manuellement
            $table->string('marked_by_user')->nullable()->comment('Email user si marquage manuel');
            
            // ============================================================
            // METADATA
            // ============================================================
            
            $table->timestamps();
            $table->softDeletes()->comment('Soft delete pour archivage sans perte');
            
            // ============================================================
            // INDEX POUR PERFORMANCE
            // ============================================================
            
            // Index pour récupération exemples par contexte
            $table->index(
                ['platform_id', 'language_code', 'example_type', 'use_in_prompts'], 
                'golden_context_idx'
            );
            
            // Index pour filtrage par catégorie et qualité
            $table->index(
                ['content_type', 'category', 'quality_score'], 
                'golden_category_quality_idx'
            );
            
            // Index pour statistiques utilisation
            $table->index(['times_used', 'improvement_impact'], 'golden_usage_idx');
        });
        
        echo "✅ Table 'golden_examples' créée avec succès\n";
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('golden_examples');
        echo "✅ Table 'golden_examples' supprimée\n";
    }
};

/*
 * =============================================================================
 * EXEMPLES D'UTILISATION
 * =============================================================================
 * 
 * // Récupérer top 5 exemples intro pour SOS-Expat FR
 * GoldenExample::where('platform_id', 1)
 *     ->where('language_code', 'fr')
 *     ->where('example_type', 'intro')
 *     ->where('use_in_prompts', true)
 *     ->where('category', 'avocat-immigration')
 *     ->orderBy('quality_score', 'desc')
 *     ->limit(5)
 *     ->get();
 * 
 * // Marquer exemple comme utilisé
 * $example->increment('times_used');
 * 
 * // Mesurer impact après génération
 * $example->update([
 *     'improvement_impact' => 5.2 // Articles générés avec exemple = +5.2% score
 * ]);
 * 
 * // Archiver exemples obsolètes (soft delete)
 * GoldenExample::where('created_at', '<', now()->subDays(90))
 *     ->where('times_used', '<', 5)
 *     ->delete();
 * 
 * // Récupérer incluant archivés
 * GoldenExample::withTrashed()->find($id);
 * 
 * // Statistiques utilisation
 * GoldenExample::selectRaw('
 *         example_type,
 *         COUNT(*) as total,
 *         AVG(quality_score) as avg_quality,
 *         AVG(times_used) as avg_usage,
 *         AVG(improvement_impact) as avg_impact
 *     ')
 *     ->where('platform_id', 1)
 *     ->groupBy('example_type')
 *     ->get();
 * 
 * =============================================================================
 * STRUCTURE EXEMPLE excerpt
 * =============================================================================
 * 
 * TYPE: intro
 * EXCERPT:
 * "Vous envisagez de vous expatrier en Espagne et vous vous interrogez sur 
 * les démarches juridiques ? Vous n'êtes pas seul. Sur les 304 millions 
 * d'expatriés dans le monde, nombreux sont ceux qui ont besoin d'un 
 * accompagnement légal adapté. Dans cet article complet, découvrez comment 
 * SOS-Expat connecte 2,500+ avocats vérifiés dans 197 pays pour vous répondre 
 * en moins de 5 minutes, 24/7."
 * 
 * WORD_COUNT: 68
 * QUALITY_SCORE: 94.50
 * TIMES_USED: 23
 * IMPROVEMENT_IMPACT: 6.8
 * 
 * ---
 * 
 * TYPE: conclusion
 * EXCERPT:
 * "En résumé, faire appel à un avocat spécialisé en droit de l'immigration 
 * en Espagne est essentiel pour sécuriser votre expatriation. Grâce à 
 * SOS-Expat, vous bénéficiez d'une consultation urgente en moins de 5 minutes, 
 * 24/7, avec des professionnels vérifiés. N'attendez plus : protégez vos 
 * droits dès aujourd'hui et vivez votre expatriation en toute sérénité."
 * 
 * WORD_COUNT: 55
 * QUALITY_SCORE: 92.00
 * TIMES_USED: 18
 * 
 * ---
 * 
 * TYPE: hook
 * EXCERPT:
 * "Saviez-vous que 73% des expatriés en Espagne rencontrent des difficultés 
 * juridiques dans leurs 6 premiers mois ? Ne faites pas cette erreur."
 * 
 * WORD_COUNT: 22
 * QUALITY_SCORE: 91.50
 * TIMES_USED: 45
 * 
 * =============================================================================
 * WORKFLOW AUTO-MARKING
 * =============================================================================
 * 
 * 1. ArticleGenerator génère article
 * 2. ContentQualityEnforcer valide → score = 94.5
 * 3. Si score ≥ 90 :
 *    - Extraire intro (300 premiers chars)
 *    - Extraire conclusion (300 derniers chars)
 *    - Extraire meilleure section H2 (plus longue)
 *    - Extraire meilleure liste (si présente)
 * 4. Créer GoldenExample pour chaque extrait :
 *    - article_id = $article->id
 *    - platform_id = $article->platform_id
 *    - language_code = $article->language_code
 *    - content_type = 'article'
 *    - example_type = 'intro' / 'conclusion' / 'section' / 'list'
 *    - category = $article->theme->slug
 *    - excerpt = [extrait]
 *    - quality_score = 94.5
 *    - marked_by = 'auto'
 *    - use_in_prompts = true
 * 5. Exemple disponible immédiatement pour prochaines générations
 * 
 * =============================================================================
 * WORKFLOW ENRICHISSEMENT PROMPT
 * =============================================================================
 * 
 * 1. ArticleGenerator commence génération
 * 2. GoldenExamplesService->getExamplesForContext(
 *      platform: SOS-Expat,
 *      contentType: article,
 *      lang: fr,
 *      category: 'avocat-immigration',
 *      limit: 5
 *    )
 * 3. Si ≥3 exemples trouvés :
 *    - Enrichir prompt avec section "# EXEMPLES D'EXCELLENTE QUALITÉ"
 *    - Ajouter chaque exemple avec son score
 *    - Consigne : "Inspire-toi du style, mais ne copie pas"
 * 4. GPT génère avec contexte enrichi
 * 5. Incrémenter times_used pour chaque exemple utilisé
 * 6. Mesurer score article généré vs moyenne sans exemples
 * 7. Calculer improvement_impact
 */