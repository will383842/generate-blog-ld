<?php

namespace App\Console\Commands;

use App\Models\Article;
use Illuminate\Console\Command;
use Carbon\Carbon;

class ArchiveOldArticles extends Command
{
    protected $signature = 'archive:old-articles 
                          {--days=180 : Archive articles older than X days}
                          {--dry-run : Show what would be archived without doing it}';

    protected $description = 'Archive old articles to optimize database performance';

    public function handle(): int
    {
        $days = (int) $this->option('days');
        $dryRun = $this->option('dry-run');
        $cutoffDate = Carbon::now()->subDays($days);

        $this->info("📦 Finding articles older than {$days} days (before {$cutoffDate->format('Y-m-d')})...");

        // Find old articles not already archived
        $query = Article::where('created_at', '<', $cutoffDate)
            ->where('status', '!=', 'archived');

        $count = $query->count();

        if ($count === 0) {
            $this->info("✅ No articles to archive.");
            return Command::SUCCESS;
        }

        $this->info("Found {$count} articles to archive.");

        if ($dryRun) {
            $this->warn("🔍 DRY RUN MODE - No changes will be made");
            
            $articles = $query->limit(10)->get();
            $this->table(
                ['ID', 'Title', 'Created', 'Platform'],
                $articles->map(fn($a) => [
                    $a->id,
                    substr($a->title, 0, 50),
                    $a->created_at->format('Y-m-d'),
                    $a->platform->name ?? 'N/A'
                ])
            );

            return Command::SUCCESS;
        }

        if (!$this->confirm("Archive {$count} articles?", false)) {
            $this->info("Cancelled.");
            return Command::SUCCESS;
        }

        try {
            $archived = $query->update(['status' => 'archived']);

            $this->info("✅ Archived {$archived} articles successfully!");

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error("❌ Error: " . $e->getMessage());
            return Command::FAILURE;
        }
    }
}