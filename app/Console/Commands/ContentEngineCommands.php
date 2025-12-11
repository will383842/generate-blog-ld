<?php

namespace App\Console\Commands;

use App\Models\TemplateVariable;
use App\Services\Content\BulkUpdateService;
use Illuminate\Console\Command;

class UpdateTemplateVariable extends Command
{
    protected $signature = 'content:update-variable 
                            {key : Variable key}
                            {value : New value}
                            {--no-bulk : Skip bulk update}';

    protected $description = 'Update a template variable and trigger bulk update';

    public function handle(BulkUpdateService $bulkUpdateService): int
    {
        $key = $this->argument('key');
        $newValue = $this->argument('value');

        $variable = TemplateVariable::where('key', $key)->first();

        if (!$variable) {
            $this->error("Variable {$key} not found");
            return 1;
        }

        $oldValue = $variable->value;

        $this->info("Updating {$key}: {$oldValue} → {$newValue}");

        if (!$this->option('no-bulk')) {
            // Preview affected articles
            $preview = $bulkUpdateService->previewAffectedArticles($key);
            $this->info("Articles affected: {$preview['total_affected']}");

            if ($preview['total_affected'] > 0 && !$this->confirm('Continue with bulk update?')) {
                $this->info('Cancelled');
                return 0;
            }
        }

        $variable->update(['value' => $newValue]);
        TemplateVariable::clearCache($key);

        $this->info("Variable updated successfully");

        if (!$this->option('no-bulk') && $oldValue !== $newValue) {
            $bulkUpdate = $bulkUpdateService->initiateBulkUpdate($key, $oldValue, $newValue);
            $this->info("Bulk update #{$bulkUpdate->id} initiated");
            $this->info("Processing {$bulkUpdate->articles_affected} articles...");
        }

        return 0;
    }
}

// ============================================================================

namespace App\Console\Commands;

use App\Models\GenerationRequest;
use App\Services\Content\BatchGenerationService;
use Illuminate\Console\Command;

class GenerateBatchContent extends Command
{
    protected $signature = 'content:generate-batch 
                            {request_id? : Generation request ID}
                            {--platforms=* : Platform IDs}
                            {--countries=* : Country IDs}
                            {--languages=* : Language codes}
                            {--category= : Category ID}
                            {--strategy=variations : Generation strategy (single|variations)}';

    protected $description = 'Generate batch content';

    public function handle(BatchGenerationService $batchService): int
    {
        if ($requestId = $this->argument('request_id')) {
            // Generate from existing request
            $request = GenerationRequest::findOrFail($requestId);
        } else {
            // Create new request from options
            if (empty($this->option('platforms')) || empty($this->option('countries')) || empty($this->option('languages'))) {
                $this->error('Missing required options: --platforms, --countries, --languages');
                return 1;
            }

            $request = GenerationRequest::create([
                'platform_ids' => $this->option('platforms'),
                'country_ids' => $this->option('countries'),
                'language_codes' => $this->option('languages'),
                'category_id' => $this->option('category'),
                'strategy' => $this->option('strategy'),
                'status' => 'pending'
            ]);
        }

        $this->info("Starting batch generation #{$request->id}");
        $this->info("Strategy: {$request->strategy}");

        $progressBar = $this->output->createProgressBar($request->articles_expected ?: 100);

        try {
            $articles = $batchService->generate($request);
            $progressBar->finish();
            $this->newLine(2);

            $this->info("✓ Generation complete!");
            $this->info("Generated {$request->articles_generated} articles");
            $this->info("Cost: {$request->total_cost}€");
            $this->info("Time: {$request->total_time_seconds}s");

            return 0;
        } catch (\Exception $e) {
            $progressBar->finish();
            $this->newLine(2);
            $this->error("Generation failed: " . $e->getMessage());
            return 1;
        }
    }
}

// ============================================================================

namespace App\Console\Commands;

use App\Models\BulkUpdateLog;
use App\Services\Content\BulkUpdateService;
use Illuminate\Console\Command;

class BulkUpdateStatus extends Command
{
    protected $signature = 'content:bulk-update-status 
                            {id? : Bulk update ID}
                            {--retry : Retry failed articles}';

    protected $description = 'Show bulk update status';

    public function handle(BulkUpdateService $bulkUpdateService): int
    {
        if ($id = $this->argument('id')) {
            $bulkUpdate = BulkUpdateLog::findOrFail($id);
            $this->showDetails($bulkUpdate, $bulkUpdateService);

            if ($this->option('retry') && $bulkUpdate->articles_failed > 0) {
                $count = $bulkUpdateService->retryFailed($bulkUpdate);
                $this->info("Retrying {$count} failed articles...");
            }
        } else {
            $this->showList();
        }

        return 0;
    }

    protected function showList(): void
    {
        $bulkUpdates = BulkUpdateLog::latest()->limit(10)->get();

        $headers = ['ID', 'Variable', 'Old → New', 'Status', 'Progress', 'Created'];
        $rows = $bulkUpdates->map(function($bu) {
            return [
                $bu->id,
                $bu->variable_key,
                "{$bu->old_value} → {$bu->new_value}",
                $bu->status,
                "{$bu->articles_updated}/{$bu->articles_affected}",
                $bu->created_at->diffForHumans()
            ];
        });

        $this->table($headers, $rows);
    }

    protected function showDetails(BulkUpdateLog $bulkUpdate, BulkUpdateService $service): void
    {
        $stats = $service->getUpdateStats($bulkUpdate);

        $this->info("Bulk Update #{$bulkUpdate->id}");
        $this->info("Variable: {$bulkUpdate->variable_key}");
        $this->info("Change: {$bulkUpdate->old_value} → {$bulkUpdate->new_value}");
        $this->info("Status: {$bulkUpdate->status}");
        $this->newLine();

        $this->info("Progress: {$stats['progress_percent']}%");
        $this->info("Articles affected: {$bulkUpdate->articles_affected}");
        $this->info("Updated: {$bulkUpdate->articles_updated}");
        $this->info("Failed: {$bulkUpdate->articles_failed}");
        $this->info("Pending: {$stats['articles_pending']}");
        $this->newLine();

        if ($bulkUpdate->started_at) {
            $this->info("Started: {$bulkUpdate->started_at}");
        }
        if ($bulkUpdate->completed_at) {
            $this->info("Completed: {$bulkUpdate->completed_at}");
            $this->info("Duration: {$stats['duration_seconds']}s");
        }

        if (!empty($stats['failed_details'])) {
            $this->newLine();
            $this->error("Failed articles:");
            foreach ($stats['failed_details'] as $detail) {
                $this->line("  - Article #{$detail['article_id']}: {$detail['error']}");
            }
        }
    }
}

// ============================================================================

namespace App\Console\Commands;

use App\Models\TemplateVariable;
use App\Services\Template\VariableReplacementService;
use Illuminate\Console\Command;

class TestVariableReplacement extends Command
{
    protected $signature = 'content:test-variables 
                            {--content= : Test content with variables}';

    protected $description = 'Test variable replacement';

    public function handle(VariableReplacementService $replacer): int
    {
        $content = $this->option('content') ?: 
            "Commission: {{COMMISSION_RATE}}% sur {{PLATFORM_NAME_ULIXAI}}. Email: {{SUPPORT_EMAIL_ULIXAI}}";

        $this->info("Original content:");
        $this->line($content);
        $this->newLine();

        // Validation
        $validation = $replacer->validate($content);
        
        $this->info("Variables used:");
        foreach ($validation['used_variables'] as $var) {
            $value = TemplateVariable::getValue($var);
            $status = $value ? '✓' : '✗';
            $this->line("  {$status} {$var}: " . ($value ?: 'MISSING'));
        }
        $this->newLine();

        if (!$validation['valid']) {
            $this->error("Missing variables: " . implode(', ', $validation['missing_variables']));
            return 1;
        }

        // Replacement
        $replaced = $replacer->replace($content);
        
        $this->info("Replaced content:");
        $this->line($replaced);
        $this->newLine();

        $log = $replacer->getReplacementLog();
        $this->info("Replacements made:");
        foreach ($log as $key => $count) {
            $this->line("  {$key}: {$count} time(s)");
        }

        return 0;
    }
}

// ============================================================================

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class ClearContentCache extends Command
{
    protected $signature = 'content:clear-cache 
                            {--type= : Cache type (variables|all)}';

    protected $description = 'Clear content engine cache';

    public function handle(): int
    {
        $type = $this->option('type') ?: 'all';

        switch ($type) {
            case 'variables':
                Cache::forget('template_variables.all');
                TemplateVariable::all()->each(fn($v) => Cache::forget("template_variable.{$v->key}"));
                $this->info('Variables cache cleared');
                break;
            
            case 'all':
                Cache::tags(['content-engine'])->flush();
                $this->info('All content cache cleared');
                break;
            
            default:
                $this->error('Invalid cache type');
                return 1;
        }

        return 0;
    }
}
