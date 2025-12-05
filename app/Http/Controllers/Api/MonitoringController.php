<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Monitoring\CostMonitoringService;
use App\Services\Monitoring\PerformanceMonitoringService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class MonitoringController extends Controller
{
    protected CostMonitoringService $costMonitoring;
    protected PerformanceMonitoringService $performanceMonitoring;

    public function __construct(
        CostMonitoringService $costMonitoring,
        PerformanceMonitoringService $performanceMonitoring
    ) {
        $this->costMonitoring = $costMonitoring;
        $this->performanceMonitoring = $performanceMonitoring;
    }

    // =========================================================================
    // COST MONITORING ENDPOINTS
    // =========================================================================

    /**
     * GET /api/monitoring/costs/daily
     * Get today's costs
     */
    public function dailyCosts(): JsonResponse
    {
        try {
            $data = Cache::remember('monitoring.daily_costs', 300, function () {
                return $this->costMonitoring->getDailyCosts();
            });

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch daily costs: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/monitoring/costs/monthly
     * Get current month costs with projection
     */
    public function monthlyCosts(): JsonResponse
    {
        try {
            $data = Cache::remember('monitoring.monthly_costs', 600, function () {
                return $this->costMonitoring->getMonthlyCosts();
            });

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch monthly costs: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/monitoring/costs/prediction
     * Get predicted costs for next N days
     */
    public function predictedCosts(Request $request): JsonResponse
    {
        try {
            $days = (int) $request->input('days', 30);
            
            if ($days < 1 || $days > 365) {
                return response()->json([
                    'success' => false,
                    'message' => 'Days must be between 1 and 365',
                ], 422);
            }

            $cacheKey = 'monitoring.predicted_costs.' . $days;
            $data = Cache::remember($cacheKey, 600, function () use ($days) {
                return $this->costMonitoring->getPredictedCosts($days);
            });

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to predict costs: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/monitoring/costs/breakdown
     * Get detailed costs breakdown
     */
    public function costsBreakdown(Request $request): JsonResponse
    {
        try {
            $days = (int) $request->input('days', 30);
            $cacheKey = 'monitoring.costs_breakdown.' . $days;
            
            $data = Cache::remember($cacheKey, 600, function () use ($days) {
                return $this->costMonitoring->getCostsBreakdown($days);
            });

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch breakdown: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/monitoring/alerts
     * Get budget alerts
     */
    public function alerts(Request $request): JsonResponse
    {
        try {
            $monthlyBudget = (float) $request->input('monthly_budget', config('monitoring.monthly_budget', 500));
            $cacheKey = 'monitoring.alerts.' . (int)$monthlyBudget;
            
            $data = Cache::remember($cacheKey, 60, function () use ($monthlyBudget) {
                return $this->costMonitoring->checkBudgetAlerts($monthlyBudget);
            });

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to check alerts: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/monitoring/savings
     * Get savings from optimizations
     */
    public function savings(): JsonResponse
    {
        try {
            $data = Cache::remember('monitoring.savings', 600, function () {
                return $this->costMonitoring->getSavingsFromOptimizations();
            });

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to calculate savings: ' . $e->getMessage(),
            ], 500);
        }
    }

    // =========================================================================
    // PERFORMANCE MONITORING ENDPOINTS
    // =========================================================================

    /**
     * GET /api/monitoring/performance
     * Get generation performance stats
     */
    public function performance(): JsonResponse
    {
        try {
            $data = Cache::remember('monitoring.performance', 600, function () {
                return $this->performanceMonitoring->getGenerationStats();
            });

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch performance stats: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/monitoring/queue
     * Get queue statistics
     */
    public function queue(): JsonResponse
    {
        try {
            $data = Cache::remember('monitoring.queue', 300, function () {
                return $this->performanceMonitoring->getQueueStats();
            });

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch queue stats: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/monitoring/apis/health
     * Get API health status
     */
    public function apiHealth(): JsonResponse
    {
        try {
            $data = Cache::remember('monitoring.api_health', 60, function () {
                return $this->performanceMonitoring->getAPIHealthStatus();
            });

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to check API health: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/monitoring/errors
     * Get error rate statistics
     */
    public function errors(): JsonResponse
    {
        try {
            $data = Cache::remember('monitoring.errors', 300, function () {
                return $this->performanceMonitoring->getErrorRates();
            });

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch error rates: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/monitoring/health
     * Get comprehensive system health
     */
    public function systemHealth(): JsonResponse
    {
        try {
            $data = Cache::remember('monitoring.system_health', 60, function () {
                return $this->performanceMonitoring->getSystemHealth();
            });

            $statusCode = match($data['overall_status']) {
                'healthy' => 200,
                'degraded' => 200,
                'critical' => 503,
                default => 200,
            };

            return response()->json([
                'success' => true,
                'data' => $data,
            ], $statusCode);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to check system health: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/monitoring/resources
     * Get system resource usage
     */
    public function resources(): JsonResponse
    {
        try {
            $data = Cache::remember('monitoring.resources', 300, function () {
                return $this->performanceMonitoring->getSystemResources();
            });

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch resources: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/monitoring/anomalies
     * Detect spending anomalies
     */
    public function anomalies(): JsonResponse
    {
        try {
            $data = Cache::remember('monitoring.anomalies', 300, function () {
                return $this->costMonitoring->detectAnomalies();
            });

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to detect anomalies: ' . $e->getMessage(),
            ], 500);
        }
    }

    // =========================================================================
    // DASHBOARD ENDPOINT (ALL-IN-ONE)
    // =========================================================================

    /**
     * GET /api/monitoring/dashboard
     * Get all monitoring data in one call
     */
    public function dashboard(Request $request): JsonResponse
    {
        try {
            $monthlyBudget = (float) $request->input('monthly_budget', config('monitoring.monthly_budget', 500));
            $cacheKey = 'monitoring.dashboard.' . (int)$monthlyBudget;

            $data = Cache::remember($cacheKey, 300, function () use ($monthlyBudget) {
                return [
                    'costs' => [
                        'daily' => $this->costMonitoring->getDailyCosts(),
                        'monthly' => $this->costMonitoring->getMonthlyCosts(),
                        'prediction' => $this->costMonitoring->getPredictedCosts(30),
                    ],
                    'alerts' => $this->costMonitoring->checkBudgetAlerts($monthlyBudget),
                    'savings' => $this->costMonitoring->getSavingsFromOptimizations(),
                    'performance' => $this->performanceMonitoring->getGenerationStats(),
                    'queue' => $this->performanceMonitoring->getQueueStats(),
                    'health' => $this->performanceMonitoring->getSystemHealth(),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard data: ' . $e->getMessage(),
            ], 500);
        }
    }
}