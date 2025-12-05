<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class PromptCache extends Model
{
    use HasFactory;

    protected $table = 'prompt_cache';
    
    public $timestamps = false; // Custom timestamps

    protected $fillable = [
        'prompt_hash',
        'prompt_text',
        'prompt_type',
        'cache_hits',
        'estimated_tokens',
        'savings_estimated',
        'first_used_at',
        'last_used_at',
    ];

    protected $casts = [
        'cache_hits' => 'integer',
        'estimated_tokens' => 'integer',
        'savings_estimated' => 'decimal:6',
        'first_used_at' => 'datetime',
        'last_used_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopePopular($query, int $minHits = 10)
    {
        return $query->where('cache_hits', '>=', $minHits);
    }

    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('last_used_at', '>=', now()->subDays($days));
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('prompt_type', $type);
    }

    // =========================================================================
    // STATIC METHODS
    // =========================================================================

    /**
     * Get or create prompt cache entry
     */
    public static function trackPrompt(string $prompt, string $type = null): self
    {
        $hash = hash('sha256', $prompt);
        
        $cache = self::firstOrCreate(
            ['prompt_hash' => $hash],
            [
                'prompt_text' => $prompt,
                'prompt_type' => $type,
                'estimated_tokens' => self::estimateTokens($prompt),
                'first_used_at' => now(),
                'last_used_at' => now(),
            ]
        );

        // Increment hit count
        if (!$cache->wasRecentlyCreated) {
            $cache->increment('cache_hits');
            $cache->update(['last_used_at' => now()]);
            
            // Update estimated savings (50% off input tokens after first hit)
            $tokenSavings = $cache->estimated_tokens * 0.5; // 50% cache discount
            $inputPricePerToken = 0.00003; // Average input price (GPT-4)
            $savingsPerHit = $tokenSavings * $inputPricePerToken;
            
            $cache->increment('savings_estimated', $savingsPerHit);
        }

        return $cache;
    }

    /**
     * Estimate tokens from text (rough approximation)
     */
    public static function estimateTokens(string $text): int
    {
        // Rule of thumb: 1 token ≈ 4 characters
        return (int) ceil(strlen($text) / 4);
    }

    /**
     * Get most popular prompts
     */
    public static function getMostPopular(int $limit = 20): array
    {
        return self::orderByDesc('cache_hits')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'prompt_type' => $item->prompt_type,
                    'cache_hits' => $item->cache_hits,
                    'estimated_tokens' => $item->estimated_tokens,
                    'savings_estimated' => round($item->savings_estimated, 2),
                    'first_used_at' => $item->first_used_at->toDateTimeString(),
                    'last_used_at' => $item->last_used_at->toDateTimeString(),
                    'prompt_preview' => substr($item->prompt_text, 0, 100) . '...',
                ];
            })
            ->toArray();
    }

    /**
     * Get total cache statistics
     */
    public static function getCacheStats(): array
    {
        $stats = self::select(
            DB::raw('COUNT(*) as total_prompts'),
            DB::raw('SUM(cache_hits) as total_hits'),
            DB::raw('SUM(savings_estimated) as total_savings')
        )->first();

        $recentActivity = self::recent(7)->count();
        $popularPrompts = self::popular(5)->count();

        return [
            'total_cached_prompts' => $stats->total_prompts ?? 0,
            'total_cache_hits' => $stats->total_hits ?? 0,
            'total_savings_estimated' => round($stats->total_savings ?? 0, 2),
            'active_prompts_7_days' => $recentActivity,
            'popular_prompts' => $popularPrompts,
        ];
    }

    /**
     * Get cache hit rate (percentage)
     */
    public static function getCacheHitRate(): float
    {
        $stats = self::select(
            DB::raw('COUNT(*) as total_prompts'),
            DB::raw('SUM(cache_hits) as total_hits')
        )->first();

        $totalPrompts = $stats->total_prompts ?? 0;
        $totalHits = $stats->total_hits ?? 0;

        if ($totalPrompts === 0) {
            return 0;
        }

        // Hit rate = (total hits / total prompt usages) * 100
        $totalUsages = $totalPrompts + $totalHits;
        return round(($totalHits / $totalUsages) * 100, 1);
    }

    /**
     * Clean old unused prompts (cache cleanup)
     */
    public static function cleanOldPrompts(int $daysInactive = 90): int
    {
        return self::where('last_used_at', '<', now()->subDays($daysInactive))
            ->where('cache_hits', '<', 3) // Less than 3 hits
            ->delete();
    }
}
