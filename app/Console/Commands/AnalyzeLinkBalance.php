<?php

namespace App\Console\Commands;

use App\Models\Platform;
use App\Services\Linking\LinkBalancerService;
use App\Services\Linking\PageRankService;
use Illuminate\Console\Command;

class AnalyzeLinkBalance extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'links:analyze
                            {platform_id : Platform ID to analyze}
                            {--language= : Filter by language code}
                            {--detailed : Show detailed article-level analysis}
                            {--export= : Export report to file (json/csv)}
                            {--auto-repair : Attempt to automatically fix issues}
                            {--dry-run : Show what auto-repair would do without changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Analyze link balance for a platform and identify issues';

    /**
     * Execute the console command.
     */
    public function handle(
        LinkBalancerService $balancerService,
        PageRankService $pageRankService
    ): int {
        $platformId = (int) $this->argument('platform_id');
        $language = $this->option('language');
        $detailed = $this->option('detailed');
        $export = $this->option('export');
        $autoRepair = $this->option('auto-repair');
        $dryRun = $this->option('dry-run');

        // Validate platform
        $platform = Platform::find($platformId);
        if (!$platform) {
            $this->error("Platform {$platformId} not found");
            return Command::FAILURE;
        }

        $this->info("🔍 Analyzing link balance for: {$platform->name}");
        if ($language) {
            $this->info("   Filtered by language: {$language}");
        }
        $this->newLine();

        // Generate report
        $report = $balancerService->generatePlatformReport($platformId);

        // Display Summary
        $this->displaySummary($report);

        // Display Distribution
        $this->displayDistribution($report['distribution']);

        // Display Issues
        $this->displayIssues($report['issues']);

        // Display Suggestions
        $this->displaySuggestions($report['suggestions']);

        // PageRank Analysis
        $this->displayPageRankStats($pageRankService, $platformId);

        // Detailed analysis
        if ($detailed) {
            $this->displayDetailedAnalysis($balancerService, $platformId, $language);
        }

        // Export
        if ($export) {
            $this->exportReport($report, $export, $platformId);
        }

        // Auto-repair
        if ($autoRepair) {
            $this->runAutoRepair($balancerService, $platformId, $dryRun);
        }

        return Command::SUCCESS;
    }

    /**
     * Display summary section
     */
    protected function displaySummary(array $report): void
    {
        $this->info('📊 Summary');
        $this->line('─────────────────────────────────');
        
        $this->table(
            ['Metric', 'Value'],
            [
                ['Total Articles', number_format($report['summary']['total_articles'])],
                ['Total Internal Links', number_format($report['summary']['total_internal_links'])],
                ['Total External Links', number_format($report['summary']['total_external_links'])],
                ['Avg Links/Article', $report['summary']['total_articles'] > 0 
                    ? round($report['summary']['total_internal_links'] / $report['summary']['total_articles'], 1)
                    : 0
                ],
            ]
        );
        $this->newLine();
    }

    /**
     * Display distribution statistics
     */
    protected function displayDistribution(array $distribution): void
    {
        $this->info('📈 Link Distribution');
        $this->line('─────────────────────────────────');

        $this->table(
            ['', 'Inbound Links', 'Outbound Links'],
            [
                ['Min', $distribution['inbound']['min'], $distribution['outbound']['min']],
                ['Max', $distribution['inbound']['max'], $distribution['outbound']['max']],
                ['Average', $distribution['inbound']['avg'], $distribution['outbound']['avg']],
                ['Median', $distribution['inbound']['median'], $distribution['outbound']['median']],
                ['Std Dev', $distribution['inbound']['std_dev'], $distribution['outbound']['std_dev']],
            ]
        );

        // Imbalance indicator
        $imbalance = $distribution['imbalance_ratio'];
        $imbalanceBar = $this->createProgressBar($imbalance * 100, 100);
        $imbalanceStatus = $imbalance < 0.2 ? '✅ Good' : ($imbalance < 0.4 ? '⚠️ Warning' : '❌ Poor');
        
        $this->newLine();
        $this->line("Imbalance Ratio: {$imbalanceBar} " . round($imbalance * 100) . "% {$imbalanceStatus}");
        $this->newLine();
    }

    /**
     * Display issues
     */
    protected function displayIssues(array $issues): void
    {
        $this->info('⚠️ Issues Detected');
        $this->line('─────────────────────────────────');

        $hasIssues = false;

        if ($issues['orphan_articles'] > 0) {
            $hasIssues = true;
            $this->error("  ❌ Orphan Articles (no inbound links): {$issues['orphan_articles']}");
        }

        if ($issues['dead_end_articles'] > 0) {
            $hasIssues = true;
            $this->warn("  ⚠️ Dead-End Articles (no outbound links): {$issues['dead_end_articles']}");
        }

        if ($issues['broken_links'] > 0) {
            $hasIssues = true;
            $this->error("  ❌ Broken External Links: {$issues['broken_links']}");
        }

        if (!$hasIssues) {
            $this->info("  ✅ No critical issues found!");
        }

        $this->newLine();
    }

    /**
     * Display suggestions
     */
    protected function displaySuggestions(array $suggestions): void
    {
        if (empty($suggestions)) {
            return;
        }

        $this->info('💡 Recommendations');
        $this->line('─────────────────────────────────');

        foreach ($suggestions as $key => $suggestion) {
            $icon = match($suggestion['severity'] ?? 'medium') {
                'high' => '🔴',
                'medium' => '🟡',
                'low' => '🟢',
                default => '⚪'
            };

            $this->line("  {$icon} {$suggestion['message']}");
            if (isset($suggestion['action'])) {
                $this->line("     → {$suggestion['action']}");
            }
            $this->newLine();
        }
    }

    /**
     * Display PageRank statistics
     */
    protected function displayPageRankStats(PageRankService $pageRankService, int $platformId): void
    {
        $this->info('📊 PageRank Analysis');
        $this->line('─────────────────────────────────');

        try {
            $stats = $pageRankService->getPlatformStats($platformId);

            if (isset($stats['error'])) {
                $this->warn("  Could not calculate PageRank: {$stats['error']}");
                return;
            }

            $this->table(
                ['Metric', 'Value'],
                [
                    ['Average Score', $stats['statistics']['average']],
                    ['Median Score', $stats['statistics']['median']],
                    ['Min Score', $stats['statistics']['min']],
                    ['Max Score', $stats['statistics']['max']],
                ]
            );

            $this->newLine();
            $this->line('Distribution:');
            $this->line("  High PR (100+): {$stats['distribution']['high_pr_100plus']} articles");
            $this->line("  Medium PR (50-100): {$stats['distribution']['medium_pr_50_100']} articles");
            $this->line("  Low PR (<50): {$stats['distribution']['low_pr_under_50']} articles");

            if (!empty($stats['top_10'])) {
                $this->newLine();
                $this->info('Top 10 Articles by PageRank:');
                
                $rows = [];
                foreach (array_slice($stats['top_10'], 0, 10) as $article) {
                    $rows[] = [
                        $article['rank'],
                        mb_substr($article['title'], 0, 50) . (mb_strlen($article['title']) > 50 ? '...' : ''),
                        $article['type'],
                        $article['normalized_score'],
                        $article['inbound_links'],
                        $article['outbound_links'],
                    ];
                }

                $this->table(
                    ['Rank', 'Title', 'Type', 'PR Score', 'In', 'Out'],
                    $rows
                );
            }

        } catch (\Exception $e) {
            $this->warn("  Could not calculate PageRank: {$e->getMessage()}");
        }

        $this->newLine();
    }

    /**
     * Display detailed article-level analysis
     */
    protected function displayDetailedAnalysis(
        LinkBalancerService $balancerService,
        int $platformId,
        ?string $language
    ): void {
        $this->info('📋 Detailed Article Analysis');
        $this->line('─────────────────────────────────');

        // Orphan articles
        $orphans = $balancerService->identifyOrphanArticles($platformId, $language);
        if ($orphans->isNotEmpty()) {
            $this->warn("Orphan Articles ({$orphans->count()}):");
            $this->table(
                ['ID', 'Title', 'Type', 'Language', 'Severity'],
                $orphans->take(10)->map(fn($o) => [
                    $o['id'],
                    mb_substr($o['title'], 0, 40) . '...',
                    $o['type'],
                    $o['language'],
                    $o['severity']
                ])->toArray()
            );
            if ($orphans->count() > 10) {
                $this->line("  ... and " . ($orphans->count() - 10) . " more");
            }
            $this->newLine();
        }

        // Dead ends
        $deadEnds = $balancerService->identifyDeadEnds($platformId, $language);
        if ($deadEnds->isNotEmpty()) {
            $this->warn("Dead-End Articles ({$deadEnds->count()}):");
            $this->table(
                ['ID', 'Title', 'Type', 'Inbound Links'],
                $deadEnds->take(10)->map(fn($d) => [
                    $d['id'],
                    mb_substr($d['title'], 0, 40) . '...',
                    $d['type'],
                    $d['inbound_count']
                ])->toArray()
            );
            if ($deadEnds->count() > 10) {
                $this->line("  ... and " . ($deadEnds->count() - 10) . " more");
            }
            $this->newLine();
        }
    }

    /**
     * Export report to file
     */
    protected function exportReport(array $report, string $format, int $platformId): void
    {
        $filename = "link_analysis_{$platformId}_" . date('Y-m-d_His');

        if ($format === 'json') {
            $path = storage_path("app/reports/{$filename}.json");
            file_put_contents($path, json_encode($report, JSON_PRETTY_PRINT));
        } elseif ($format === 'csv') {
            $path = storage_path("app/reports/{$filename}.csv");
            // Export summary as CSV
            $csv = "Metric,Value\n";
            foreach ($report['summary'] as $key => $value) {
                $csv .= "{$key},{$value}\n";
            }
            file_put_contents($path, $csv);
        } else {
            $this->error("Unknown export format: {$format}");
            return;
        }

        $this->info("📁 Report exported to: {$path}");
    }

    /**
     * Run auto-repair
     */
    protected function runAutoRepair(
        LinkBalancerService $balancerService,
        int $platformId,
        bool $dryRun
    ): void {
        $this->newLine();
        $this->info('🔧 Auto-Repair');
        $this->line('─────────────────────────────────');

        if ($dryRun) {
            $this->warn('DRY RUN - No changes will be made');
        }

        $results = $balancerService->autoRepairLinkBalance($platformId, $dryRun);

        $this->line("Actions " . ($dryRun ? "that would be taken:" : "taken:"));
        foreach (array_slice($results['actions'], 0, 20) as $action) {
            $this->line("  • {$action}");
        }

        if (count($results['actions']) > 20) {
            $this->line("  ... and " . (count($results['actions']) - 20) . " more actions");
        }

        if (!$dryRun) {
            $this->newLine();
            $this->info("Results:");
            $this->line("  Orphans fixed: {$results['orphans_fixed']}");
            $this->line("  Dead-ends fixed: {$results['dead_ends_fixed']}");
            $this->line("  Pillars linked: {$results['pillars_linked']}");
        }
    }

    /**
     * Create a simple ASCII progress bar
     */
    protected function createProgressBar(float $value, float $max, int $width = 20): string
    {
        $percentage = min(1, $value / $max);
        $filled = (int) round($percentage * $width);
        $empty = $width - $filled;

        return '[' . str_repeat('█', $filled) . str_repeat('░', $empty) . ']';
    }
}
