<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ResearchQuery extends Model
{
    use HasFactory;

    protected $fillable = [
        'query_text',
        'language_code',
        'cache_key',
        'cache_hit',
        'results_count',
    ];

    protected $casts = [
        'cache_hit' => 'boolean',
        'results_count' => 'integer',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function results(): HasMany
    {
        return $this->hasMany(ResearchResult::class, 'query_id');
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeForLanguage($query, string $languageCode)
    {
        return $query->where('language_code', $languageCode);
    }

    public function scopeCacheHit($query)
    {
        return $query->where('cache_hit', true);
    }

    public function scopeCacheMiss($query)
    {
        return $query->where('cache_hit', false);
    }

    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Calculer le taux de cache hit
     */
    public static function getCacheHitRate(int $days = 7): float
    {
        $total = self::recent($days)->count();
        
        if ($total === 0) {
            return 0;
        }
        
        $hits = self::recent($days)->cacheHit()->count();
        
        return round(($hits / $total) * 100, 2);
    }

    /**
     * Obtenir les statistiques par langue
     */
    public static function getLanguageStats(int $days = 7): array
    {
        return self::recent($days)
            ->selectRaw('language_code, COUNT(*) as total, SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) as hits')
            ->groupBy('language_code')
            ->get()
            ->map(function ($stat) {
                return [
                    'language' => $stat->language_code,
                    'total_queries' => $stat->total,
                    'cache_hits' => $stat->hits,
                    'hit_rate' => $stat->total > 0 ? round(($stat->hits / $stat->total) * 100, 2) : 0,
                ];
            })
            ->toArray();
    }
}