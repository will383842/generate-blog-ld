<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class ApiCost extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'service',
        'model',
        'type',           // Renommé 'operation' dans mes services
        'requests_count',
        'input_tokens',
        'output_tokens',
        'cost',
    ];

    protected $casts = [
        'date' => 'date',
        'requests_count' => 'integer',
        'input_tokens' => 'integer',
        'output_tokens' => 'integer',
        'cost' => 'decimal:6',  // 6 décimales pour précision
    ];

    // =========================================================================
    // MÉTHODE PRINCIPALE - ENREGISTREMENT (Compatible avec ton code existant)
    // =========================================================================

    /**
     * Enregistrer un coût (agrégation par jour/service/model/type)
     */
    public static function record(
        string $service,
        string $type,
        float $cost,
        int $inputTokens = 0,
        int $outputTokens = 0,
        ?string $model = null
    ): void {
        static::updateOrCreate(
            [
                'date' => now()->toDateString(),
                'service' => $service,
                'model' => $model,
                'type' => $type,
            ],
            [
                'requests_count' => DB::raw('COALESCE(requests_count, 0) + 1'),
                'input_tokens' => DB::raw("COALESCE(input_tokens, 0) + {$inputTokens}"),
                'output_tokens' => DB::raw("COALESCE(output_tokens, 0) + {$outputTokens}"),
                'cost' => DB::raw("COALESCE(cost, 0) + {$cost}"),
            ]
        );
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeForService(Builder $query, string $service): Builder
    {
        return $query->where('service', $service);
    }

    public function scopeForType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    public function scopeToday(Builder $query): Builder
    {
        return $query->where('date', now()->toDateString());
    }

    public function scopeThisMonth(Builder $query): Builder
    {
        return $query->whereMonth('date', now()->month)
                     ->whereYear('date', now()->year);
    }

    public function scopeThisWeek(Builder $query): Builder
    {
        return $query->whereBetween('date', [
            now()->startOfWeek()->toDateString(),
            now()->endOfWeek()->toDateString(),
        ]);
    }

    public function scopeBetweenDates(Builder $query, $start, $end): Builder
    {
        return $query->whereBetween('date', [$start, $end]);
    }

    // =========================================================================
    // MÉTHODES STATIQUES - COÛTS (Compatible avec ton code existant)
    // =========================================================================

    /**
     * Coût total aujourd'hui
     */
    public static function getTodayCost(?string $service = null): float
    {
        $query = static::where('date', now()->toDateString());
        
        if ($service) {
            $query->where('service', $service);
        }

        return (float) $query->sum('cost');
    }

    /**
     * Coût total ce mois
     */
    public static function getMonthCost(?string $service = null): float
    {
        $query = static::whereMonth('date', now()->month)
                       ->whereYear('date', now()->year);
        
        if ($service) {
            $query->where('service', $service);
        }

        return (float) $query->sum('cost');
    }

    /**
     * Coût total cette semaine
     */
    public static function getWeekCost(?string $service = null): float
    {
        $query = static::thisWeek();
        
        if ($service) {
            $query->forService($service);
        }

        return (float) $query->sum('cost');
    }

    // =========================================================================
    // MÉTHODES STATIQUES - STATISTIQUES AVANCÉES
    // =========================================================================

    /**
     * Nombre de requêtes aujourd'hui
     */
    public static function getTodayRequests(?string $service = null): int
    {
        $query = static::where('date', now()->toDateString());
        
        if ($service) {
            $query->where('service', $service);
        }

        return (int) $query->sum('requests_count');
    }

    /**
     * Statistiques détaillées par service/type
     */
    public static function getStats(?string $period = 'today'): array
    {
        $query = match ($period) {
            'today' => static::today(),
            'week' => static::thisWeek(),
            'month' => static::thisMonth(),
            default => static::query(),
        };

        return $query->selectRaw('
            service,
            type,
            model,
            SUM(requests_count) as total_requests,
            SUM(input_tokens) as total_input_tokens,
            SUM(output_tokens) as total_output_tokens,
            SUM(cost) as total_cost,
            AVG(cost / NULLIF(requests_count, 0)) as avg_cost_per_request
        ')
        ->groupBy('service', 'type', 'model')
        ->orderByDesc('total_cost')
        ->get()
        ->toArray();
    }

    /**
     * Évolution des coûts sur N jours
     */
    public static function getDailyTrend(int $days = 30): array
    {
        return static::query()
            ->selectRaw('date, service, SUM(cost) as total_cost, SUM(requests_count) as total_requests')
            ->where('date', '>=', now()->subDays($days)->toDateString())
            ->groupBy('date', 'service')
            ->orderBy('date')
            ->get()
            ->groupBy('date')
            ->map(function ($dayData) {
                $result = [
                    'date' => $dayData->first()->date->format('Y-m-d'),
                    'total_cost' => 0,
                    'total_requests' => 0,
                ];
                foreach ($dayData as $item) {
                    $result[$item->service] = [
                        'cost' => (float) $item->total_cost,
                        'requests' => (int) $item->total_requests,
                    ];
                    $result['total_cost'] += (float) $item->total_cost;
                    $result['total_requests'] += (int) $item->total_requests;
                }
                return $result;
            })
            ->values()
            ->toArray();
    }

    /**
     * Top opérations les plus coûteuses
     */
    public static function getTopOperations(int $limit = 10, ?string $period = 'month'): array
    {
        $query = match ($period) {
            'today' => static::today(),
            'week' => static::thisWeek(),
            'month' => static::thisMonth(),
            default => static::query(),
        };

        return $query->selectRaw('
            service,
            type as operation,
            model,
            SUM(cost) as total_cost,
            SUM(requests_count) as total_requests
        ')
        ->groupBy('service', 'type', 'model')
        ->orderByDesc('total_cost')
        ->limit($limit)
        ->get()
        ->toArray();
    }

    /**
     * Coût moyen par requête
     */
    public static function getAverageCostPerRequest(?string $service = null, ?string $period = 'month'): float
    {
        $query = match ($period) {
            'today' => static::today(),
            'week' => static::thisWeek(),
            'month' => static::thisMonth(),
            default => static::query(),
        };

        if ($service) {
            $query->forService($service);
        }

        $totals = $query->selectRaw('SUM(cost) as total_cost, SUM(requests_count) as total_requests')
                        ->first();

        if (!$totals || $totals->total_requests == 0) {
            return 0;
        }

        return round($totals->total_cost / $totals->total_requests, 6);
    }

    /**
     * Répartition par service
     */
    public static function getCostByService(?string $period = 'month'): array
    {
        $query = match ($period) {
            'today' => static::today(),
            'week' => static::thisWeek(),
            'month' => static::thisMonth(),
            default => static::query(),
        };

        return $query->selectRaw('
            service,
            SUM(cost) as total_cost,
            SUM(requests_count) as total_requests,
            SUM(input_tokens) as total_input_tokens,
            SUM(output_tokens) as total_output_tokens
        ')
        ->groupBy('service')
        ->orderByDesc('total_cost')
        ->get()
        ->keyBy('service')
        ->toArray();
    }

    /**
     * Projection de fin de mois basée sur la moyenne quotidienne
     */
    public static function getMonthlyProjection(): array
    {
        $daysElapsed = now()->day;
        $daysInMonth = now()->daysInMonth;
        $monthCost = static::getMonthCost();
        $monthRequests = static::thisMonth()->sum('requests_count');

        if ($daysElapsed === 0) {
            return [
                'current_cost' => 0,
                'projected_cost' => 0,
                'daily_average' => 0,
            ];
        }

        $dailyAverage = $monthCost / $daysElapsed;
        $projectedCost = $dailyAverage * $daysInMonth;

        return [
            'current_cost' => round($monthCost, 4),
            'current_requests' => (int) $monthRequests,
            'daily_average_cost' => round($dailyAverage, 4),
            'projected_cost' => round($projectedCost, 2),
            'days_elapsed' => $daysElapsed,
            'days_remaining' => $daysInMonth - $daysElapsed,
        ];
    }
}