<?php

namespace App\Models;

use App\Models\Article;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Http;

/**
 * Phase 27 - Fichier 8: Model ExternalLink amélioré
 * Gestion intelligente des liens externes avec vérification et scoring
 */
class ExternalLink extends Model
{
    // Types de sources
    const SOURCE_TYPES = [
        'government' => 'Gouvernement',
        'organization' => 'Organisation',
        'reference' => 'Référence',
        'news' => 'Actualités',
        'authority' => 'Autorité',
    ];
    
    // Priorité des sources (plus bas = plus prioritaire)
    const SOURCE_PRIORITY = [
        'government' => 1,
        'organization' => 2,
        'reference' => 3,
        'news' => 4,
        'authority' => 5,
    ];
    
    protected $fillable = [
        'article_id',
        'url',
        'domain',
        'anchor_text',
        'source',
        'source_type',
        'country_code',
        'language_code',
        'authority_score',
        'is_affiliate',
        'is_nofollow',
        'is_sponsored',
        'is_automatic',
        'last_verified_at',
        'is_broken',
        'clicks',
    ];

    protected $casts = [
        'is_affiliate' => 'boolean',
        'is_nofollow' => 'boolean',
        'is_sponsored' => 'boolean',
        'is_automatic' => 'boolean',
        'is_broken' => 'boolean',
        'authority_score' => 'integer',
        'clicks' => 'integer',
        'last_verified_at' => 'datetime',
    ];
    
    protected $attributes = [
        'source_type' => 'reference',
        'language_code' => 'fr',
        'authority_score' => 50,
        'is_affiliate' => false,
        'is_nofollow' => false,
        'is_sponsored' => false,
        'is_automatic' => true,
        'is_broken' => false,
        'clicks' => 0,
    ];

    // =========================================================================
    // BOOT
    // =========================================================================
    
    protected static function boot()
    {
        parent::boot();
        
        // Extraire automatiquement le domaine depuis l'URL
        static::saving(function ($link) {
            if ($link->url && !$link->domain) {
                $link->domain = parse_url($link->url, PHP_URL_HOST);
            }
        });
    }

    // =========================================================================
    // RELATIONS
    // =========================================================================
    
    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
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
     * Par type de source
     */
    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('source_type', $type);
    }
    
    /**
     * Pour un pays spécifique
     */
    public function scopeForCountry(Builder $query, string $countryCode): Builder
    {
        return $query->where(function ($q) use ($countryCode) {
            $q->where('country_code', strtoupper($countryCode))
              ->orWhereNull('country_code');
        });
    }
    
    /**
     * Pour une langue spécifique
     */
    public function scopeForLanguage(Builder $query, string $langCode): Builder
    {
        return $query->where('language_code', strtolower($langCode));
    }
    
    /**
     * Liens cassés
     */
    public function scopeBroken(Builder $query): Builder
    {
        return $query->where('is_broken', true);
    }
    
    /**
     * Liens vérifiés
     */
    public function scopeVerified(Builder $query): Builder
    {
        return $query->whereNotNull('last_verified_at');
    }
    
    /**
     * Liens non vérifiés depuis X jours
     */
    public function scopeNotVerifiedSince(Builder $query, int $days): Builder
    {
        return $query->where(function ($q) use ($days) {
            $q->whereNull('last_verified_at')
              ->orWhere('last_verified_at', '<', now()->subDays($days));
        });
    }
    
    /**
     * Liens avec score d'autorité minimum
     */
    public function scopeMinAuthority(Builder $query, int $minScore): Builder
    {
        return $query->where('authority_score', '>=', $minScore);
    }
    
    /**
     * Liens affiliés
     */
    public function scopeAffiliates(Builder $query): Builder
    {
        return $query->where('is_affiliate', true);
    }
    
    /**
     * Trier par priorité de source
     */
    public function scopeOrderBySourcePriority(Builder $query): Builder
    {
        return $query->orderByRaw("FIELD(source_type, 'government', 'organization', 'reference', 'news', 'authority')");
    }

    // =========================================================================
    // MÉTHODES
    // =========================================================================
    
    /**
     * Marquer le lien comme cassé
     */
    public function markBroken(): void
    {
        $this->update([
            'is_broken' => true,
            'last_verified_at' => now(),
        ]);
    }
    
    /**
     * Marquer le lien comme vérifié et fonctionnel
     */
    public function markVerified(): void
    {
        $this->update([
            'is_broken' => false,
            'last_verified_at' => now(),
        ]);
    }
    
    /**
     * Vérifier si le lien est accessible (HEAD request)
     */
    public function verify(): bool
    {
        try {
            $response = Http::timeout(10)
                ->withHeaders(['User-Agent' => 'ContentEngine LinkVerifier/1.0'])
                ->head($this->url);
            
            $isValid = $response->successful();
            
            if ($isValid) {
                $this->markVerified();
            } else {
                $this->markBroken();
            }
            
            return $isValid;
        } catch (\Exception $e) {
            $this->markBroken();
            return false;
        }
    }
    
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
        $rel = ['noopener'];
        
        if ($this->is_nofollow) {
            $rel[] = 'nofollow';
        }
        
        if ($this->is_sponsored) {
            $rel[] = 'sponsored';
        }
        
        return sprintf(
            '<a href="%s" target="_blank" rel="%s" class="external-link" data-type="%s" title="%s">%s</a>',
            htmlspecialchars($this->url),
            implode(' ', $rel),
            $this->source_type,
            htmlspecialchars($this->source ?? ''),
            htmlspecialchars($this->anchor_text)
        );
    }
    
    /**
     * Obtenir la priorité de la source
     */
    public function getSourcePriority(): int
    {
        return self::SOURCE_PRIORITY[$this->source_type] ?? 99;
    }
    
    /**
     * Vérifie si c'est un lien gouvernemental
     */
    public function isGovernment(): bool
    {
        return $this->source_type === 'government';
    }
    
    /**
     * Vérifie si c'est un lien d'organisation
     */
    public function isOrganization(): bool
    {
        return $this->source_type === 'organization';
    }
}
