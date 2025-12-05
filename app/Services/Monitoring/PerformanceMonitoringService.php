<?php

namespace App\Services\Monitoring;

use App\Models\GenerationQueue;
use App\Models\GenerationLog;
use App\Models\ExportQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PerformanceMonitoringService
{
    // =========================================================================
    // GENERATION STATISTICS
    // =========================================================================

    /**
     * Get generation performance stats
     */
    public function getGenerationStats(): array
    {
        // Last 24 hours stats
        $logs = GenerationLog::where('created_at', '>=', now()->subDay())->get();

        $avgTimeByType = $logs->groupBy('content_type')->map(function ($group) {
            return [
                'count' => $group->count(),
                'avg_duration' => round($group->avg('duration_seconds'), 1),
                'min_duration' => round($group->min('duration_seconds'), 1),
                'max_duration' => round($group->max('duration_seconds'), 1),
                'success_rate' => round(($group->where('status', 'completed')->count() / $group->count()) * 100, 1),
            ];
        });

        $totalGenerations = $logs->count();
        $successCount = $logs->where('status', 'completed')->count();
        $failedCount = $logs->where('status', 'failed')->count();

        return [
            'period' => 'last_24_hours',
            'total_generations' => $totalGenerations,
            'successful' => $successCount,
            'failed' => $failedCount,
            'success_rate' => $totalGenerations > 0 ? round(($successCount / $totalGenerations) * 100, 1) : 0,
            'avg_duration_overall' => round($logs->avg('duration_seconds'), 1),
            'generations_per_hour' => round($totalGenerations / 24, 1),
            'by_content_type' => $avgTimeByType->toArray(),
        ];
    }

    /**
     * Get current generation rate
     */
    public function getCurrentGenerationRate(): array
    {
        // Last hour
        $lastHour = GenerationLog::where('created_at', '>=', now()->subHour())->count();
        
        // Last 10 minutes
        $last10Min = GenerationLog::where('created_at', '>=', now()->subMinutes(10))->count();
        
        return [
            'last_hour' => $lastHour,
            'last_10_minutes' => $last10Min,
            'projected_hourly_rate' => $last10Min * 6, // Extrapolate
            'status' => $lastHour > 0 ? 'active' : 'idle',
        ];
    }

    // =========================================================================
    // QUEUE STATISTICS
    // =========================================================================

    /**
     * Get queue status and statistics
     */
    public function getQueueStats(): array
    {
        // Generation Queue
        $genQueue = GenerationQueue::select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();

        // Export Queue
        $exportQueue = ExportQueue::select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();

        // Calculate average wait time for pending jobs
        $avgWaitTime = GenerationQueue::where('status', 'pending')
            ->select(DB::raw('AVG(TIMESTAMPDIFF(MINUTE, created_at, NOW())) as avg_wait'))
            ->value('avg_wait');

        // Oldest pending job
        $oldestPending = GenerationQueue::where('status', 'pending')
            ->orderBy('created_at', 'asc')
            ->first();

        $totalBacklog = ($genQueue['pending'] ?? 0) + ($exportQueue['pending'] ?? 0);

        return [
            'generation_queue' => [
                'pending' => $genQueue['pending'] ?? 0,
                'processing' => $genQueue['processing'] ?? 0,
                'completed' => $genQueue['completed'] ?? 0,
                'failed' => $genQueue['failed'] ?? 0,
            ],
            'export_queue' => [
                'pending' => $exportQueue['pending'] ?? 0,
                'processing' => $exportQueue['processing'] ?? 0,
                'completed' => $exportQueue['completed'] ?? 0,
                'failed' => $exportQueue['failed'] ?? 0,
            ],
            'total_backlog' => $totalBacklog,
            'avg_wait_time_minutes' => $avgWaitTime ? round($avgWaitTime, 1) : 0,
            'oldest_pending_job' => $oldestPending ? [
                'id' => $oldestPending->id,
                'age_minutes' => now()->diffInMinutes($oldestPending->created_at),
                'created_at' => $oldestPending->created_at->toDateTimeString(),
            ] : null,
            'status' => $this->getQueueHealthStatus($totalBacklog, $avgWaitTime),
        ];
    }

    /**
     * Get queue health status
     */
    private function getQueueHealthStatus(int $backlog, ?float $avgWaitTime): string
    {
        if ($backlog > 1000) return 'critical';
        if ($backlog > 500) return 'warning';
        if ($avgWaitTime && $avgWaitTime > 60) return 'degraded';
        return 'healthy';
    }

    // =========================================================================
    // API HEALTH CHECKS
    // =========================================================================

    /**
     * Check health status of external APIs
     */
    public function getAPIHealthStatus(): array
    {
        $apis = [
            'openai' => $this->checkOpenAIHealth(),
            'perplexity' => $this->checkPerplexityHealth(),
            'unsplash' => $this->checkUnsplashHealth(),
        ];

        $overallStatus = $this->calculateOverallAPIStatus($apis);

        return [
            'overall_status' => $overallStatus,
            'apis' => $apis,
            'checked_at' => now()->toDateTimeString(),
        ];
    }

    /**
     * Check OpenAI API health
     */
    private function checkOpenAIHealth(): array
    {
        $cacheKey = 'api_health_openai';
        
        return Cache::remember($cacheKey, 300, function () { // Cache 5 minutes
            try {
                $start = microtime(true);
                
                $response = Http::timeout(5)
                    ->withToken(config('services.openai.key'))
                    ->get('https://api.openai.com/v1/models');
                
                $latency = round((microtime(true) - $start) * 1000, 0);
                
                if ($response->successful()) {
                    return [
                        'status' => 'healthy',
                        'latency_ms' => $latency,
                        'last_checked' => now()->toDateTimeString(),
                    ];
                }

                return [
                    'status' => 'degraded',
                    'latency_ms' => $latency,
                    'error' => 'HTTP ' . $response->status(),
                    'last_checked' => now()->toDateTimeString(),
                ];

            } catch (\Exception $e) {
                return [
                    'status' => 'down',
                    'error' => $e->getMessage(),
                    'last_checked' => now()->toDateTimeString(),
                ];
            }
        });
    }

    /**
     * Check Perplexity API health
     */
    private function checkPerplexityHealth(): array
    {
        $cacheKey = 'api_health_perplexity';
        
        return Cache::remember($cacheKey, 300, function () {
            try {
                $start = microtime(true);
                
                // Simple test request
                $response = Http::timeout(5)
                    ->withToken(config('services.perplexity.key'))
                    ->post('https://api.perplexity.ai/chat/completions', [
                        'model' => 'llama-3.1-sonar-small-128k-online',
                        'messages' => [
                            ['role' => 'user', 'content' => 'test']
                        ],
                        'max_tokens' => 1,
                    ]);
                
                $latency = round((microtime(true) - $start) * 1000, 0);
                
                return [
                    'status' => $response->successful() ? 'healthy' : 'degraded',
                    'latency_ms' => $latency,
                    'last_checked' => now()->toDateTimeString(),
                ];

            } catch (\Exception $e) {
                return [
                    'status' => 'down',
                    'error' => $e->getMessage(),
                    'last_checked' => now()->toDateTimeString(),
                ];
            }
        });
    }

    /**
     * Check Unsplash API health
     */
    private function checkUnsplashHealth(): array
    {
        $cacheKey = 'api_health_unsplash';
        
        return Cache::remember($cacheKey, 300, function () {
            try {
                $start = microtime(true);
                
                $response = Http::timeout(5)
                    ->get('https://api.unsplash.com/stats/month', [
                        'client_id' => config('services.unsplash.access_key'),
                    ]);
                
                $latency = round((microtime(true) - $start) * 1000, 0);
                
                return [
                    'status' => $response->successful() ? 'healthy' : 'degraded',
                    'latency_ms' => $latency,
                    'last_checked' => now()->toDateTimeString(),
                ];

            } catch (\Exception $e) {
                return [
                    'status' => 'down',
                    'error' => $e->getMessage(),
                    'last_checked' => now()->toDateTimeString(),
                ];
            }
        });
    }

    /**
     * Calculate overall API status
     */
    private function calculateOverallAPIStatus(array $apis): string
    {
        $statuses = array_column($apis, 'status');
        
        if (in_array('down', $statuses)) {
            return 'degraded';
        }
        
        if (in_array('degraded', $statuses)) {
            return 'degraded';
        }
        
        return 'healthy';
    }

    // =========================================================================
    // ERROR RATE MONITORING
    // =========================================================================

    /**
     * Get error rate statistics
     */
    public function getErrorRates(): array
    {
        // Last hour
        $lastHour = GenerationLog::where('created_at', '>=', now()->subHour())->get();
        
        $total = $lastHour->count();
        $failed = $lastHour->where('status', 'failed')->count();
        $errorRate = $total > 0 ? round(($failed / $total) * 100, 1) : 0;

        // By error type
        $errorsByType = $lastHour->where('status', 'failed')
            ->groupBy('error_message')
            ->map(fn($group) => $group->count())
            ->sortDesc()
            ->take(5)
            ->toArray();

        return [
            'period' => 'last_hour',
            'total_attempts' => $total,
            'failed_attempts' => $failed,
            'error_rate_percent' => $errorRate,
            'status' => $this->getErrorRateStatus($errorRate),
            'top_errors' => $errorsByType,
        ];
    }

    /**
     * Get error rate status
     */
    private function getErrorRateStatus(float $errorRate): string
    {
        return match(true) {
            $errorRate < 1 => 'excellent',
            $errorRate < 5 => 'good',
            $errorRate < 10 => 'warning',
            default => 'critical',
        };
    }

    // =========================================================================
    // SYSTEM RESOURCES
    // =========================================================================

    /**
     * Get system resource usage
     */
    public function getSystemResources(): array
    {
        return [
            'database' => $this->getDatabaseStats(),
            'cache' => $this->getCacheStats(),
            'storage' => $this->getStorageStats(),
        ];
    }

    /**
     * Get database statistics
     */
    private function getDatabaseStats(): array
    {
        try {
            // Get database size
            $dbName = config('database.connections.mysql.database');
            $dbSize = DB::select("
                SELECT 
                    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
                FROM information_schema.TABLES 
                WHERE table_schema = ?
            ", [$dbName]);

            // Get connection count
            $connections = DB::select('SHOW STATUS WHERE Variable_name = "Threads_connected"');

            return [
                'size_mb' => $dbSize[0]->size_mb ?? 0,
                'active_connections' => $connections[0]->Value ?? 0,
                'status' => 'healthy',
            ];

        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get cache statistics
     */
    private function getCacheStats(): array
    {
        try {
            // This is implementation-specific (Redis, Memcached, etc.)
            return [
                'driver' => config('cache.default'),
                'status' => Cache::has('test_key') || !Cache::has('test_key') ? 'healthy' : 'degraded',
            ];

        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get storage statistics
     */
    private function getStorageStats(): array
    {
        try {
            $storagePath = storage_path();
            $freeSpace = disk_free_space($storagePath);
            $totalSpace = disk_total_space($storagePath);
            $usedSpace = $totalSpace - $freeSpace;
            $usedPercent = round(($usedSpace / $totalSpace) * 100, 1);

            return [
                'free_space_gb' => round($freeSpace / 1024 / 1024 / 1024, 2),
                'total_space_gb' => round($totalSpace / 1024 / 1024 / 1024, 2),
                'used_percent' => $usedPercent,
                'status' => $usedPercent > 90 ? 'warning' : 'healthy',
            ];

        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'error' => $e->getMessage(),
            ];
        }
    }

    // =========================================================================
    // COMPREHENSIVE HEALTH CHECK
    // =========================================================================

    /**
     * Get comprehensive system health
     */
    public function getSystemHealth(): array
    {
        $generation = $this->getGenerationStats();
        $queue = $this->getQueueStats();
        $apis = $this->getAPIHealthStatus();
        $errors = $this->getErrorRates();

        $issues = [];

        // Check for issues
        if ($queue['status'] !== 'healthy') {
            $issues[] = 'Queue backlog: ' . $queue['total_backlog'] . ' jobs pending';
        }

        if ($apis['overall_status'] !== 'healthy') {
            $issues[] = 'API degradation detected';
        }

        if ($errors['status'] === 'critical') {
            $issues[] = 'High error rate: ' . $errors['error_rate_percent'] . '%';
        }

        if ($generation['success_rate'] < 90) {
            $issues[] = 'Low success rate: ' . $generation['success_rate'] . '%';
        }

        $overallStatus = count($issues) === 0 ? 'healthy' : (count($issues) > 2 ? 'critical' : 'degraded');

        return [
            'overall_status' => $overallStatus,
            'checked_at' => now()->toDateTimeString(),
            'components' => [
                'generation' => $generation['success_rate'] >= 95 ? 'healthy' : 'degraded',
                'queue' => $queue['status'],
                'apis' => $apis['overall_status'],
                'errors' => $errors['status'],
            ],
            'issues' => $issues,
            'metrics' => [
                'generations_per_hour' => $generation['generations_per_hour'],
                'queue_backlog' => $queue['total_backlog'],
                'error_rate' => $errors['error_rate_percent'],
                'success_rate' => $generation['success_rate'],
            ],
        ];
    }
}
