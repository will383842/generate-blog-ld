<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * =============================================================================
 * PHASE 13 - FICHIER 3/14 : Model QualityCheck
 * =============================================================================
 * 
 * EMPLACEMENT : app/Models/QualityCheck.php
 * 
 * DESCRIPTION : Model pour l'historique des validations qualité
 * Relation polymorphique vers Article/Landing/Comparative
 * 
 * =============================================================================
 */

class QualityCheck extends Model
{
    use HasFactory;

    protected $fillable = [
        'checkable_type',
        'checkable_id',
        'content_type',
        'platform_id',
        'language_code',
        'knowledge_score',
        'brand_score',
        'seo_score',
        'readability_score',
        'structure_score',
        'originality_score',
        'overall_score',
        'status',
        'validation_details',
        'errors',
        'warnings',
        'suggestions',
        'checked_at',
    ];

    protected $casts = [
        'knowledge_score' => 'decimal:2',
        'brand_score' => 'decimal:2',
        'seo_score' => 'decimal:2',
        'readability_score' => 'decimal:2',
        'structure_score' => 'decimal:2',
        'originality_score' => 'decimal:2',
        'overall_score' => 'decimal:2',
        'validation_details' => 'array',
        'errors' => 'array',
        'warnings' => 'array',
        'suggestions' => 'array',
        'checked_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
// =========================================================================
// RELATIONS
// =========================================================================

/**
 * Article associé à ce quality check
 */
public function article()
{
    return $this->belongsTo(Article::class);
}
    // =========================================================================
    // RELATIONS
    // =========================================================================

    /**
     * Relation polymorphique vers le contenu validé (Article, Landing, etc.)
     */
    public function checkable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Relation vers Platform
     */
    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    /**
     * Scope : Validations échouées
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Scope : Validations avec avertissement
     */
    public function scopeWarning($query)
    {
        return $query->where('status', 'warning');
    }

    /**
     * Scope : Validations réussies
     */
    public function scopePassed($query)
    {
        return $query->where('status', 'passed');
    }

    /**
     * Scope : Par plateforme
     */
    public function scopeForPlatform($query, $platformId)
    {
        return $query->where('platform_id', $platformId);
    }

    /**
     * Scope : Par type de contenu
     */
    public function scopeForContentType($query, string $contentType)
    {
        return $query->where('content_type', $contentType);
    }

    /**
     * Scope : Par langue
     */
    public function scopeForLanguage($query, string $languageCode)
    {
        return $query->where('language_code', $languageCode);
    }

    /**
     * Scope : Score minimum
     */
    public function scopeMinScore($query, float $minScore)
    {
        return $query->where('overall_score', '>=', $minScore);
    }

    /**
     * Scope : Score maximum
     */
    public function scopeMaxScore($query, float $maxScore)
    {
        return $query->where('overall_score', '<=', $maxScore);
    }

    /**
     * Scope : Validations récentes
     */
    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('checked_at', '>=', now()->subDays($days));
    }

    /**
     * Scope : Haute qualité (score ≥ 90)
     */
    public function scopeHighQuality($query)
    {
        return $query->where('overall_score', '>=', 90);
    }

    /**
     * Scope : Basse qualité (score < 60)
     */
    public function scopeLowQuality($query)
    {
        return $query->where('overall_score', '<', 60);
    }

    // =========================================================================
    // MÉTHODES UTILITAIRES
    // =========================================================================

    /**
     * Vérifier si la validation est réussie
     */
    public function isPassed(): bool
    {
        return $this->status === 'passed';
    }

    /**
     * Vérifier si la validation a échoué
     */
    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    /**
     * Vérifier si la validation a des avertissements
     */
    public function hasWarnings(): bool
    {
        return $this->status === 'warning' || !empty($this->warnings);
    }

    /**
     * Récupérer score d'un critère spécifique
     */
    public function getCriteriaScore(string $criteria): float
    {
        $field = $criteria . '_score';
        return $this->$field ?? 0;
    }

    /**
     * Récupérer le critère avec le score le plus bas
     */
    public function getLowestCriteria(): array
    {
        $scores = [
            'knowledge' => $this->knowledge_score,
            'brand' => $this->brand_score,
            'seo' => $this->seo_score,
            'readability' => $this->readability_score,
            'structure' => $this->structure_score,
            'originality' => $this->originality_score,
        ];

        $lowestCriteria = array_keys($scores, min($scores))[0];

        return [
            'criteria' => $lowestCriteria,
            'score' => $scores[$lowestCriteria],
        ];
    }

    /**
     * Récupérer le critère avec le score le plus haut
     */
    public function getHighestCriteria(): array
    {
        $scores = [
            'knowledge' => $this->knowledge_score,
            'brand' => $this->brand_score,
            'seo' => $this->seo_score,
            'readability' => $this->readability_score,
            'structure' => $this->structure_score,
            'originality' => $this->originality_score,
        ];

        $highestCriteria = array_keys($scores, max($scores))[0];

        return [
            'criteria' => $highestCriteria,
            'score' => $scores[$highestCriteria],
        ];
    }

    /**
     * Récupérer tous les scores sous forme de tableau
     */
    public function getAllScores(): array
    {
        return [
            'knowledge' => $this->knowledge_score,
            'brand' => $this->brand_score,
            'seo' => $this->seo_score,
            'readability' => $this->readability_score,
            'structure' => $this->structure_score,
            'originality' => $this->originality_score,
            'overall' => $this->overall_score,
        ];
    }

    /**
     * Compter le nombre total d'erreurs
     */
    public function getTotalErrorsCount(): int
    {
        return count($this->errors ?? []);
    }

    /**
     * Compter le nombre total d'avertissements
     */
    public function getTotalWarningsCount(): int
    {
        return count($this->warnings ?? []);
    }

    /**
     * Formater le résultat pour affichage
     */
    public function getFormattedResult(): string
    {
        $emoji = match($this->status) {
            'passed' => '✅',
            'warning' => '⚠️',
            'failed' => '❌',
            default => '❓',
        };

        return sprintf(
            '%s Score: %.1f%% | Status: %s | Errors: %d | Warnings: %d',
            $emoji,
            $this->overall_score,
            strtoupper($this->status),
            $this->getTotalErrorsCount(),
            $this->getTotalWarningsCount()
        );
    }

    // =========================================================================
    // MÉTHODES STATIQUES
    // =========================================================================

    /**
     * Statistiques globales
     */
    public static function getGlobalStats(): array
    {
        return [
            'total_checks' => self::count(),
            'passed' => self::where('status', 'passed')->count(),
            'warning' => self::where('status', 'warning')->count(),
            'failed' => self::where('status', 'failed')->count(),
            'avg_overall_score' => round(self::avg('overall_score'), 2),
            'avg_knowledge_score' => round(self::avg('knowledge_score'), 2),
            'avg_brand_score' => round(self::avg('brand_score'), 2),
            'avg_seo_score' => round(self::avg('seo_score'), 2),
            'avg_readability_score' => round(self::avg('readability_score'), 2),
            'avg_structure_score' => round(self::avg('structure_score'), 2),
            'avg_originality_score' => round(self::avg('originality_score'), 2),
        ];
    }

    /**
     * Tendances qualité (derniers X jours)
     */
    public static function getQualityTrends(int $days = 30): array
    {
        return self::where('checked_at', '>=', now()->subDays($days))
            ->selectRaw('DATE(checked_at) as date, AVG(overall_score) as avg_score, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->toArray();
    }
}

/*
 * =============================================================================
 * EXEMPLES D'UTILISATION
 * =============================================================================
 * 
 * // Créer un quality check
 * $qualityCheck = QualityCheck::create([
 *     'checkable_type' => Article::class,
 *     'checkable_id' => $article->id,
 *     'content_type' => 'article',
 *     'platform_id' => 1,
 *     'language_code' => 'fr',
 *     'knowledge_score' => 85.50,
 *     'brand_score' => 90.00,
 *     'seo_score' => 75.00,
 *     'readability_score' => 70.00,
 *     'structure_score' => 85.00,
 *     'originality_score' => 95.00,
 *     'overall_score' => 82.75,
 *     'status' => 'passed',
 *     'validation_details' => [...],
 *     'errors' => [],
 *     'warnings' => ['Meta description un peu longue'],
 *     'suggestions' => ['Ajouter 2 FAQs supplémentaires'],
 *     'checked_at' => now(),
 * ]);
 * 
 * // Récupérer validations d'un article
 * $checks = $article->qualityChecks()->orderBy('checked_at', 'desc')->get();
 * 
 * // Récupérer dernière validation
 * $lastCheck = $article->qualityChecks()->latest('checked_at')->first();
 * 
 * // Filtrer validations échouées
 * $failedChecks = QualityCheck::failed()
 *     ->forPlatform(1)
 *     ->recent(7)
 *     ->get();
 * 
 * // Statistiques globales
 * $stats = QualityCheck::getGlobalStats();
 * 
 * // Tendances 30 jours
 * $trends = QualityCheck::getQualityTrends(30);
 * 
 * // Critère le plus faible
 * $lowest = $qualityCheck->getLowestCriteria();
 * // ['criteria' => 'readability', 'score' => 70.00]
 * 
 * // Formater résultat
 * echo $qualityCheck->getFormattedResult();
 * // "✅ Score: 82.8% | Status: PASSED | Errors: 0 | Warnings: 1"
 */