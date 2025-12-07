<?php

namespace App\Models;

use App\Models\Article;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

/**
 * Phase 27 - Fichier 7: Model InternalLink amélioré
 * Gestion intelligente des liens internes avec contexte et scoring
 */
class InternalLink extends Model
{
    // Types d'ancres disponibles
    const ANCHOR_TYPES = [
        'exact_match' => 'Correspondance exacte',
        'long_tail' => 'Long tail',
        'generic' => 'Générique',
        'cta' => 'Call to action',
        'question' => 'Question',
    ];
    
    // Contextes de liens
    const LINK_CONTEXTS = [
        'pillar_to_article' => 'Pilier vers article',
        'article_to_pillar' => 'Article vers pilier',
        'sibling' => 'Articles frères',
        'related' => 'Articles liés',
    ];
    
    protected $fillable = [
        'source_article_id',
        'target_article_id',
        'anchor_text',
        'anchor_type',
        'position_in_content',
        'link_context',
        'relevance_score',
        'clicks',
        'is_automatic',
    ];

    protected $casts = [
        'position_in_content' => 'integer',
        'relevance_score' => 'integer',
        'clicks' => 'integer',
        'is_automatic' => 'boolean',
    ];
    
    protected $attributes = [
        'anchor_type' => 'exact_match',
        'link_context' => 'related',
        'relevance_score' => 50,
        'clicks' => 0,
        'is_automatic' => true,
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================
    
    /**
     * Article source du lien
     */
    public function sourceArticle(): BelongsTo
    {
        return $this->belongsTo(Article::class, 'source_article_id');
    }
    
    /**
     * Article cible du lien
     */
    public function targetArticle(): BelongsTo
    {
        return $this->belongsTo(Article::class, 'target_article_id');
    }
    
    /**
     * Alias pour compatibilité avec ancien code
     */
    public function article(): BelongsTo
    {
        return $this->sourceArticle();
    }

    // =========================================================================
    // SCOPES
    // =========================================================================
    
    /**
     * Liens générés automatiquement
     */
    public function scopeAutomatic(Builder $query): Builder
    {
        return $query->where('is_automatic', true);
    }
    
    /**
     * Liens créés manuellement
     */
    public function scopeManual(Builder $query): Builder
    {
        return $query->where('is_automatic', false);
    }
    
    /**
     * Par contexte de lien
     */
    public function scopeByContext(Builder $query, string $context): Builder
    {
        return $query->where('link_context', $context);
    }
    
    /**
     * Liens à haute pertinence (score >= 70)
     */
    public function scopeHighRelevance(Builder $query, int $minScore = 70): Builder
    {
        return $query->where('relevance_score', '>=', $minScore);
    }
    
    /**
     * Liens sortants d'un article
     */
    public function scopeForArticle(Builder $query, int $articleId): Builder
    {
        return $query->where('source_article_id', $articleId);
    }
    
    /**
     * Liens entrants vers un article
     */
    public function scopeInboundTo(Builder $query, int $articleId): Builder
    {
        return $query->where('target_article_id', $articleId);
    }
    
    /**
     * Par type d'ancre
     */
    public function scopeByAnchorType(Builder $query, string $type): Builder
    {
        return $query->where('anchor_type', $type);
    }

    // =========================================================================
    // MÉTHODES
    // =========================================================================
    
    /**
     * Incrémenter le compteur de clics
     */
    public function incrementClicks(): void
    {
        $this->increment('clicks');
    }
    
    /**
     * Générer le HTML du lien
     */
    public function toHtml(): string
    {
        $target = $this->targetArticle;
        if (!$target) {
            return $this->anchor_text;
        }
        
        return sprintf(
            '<a href="%s" class="internal-link" data-context="%s" title="%s">%s</a>',
            $target->getFullUrl(),
            $this->link_context,
            htmlspecialchars($target->title),
            htmlspecialchars($this->anchor_text)
        );
    }
    
    /**
     * Vérifie si le lien pointe vers un pilier
     */
    public function isToPillar(): bool
    {
        return $this->link_context === 'article_to_pillar';
    }
    
    /**
     * Vérifie si le lien provient d'un pilier
     */
    public function isFromPillar(): bool
    {
        return $this->link_context === 'pillar_to_article';
    }
    
    /**
     * Obtenir le label du type d'ancre
     */
    public function getAnchorTypeLabel(): string
    {
        return self::ANCHOR_TYPES[$this->anchor_type] ?? $this->anchor_type;
    }
    
    /**
     * Obtenir le label du contexte
     */
    public function getContextLabel(): string
    {
        return self::LINK_CONTEXTS[$this->link_context] ?? $this->link_context;
    }
}
