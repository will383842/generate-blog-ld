<?php

namespace App\Services\Monitoring;

use App\Models\AiCostDetailed;
use App\Models\PromptCache;
use App\Services\AI\ModelSelectionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CostMonitoringService
{
    protected ModelSelectionService $modelSelection;

    public function __construct(ModelSelectionService $modelSelection)
    {
        $this->modelSelection = $modelSelection;
    }

    // =========================================================================
    // DAILY COSTS
    // =========================================================================

    /**
     * Get today's costs breakdown
     */
    public function getDailyCosts(): array
    {
        return AiCostDetailed::getDailyCosts();
    }

    /**
     * Get costs for specific date
     */
    public function getCostsForDate(string $date): array
    {
        $costs = AiCostDetailed::whereDate('created_at', $date)
            ->select(
                'model_used',
                DB::raw('COUNT(*) as calls_count'),
                DB::raw('SUM(total_cost) as total_cost')
            )
            ->groupBy('model_used')
            ->get();

        return [
            'date' => $date,
            'total_cost' => round($costs->sum('total_cost'), 2),
            'total_calls' => $costs->sum('calls_count'),
            'breakdown' => $costs->toArray(),
        ];
    }

    // =========================================================================
    // MONTHLY COSTS
    // =========================================================================

    /**
     * Get current month costs with projection
     */
    public function getMonthlyCosts(): array
    {
        return AiCostDetailed::getMonthlyCosts();
    }

    /**
     * Get costs for specific month
     */
    public function getCostsForMonth(int $year, int $month): array
    {
        $costs = AiCostDetailed::whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->select(
                'model_used',
                DB::raw('COUNT(*) as calls_count'),
                DB::raw('SUM(total_cost) as total_cost')
            )
            ->groupBy('model_used')
            ->get();

        return [
            'year' => $year,
            'month' => $month,
            'total_cost' => round($costs->sum('total_cost'), 2),
            'total_calls' => $costs->sum('calls_count'),
            'breakdown' => $costs->toArray(),
        ];
    }

    // =========================================================================
    // PREDICTIONS
    // =========================================================================

    /**
     * Predict costs for next N days based on recent average
     */
    public function getPredictedCosts(int $days = 30): array
    {
        // Get average daily cost from last 7 days
        $recentCosts = AiCostDetailed::where('created_at', '>=', now()->subDays(7))
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total_cost) as daily_total')
            )
            ->groupBy('date')
            ->get();

        $avgDailyCost = $recentCosts->avg('daily_total') ?? 0;
        $predictedTotal = $avgDailyCost * $days;

        return [
            'prediction_days' => $days,
            'avg_daily_cost_last_7_days' => round($avgDailyCost, 2),
            'predicted_total' => round($predictedTotal, 2),
            'prediction_date_range' => [
                'from' => now()->toDateString(),
                'to' => now()->addDays($days)->toDateString(),
            ],
            'confidence' => $recentCosts->count() >= 5 ? 'high' : 'low',
        ];
    }

    /**
     * Predict end of month cost
     */
    public function getMonthEndPrediction(): array
    {
        $monthData = $this->getMonthlyCosts();
        
        return [
            'current_spend' => $monthData['current_total'],
            'projected_month_end' => $monthData['projected_total'],
            'days_elapsed' => $monthData['days_elapsed'],
            'days_remaining' => $monthData['days_remaining'],
            'avg_daily_cost' => round($monthData['current_total'] / max($monthData['days_elapsed'], 1), 2),
        ];
    }

    // =========================================================================
    // BUDGET ALERTS
    // =========================================================================

    /**
     * Check budget status and generate alerts
     */
    public function checkBudgetAlerts(float $monthlyBudget = 500): array
    {
        $monthData = $this->getMonthlyCosts();
        $current = $monthData['current_total'];
        $projected = $monthData['projected_total'];
        
        $alerts = [];

        // Alert 1: Current spend > 80% of budget
        if ($current >= ($monthlyBudget * 0.8)) {
            $percentUsed = round(($current / $monthlyBudget) * 100, 1);
            $alerts[] = [
                'level' => 'warning',
                'type' => 'current_spend',
                'message' => "Budget utilisé à {$percentUsed}% ({$current}$ / {$monthlyBudget}$)",
                'action' => 'Surveiller de près les dépenses',
            ];
        }

        // Alert 2: Current spend > 100% of budget
        if ($current >= $monthlyBudget) {
            $overspend = $current - $monthlyBudget;
            $alerts[] = [
                'level' => 'critical',
                'type' => 'budget_exceeded',
                'message' => "Budget mensuel dépassé de {$overspend}$",
                'action' => 'Réviser budget ou réduire utilisation',
            ];
        }

        // Alert 3: Projection exceeds budget
        if ($projected > $monthlyBudget) {
            $expectedOverspend = $projected - $monthlyBudget;
            $alerts[] = [
                'level' => 'warning',
                'type' => 'projection_over_budget',
                'message' => "Projection fin de mois: {$projected}$ (dépassement prévu: {$expectedOverspend}$)",
                'action' => 'Ajuster la production ou augmenter budget',
            ];
        }

        // Alert 4: Daily spike detection (>200% of average)
        $todayCost = AiCostDetailed::today()->sum('total_cost');
        $avgDaily = $current / max($monthData['days_elapsed'], 1);
        
        if ($todayCost > ($avgDaily * 2)) {
            $alerts[] = [
                'level' => 'info',
                'type' => 'daily_spike',
                'message' => "Pic de dépenses aujourd'hui: {$todayCost}$ (moyenne: {$avgDaily}$)",
                'action' => 'Vérifier si activité normale ou anomalie',
            ];
        }

        return [
            'budget_set' => $monthlyBudget,
            'current_spend' => $current,
            'projected_spend' => $projected,
            'budget_status' => $this->getBudgetStatus($current, $monthlyBudget),
            'alerts' => $alerts,
            'has_alerts' => count($alerts) > 0,
        ];
    }

    /**
     * Get budget status
     */
    private function getBudgetStatus(float $current, float $budget): string
    {
        $percent = ($current / $budget) * 100;

        return match(true) {
            $percent < 50 => 'safe',
            $percent < 80 => 'moderate',
            $percent < 100 => 'warning',
            default => 'critical',
        };
    }

    // =========================================================================
    // SAVINGS ANALYSIS
    // =========================================================================

    /**
     * Calculate savings from optimizations
     */
    public function getSavingsFromOptimizations(): array
    {
        $monthData = $this->getMonthlyCosts();
        $currentSpend = $monthData['current_total'];

        // Calculate what would have been spent with GPT-4 only
        $costsByModel = collect($monthData['breakdown']);
        $totalCalls = $costsByModel->sum('calls_count');

        // Estimate average tokens per call (rough)
        $avgInputTokens = 2000;
        $avgOutputTokens = 1500;

        // Calculate hypothetical GPT-4 cost
        $gpt4Pricing = $this->modelSelection->getModelPricing('gpt-4');
        $hypotheticalGpt4Cost = $totalCalls * (
            ($avgInputTokens / 1000 * $gpt4Pricing['input']) +
            ($avgOutputTokens / 1000 * $gpt4Pricing['output'])
        );

        // Model selection savings
        $modelSelectionSavings = $hypotheticalGpt4Cost - $currentSpend;
        $modelSelectionPercent = $hypotheticalGpt4Cost > 0 
            ? ($modelSelectionSavings / $hypotheticalGpt4Cost) * 100 
            : 0;

        // Prompt cache savings (from PromptCache)
        $cacheStats = PromptCache::getCacheStats();
        $promptCacheSavings = $cacheStats['total_savings_estimated'] ?? 0;

        // Research cache savings (estimate)
        $researchCacheSavings = $this->estimateResearchCacheSavings();

        // Total savings
        $totalSavings = $modelSelectionSavings + $promptCacheSavings + $researchCacheSavings;

        return [
            'hypothetical_cost_all_gpt4' => round($hypotheticalGpt4Cost, 2),
            'actual_cost_optimized' => round($currentSpend, 2),
            'total_savings' => round($totalSavings, 2),
            'total_savings_percent' => round(($totalSavings / max($hypotheticalGpt4Cost, 1)) * 100, 1),
            'breakdown' => [
                'model_selection' => [
                    'savings' => round($modelSelectionSavings, 2),
                    'percent' => round($modelSelectionPercent, 1),
                    'description' => 'Utilisation intelligente GPT-4o/mini au lieu de GPT-4',
                ],
                'prompt_cache' => [
                    'savings' => round($promptCacheSavings, 2),
                    'hits' => $cacheStats['total_cache_hits'] ?? 0,
                    'description' => 'Cache automatique OpenAI des prompts',
                ],
                'research_cache' => [
                    'savings' => round($researchCacheSavings, 2),
                    'description' => 'Cache recherches Perplexity/News API',
                ],
            ],
            'monthly_projection' => round($totalSavings * (now()->daysInMonth / max(now()->day, 1)), 2),
            'yearly_projection' => round($totalSavings * 12, 2),
        ];
    }

    /**
     * Estimate research cache savings
     */
    private function estimateResearchCacheSavings(): float
    {
        // Estimate from research cache hit rate
        // Assume 70% hit rate saves 70% of Perplexity costs
        $researchCosts = AiCostDetailed::thisMonth()
            ->where('task_type', 'research')
            ->sum('total_cost');

        // With 70% cache hit rate, we avoid 70% of API calls
        return $researchCosts * 0.7;
    }

    // =========================================================================
    // DETAILED BREAKDOWNS
    // =========================================================================

    /**
     * Get costs breakdown by dimension
     */
    public function getCostsBreakdown(int $days = 30): array
    {
        return [
            'by_model' => $this->getBreakdownByModel($days),
            'by_task' => AiCostDetailed::getCostsByTask($days),
            'by_platform' => AiCostDetailed::getCostsByPlatform($days),
            'by_language' => AiCostDetailed::getCostsByLanguage($days),
            'by_content_type' => AiCostDetailed::getAverageCostPerContent(),
        ];
    }

    /**
     * Get breakdown by model
     */
    private function getBreakdownByModel(int $days): array
    {
        return AiCostDetailed::where('created_at', '>=', now()->subDays($days))
            ->select(
                'model_used',
                DB::raw('COUNT(*) as calls_count'),
                DB::raw('SUM(total_cost) as total_cost'),
                DB::raw('AVG(total_cost) as avg_cost')
            )
            ->groupBy('model_used')
            ->orderByDesc('total_cost')
            ->get()
            ->toArray();
    }

    // =========================================================================
    // ANOMALY DETECTION
    // =========================================================================

    /**
     * Detect unusual spending patterns
     */
    public function detectAnomalies(): array
    {
        $anomalies = [];

        // Get hourly costs for last 24 hours
        $hourlyCosts = AiCostDetailed::getHourlyCosts(24);
        
        if (count($hourlyCosts) < 3) {
            return ['anomalies' => [], 'status' => 'insufficient_data'];
        }

        $costs = array_column($hourlyCosts, 'total_cost');
        $avgCost = array_sum($costs) / count($costs);
        $stdDev = $this->calculateStdDev($costs);

        // Detect spikes (>2 standard deviations)
        foreach ($hourlyCosts as $hourData) {
            if ($hourData['total_cost'] > ($avgCost + 2 * $stdDev)) {
                $anomalies[] = [
                    'type' => 'cost_spike',
                    'hour' => $hourData['hour'],
                    'cost' => $hourData['total_cost'],
                    'expected' => round($avgCost, 2),
                    'deviation' => round($hourData['total_cost'] - $avgCost, 2),
                ];
            }
        }

        return [
            'anomalies' => $anomalies,
            'status' => count($anomalies) > 0 ? 'anomalies_detected' : 'normal',
            'avg_hourly_cost' => round($avgCost, 2),
            'std_deviation' => round($stdDev, 2),
        ];
    }

    /**
     * Calculate standard deviation
     */
    private function calculateStdDev(array $values): float
    {
        $count = count($values);
        if ($count < 2) return 0;

        $mean = array_sum($values) / $count;
        $variance = array_sum(array_map(function($val) use ($mean) {
            return pow($val - $mean, 2);
        }, $values)) / $count;

        return sqrt($variance);
    }
}
