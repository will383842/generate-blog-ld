<?php

namespace App\Console\Commands;

use App\Models\QualityCheck;
use App\Models\GoldenExample;
use App\Models\Article;
use Illuminate\Console\Command;
use Carbon\Carbon;

class QualityGenerateReport extends Command
{
    protected $signature = 'quality:generate-report 
                          {--period=month : Report period: week, month, quarter}
                          {--export : Export report to file}';

    protected $description = 'Generate quality metrics report';

    public function handle(): int
    {
        $period = $this->option('period');
        $export = $this->option('export');

        $this->info("📊 Generating quality report for period: {$period}");

        $dateFrom = match($period) {
            'week' => Carbon::now()->subWeek(),
            'month' => Carbon::now()->subMonth(),
            'quarter' => Carbon::now()->subQuarter(),
            default => Carbon::now()->subMonth(),
        };

        try {
            // Articles stats
            $totalArticles = Article::where('created_at', '>=', $dateFrom)->count();
            $publishedArticles = Article::where('created_at', '>=', $dateFrom)
                ->where('status', 'published')
                ->count();

            // Quality checks
            $qualityChecks = QualityCheck::where('created_at', '>=', $dateFrom)->get();
            $avgScore = $qualityChecks->avg('overall_score');
            $passedChecks = $qualityChecks->where('passed', true)->count();
            $failedChecks = $qualityChecks->where('passed', false)->count();

            // Golden examples
            $goldenCount = GoldenExample::where('created_at', '>=', $dateFrom)->count();

            // Display report
            $this->info("\n╔═══════════════════════════════════════════════════════════════╗");
            $this->info("║               QUALITY REPORT - " . strtoupper($period) . "                    ║");
            $this->info("╠═══════════════════════════════════════════════════════════════╣");
            
            $this->table(
                ['Metric', 'Value'],
                [
                    ['Period', $dateFrom->format('Y-m-d') . ' to ' . Carbon::now()->format('Y-m-d')],
                    ['Total Articles', $totalArticles],
                    ['Published', $publishedArticles],
                    ['Quality Checks', $qualityChecks->count()],
                    ['Average Score', round($avgScore, 1) . '%'],
                    ['Passed', $passedChecks],
                    ['Failed', $failedChecks],
                    ['Pass Rate', $qualityChecks->count() > 0 ? round(($passedChecks / $qualityChecks->count()) * 100, 1) . '%' : 'N/A'],
                    ['Golden Examples', $goldenCount],
                ]
            );

            $this->info("╚═══════════════════════════════════════════════════════════════╝\n");

            // Export if requested
            if ($export) {
                $filename = 'quality-report-' . $period . '-' . now()->format('Y-m-d') . '.json';
                $path = storage_path('reports/' . $filename);
                
                if (!file_exists(dirname($path))) {
                    mkdir(dirname($path), 0755, true);
                }

                file_put_contents($path, json_encode([
                    'period' => $period,
                    'date_from' => $dateFrom->format('Y-m-d'),
                    'date_to' => Carbon::now()->format('Y-m-d'),
                    'metrics' => [
                        'total_articles' => $totalArticles,
                        'published' => $publishedArticles,
                        'quality_checks' => $qualityChecks->count(),
                        'avg_score' => round($avgScore, 1),
                        'passed' => $passedChecks,
                        'failed' => $failedChecks,
                        'pass_rate' => $qualityChecks->count() > 0 ? round(($passedChecks / $qualityChecks->count()) * 100, 1) : 0,
                        'golden_examples' => $goldenCount,
                    ],
                ], JSON_PRETTY_PRINT));

                $this->info("✅ Report exported to: {$path}");
            }

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error("❌ Error: " . $e->getMessage());
            return Command::FAILURE;
        }
    }
}