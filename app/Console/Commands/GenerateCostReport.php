<?php

namespace App\Console\Commands;

use App\Services\Monitoring\CostMonitoringService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class GenerateCostReport extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'costs:report 
                            {--monthly : Generate monthly report}
                            {--weekly : Generate weekly report}
                            {--export : Export to file}
                            {--email= : Send report to email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate detailed cost reports';

    protected CostMonitoringService $costMonitoring;

    public function __construct(CostMonitoringService $costMonitoring)
    {
        parent::__construct();
        $this->costMonitoring = $costMonitoring;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('📊 Generating Cost Report...');
        $this->newLine();

        if ($this->option('monthly')) {
            $report = $this->generateMonthlyReport();
        } elseif ($this->option('weekly')) {
            $report = $this->generateWeeklyReport();
        } else {
            $report = $this->generateDailyReport();
        }

        // Display report
        $this->displayReport($report);

        // Export to file if requested
        if ($this->option('export')) {
            $this->exportReport($report);
        }

        // Send email if requested
        if ($this->option('email')) {
            $this->sendReportEmail($this->option('email'), $report);
        }

        return Command::SUCCESS;
    }

    /**
     * Generate daily report
     */
    private function generateDailyReport(): array
    {
        $costs = $this->costMonitoring->getDailyCosts();
        $savings = $this->costMonitoring->getSavingsFromOptimizations();

        return [
            'type' => 'daily',
            'period' => $costs['date'],
            'costs' => $costs,
            'savings' => $savings,
        ];
    }

    /**
     * Generate weekly report
     */
    private function generateWeeklyReport(): array
    {
        $breakdown = $this->costMonitoring->getCostsBreakdown(7);
        $savings = $this->costMonitoring->getSavingsFromOptimizations();

        // Calculate total from breakdown
        $totalCost = collect($breakdown['by_model'])->sum('total_cost');

        return [
            'type' => 'weekly',
            'period' => 'Last 7 days',
            'total_cost' => round($totalCost, 2),
            'breakdown' => $breakdown,
            'savings' => $savings,
        ];
    }

    /**
     * Generate monthly report
     */
    private function generateMonthlyReport(): array
    {
        $costs = $this->costMonitoring->getMonthlyCosts();
        $breakdown = $this->costMonitoring->getCostsBreakdown(30);
        $savings = $this->costMonitoring->getSavingsFromOptimizations();
        $prediction = $this->costMonitoring->getMonthEndPrediction();

        return [
            'type' => 'monthly',
            'period' => $costs['month'],
            'costs' => $costs,
            'breakdown' => $breakdown,
            'savings' => $savings,
            'prediction' => $prediction,
        ];
    }

    /**
     * Display report in console
     */
    private function displayReport(array $report): void
    {
        $this->line('═══════════════════════════════════════════════════════════════');
        $this->info("  📊 COST REPORT - " . strtoupper($report['type']));
        $this->line('═══════════════════════════════════════════════════════════════');
        $this->newLine();

        if ($report['type'] === 'daily') {
            $this->displayDailyReport($report);
        } elseif ($report['type'] === 'weekly') {
            $this->displayWeeklyReport($report);
        } else {
            $this->displayMonthlyReport($report);
        }

        // Display savings
        $this->newLine();
        $this->displaySavings($report['savings']);
    }

    /**
     * Display daily report
     */
    private function displayDailyReport(array $report): void
    {
        $costs = $report['costs'];

        $this->info("📅 Date: {$costs['date']}");
        $this->newLine();

        $this->line("💰 Total Cost: \${$costs['total_cost']}");
        $this->line("📞 Total API Calls: {$costs['total_calls']}");
        $this->newLine();

        $this->info('By Model:');
        foreach ($costs['breakdown'] as $model) {
            $this->line("  • {$model['model_used']}: \${$model['total_cost']} ({$model['calls_count']} calls)");
        }
    }

    /**
     * Display weekly report
     */
    private function displayWeeklyReport(array $report): void
    {
        $this->info("📅 Period: {$report['period']}");
        $this->newLine();

        $this->line("💰 Total Cost: \${$report['total_cost']}");
        $this->newLine();

        $this->info('By Model:');
        foreach ($report['breakdown']['by_model'] as $model) {
            $avgCost = isset($model['avg_cost']) ? round($model['avg_cost'], 4) : 0;
            $this->line("  • {$model['model_used']}: \${$model['total_cost']} (avg: \${$avgCost}/call)");
        }

        $this->newLine();
        $this->info('By Task Type:');
        foreach ($report['breakdown']['by_task'] as $task) {
            $this->line("  • {$task['task_type']}: \${$task['total_cost']} ({$task['calls_count']} calls)");
        }
    }

    /**
     * Display monthly report
     */
    private function displayMonthlyReport(array $report): void
    {
        $costs = $report['costs'];

        $this->info("📅 Month: {$costs['month']}");
        $this->newLine();

        $this->line("💰 Current Spend: \${$costs['current_total']}");
        $this->line("📊 Projected End of Month: \${$costs['projected_total']}");
        $this->line("📉 vs Last Month: {$costs['vs_last_month']}%");
        $this->newLine();

        $this->line("⏱️  Days Elapsed: {$costs['days_elapsed']}");
        $this->line("⏳ Days Remaining: {$costs['days_remaining']}");
        $this->newLine();

        $this->info('By Model:');
        foreach ($costs['breakdown'] as $model) {
            $this->line("  • {$model['model_used']}: \${$model['total_cost']} ({$model['calls_count']} calls)");
        }

        $this->newLine();
        $this->info('By Platform:');
        foreach ($report['breakdown']['by_platform'] as $platform) {
            $this->line("  • {$platform['platform_name']}: \${$platform['total_cost']}");
        }
    }

    /**
     * Display savings
     */
    private function displaySavings(array $savings): void
    {
        $this->line('───────────────────────────────────────────────────────────────');
        $this->info('💵 SAVINGS FROM OPTIMIZATIONS');
        $this->line('───────────────────────────────────────────────────────────────');

        $this->line("Without Optimizations: \${$savings['hypothetical_cost_all_gpt4']}");
        $this->line("With Optimizations: \${$savings['actual_cost_optimized']}");
        $this->newLine();

        $this->info("✅ Total Savings: \${$savings['total_savings']} ({$savings['total_savings_percent']}%)");
        $this->newLine();

        $this->info('Breakdown:');
        foreach ($savings['breakdown'] as $type => $data) {
            $savingsAmount = is_array($data) && isset($data['savings']) ? $data['savings'] : 0;
            $description = is_array($data) && isset($data['description']) ? $data['description'] : '';
            $this->line("  • " . ucfirst(str_replace('_', ' ', $type)) . ": \${$savingsAmount}");
            if ($description) {
                $this->line("    → {$description}");
            }
        }

        $this->newLine();
        $this->line("📅 Monthly Projection: \${$savings['monthly_projection']}");
        $this->line("📆 Yearly Projection: \${$savings['yearly_projection']}");
    }

    /**
     * Export report to file
     */
    private function exportReport(array $report): void
    {
        try {
            $filename = 'cost-report-' . $report['type'] . '-' . now()->format('Y-m-d-His') . '.json';
            $path = 'reports/' . $filename;

            Storage::disk('local')->put($path, json_encode($report, JSON_PRETTY_PRINT));

            $fullPath = storage_path('app/' . $path);
            $this->info("✅ Report exported to: {$fullPath}");

        } catch (\Exception $e) {
            $this->error("❌ Failed to export report: " . $e->getMessage());
        }
    }

    /**
     * Send report via email
     */
    private function sendReportEmail(string $email, array $report): void
    {
        try {
            // Format report as text
            $body = $this->formatReportForEmail($report);

            \Illuminate\Support\Facades\Mail::raw($body, function ($message) use ($email, $report) {
                $message->to($email)
                        ->subject('Cost Report - ' . ucfirst($report['type']) . ' - ' . now()->format('Y-m-d'));
            });

            $this->info("✅ Report sent to: {$email}");

        } catch (\Exception $e) {
            $this->error("❌ Failed to send email: " . $e->getMessage());
        }
    }

    /**
     * Format report for email
     */
    private function formatReportForEmail(array $report): string
    {
        $body = "COST REPORT - " . strtoupper($report['type']) . "\n";
        $body .= "Generated: " . now()->toDateTimeString() . "\n\n";
        $body .= "═══════════════════════════════════════════════\n\n";

        if ($report['type'] === 'monthly' && isset($report['costs'])) {
            $costs = $report['costs'];
            $body .= "Month: {$costs['month']}\n";
            $body .= "Current Spend: \${$costs['current_total']}\n";
            $body .= "Projected: \${$costs['projected_total']}\n";
            $body .= "vs Last Month: {$costs['vs_last_month']}%\n\n";
        }

        $body .= "SAVINGS:\n";
        $savings = $report['savings'];
        $body .= "Total Saved: \${$savings['total_savings']} ({$savings['total_savings_percent']}%)\n";
        $body .= "Monthly Projection: \${$savings['monthly_projection']}\n";
        $body .= "Yearly Projection: \${$savings['yearly_projection']}\n\n";

        $body .= "═══════════════════════════════════════════════\n\n";
        $body .= "For detailed breakdown, please check the dashboard.\n";

        return $body;
    }
}
