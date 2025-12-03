<?php

namespace App\Console\Commands;

use App\Services\Quality\FeedbackLoopService;
use Illuminate\Console\Command;

class FeedbackCollect extends Command
{
    protected $signature = 'feedback:collect 
                          {--days=7 : Number of days to analyze}';

    protected $description = 'Collect and analyze feedback patterns from recent articles';

    public function handle(FeedbackLoopService $feedbackService): int
    {
        $days = (int) $this->option('days');

        $this->info("🔍 Collecting feedback from last {$days} days...");

        try {
            $results = $feedbackService->collectFeedback($days);

            $this->info("\n✅ Feedback collection completed!");
            $this->table(
                ['Metric', 'Value'],
                [
                    ['Articles analyzed', $results['articles_analyzed'] ?? 0],
                    ['Patterns identified', $results['patterns_found'] ?? 0],
                    ['Improvements suggested', $results['improvements'] ?? 0],
                ]
            );

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error("❌ Error: " . $e->getMessage());
            return Command::FAILURE;
        }
    }
}