<?php

namespace App\Console\Commands;

use App\Models\AuthorityDomain;
use App\Services\Linking\AuthorityDomainService;
use App\Services\Linking\GovernmentSiteResolver;
use Illuminate\Console\Command;

class DiscoverAuthorityDomains extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'links:discover-domains
                            {--type= : Filter by type (government, organization, reference, news, authority)}
                            {--country= : Filter by country code}
                            {--topic= : Filter by topic}
                            {--import= : Import from CSV file}
                            {--export= : Export to CSV file}
                            {--verify : Verify all domains are accessible}
                            {--recalculate : Recalculate all authority scores}
                            {--seed-governments : Seed government domains from resolver}
                            {--stats : Show statistics}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Manage authority domains for external linking';

    /**
     * Execute the console command.
     */
    public function handle(
        AuthorityDomainService $domainService,
        GovernmentSiteResolver $govResolver
    ): int {
        // Stats
        if ($this->option('stats')) {
            return $this->showStats($domainService);
        }

        // Import
        if ($importPath = $this->option('import')) {
            return $this->importDomains($domainService, $importPath);
        }

        // Export
        if ($exportPath = $this->option('export')) {
            return $this->exportDomains($domainService, $exportPath);
        }

        // Seed governments
        if ($this->option('seed-governments')) {
            return $this->seedGovernments($govResolver);
        }

        // Verify
        if ($this->option('verify')) {
            return $this->verifyDomains($domainService);
        }

        // Recalculate
        if ($this->option('recalculate')) {
            return $this->recalculateScores($domainService);
        }

        // Default: List domains
        return $this->listDomains();
    }

    /**
     * Show statistics
     */
    protected function showStats(AuthorityDomainService $service): int
    {
        $stats = $service->getStatistics();

        $this->info('📊 Authority Domains Statistics');
        $this->newLine();

        $this->table(
            ['Metric', 'Value'],
            [
                ['Total Domains', $stats['total']],
                ['Active Domains', $stats['active']],
                ['Auto-Discovered', $stats['auto_discovered']],
                ['Average Authority', $stats['average_authority']],
            ]
        );

        $this->newLine();
        $this->info('By Type:');
        foreach ($stats['by_type'] as $type => $count) {
            $this->line("  {$type}: {$count}");
        }

        $this->newLine();
        $this->info('Top Countries:');
        $i = 0;
        foreach ($stats['by_country'] as $country => $count) {
            if ($i++ >= 10) break;
            $this->line("  {$country}: {$count}");
        }

        return Command::SUCCESS;
    }

    /**
     * Import domains from CSV
     */
    protected function importDomains(AuthorityDomainService $service, string $path): int
    {
        $this->info("📥 Importing domains from: {$path}");

        if (!file_exists($path)) {
            $this->error("File not found: {$path}");
            return Command::FAILURE;
        }

        $result = $service->importFromCsv($path);

        $this->info("✅ Import completed");
        $this->line("  Created: {$result['created']}");
        $this->line("  Updated: {$result['updated']}");

        if (!empty($result['errors'])) {
            $this->warn("  Errors: " . count($result['errors']));
            foreach (array_slice($result['errors'], 0, 5) as $error) {
                $this->line("    - {$error}");
            }
        }

        return Command::SUCCESS;
    }

    /**
     * Export domains to CSV
     */
    protected function exportDomains(AuthorityDomainService $service, string $path): int
    {
        $this->info("📤 Exporting domains to: {$path}");

        $count = $service->exportToCsv($path);

        $this->info("✅ Exported {$count} domains");

        return Command::SUCCESS;
    }

    /**
     * Seed government domains
     */
    protected function seedGovernments(GovernmentSiteResolver $resolver): int
    {
        $this->info("🏛️ Seeding government domains...");
        $this->newLine();

        $countries = $resolver->getConfiguredCountries();
        $progressBar = $this->output->createProgressBar(count($countries));
        $progressBar->start();

        $created = 0;
        $updated = 0;

        foreach ($countries as $countryCode) {
            $sites = $resolver->resolveAll($countryCode);

            foreach ($sites as $theme => $site) {
                $domain = parse_url($site['url'], PHP_URL_HOST);
                if (!$domain) continue;

                $domain = preg_replace('/^www\./', '', $domain);

                $existing = AuthorityDomain::where('domain', $domain)->first();

                if ($existing) {
                    $updated++;
                } else {
                    AuthorityDomain::create([
                        'domain' => $domain,
                        'name' => $site['name'],
                        'source_type' => 'government',
                        'country_code' => $countryCode,
                        'languages' => [$this->guessLanguage($countryCode)],
                        'topics' => [$theme],
                        'authority_score' => 95,
                        'is_active' => true,
                        'auto_discovered' => false,
                    ]);
                    $created++;
                }
            }

            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine(2);

        $this->info("✅ Seeding completed");
        $this->line("  Countries processed: " . count($countries));
        $this->line("  Domains created: {$created}");
        $this->line("  Domains updated: {$updated}");

        return Command::SUCCESS;
    }

    /**
     * Verify all domains
     */
    protected function verifyDomains(AuthorityDomainService $service): int
    {
        $this->info("🔍 Verifying domains...");
        $this->newLine();

        $domains = AuthorityDomain::active()->get();
        $progressBar = $this->output->createProgressBar($domains->count());
        $progressBar->start();

        $active = 0;
        $inactive = 0;

        foreach ($domains as $domain) {
            $isActive = $service->verifyDomainActive($domain);
            
            if ($isActive) {
                $active++;
            } else {
                $inactive++;
                $domain->update(['is_active' => false]);
            }

            $progressBar->advance();
            usleep(200000); // 200ms pause
        }

        $progressBar->finish();
        $this->newLine(2);

        $this->info("✅ Verification completed");
        $this->line("  Active: {$active}");
        $this->line("  Inactive: {$inactive}");

        return Command::SUCCESS;
    }

    /**
     * Recalculate authority scores
     */
    protected function recalculateScores(AuthorityDomainService $service): int
    {
        $this->info("📊 Recalculating authority scores...");

        $updated = $service->recalculateAllScores();

        $this->info("✅ Updated {$updated} domains");

        return Command::SUCCESS;
    }

    /**
     * List domains
     */
    protected function listDomains(): int
    {
        $query = AuthorityDomain::query();

        if ($type = $this->option('type')) {
            $query->byType($type);
        }

        if ($country = $this->option('country')) {
            $query->forCountry($country);
        }

        if ($topic = $this->option('topic')) {
            $query->byTopics([$topic]);
        }

        $domains = $query->orderByAuthority()->limit(50)->get();

        if ($domains->isEmpty()) {
            $this->warn('No domains found matching criteria');
            return Command::SUCCESS;
        }

        $rows = $domains->map(function ($domain) {
            return [
                $domain->domain,
                mb_substr($domain->name, 0, 30),
                $domain->source_type,
                $domain->country_code ?? '-',
                $domain->authority_score,
                $domain->is_active ? '✓' : '✗',
            ];
        })->toArray();

        $this->table(
            ['Domain', 'Name', 'Type', 'Country', 'Score', 'Active'],
            $rows
        );

        $this->line("Showing {$domains->count()} of " . $query->count() . " domains");

        return Command::SUCCESS;
    }

    /**
     * Guess primary language from country code
     */
    protected function guessLanguage(string $countryCode): string
    {
        $map = [
            'FR' => 'fr', 'DE' => 'de', 'ES' => 'es', 'IT' => 'it',
            'GB' => 'en', 'US' => 'en', 'CA' => 'en', 'AU' => 'en',
            'JP' => 'ja', 'CN' => 'zh', 'BR' => 'pt', 'RU' => 'ru',
            'SA' => 'ar', 'AE' => 'ar', 'IN' => 'hi', 'TH' => 'th',
        ];

        return $map[$countryCode] ?? 'en';
    }
}
