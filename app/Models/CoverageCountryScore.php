<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model CoverageCountryScore
 * 
 * Cache des scores de couverture par pays et plateforme
 */
class CoverageCountryScore extends Model
{
    use HasFactory;

    protected $fillable = [
        'platform_id',
        'country_id',
        'recruitment_score',
        'awareness_score',
        'founder_score',
        'overall_score',
        'recruitment_breakdown',
        'awareness_breakdown',
        'founder_breakdown',
        'language_scores',
        'total_articles',
        'published_articles',
        'unpublished_articles',
        'total_targets',
        'completed_targets',
        'missing_targets',
        'priority_rank',
        'recommendations',
        'calculated_at',
    ];

    protected $casts = [
        'recruitment_score' => 'float',
        'awareness_score' => 'float',
        'founder_score' => 'float',
        'overall_score' => 'float',
        'recruitment_breakdown' => 'array',
        'awareness_breakdown' => 'array',
        'founder_breakdown' => 'array',
        'language_scores' => 'array',
        'recommendations' => 'array',
        'total_articles' => 'integer',
        'published_articles' => 'integer',
        'unpublished_articles' => 'integer',
        'total_targets' => 'integer',
        'completed_targets' => 'integer',
        'missing_targets' => 'integer',
        'priority_rank' => 'integer',
        'calculated_at' => 'datetime',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeForPlatform($query, int $platformId)
    {
        return $query->where('platform_id', $platformId);
    }

    public function scopeForCountry($query, int $countryId)
    {
        return $query->where('country_id', $countryId);
    }

    public function scopeByPriority($query)
    {
        return $query->orderBy('priority_rank', 'asc');
    }

    public function scopeByScore($query, string $direction = 'desc')
    {
        return $query->orderBy('overall_score', $direction);
    }

    public function scopeWithStatus($query, string $status)
    {
        return match($status) {
            'excellent' => $query->where('overall_score', '>=', 80),
            'good' => $query->whereBetween('overall_score', [60, 79.99]),
            'partial' => $query->whereBetween('overall_score', [40, 59.99]),
            'minimal' => $query->whereBetween('overall_score', [20, 39.99]),
            'missing' => $query->where('overall_score', '<', 20),
            default => $query,
        };
    }

    public function scopeNeedsRecalculation($query, int $minutes = 5)
    {
        return $query->where(function($q) use ($minutes) {
            $q->whereNull('calculated_at')
              ->orWhere('calculated_at', '<', now()->subMinutes($minutes));
        });
    }

    // =========================================================================
    // ACCESSORS
    // =========================================================================

    /**
     * Obtient le statut textuel basé sur le score
     */
    public function getStatus(): string
    {
        if ($this->overall_score >= 80) return 'excellent';
        if ($this->overall_score >= 60) return 'good';
        if ($this->overall_score >= 40) return 'partial';
        if ($this->overall_score >= 20) return 'minimal';
        return 'missing';
    }

    /**
     * Vérifie si le score nécessite un recalcul
     */
    public function needsRecalculation(int $minutes = 5): bool
    {
        if (!$this->calculated_at) return true;
        return $this->calculated_at->diffInMinutes(now()) > $minutes;
    }

    /**
     * Obtient les recommandations prioritaires
     */
    public function getTopRecommendations(int $limit = 5): array
    {
        $recommendations = $this->recommendations ?? [];
        usort($recommendations, fn($a, $b) => ($b['priority'] ?? 0) - ($a['priority'] ?? 0));
        return array_slice($recommendations, 0, $limit);
    }

    /**
     * Obtient le score d'une langue spécifique
     */
    public function getLanguageScore(string $langCode): ?array
    {
        return $this->language_scores[$langCode] ?? null;
    }

    /**
     * Vérifie si une langue a une couverture complète
     */
    public function hasLanguageCoverage(string $langCode, float $minScore = 80): bool
    {
        $langScore = $this->getLanguageScore($langCode);
        return $langScore && ($langScore['score'] ?? 0) >= $minScore;
    }

    /**
     * Obtient le pourcentage de progression
     */
    public function getProgressPercentage(): float
    {
        if ($this->total_targets === 0) return 0;
        return round(($this->completed_targets / $this->total_targets) * 100, 2);
    }

    // =========================================================================
    // METHODS
    // =========================================================================

    /**
     * Met à jour les scores depuis le service
     */
    public function updateFromService(array $scoreData): self
    {
        $this->fill([
            'recruitment_score' => $scoreData['recruitment_score'] ?? 0,
            'awareness_score' => $scoreData['awareness_score'] ?? 0,
            'founder_score' => $scoreData['founder_score'] ?? 0,
            'overall_score' => $scoreData['overall_score'] ?? 0,
            'recruitment_breakdown' => $scoreData['recruitment_breakdown'] ?? [],
            'awareness_breakdown' => $scoreData['awareness_breakdown'] ?? [],
            'founder_breakdown' => $scoreData['founder_breakdown'] ?? [],
            'language_scores' => $scoreData['language_scores'] ?? [],
            'total_articles' => $scoreData['total_articles'] ?? 0,
            'published_articles' => $scoreData['published_articles'] ?? 0,
            'unpublished_articles' => $scoreData['unpublished_articles'] ?? 0,
            'total_targets' => $scoreData['total_targets'] ?? 0,
            'completed_targets' => $scoreData['completed_targets'] ?? 0,
            'missing_targets' => $scoreData['missing_targets'] ?? 0,
            'priority_rank' => $scoreData['priority_score'] ?? 50,
            'recommendations' => $scoreData['recommendations'] ?? [],
            'calculated_at' => now(),
        ]);
        
        $this->save();
        
        return $this;
    }

    /**
     * Crée ou met à jour un score pour un pays
     */
    public static function updateOrCreateScore(int $platformId, int $countryId, array $scoreData): self
    {
        return static::updateOrCreate(
            [
                'platform_id' => $platformId,
                'country_id' => $countryId,
            ],
            [
                'recruitment_score' => $scoreData['recruitment_score'] ?? 0,
                'awareness_score' => $scoreData['awareness_score'] ?? 0,
                'founder_score' => $scoreData['founder_score'] ?? 0,
                'overall_score' => $scoreData['overall_score'] ?? 0,
                'recruitment_breakdown' => $scoreData['recruitment_breakdown'] ?? [],
                'awareness_breakdown' => $scoreData['awareness_breakdown'] ?? [],
                'founder_breakdown' => $scoreData['founder_breakdown'] ?? [],
                'language_scores' => $scoreData['language_scores'] ?? [],
                'total_articles' => $scoreData['total_articles'] ?? 0,
                'published_articles' => $scoreData['published_articles'] ?? 0,
                'unpublished_articles' => $scoreData['unpublished_articles'] ?? 0,
                'total_targets' => $scoreData['total_targets'] ?? 0,
                'completed_targets' => $scoreData['completed_targets'] ?? 0,
                'missing_targets' => $scoreData['missing_targets'] ?? 0,
                'priority_rank' => $scoreData['priority_score'] ?? 50,
                'recommendations' => $scoreData['recommendations'] ?? [],
                'calculated_at' => now(),
            ]
        );
    }
}
