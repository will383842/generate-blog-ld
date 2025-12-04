<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ResearchCache extends Model
{
    use HasFactory;

    protected $table = 'research_cache';

    protected $fillable = [
        'cache_key',
        'query_text',
        'language_code',
        'results',
        'hit_count',
        'expires_at',
    ];

    protected $casts = [
        'results' => 'array',
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

    public function scopeForLanguage($query, string $languageCode)
    {
        return $query->where('language_code', $languageCode);
    }

    public function scopePopular($query, int $minHits = 5)
    {
        return $query->where('hit_count', '>=', $minHits);
    }

    public function scopeOrderByHits($query, string $direction = 'desc')
    {
        return $query->orderBy('hit_count', $direction);
    }

    public function scopeOrderByAge($query, string $direction = 'desc')
    {
        return $query->orderBy('created_at', $direction);
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Vérifier si le cache est encore valide
     */
    public function isValid(): bool
    {
        return $this->expires_at > now();
    }

    /**
     * Vérifier si le cache est expiré
     */
    public function isExpired(): bool
    {
        return !$this->isValid();
    }

    /**
     * Obtenir le temps restant avant expiration (en heures)
     */
    public function getTimeToExpiry(): float
    {
        if ($this->isExpired()) {
            return 0;
        }
        
        return round($this->expires_at->diffInHours(now()), 2);
    }

    /**
     * Incrémenter le compteur de hits
     */
    public function incrementHits(): void
    {
        $this->increment('hit_count');
    }

    /**
     * Obtenir les statistiques du cache
     */
    public static function getCacheStats(): array
    {
        $total = self::count();
        $valid = self::valid()->count();
        $expired = self::expired()->count();
        $totalHits = self::sum('hit_count');
        
        return [
            'total_entries' => $total,
            'valid_entries' => $valid,
            'expired_entries' => $expired,
            'total_hits' => $totalHits,
            'average_hits_per_entry' => $total > 0 ? round($totalHits / $total, 2) : 0,
            'cache_efficiency' => $total > 0 ? round(($valid / $total) * 100, 2) : 0,
        ];
    }

    /**
     * Nettoyer les entrées expirées
     */
    public static function cleanExpired(): int
    {
        return self::expired()->delete();
    }

    /**
     * Obtenir les requêtes les plus populaires
     */
    public static function getMostPopular(int $limit = 10): array
    {
        return self::valid()
            ->orderByHits('desc')
            ->limit($limit)
            ->get()
            ->map(function ($cache) {
                return [
                    'query' => $cache->query_text,
                    'language' => $cache->language_code,
                    'hits' => $cache->hit_count,
                    'age_hours' => round($cache->created_at->diffInHours(now()), 1),
                    'expires_in_hours' => $cache->getTimeToExpiry(),
                ];
            })
            ->toArray();
    }

    /**
     * Obtenir les statistiques par langue
     */
    public static function getLanguageDistribution(): array
    {
        return self::valid()
            ->selectRaw('language_code, COUNT(*) as count, SUM(hit_count) as total_hits')
            ->groupBy('language_code')
            ->get()
            ->map(function ($stat) {
                return [
                    'language' => $stat->language_code,
                    'entries' => $stat->count,
                    'total_hits' => $stat->total_hits,
                    'avg_hits' => round($stat->total_hits / $stat->count, 2),
                ];
            })
            ->toArray();
    }
}