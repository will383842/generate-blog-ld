<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PerplexityCache extends Model
{
    use HasFactory;

    protected $table = 'perplexity_cache';

    protected $fillable = [
        'cache_key',
        'country_code',
        'theme',
        'language_code',
        'query',
        'sources',
        'raw_response',
        'hit_count',
        'expires_at',
    ];

    protected $casts = [
        'sources' => 'array',
        'raw_response' => 'array',
        'hit_count' => 'integer',
        'expires_at' => 'datetime',
    ];

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeValid($query)
    {
        return $query->where('expires_at', '>', now());
    }

    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<=', now());
    }

    public function scopeForContext($query, string $countryCode, string $theme, string $languageCode)
    {
        return $query->where('country_code', $countryCode)
                     ->where('theme', $theme)
                     ->where('language_code', $languageCode);
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Générer une clé de cache
     */
    public static function generateKey(string $countryCode, string $theme, string $languageCode, string $query): string
    {
        return hash('sha256', "{$countryCode}|{$theme}|{$languageCode}|{$query}");
    }

    /**
     * Récupérer depuis le cache ou null si expiré
     */
    public static function getFromCache(string $countryCode, string $theme, string $languageCode, string $query): ?self
    {
        $key = self::generateKey($countryCode, $theme, $languageCode, $query);
        
        $cached = self::where('cache_key', $key)->valid()->first();
        
        if ($cached) {
            $cached->increment('hit_count');
        }
        
        return $cached;
    }

    /**
     * Stocker dans le cache
     */
    public static function store(
        string $countryCode,
        string $theme,
        string $languageCode,
        string $query,
        array $sources,
        ?array $rawResponse = null,
        int $ttlDays = 7
    ): self {
        $key = self::generateKey($countryCode, $theme, $languageCode, $query);
        
        return self::updateOrCreate(
            ['cache_key' => $key],
            [
                'country_code' => $countryCode,
                'theme' => $theme,
                'language_code' => $languageCode,
                'query' => $query,
                'sources' => $sources,
                'raw_response' => $rawResponse,
                'hit_count' => 0,
                'expires_at' => now()->addDays($ttlDays),
            ]
        );
    }

    /**
     * Nettoyer les entrées expirées
     */
    public static function cleanup(): int
    {
        return self::expired()->delete();
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function getSources(): array
    {
        return $this->sources ?? [];
    }
}
