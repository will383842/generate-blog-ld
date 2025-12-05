<?php

namespace App\Console\Commands;

use App\Services\Monitoring\CostMonitoringService;
use App\Services\Monitoring\PerformanceMonitoringService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class CheckSystemAlerts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'monitoring:check-alerts 
                            {--budget=500 : Monthly budget threshold in dollars}
                            {--email= : Email address to send alerts to}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check system alerts for budget, queue, errors, and performance';

    protected CostMonitoringService $costMonitoring;
    protected PerformanceMonitoringService $performanceMonitoring;

    public function __construct(
        CostMonitoringService $costMonitoring,
        PerformanceMonitoringService $performanceMonitoring
    ) {
        parent::__construct();
        $this->costMonitoring = $costMonitoring;
        $this->performanceMonitoring = $performanceMonitoring;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🔍 Checking system alerts...');
        
        $monthlyBudget = (float) $this->option('budget') ?: config('monitoring.monthly_budget', 500);
        $emailTo = $this->option('email') ?: config('monitoring.alerts.email');

        $alerts = [];

        // 1. Check budget alerts
        $this->info('  → Checking budget...');
        $budgetAlerts = $this->checkBudgetAlerts($monthlyBudget);
        if (!empty($budgetAlerts)) {
            $alerts = array_merge($alerts, $budgetAlerts);
        }

        // 2. Check queue backlog
        $this->info('  → Checking queue...');
        $queueAlerts = $this->checkQueueAlerts();
        if (!empty($queueAlerts)) {
            $alerts = array_merge($alerts, $queueAlerts);
        }

        // 3. Check error rate
        $this->info('  → Checking error rate...');
        $errorAlerts = $this->checkErrorRateAlerts();
        if (!empty($errorAlerts)) {
            $alerts = array_merge($alerts, $errorAlerts);
        }

        // 4. Check performance
        $this->info('  → Checking performance...');
        $performanceAlerts = $this->checkPerformanceAlerts();
        if (!empty($performanceAlerts)) {
            $alerts = array_merge($alerts, $performanceAlerts);
        }

        // 5. Check anomalies
        $this->info('  → Checking anomalies...');
        $anomalies = $this->checkAnomalies();
        if (!empty($anomalies)) {
            $alerts = array_merge($alerts, $anomalies);
        }

        // Display results
        if (empty($alerts)) {
            $this->info('✅ No alerts - System healthy');
            return Command::SUCCESS;
        }

        // Display alerts
        $this->newLine();
        $this->warn('⚠️  ' . count($alerts) . ' alert(s) detected:');
        foreach ($alerts as $alert) {
            $icon = match($alert['level']) {
                'critical' => '🔴',
                'warning' => '⚠️ ',
                'info' => 'ℹ️ ',
                default => '•',
            };
            $this->line("  {$icon} [{$alert['level']}] {$alert['message']}");
        }

        // Send email if configured
        if ($emailTo && !empty($alerts)) {
            $this->sendAlertEmail($emailTo, $alerts);
        }

        // Log alerts
        foreach ($alerts as $alert) {
            Log::channel('monitoring')->warning('System alert', $alert);
        }

        return Command::SUCCESS;
    }

    /**
     * Check budget alerts
     */
    private function checkBudgetAlerts(float $monthlyBudget): array
    {
        try {
            $budgetCheck = $this->costMonitoring->checkBudgetAlerts($monthlyBudget);
            return $budgetCheck['alerts'] ?? [];

        } catch (\Exception $e) {
            return [[
                'level' => 'critical',
                'type' => 'monitoring_error',
                'message' => 'Failed to check budget: ' . $e->getMessage(),
                'action' => 'Check monitoring service',
            ]];
        }
    }

    /**
     * Check queue backlog alerts
     */
    private function checkQueueAlerts(): array
    {
        try {
            $queueStats = $this->performanceMonitoring->getQueueStats();
            $alerts = [];

            // Alert if backlog > 500
            if ($queueStats['total_backlog'] > 500) {
                $alerts[] = [
                    'level' => 'warning',
                    'type' => 'queue_backlog',
                    'message' => "Queue backlog: {$queueStats['total_backlog']} jobs pending",
                    'action' => 'Consider increasing workers or reducing generation rate',
                ];
            }

            // Alert if backlog > 1000
            if ($queueStats['total_backlog'] > 1000) {
                $alerts[] = [
                    'level' => 'critical',
                    'type' => 'queue_backlog_critical',
                    'message' => "CRITICAL: Queue backlog exceeds 1000 jobs ({$queueStats['total_backlog']})",
                    'action' => 'Immediate action required - add workers',
                ];
            }

            // Alert if average wait time > 1 hour
            if ($queueStats['avg_wait_time_minutes'] > 60) {
                $alerts[] = [
                    'level' => 'warning',
                    'type' => 'queue_wait_time',
                    'message' => "High queue wait time: {$queueStats['avg_wait_time_minutes']} minutes",
                    'action' => 'Jobs taking too long to process',
                ];
            }

            return $alerts;

        } catch (\Exception $e) {
            return [[
                'level' => 'critical',
                'type' => 'monitoring_error',
                'message' => 'Failed to check queue: ' . $e->getMessage(),
                'action' => 'Check queue monitoring',
            ]];
        }
    }

    /**
     * Check error rate alerts
     */
    private function checkErrorRateAlerts(): array
    {
        try {
            $errorStats = $this->performanceMonitoring->getErrorRates();
            $alerts = [];

            // Alert if error rate > 5%
            if ($errorStats['error_rate_percent'] > 5) {
                $alerts[] = [
                    'level' => 'warning',
                    'type' => 'high_error_rate',
                    'message' => "Error rate: {$errorStats['error_rate_percent']}%",
                    'action' => 'Check logs for recurring errors',
                ];
            }

            // Alert if error rate > 10%
            if ($errorStats['error_rate_percent'] > 10) {
                $alerts[] = [
                    'level' => 'critical',
                    'type' => 'critical_error_rate',
                    'message' => "CRITICAL: Error rate exceeds 10% ({$errorStats['error_rate_percent']}%)",
                    'action' => 'System degradation - investigate immediately',
                ];
            }

            return $alerts;

        } catch (\Exception $e) {
            return [[
                'level' => 'critical',
                'type' => 'monitoring_error',
                'message' => 'Failed to check error rates: ' . $e->getMessage(),
                'action' => 'Check error monitoring',
            ]];
        }
    }

    /**
     * Check performance alerts
     */
    private function checkPerformanceAlerts(): array
    {
        try {
            $perfStats = $this->performanceMonitoring->getGenerationStats();
            $alerts = [];

            // Alert if average generation time > 5 minutes
            if ($perfStats['avg_duration_overall'] > 300) {
                $duration = round($perfStats['avg_duration_overall'] / 60, 1);
                $alerts[] = [
                    'level' => 'warning',
                    'type' => 'slow_generation',
                    'message' => "Slow generation times: {$duration} minutes average",
                    'action' => 'Check API latency or optimize prompts',
                ];
            }

            // Alert if success rate < 90%
            if ($perfStats['success_rate'] < 90) {
                $alerts[] = [
                    'level' => 'warning',
                    'type' => 'low_success_rate',
                    'message' => "Low success rate: {$perfStats['success_rate']}%",
                    'action' => 'Check for API issues or validation errors',
                ];
            }

            return $alerts;

        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Check for spending anomalies
     */
    private function checkAnomalies(): array
    {
        try {
            $anomalyCheck = $this->costMonitoring->detectAnomalies();
            $alerts = [];

            if ($anomalyCheck['status'] === 'anomalies_detected') {
                foreach ($anomalyCheck['anomalies'] as $anomaly) {
                    $alerts[] = [
                        'level' => 'info',
                        'type' => 'cost_anomaly',
                        'message' => "Cost spike detected at {$anomaly['hour']}: \${$anomaly['cost']} (expected \${$anomaly['expected']})",
                        'action' => 'Review usage during this period',
                    ];
                }
            }

            return $alerts;

        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Send alert email
     */
    private function sendAlertEmail(string $emailTo, array $alerts): void
    {
        try {
            $subject = count($alerts) . ' System Alert(s) Detected - Content Engine';
            
            $body = "System Alerts:\n\n";
            foreach ($alerts as $alert) {
                $body .= "[{$alert['level']}] {$alert['message']}\n";
                $body .= "Action: {$alert['action']}\n\n";
            }

            Mail::raw($body, function ($message) use ($emailTo, $subject) {
                $message->to($emailTo)
                        ->subject($subject);
            });

            $this->info('  → Alert email sent to ' . $emailTo);

        } catch (\Exception $e) {
            $this->error('  → Failed to send email: ' . $e->getMessage());
        }
    }
}
