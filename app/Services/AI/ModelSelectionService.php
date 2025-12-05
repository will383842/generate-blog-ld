<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Log;

class ModelSelectionService
{
    // =========================================================================
    // MODEL PRICING (Décembre 2025)
    // =========================================================================

    private const PRICING = [
        'gpt-4' => [
            'input' => 0.03,   // $0.03 per 1K input tokens
            'output' => 0.06,  // $0.06 per 1K output tokens
        ],
        'gpt-4o' => [
            'input' => 0.0025,   // $0.0025 per 1K input tokens (nouveau pricing)
            'output' => 0.01,    // $0.01 per 1K output tokens
        ],
        'gpt-4o-mini' => [
            'input' => 0.00015,  // $0.00015 per 1K input tokens
            'output' => 0.0006,  // $0.0006 per 1K output tokens
        ],
    ];

    // =========================================================================
    // MODEL SELECTION
    // =========================================================================

    /**
     * Select optimal model based on task type and context
     */
    public function selectOptimalModel(
        string $taskType, 
        ?int $wordCount = null,
        ?string $contentType = null
    ): string {
        return match($taskType) {
            // Articles standards (800-1500 mots)
            'article', 
            'article_generation' => $this->selectForArticle($wordCount),
            
            // Piliers (3000-9000 mots) - Qualité maximale requise
            'pillar', 
            'pillar_generation',
            'deep_research' => 'gpt-4',
            
            // Traductions - Mini largement suffisant
            'translation' => 'gpt-4o-mini',
            
            // Meta descriptions (courts)
            'meta',
            'meta_description',
            'meta_title' => 'gpt-4o-mini',
            
            // FAQs simples
            'faq',
            'faq_generation' => 'gpt-4o-mini',
            
            // Communiqués de presse
            'press_release' => 'gpt-4o',
            
            // Dossiers de presse (long format)
            'press_dossier' => 'gpt-4',
            
            // Image prompts (DALL-E)
            'image_prompt' => 'gpt-4o-mini',
            
            // Research / Fact-checking
            'research',
            'fact_checking' => 'gpt-4o',
            
            // Landing pages
            'landing_page' => 'gpt-4o',
            
            // Comparative content
            'comparative' => 'gpt-4o',
            
            // Default: GPT-4o (bon compromis)
            default => 'gpt-4o',
        };
    }

    /**
     * Select model for article based on word count
     */
    private function selectForArticle(?int $wordCount): string
    {
        if ($wordCount === null) {
            return 'gpt-4o'; // Default
        }

        // Articles très longs (>2500 mots) → GPT-4 pour qualité
        if ($wordCount > 2500) {
            return 'gpt-4';
        }

        // Articles courts (<500 mots) → Mini suffisant
        if ($wordCount < 500) {
            return 'gpt-4o-mini';
        }

        // Articles standards (500-2500) → GPT-4o (meilleur rapport qualité/prix)
        return 'gpt-4o';
    }

    // =========================================================================
    // COST ESTIMATION
    // =========================================================================

    /**
     * Estimate cost BEFORE making API call
     */
    public function estimateCost(
        string $model, 
        int $inputTokens, 
        int $outputTokens
    ): float {
        $pricing = self::PRICING[$model] ?? self::PRICING['gpt-4o'];
        
        $inputCost = ($inputTokens / 1000) * $pricing['input'];
        $outputCost = ($outputTokens / 1000) * $pricing['output'];
        
        return round($inputCost + $outputCost, 6);
    }

    /**
     * Estimate tokens from text (rough approximation)
     */
    public function estimateTokens(string $text): int
    {
        // Rule of thumb: 1 token ≈ 4 characters for English
        // For other languages, slightly less efficient
        return (int) ceil(strlen($text) / 4);
    }

    /**
     * Get model pricing information
     */
    public function getModelPricing(string $model): array
    {
        return self::PRICING[$model] ?? self::PRICING['gpt-4o'];
    }

    /**
     * Get all available models with pricing
     */
    public function getAllModels(): array
    {
        return [
            'gpt-4' => [
                'name' => 'GPT-4',
                'description' => 'Qualité maximale, idéal pour piliers et contenus complexes',
                'pricing' => self::PRICING['gpt-4'],
                'use_cases' => ['pillar', 'press_dossier', 'complex_research'],
            ],
            'gpt-4o' => [
                'name' => 'GPT-4o',
                'description' => 'Meilleur rapport qualité/prix, idéal pour articles standards',
                'pricing' => self::PRICING['gpt-4o'],
                'use_cases' => ['article', 'press_release', 'landing_page', 'comparative'],
            ],
            'gpt-4o-mini' => [
                'name' => 'GPT-4o Mini',
                'description' => 'Économique, idéal pour traductions et contenus courts',
                'pricing' => self::PRICING['gpt-4o-mini'],
                'use_cases' => ['translation', 'meta', 'faq', 'image_prompt'],
            ],
        ];
    }

    // =========================================================================
    // COST COMPARISON
    // =========================================================================

    /**
     * Compare costs between models for same task
     */
    public function compareCosts(
        int $inputTokens, 
        int $outputTokens
    ): array {
        $comparison = [];

        foreach (self::PRICING as $model => $pricing) {
            $cost = $this->estimateCost($model, $inputTokens, $outputTokens);
            $comparison[$model] = [
                'cost' => $cost,
                'cost_formatted' => '$' . number_format($cost, 4),
            ];
        }

        // Add savings calculation vs GPT-4
        $gpt4Cost = $comparison['gpt-4']['cost'];
        foreach ($comparison as $model => $data) {
            if ($model !== 'gpt-4') {
                $savings = $gpt4Cost - $data['cost'];
                $savingsPercent = ($savings / $gpt4Cost) * 100;
                $comparison[$model]['savings_vs_gpt4'] = round($savings, 4);
                $comparison[$model]['savings_percent'] = round($savingsPercent, 1);
            }
        }

        return $comparison;
    }

    /**
     * Calculate monthly savings with smart model selection
     */
    public function calculateMonthlySavings(array $monthlyUsage): array
    {
        // Exemple:
        // $monthlyUsage = [
        //     'articles' => 800,
        //     'pillars' => 270,
        //     'translations' => 2400,
        //     'meta' => 1600,
        // ];

        $costAllGpt4 = 0;
        $costOptimized = 0;

        // Estimation tokens moyens par type
        $avgTokens = [
            'articles' => ['input' => 2000, 'output' => 1500],
            'pillars' => ['input' => 5000, 'output' => 10000],
            'translations' => ['input' => 1500, 'output' => 1500],
            'meta' => ['input' => 200, 'output' => 50],
        ];

        foreach ($monthlyUsage as $type => $count) {
            $tokens = $avgTokens[$type] ?? ['input' => 1000, 'output' => 1000];
            
            // Cost if using GPT-4 for everything
            $costAllGpt4 += $this->estimateCost(
                'gpt-4', 
                $tokens['input'], 
                $tokens['output']
            ) * $count;

            // Cost with optimized model selection
            $optimalModel = $this->selectOptimalModel($type);
            $costOptimized += $this->estimateCost(
                $optimalModel,
                $tokens['input'],
                $tokens['output']
            ) * $count;
        }

        $savings = $costAllGpt4 - $costOptimized;
        $savingsPercent = ($savings / $costAllGpt4) * 100;

        return [
            'cost_all_gpt4' => round($costAllGpt4, 2),
            'cost_optimized' => round($costOptimized, 2),
            'monthly_savings' => round($savings, 2),
            'savings_percent' => round($savingsPercent, 1),
            'yearly_savings' => round($savings * 12, 2),
        ];
    }

    // =========================================================================
    // LOGGING & MONITORING
    // =========================================================================

    /**
     * Log model selection decision
     */
    public function logSelection(
        string $taskType, 
        string $selectedModel, 
        ?array $context = []
    ): void {
        Log::info('Model selected', [
            'task_type' => $taskType,
            'model' => $selectedModel,
            'context' => $context,
            'pricing' => $this->getModelPricing($selectedModel),
        ]);
    }
}
