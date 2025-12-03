<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Ajouter colonnes quality_score et validation_notes
 * 
 * Cette migration ajoute les colonnes nécessaires pour la validation
 * de contenu par PlatformKnowledgeService
 * 
 * Tables concernées:
 * - articles
 * - landings
 * - comparatives
 * - pillar_articles (si existe)
 * - press_releases (si existe)
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // === ARTICLES ===
        if (Schema::hasTable('articles')) {
            Schema::table('articles', function (Blueprint $table) {
                if (!Schema::hasColumn('articles', 'quality_score')) {
                    $table->decimal('quality_score', 5, 2)->nullable()->after('status');
                }
                if (!Schema::hasColumn('articles', 'validation_notes')) {
                    $table->json('validation_notes')->nullable()->after('quality_score');
                }
            });

            // Ajouter index pour requêtes sur quality_score
            Schema::table('articles', function (Blueprint $table) {
                $table->index(['status', 'quality_score'], 'articles_status_quality_idx');
            });

            echo "✅ Colonnes ajoutées à la table 'articles'\n";
        }

        // === LANDINGS ===
        if (Schema::hasTable('landings')) {
            Schema::table('landings', function (Blueprint $table) {
                if (!Schema::hasColumn('landings', 'quality_score')) {
                    $table->decimal('quality_score', 5, 2)->nullable()->after('status');
                }
                if (!Schema::hasColumn('landings', 'validation_notes')) {
                    $table->json('validation_notes')->nullable()->after('quality_score');
                }
            });

            Schema::table('landings', function (Blueprint $table) {
                $table->index(['status', 'quality_score'], 'landings_status_quality_idx');
            });

            echo "✅ Colonnes ajoutées à la table 'landings'\n";
        }

        // === COMPARATIVES ===
        if (Schema::hasTable('comparatives')) {
            Schema::table('comparatives', function (Blueprint $table) {
                if (!Schema::hasColumn('comparatives', 'quality_score')) {
                    $table->decimal('quality_score', 5, 2)->nullable()->after('status');
                }
                if (!Schema::hasColumn('comparatives', 'validation_notes')) {
                    $table->json('validation_notes')->nullable()->after('quality_score');
                }
            });

            Schema::table('comparatives', function (Blueprint $table) {
                $table->index(['status', 'quality_score'], 'comparatives_status_quality_idx');
            });

            echo "✅ Colonnes ajoutées à la table 'comparatives'\n";
        }

        // === PILLAR ARTICLES (Phase 14 - optionnel) ===
        if (Schema::hasTable('pillar_articles')) {
            Schema::table('pillar_articles', function (Blueprint $table) {
                if (!Schema::hasColumn('pillar_articles', 'quality_score')) {
                    $table->decimal('quality_score', 5, 2)->nullable()->after('status');
                }
                if (!Schema::hasColumn('pillar_articles', 'validation_notes')) {
                    $table->json('validation_notes')->nullable()->after('quality_score');
                }
            });

            Schema::table('pillar_articles', function (Blueprint $table) {
                $table->index(['status', 'quality_score'], 'pillar_articles_status_quality_idx');
            });

            echo "✅ Colonnes ajoutées à la table 'pillar_articles'\n";
        }

        // === PRESS RELEASES (Phase 16 - optionnel) ===
        if (Schema::hasTable('press_releases')) {
            Schema::table('press_releases', function (Blueprint $table) {
                if (!Schema::hasColumn('press_releases', 'quality_score')) {
                    $table->decimal('quality_score', 5, 2)->nullable()->after('status');
                }
                if (!Schema::hasColumn('press_releases', 'validation_notes')) {
                    $table->json('validation_notes')->nullable()->after('quality_score');
                }
            });

            Schema::table('press_releases', function (Blueprint $table) {
                $table->index(['status', 'quality_score'], 'press_releases_status_quality_idx');
            });

            echo "✅ Colonnes ajoutées à la table 'press_releases'\n";
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = ['articles', 'landings', 'comparatives', 'pillar_articles', 'press_releases'];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    // Supprimer index
                    $indexName = $tableName . '_status_quality_idx';
                    if (Schema::hasColumn($tableName, 'quality_score')) {
                        $table->dropIndex($indexName);
                    }

                    // Supprimer colonnes
                    if (Schema::hasColumn($tableName, 'quality_score')) {
                        $table->dropColumn('quality_score');
                    }
                    if (Schema::hasColumn($tableName, 'validation_notes')) {
                        $table->dropColumn('validation_notes');
                    }
                });

                echo "✅ Colonnes supprimées de la table '{$tableName}'\n";
            }
        }
    }
};

/*
 * DESCRIPTION DES COLONNES:
 * 
 * quality_score (DECIMAL 5,2):
 * - Score de validation du contenu (0.00 à 100.00)
 * - Généré par PlatformKnowledgeService::validateContent()
 * - Nullable (pas de score si pas encore validé)
 * - Exemples: 85.50, 92.75, 67.20
 * 
 * validation_notes (JSON):
 * - Détails de la validation
 * - Structure:
 *   {
 *     "valid": true/false,
 *     "score": 85.5,
 *     "errors": ["Chiffre '304 millions' manquant", ...],
 *     "warnings": ["Nom plateforme absent", ...],
 *     "validated_at": "2025-12-03T10:30:00Z"
 *   }
 * 
 * UTILISATION:
 * 
 * // Requête articles avec validation échouée
 * Article::where('status', 'review_needed')
 *     ->where('quality_score', '<', 70)
 *     ->get();
 * 
 * // Requête articles haute qualité
 * Article::where('quality_score', '>=', 90)
 *     ->orderBy('quality_score', 'desc')
 *     ->get();
 * 
 * // Décoder validation_notes
 * $notes = json_decode($article->validation_notes, true);
 * $errors = $notes['errors'] ?? [];
 */