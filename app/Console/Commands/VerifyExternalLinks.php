<?php

namespace App\Console\Commands;

use App\Jobs\VerifyExternalLinks as VerifyExternalLinksJob;
use App\Models\Article;
use App\Models\ExternalLink;
use App\Models\Platform;
use App\Services\Linking\LinkVerificationService;
use Illuminate\Console\Command;

class VerifyExternalLinks extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'links:verify
                            {--platform_id= : Platform ID to verify}
                            {--article_id= : Specific article to verify}
                            {--only-unverified : Only verify links never checked}
                            {--only-broken : Only re-verify broken links}
                            {--repair : Attempt to auto-repair broken links}
                            {--report : Generate health report}
                            {--sync : Run synchronously instead of dispatching job}
                            {--limit= : Limit number of links to verify}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verify external links and identify broken ones';

    /**
     * Execute the console command.
     */
    public function handle(LinkVerificationService $service): int
    {
        $platformId = $this->option('platform_id');
        $articleId = $this->option('article_id');
        $onlyUnverified = $this->option('only-unverified');
        $onlyBroken = $this->option('only-broken');
        $repair = $this->option('repair');
        $report = $this->option('report');
        $sync = $this->option('sync');
        $limit = $this->option('limit');

        // Report mode
        if ($report && $platformId) {
            return $this->generateReport($service, (int)$platformId);
        }

        // Single article verification
        if ($articleId) {
            return $this->verifyArticle($service, (int)$articleId);
        }

        // Repair mode
        if ($repair && $platformId) {
            return $this->repairBrokenLinks($service, (int)$platformId);
        }

        // Batch verification
        if ($sync) {
            return $this->verifySync($service, $platformId, $onlyUnverified, $onlyBroken, $limit);
        } else {
            return $this->verifyAsync($platformId, $onlyUnverified, $limit);
        }
    }

    /**
     * Verify a single article
     */
    protected function verifyArticle(LinkVerificationService $service, int $articleId): int
    {
        $article = Article::find($articleId);
        
        if (!$article) {
            $this->error("Article {$articleId} not found");
            return Command::FAILURE;
        }

        $this->info("🔍 Verifying links for article: {$article->title}");
        $this->newLine();

        $links = $article->externalLinks()->get();
        
        if ($links->isEmpty()) {
            $this->warn('No external links found for this article');
            return Command::SUCCESS;
        }

        $progressBar = $this->output->createProgressBar($links->count());
        $progressBar->start();

        $results = [
            'valid' => 0,
            'broken' => 0,
            'details' => []
        ];

        foreach ($links as $link) {
            $verification = $service->verifyLink($link);
            
            if ($verification['is_valid']) {
                $results['valid']++;
            } else {
                $results['broken']++;
                $results['details'][] = [
                    'url' => $link->url,
                    'status' => $verification['status_code'] ?? 'Error',
                    'error' => $verification['error'] ?? null
                ];
            }

            $progressBar->advance();
            usleep(200000);
        }

        $progressBar->finish();
        $this->newLine(2);

        $this->info("✅ Verification completed");
        $this->line("  Total: {$links->count()}");
        $this->line("  Valid: {$results['valid']}");
        $this->line("  Broken: {$results['broken']}");

        if (!empty($results['details'])) {
            $this->newLine();
            $this->warn("Broken links:");
            foreach ($results['details'] as $detail) {
                $this->line("  ❌ {$detail['url']}");
                if ($detail['error']) {
                    $this->line("     Error: {$detail['error']}");
                }
            }
        }

        return Command::SUCCESS;
    }

    /**
     * Verify synchronously
     */
    protected function verifySync(
        LinkVerificationService $service,
        ?string $platformId,
        bool $onlyUnverified,
        bool $onlyBroken,
        ?string $limit
    ): int {
        $this->info("🔍 Verifying external links...");
        $this->newLine();

        // Build query
        $query = ExternalLink::query();

        if ($platformId) {
            $query->whereHas('article', function ($q) use ($platformId) {
                $q->where('platform_id', $platformId);
            });
        }

        if ($onlyUnverified) {
            $query->whereNull('last_verified_at');
        }

        if ($onlyBroken) {
            $query->where('is_broken', true);
        }

        if ($limit) {
            $query->limit((int)$limit);
        }

        $links = $query->get();
        $total = $links->count();

        if ($total === 0) {
            $this->warn('No links to verify');
            return Command::SUCCESS;
        }

        $this->line("Total links to verify: {$total}");
        
        if (!$this->confirm('Continue?', true)) {
            return Command::SUCCESS;
        }

        $progressBar = $this->output->createProgressBar($total);
        $progressBar->setFormat(' %current%/%max% [%bar%] %percent:3s%% | %message%');
        $progressBar->start();

        $stats = [
            'valid' => 0,
            'broken' => 0,
            'newly_broken' => 0
        ];

        foreach ($links as $link) {
            $progressBar->setMessage(mb_substr($link->domain, 0, 30));

            $wasBroken = $link->is_broken;
            $verification = $service->verifyLink($link);

            if ($verification['is_valid']) {
                $stats['valid']++;
            } else {
                $stats['broken']++;
                if (!$wasBroken) {
                    $stats['newly_broken']++;
                }
            }

            $progressBar->advance();
            usleep(150000); // 150ms
        }

        $progressBar->finish();
        $this->newLine(2);

        $this->info("✅ Verification completed");
        $this->table(
            ['Metric', 'Count'],
            [
                ['Total Checked', $total],
                ['Valid', $stats['valid']],
                ['Broken', $stats['broken']],
                ['Newly Broken', $stats['newly_broken']],
            ]
        );

        return Command::SUCCESS;
    }

    /**
     * Dispatch async verification job
     */
    protected function verifyAsync(?string $platformId, bool $onlyUnverified, ?string $limit): int
    {
        $this->info("📤 Dispatching verification job...");

        VerifyExternalLinksJob::dispatch(
            $platformId ? (int)$platformId : null,
            $onlyUnverified,
            $limit ? (int)$limit : null
        );

        $this->info("✅ Job dispatched to queue");
        $this->line("Monitor with: php artisan queue:work linking-verification");

        return Command::SUCCESS;
    }

    /**
     * Repair broken links
     */
    protected function repairBrokenLinks(LinkVerificationService $service, int $platformId): int
    {
        $platform = Platform::find($platformId);
        
        if (!$platform) {
            $this->error("Platform {$platformId} not found");
            return Command::FAILURE;
        }

        $this->info("🔧 Auto-repairing broken links for: {$platform->name}");
        $this->newLine();

        $result = $service->autoRepairBrokenLinks($platformId);

        $this->info("✅ Repair completed");
        $this->line("  Total broken: {$result['total_broken']}");
        $this->line("  Repaired: {$result['repaired']}");
        $this->line("  Not repairable: {$result['not_repairable']}");

        if (!empty($result['repairs'])) {
            $this->newLine();
            $this->info("Repairs made:");
            foreach (array_slice($result['repairs'], 0, 10) as $repair) {
                $this->line("  • {$repair['old_url']}");
                $this->line("    → {$repair['new_url']}");
            }
        }

        return Command::SUCCESS;
    }

    /**
     * Generate health report
     */
    protected function generateReport(LinkVerificationService $service, int $platformId): int
    {
        $platform = Platform::find($platformId);
        
        if (!$platform) {
            $this->error("Platform {$platformId} not found");
            return Command::FAILURE;
        }

        $this->info("📊 Link Health Report: {$platform->name}");
        $this->newLine();

        $report = $service->generateHealthReport($platformId);

        // Summary
        $this->table(
            ['Metric', 'Value'],
            [
                ['Total Links', $report['summary']['total_links']],
                ['Broken Links', $report['summary']['broken_links']],
                ['Broken %', $report['summary']['broken_percentage'] . '%'],
                ['Unverified', $report['summary']['unverified_links']],
                ['Recently Verified', $report['summary']['recently_verified']],
                ['Health Score', $report['summary']['health_score'] . '/100'],
            ]
        );

        // Status
        if ($report['needs_attention']) {
            $this->error("⚠️ ATTENTION NEEDED - Broken link percentage exceeds threshold");
        } else {
            $this->info("✅ Link health is acceptable");
        }

        // Broken by domain
        if (!empty($report['broken_by_domain'])) {
            $this->newLine();
            $this->warn("Broken links by domain:");
            foreach ($report['broken_by_domain'] as $domain => $count) {
                $this->line("  {$domain}: {$count}");
            }
        }

        // Recommendations
        if (!empty($report['recommendations'])) {
            $this->newLine();
            $this->info("💡 Recommendations:");
            foreach ($report['recommendations'] as $rec) {
                $icon = match($rec['priority']) {
                    'high' => '🔴',
                    'medium' => '🟡',
                    'low' => '🟢',
                    default => '⚪'
                };
                $this->line("  {$icon} {$rec['message']}");
                $this->line("     {$rec['action']}");
            }
        }

        return Command::SUCCESS;
    }
}
