<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResearchResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'query_id',
        'source_type',
        'title',
        'url',
        'excerpt',
        'published_date',
        'relevance_score',
    ];

    protected $casts = [
        'relevance_score' => 'integer',
        'published_date' => 'datetime',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function query(): BelongsTo
    {
        return $this->belongsTo(ResearchQuery::class, 'query_id');
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeFromSource($query, string $sourceType)
    {
        return $query->where('source_type', $sourceType);
    }

    public function scopeHighRelevance($query, int $minScore = 70)
    {
        return $query->where('relevance_score', '>=', $minScore);
    }

    public function scopeMediumRelevance($query)
    {
        return $query->whereBetween('relevance_score', [40, 69]);
    }

    public function scopeLowRelevance($query)
    {
        return $query->where('relevance_score', '<', 40);
    }

    public function scopeOrderByRelevance($query, string $direction = 'desc')
    {
        return $query->orderBy('relevance_score', $direction);
    }

    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('published_date', '>=', now()->subDays($days));
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Obtenir le domaine de l'URL
     */
    public function getDomain(): string
    {
        $parsed = parse_url($this->url);
        $host = $parsed['host'] ?? $this->url;
        
        return preg_replace('/^www\./', '', $host);
    }

    /**
     * Vérifier si la source est gouvernementale
     */
    public function isGovernmental(): bool
    {
        $domain = strtolower($this->getDomain());
        return preg_match('/\.gouv\.|\.gov\.|government|gouvernement/', $domain) === 1;
    }

    /**
     * Obtenir la catégorie de pertinence
     */
    public function getRelevanceCategory(): string
    {
        if ($this->relevance_score >= 70) {
            return 'high';
        }
        
        if ($this->relevance_score >= 40) {
            return 'medium';
        }
        
        return 'low';
    }

    /**
     * Obtenir un extrait court
     */
    public function getShortExcerpt(int $maxLength = 150): string
    {
        if (empty($this->excerpt)) {
            return '';
        }
        
        if (mb_strlen($this->excerpt) <= $maxLength) {
            return $this->excerpt;
        }
        
        return mb_substr($this->excerpt, 0, $maxLength) . '...';
    }
}