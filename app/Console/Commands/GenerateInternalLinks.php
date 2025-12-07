<?php

namespace App\Console\Commands;

use App\Jobs\GenerateInternalLinks as GenerateInternalLinksJob;
use App\Jobs\GenerateInternalLinksBatch;
use App\Models\Article;
use App\Models\Platform;
use App\Services\Linking\InternalLinkingService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Bus;

class GenerateInternalLinks extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'links:generate-internal
                            {--article_id= : ID of a specific article}
                            {--platform_id= : Process all articles of a platform}
                            {--language= : Filter by language code}
                            {--all : Process all articles across all platforms}
                            {--force : Regenerate even if links already exist}
                            {--sync : Run synchronously instead of dispatching jobs}
                            {--dry-run : Show what would be done without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate internal links for articles using TF-IDF similarity';

    /**
     * Execute the console command.
     */
    public function handle(InternalLinkingService $linkingService): int
    {
        $articleId = $this->option('article_id');
        $platformId = $this->option('platform_id');
        $languageCode = $this->option('language');
        $all = $this->option('all');
        $force = $this->option('force');
        $sync = $this->option('sync');
        $dryRun = $this->option('dry-run');

        // Validation
        if (!$articleId && !$platformId && !$all) {
            $this->error('Please specify --article_id, --platform_id, or --all');
            return Command::FAILURE;
        }

        if ($dryRun) {
            $this->info('🔍 DRY RUN - No changes will be made');
            $this->newLine();
        }

        // Mode: Single article
        if ($articleId) {
            return $this->processArticle((int)$articleId, $linkingService, $force, $sync, $dryRun);
        }

        // Mode: Platform or All
        return $this->processBatch($platformId, $languageCode, $force, $sync, $dryRun, $linkingService);
    }

    /**
     * Process a single article
     */
    protected function processArticle(
        int $articleId,
        InternalLinkingService $linkingService,
        bool $force,
        bool $sync,
        bool $dryRun
    ): int {
        $article = Article::find($articleId);

        if (!$article) {
            $this->error("Article {$articleId} not found");
            return Command::FAILURE;
        }

        $this->info("📝 Processing article: {$article->title}");
        $this->table(
            ['Property', 'Value'],
            [
                ['ID', $article->id],
                ['Platform', $article->platform->name ?? 'N/A'],
                ['Language', $article->language_code],
                ['Country', $article->country_code ?? 'N/A'],
                ['Type', $article->type],
                ['Status', $article->status],
            ]
        );

        if ($dryRun) {
            $existingLinks = $article->internalLinksAsSource()->count();
            $this->info("Current internal links: {$existingLinks}");
            $this->info("Would generate new internal links for this article");
            return Command::SUCCESS;
        }

        if ($sync) {
            $this->info('Running synchronously...');
            $this->newLine();

            $progressBar = $this->output->createProgressBar(3);
            $progressBar->start();

            try {
                $progressBar->advance(); // Analyzing

                $result = $linkingService->generateInternalLinks($article);

                $progressBar->advance(); // Processing
                $progressBar->advance(); // Complete
                $progressBar->finish();

                $this->newLine(2);
                $this->info('✅ Internal links generated successfully!');
                $this->table(
                    ['Metric', 'Count'],
                    [
                        ['Links Created', $result['created'] ?? 0],
                        ['Links Deleted (old)', $result['deleted'] ?? 0],
                        ['Pillar Link', isset($result['pillar_linked']) && $result['pillar_linked'] ? 'Yes' : 'No'],
                    ]
                );

            } catch (\Exception $e) {
                $progressBar->finish();
                $this->newLine(2);
                $this->error("❌ Failed: {$e->getMessage()}");
                return Command::FAILURE;
            }
        } else {
            GenerateInternalLinksJob::dispatch($articleId, $force);
            $this->info('📤 Job dispatched to queue');
        }

        return Command::SUCCESS;
    }

    /**
     * Process multiple articles in batch
     */
    protected function processBatch(
        ?string $platformId,
        ?string $languageCode,
        bool $force,
        bool $sync,
        bool $dryRun,
        InternalLinkingService $linkingService
    ): int {
        // Build query
        $query = Article::where('status', 'published');

        if ($platformId) {
            $platform = Platform::find($platformId);
            if (!$platform) {
                $this->error("Platform {$platformId} not found");
                return Command::FAILURE;
            }
            $query->where('platform_id', $platformId);
            $this->info("📦 Platform: {$platform->name}");
        } else {
            $this->info('📦 All platforms');
        }

        if ($languageCode) {
            $query->where('language_code', $languageCode);
            $this->info("🌐 Language: {$languageCode}");
        }

        $totalArticles = $query->count();
        $this->info("📊 Total articles to process: {$totalArticles}");
        $this->newLine();

        if ($totalArticles === 0) {
            $this->warn('No articles found matching criteria');
            return Command::SUCCESS;
        }

        if ($dryRun) {
            $this->table(
                ['Platform', 'Language', 'Count'],
                $query->clone()
                    ->selectRaw('platform_id, language_code, COUNT(*) as count')
                    ->groupBy('platform_id', 'language_code')
                    ->get()
                    ->map(fn($row) => [
                        Platform::find($row->platform_id)?->name ?? $row->platform_id,
                        $row->language_code,
                        $row->count
                    ])
                    ->toArray()
            );
            $this->info("Would process {$totalArticles} articles");
            return Command::SUCCESS;
        }

        // Confirmation
        if (!$this->confirm("Process {$totalArticles} articles?", true)) {
            $this->info('Cancelled');
            return Command::SUCCESS;
        }

        if ($sync) {
            return $this->processBatchSync($query, $linkingService, $force);
        } else {
            return $this->processBatchAsync($platformId ? (int)$platformId : null, $languageCode, $force);
        }
    }

    /**
     * Process batch synchronously
     */
    protected function processBatchSync($query, InternalLinkingService $linkingService, bool $force): int
    {
        $totalArticles = $query->count();
        $progressBar = $this->output->createProgressBar($totalArticles);
        $progressBar->setFormat(' %current%/%max% [%bar%] %percent:3s%% | %message%');
        $progressBar->start();

        $stats = [
            'success' => 0,
            'failed' => 0,
            'skipped' => 0,
            'links_created' => 0
        ];

        $query->orderBy('id')->chunk(50, function ($articles) use ($progressBar, $linkingService, $force, &$stats) {
            foreach ($articles as $article) {
                $progressBar->setMessage($article->title);

                // Skip if has recent links and not forcing
                if (!$force && $this->hasRecentLinks($article)) {
                    $stats['skipped']++;
                    $progressBar->advance();
                    continue;
                }

                try {
                    $result = $linkingService->generateInternalLinks($article);
                    $stats['success']++;
                    $stats['links_created'] += $result['created'] ?? 0;
                } catch (\Exception $e) {
                    $stats['failed']++;
                    $this->newLine();
                    $this->warn("Failed article {$article->id}: {$e->getMessage()}");
                }

                $progressBar->advance();
                usleep(100000); // 100ms pause
            }
        });

        $progressBar->finish();
        $this->newLine(2);

        $this->info('✅ Batch processing complete!');
        $this->table(
            ['Metric', 'Count'],
            [
                ['✓ Success', $stats['success']],
                ['✗ Failed', $stats['failed']],
                ['↷ Skipped', $stats['skipped']],
                ['🔗 Links Created', $stats['links_created']],
            ]
        );

        return $stats['failed'] > 0 ? Command::FAILURE : Command::SUCCESS;
    }

    /**
     * Process batch asynchronously via jobs
     */
    protected function processBatchAsync(?int $platformId, ?string $languageCode, bool $force): int
    {
        $this->info('📤 Dispatching batch job to queue...');

        // Option 1: Single batch job
        GenerateInternalLinksBatch::dispatch($platformId, $languageCode, $force);
        $this->info('✅ Batch job dispatched');

        // Option 2: Individual jobs with batch tracking (commented out)
        /*
        $batch = GenerateInternalLinksBatch::dispatchAsIndividualJobs($platformId, $languageCode, $force);
        $this->info("✅ Batch dispatched with ID: {$batch->id}");
        $this->info("   Track progress: php artisan links:batch-status {$batch->id}");
        */

        $this->newLine();
        $this->info('Monitor progress with:');
        $this->line('  php artisan horizon');
        $this->line('  php artisan queue:work linking-batch');

        return Command::SUCCESS;
    }

    /**
     * Check if article has recent links
     */
    protected function hasRecentLinks(Article $article): bool
    {
        return $article->internalLinksAsSource()
            ->where('is_automatic', true)
            ->where('created_at', '>', now()->subDay())
            ->exists();
    }
}
