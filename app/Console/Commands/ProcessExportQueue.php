<?php

namespace App\Console\Commands;

use App\Models\ExportQueue;
use App\Jobs\ProcessExport;
use Illuminate\Console\Command;

class ProcessExportQueue extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'export:process-queue 
                            {--limit=50 : Maximum number of exports to process}
                            {--status=pending : Status to filter (pending/failed)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process pending exports from the export queue';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $limit = (int) $this->option('limit');
        $status = $this->option('status');

        $this->info("Processing export queue (status: {$status}, limit: {$limit})...");

        // Récupérer exports en attente
        $exports = ExportQueue::where('status', $status)
            ->orderBy('created_at', 'asc')
            ->limit($limit)
            ->get();

        if ($exports->isEmpty()) {
            $this->info('No pending exports found.');
            return self::SUCCESS;
        }

        $this->info("Found {$exports->count()} exports to process.");

        $bar = $this->output->createProgressBar($exports->count());
        $bar->start();

        $processed = 0;

        foreach ($exports as $export) {
            try {
                // Dispatch job
                ProcessExport::dispatch($export->id);
                $processed++;
            } catch (\Exception $e) {
                $this->error("\nFailed to dispatch export #{$export->id}: {$e->getMessage()}");
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();

        $this->info("Successfully dispatched {$processed} exports to queue.");

        // Afficher stats
        $this->showStats();

        return self::SUCCESS;
    }

    /**
     * Show export queue statistics
     */
    private function showStats(): void
    {
        $stats = [
            'pending' => ExportQueue::where('status', 'pending')->count(),
            'processing' => ExportQueue::where('status', 'processing')->count(),
            'completed' => ExportQueue::where('status', 'completed')->count(),
            'failed' => ExportQueue::where('status', 'failed')->count(),
        ];

        $this->newLine();
        $this->info('Export Queue Statistics:');
        $this->table(
            ['Status', 'Count'],
            [
                ['Pending', $stats['pending']],
                ['Processing', $stats['processing']],
                ['Completed', $stats['completed']],
                ['Failed', $stats['failed']],
                ['Total', array_sum($stats)],
            ]
        );
    }
}