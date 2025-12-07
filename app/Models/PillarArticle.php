<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * PillarArticle Model
 *
 * Represents pillar/cornerstone content articles.
 * Extends Article with a global scope filtering by type = 'pillar'.
 *
 * This model uses Single Table Inheritance (STI) pattern:
 * - Uses the same 'articles' table
 * - Automatically filters by type = 'pillar'
 * - Sets type = 'pillar' on creation
 */
class PillarArticle extends Article
{
    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        // Add global scope to always filter by pillar type
        static::addGlobalScope('pillar', function (Builder $builder) {
            $builder->where('type', Article::TYPE_PILLAR);
        });

        // Automatically set type on creation
        static::creating(function ($article) {
            $article->type = Article::TYPE_PILLAR;
        });
    }

    /**
     * Get the table associated with the model.
     */
    public function getTable(): string
    {
        return 'articles';
    }

    // =========================================================================
    // PILLAR-SPECIFIC RELATIONSHIPS
    // =========================================================================

    /**
     * Get the research sources for this pillar article.
     */
    public function researchSources(): HasMany
    {
        return $this->hasMany(PillarResearchSource::class, 'article_id');
    }

    /**
     * Get the schedule for this pillar article.
     */
    public function pillarSchedule(): HasOne
    {
        return $this->hasOne(PillarSchedule::class, 'article_id');
    }

    /**
     * Get the statistics for this pillar article.
     */
    public function pillarStatistics(): HasMany
    {
        return $this->hasMany(PillarStatistic::class, 'article_id');
    }

    // =========================================================================
    // PILLAR-SPECIFIC METHODS
    // =========================================================================

    /**
     * Check if this is a cornerstone/main pillar (3000+ words)
     */
    public function isCornerstone(): bool
    {
        return $this->word_count >= 3000;
    }

    /**
     * Get high-relevance research sources
     */
    public function getTopSources(int $limit = 5): \Illuminate\Database\Eloquent\Collection
    {
        return $this->researchSources()
            ->orderByDesc('relevance_score')
            ->limit($limit)
            ->get();
    }

    /**
     * Get verified statistics only
     */
    public function getVerifiedStatistics(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->pillarStatistics()
            ->where('verified', true)
            ->get();
    }

    /**
     * Check if pillar has sufficient research sources
     */
    public function hasSufficientResearch(int $minSources = 5): bool
    {
        return $this->researchSources()->count() >= $minSources;
    }

    /**
     * Get completion status for pillar
     */
    public function getCompletionStatus(): array
    {
        $hasContent = !empty($this->content) && $this->word_count >= 2000;
        $hasSources = $this->researchSources()->count() >= 3;
        $hasStats = $this->pillarStatistics()->where('verified', true)->count() >= 2;
        $hasImage = !empty($this->image_url);
        $hasMeta = !empty($this->meta_title) && !empty($this->meta_description);

        $completedSteps = array_filter([$hasContent, $hasSources, $hasStats, $hasImage, $hasMeta]);

        return [
            'content' => $hasContent,
            'sources' => $hasSources,
            'statistics' => $hasStats,
            'image' => $hasImage,
            'meta' => $hasMeta,
            'completed' => count($completedSteps),
            'total' => 5,
            'percentage' => round((count($completedSteps) / 5) * 100),
        ];
    }

    // =========================================================================
    // PILLAR-SPECIFIC SCOPES
    // =========================================================================

    /**
     * Scope for cornerstone pillars (3000+ words)
     */
    public function scopeCornerstone(Builder $query): Builder
    {
        return $query->where('word_count', '>=', 3000);
    }

    /**
     * Scope for pillars with research
     */
    public function scopeWithResearch(Builder $query): Builder
    {
        return $query->has('researchSources');
    }

    /**
     * Scope for pillars with verified statistics
     */
    public function scopeWithVerifiedStats(Builder $query): Builder
    {
        return $query->whereHas('pillarStatistics', function ($q) {
            $q->where('verified', true);
        });
    }

    /**
     * Scope for pillars needing more research
     */
    public function scopeNeedsResearch(Builder $query, int $minSources = 5): Builder
    {
        return $query->has('researchSources', '<', $minSources);
    }

    /**
     * Scope for scheduled pillars
     */
    public function scopeScheduled(Builder $query): Builder
    {
        return $query->whereHas('pillarSchedule', function ($q) {
            $q->where('status', 'planned');
        });
    }
}
