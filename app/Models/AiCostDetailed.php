<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

class AiCostDetailed extends Model
{
    use HasFactory;

    protected $table = 'ai_costs_detailed';
    
    public $timestamps = false; // Only created_at

    protected $fillable = [
        'platform_id',
        'content_type',
        'content_id',
        'model_used',
        'task_type',
        'input_tokens',
        'output_tokens',
        'input_cost',
        'output_cost',
        'total_cost',
        'language_code',
        'notes',
    ];

    protected $casts = [
        'input_tokens' => 'integer',
        'output_tokens' => 'integer',
        'input_cost' => 'decimal:6',
        'output_cost' => 'decimal:6',
        'total_cost' => 'decimal:6',
        'created_at' => 'datetime',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeToday($query)
    {
        return $query->whereDate('created_at', today());
    }

    public function scopeThisMonth($query)
    {
        return $query->whereYear('created_at', now()->year)
                    ->whereMonth('created_at', now()->month);
    }

    public function scopeLastMonth($query)
    {
        $lastMonth = now()->subMonth();
        return $query->whereYear('created_at', $lastMonth->year)
                    ->whereMonth('created_at', $lastMonth->month);
    }

    public function scopeByModel($query, string $model)
    {
        return $query->where('model_used', $model);
    }

    public function scopeByTask($query, string $taskType)
    {
        return $query->where('task_type', $taskType);
    }

    public function scopeByPlatform($query, int $platformId)
    {
        return $query->where('platform_id', $platformId);
    }

    public function scopeByLanguage($query, string $languageCode)
    {
        return $query->where('language_code', $languageCode);
    }

    // =========================================================================
    // STATIC METHODS - ANALYTICS
    // =========================================================================

    /**
     * Get daily costs summary
     */
    public static function getDailyCosts(): array
    {
        $costs = self::today()
            ->select(
                'model_used',
                DB::raw('COUNT(*) as calls_count'),
                DB::raw('SUM(input_tokens) as total_input_tokens'),
                DB::raw('SUM(output_tokens) as total_output_tokens'),
                DB::raw('SUM(total_cost) as total_cost')
            )
            ->groupBy('model_used')
            ->get();

        return [
            'date' => today()->toDateString(),
            'total_cost' => $costs->sum('total_cost'),
            'total_calls' => $costs->sum('calls_count'),
            'breakdown' => $costs->toArray(),
        ];
    }

    /**
     * Get monthly costs summary
     */
    public static function getMonthlyCosts(): array
    {
        $costs = self::thisMonth()
            ->select(
                'model_used',
                DB::raw('COUNT(*) as calls_count'),
                DB::raw('SUM(total_cost) as total_cost')
            )
            ->groupBy('model_used')
            ->get();

        $lastMonthTotal = self::lastMonth()->sum('total_cost');
        $currentTotal = $costs->sum('total_cost');
        $daysInMonth = now()->daysInMonth;
        $currentDay = now()->day;
        
        $projectedTotal = ($currentTotal / $currentDay) * $daysInMonth;

        return [
            'month' => now()->format('Y-m'),
            'current_total' => round($currentTotal, 2),
            'projected_total' => round($projectedTotal, 2),
            'last_month_total' => round($lastMonthTotal, 2),
            'vs_last_month' => $lastMonthTotal > 0 
                ? round((($currentTotal - $lastMonthTotal) / $lastMonthTotal) * 100, 1) 
                : 0,
            'days_elapsed' => $currentDay,
            'days_remaining' => $daysInMonth - $currentDay,
            'breakdown' => $costs->toArray(),
        ];
    }

    /**
     * Get costs by task type
     */
    public static function getCostsByTask(int $days = 30): array
    {
        return self::where('created_at', '>=', now()->subDays($days))
            ->select(
                'task_type',
                DB::raw('COUNT(*) as calls_count'),
                DB::raw('SUM(total_cost) as total_cost'),
                DB::raw('AVG(total_cost) as avg_cost')
            )
            ->groupBy('task_type')
            ->orderByDesc('total_cost')
            ->get()
            ->toArray();
    }

    /**
     * Get costs by platform
     */
    public static function getCostsByPlatform(int $days = 30): array
    {
        return self::where('created_at', '>=', now()->subDays($days))
            ->with('platform:id,name')
            ->select(
                'platform_id',
                DB::raw('COUNT(*) as calls_count'),
                DB::raw('SUM(total_cost) as total_cost')
            )
            ->groupBy('platform_id')
            ->orderByDesc('total_cost')
            ->get()
            ->map(function ($item) {
                return [
                    'platform_id' => $item->platform_id,
                    'platform_name' => $item->platform->name ?? 'Unknown',
                    'calls_count' => $item->calls_count,
                    'total_cost' => round($item->total_cost, 2),
                ];
            })
            ->toArray();
    }

    /**
     * Get costs by language
     */
    public static function getCostsByLanguage(int $days = 30): array
    {
        return self::where('created_at', '>=', now()->subDays($days))
            ->whereNotNull('language_code')
            ->select(
                'language_code',
                DB::raw('COUNT(*) as calls_count'),
                DB::raw('SUM(total_cost) as total_cost')
            )
            ->groupBy('language_code')
            ->orderByDesc('total_cost')
            ->get()
            ->toArray();
    }

    /**
     * Get average cost per content type
     */
    public static function getAverageCostPerContent(): array
    {
        return self::thisMonth()
            ->select(
                'content_type',
                DB::raw('COUNT(*) as count'),
                DB::raw('AVG(total_cost) as avg_cost'),
                DB::raw('MIN(total_cost) as min_cost'),
                DB::raw('MAX(total_cost) as max_cost')
            )
            ->groupBy('content_type')
            ->get()
            ->toArray();
    }

    /**
     * Get hourly costs (for anomaly detection)
     */
    public static function getHourlyCosts(int $hours = 24): array
    {
        return self::where('created_at', '>=', now()->subHours($hours))
            ->select(
                DB::raw('DATE_FORMAT(created_at, "%Y-%m-%d %H:00:00") as hour'),
                DB::raw('COUNT(*) as calls_count'),
                DB::raw('SUM(total_cost) as total_cost')
            )
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->toArray();
    }
}
