<?php

namespace Database\Seeders;

use App\Models\ResearchSource;
use Illuminate\Database\Seeder;

class ResearchSourceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sources = [
            [
                'source_code' => 'perplexity_ai',
                'name' => 'Perplexity AI',
                'api_endpoint' => 'https://api.perplexity.ai/chat/completions',
                'rate_limit' => 100, // 100 requêtes par heure
                'cost_per_request' => 0.005, // $0.005 par requête
                'is_active' => true,
            ],
            [
                'source_code' => 'news_api',
                'name' => 'News API',
                'api_endpoint' => 'https://newsapi.org/v2/everything',
                'rate_limit' => 1000, // 1000 requêtes par heure (plan gratuit : 100/jour)
                'cost_per_request' => 0, // Gratuit (plan limité)
                'is_active' => true,
            ],
        ];

        foreach ($sources as $source) {
            ResearchSource::updateOrCreate(
                ['source_code' => $source['source_code']],
                $source
            );
        }

        $this->command->info('✅ Research sources seeded successfully!');
        $this->command->info('   - Perplexity AI: 100 req/h @ $0.005/req');
        $this->command->info('   - News API: 1000 req/h @ FREE (100/day limit)');
    }
}