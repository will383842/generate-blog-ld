<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PillarResearchSource extends Model
{
    use HasFactory;

    protected $table = 'pillar_research_sources';

    public $timestamps = false;

    protected $fillable = [
        'article_id',
        'source_type',
        'source_url',
        'source_title',
        'source_date',
        'relevance_score',
        'content_excerpt',
    ];

    protected $casts = [
        'source_date' => 'date',
        'relevance_score' => 'integer',
        'created_at' => 'datetime',
    ];

    // =========================================================================
    // CONSTANTES
    // =========================================================================

    const TYPE_PERPLEXITY = 'perplexity';
    const TYPE_NEWS_API = 'news_api';
    const TYPE_MANUAL = 'manual';

    // =========================================================================
    // RELATIONS
    // =========================================================================

    /**
     * Article associé
     */
    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    /**
     * Sources par type
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('source_type', $type);
    }

    /**
     * Sources pertinentes (score > 60)
     */
    public function scopeRelevant($query)
    {
        return $query->where('relevance_score', '>', 60);
    }

    /**
     * Triées par pertinence
     */
    public function scopeOrderedByRelevance($query)
    {
        return $query->orderBy('relevance_score', 'desc');
    }

    // =========================================================================
    // MÉTHODES UTILITAIRES
    // =========================================================================

    /**
     * Vérifier si la source est pertinente
     */
    public function isRelevant(): bool
    {
        return $this->relevance_score > 60;
    }

    /**
     * Vérifier si la source est très pertinente
     */
    public function isHighlyRelevant(): bool
    {
        return $this->relevance_score > 80;
    }

    /**
     * Obtenir un extrait court (150 caractères)
     */
    public function getShortExcerpt(): string
    {
        if (!$this->content_excerpt) {
            return '';
        }

        return strlen($this->content_excerpt) > 150
            ? substr($this->content_excerpt, 0, 147) . '...'
            : $this->content_excerpt;
    }
}
