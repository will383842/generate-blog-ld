<?php

namespace App\Services\AI;

use App\Models\PromptCache;
use Illuminate\Support\Facades\Log;

class PromptOptimizerService
{
    // =========================================================================
    // PROMPT OPTIMIZATION
    // =========================================================================

    /**
     * Optimize prompt to reduce token usage without losing meaning
     */
    public function optimizePrompt(string $prompt): string
    {
        $optimized = $prompt;

        // 1. Remove excessive whitespace
        $optimized = preg_replace('/\s+/', ' ', $optimized);
        $optimized = trim($optimized);

        // 2. Simplify verbose phrases
        $replacements = [
            'Tu dois absolument' => 'Impératif :',
            'Il est très important de' => 'Important :',
            'S\'il te plaît' => 'SVP',
            'Je voudrais que tu' => '',
            'Peux-tu' => '',
            'Est-ce que tu peux' => '',
            'N\'oublie pas de' => 'Ne pas oublier :',
            'Fais attention à' => 'Attention :',
            'Note importante :' => 'Note :',
            'Remarque importante :' => 'Remarque :',
        ];

        foreach ($replacements as $verbose => $concise) {
            $optimized = str_ireplace($verbose, $concise, $optimized);
        }

        // 3. Remove redundant articles when possible
        // (Conservative approach - only in lists)
        $optimized = preg_replace('/:\s*\n\s*-\s*le\s+/i', ':\n- ', $optimized);
        $optimized = preg_replace('/:\s*\n\s*-\s*la\s+/i', ':\n- ', $optimized);
        $optimized = preg_replace('/:\s*\n\s*-\s*les\s+/i', ':\n- ', $optimized);

        // 4. Compact bullet points
        $optimized = str_replace("\n\n-", "\n-", $optimized);

        // 5. Remove duplicate spaces after optimization
        $optimized = preg_replace('/\s+/', ' ', $optimized);
        $optimized = preg_replace('/\s*\n\s*/', "\n", $optimized);

        return trim($optimized);
    }

    /**
     * Compress instructions while preserving meaning
     */
    public function compressInstructions(array $instructions): string
    {
        $compressed = [];

        foreach ($instructions as $key => $instruction) {
            // Remove numbering if present
            $instruction = preg_replace('/^\d+\.\s*/', '', $instruction);
            
            // Shorten common instruction patterns
            $instruction = str_replace([
                'Tu dois générer',
                'Tu dois créer',
                'Tu dois écrire',
            ], 'Générer', $instruction);

            $compressed[] = '- ' . trim($instruction);
        }

        return implode("\n", $compressed);
    }

    /**
     * Estimate token count for text (approximation)
     */
    public function estimateTokens(string $text): int
    {
        // Rule of thumb: 1 token ≈ 4 characters
        return (int) ceil(strlen($text) / 4);
    }

    /**
     * Compare original vs optimized prompt
     */
    public function comparePrompts(string $original, string $optimized): array
    {
        $originalTokens = $this->estimateTokens($original);
        $optimizedTokens = $this->estimateTokens($optimized);
        $tokensSaved = $originalTokens - $optimizedTokens;
        $percentSaved = $originalTokens > 0 
            ? round(($tokensSaved / $originalTokens) * 100, 1) 
            : 0;

        // Estimate cost savings (using GPT-4 pricing as baseline)
        $inputPricePerToken = 0.00003; // $0.03 per 1K tokens
        $costSaved = $tokensSaved * $inputPricePerToken;

        return [
            'original_tokens' => $originalTokens,
            'optimized_tokens' => $optimizedTokens,
            'tokens_saved' => $tokensSaved,
            'percent_saved' => $percentSaved,
            'cost_saved_per_call' => round($costSaved, 6),
            'original_length' => strlen($original),
            'optimized_length' => strlen($optimized),
        ];
    }

    // =========================================================================
    // PROMPT CACHING (OpenAI Automatic)
    // =========================================================================

    /**
     * Track prompt for cache statistics
     * Note: OpenAI handles actual caching automatically
     */
    public function trackPrompt(string $prompt, string $type = null): void
    {
        try {
            PromptCache::trackPrompt($prompt, $type);
        } catch (\Exception $e) {
            Log::warning('Failed to track prompt cache', [
                'error' => $e->getMessage(),
                'prompt_preview' => substr($prompt, 0, 50),
            ]);
        }
    }

    /**
     * Get cache statistics
     */
    public function getCacheStats(): array
    {
        return PromptCache::getCacheStats();
    }

    /**
     * Get most reused prompts
     */
    public function getMostReusedPrompts(int $limit = 10): array
    {
        return PromptCache::getMostPopular($limit);
    }

    // =========================================================================
    // SMART PROMPT CONSTRUCTION
    // =========================================================================

    /**
     * Build optimized system prompt with consistent format
     */
    public function buildSystemPrompt(array $components): string
    {
        $parts = [];

        // Role
        if (isset($components['role'])) {
            $parts[] = "Rôle: {$components['role']}";
        }

        // Main instruction
        if (isset($components['instruction'])) {
            $parts[] = "\nTâche: {$components['instruction']}";
        }

        // Rules (optimized format)
        if (isset($components['rules']) && is_array($components['rules'])) {
            $parts[] = "\nRègles:";
            foreach ($components['rules'] as $rule) {
                $parts[] = "- {$rule}";
            }
        }

        // Format
        if (isset($components['format'])) {
            $parts[] = "\nFormat: {$components['format']}";
        }

        // Examples (if provided)
        if (isset($components['examples']) && is_array($components['examples'])) {
            $parts[] = "\nExemples:";
            foreach ($components['examples'] as $example) {
                $parts[] = "- {$example}";
            }
        }

        $prompt = implode("\n", $parts);
        
        // Apply optimization
        return $this->optimizePrompt($prompt);
    }

    /**
     * Extract reusable components from prompt for better caching
     */
    public function extractReusableComponents(string $prompt): array
    {
        // Separate variable parts from static instructions
        // This helps maximize cache hits

        $components = [
            'static' => '',
            'variable' => [],
        ];

        // Detect variable placeholders like {{variable}}, {variable}, [variable]
        preg_match_all('/\{\{([^}]+)\}\}|\{([^}]+)\}|\[([^\]]+)\]/', $prompt, $matches);
        
        if (!empty($matches[0])) {
            $components['variable'] = $matches[0];
            
            // Replace variables with placeholders
            $static = $prompt;
            foreach ($matches[0] as $variable) {
                $static = str_replace($variable, '[VAR]', $static);
            }
            $components['static'] = $static;
        } else {
            $components['static'] = $prompt;
        }

        return $components;
    }

    // =========================================================================
    // BATCH OPTIMIZATION
    // =========================================================================

    /**
     * Optimize multiple prompts at once
     */
    public function optimizeBatch(array $prompts): array
    {
        $results = [];

        foreach ($prompts as $key => $prompt) {
            $optimized = $this->optimizePrompt($prompt);
            $comparison = $this->comparePrompts($prompt, $optimized);
            
            $results[$key] = [
                'original' => $prompt,
                'optimized' => $optimized,
                'stats' => $comparison,
            ];
        }

        // Calculate total savings
        $totalTokensSaved = array_sum(array_column(array_column($results, 'stats'), 'tokens_saved'));
        $totalCostSaved = array_sum(array_column(array_column($results, 'stats'), 'cost_saved_per_call'));

        return [
            'prompts' => $results,
            'summary' => [
                'count' => count($prompts),
                'total_tokens_saved' => $totalTokensSaved,
                'total_cost_saved_per_batch' => round($totalCostSaved, 6),
            ],
        ];
    }

    /**
     * Analyze prompt efficiency
     */
    public function analyzePrompt(string $prompt): array
    {
        $tokens = $this->estimateTokens($prompt);
        $optimized = $this->optimizePrompt($prompt);
        $optimizedTokens = $this->estimateTokens($optimized);

        return [
            'original_tokens' => $tokens,
            'optimized_tokens' => $optimizedTokens,
            'efficiency_score' => $tokens > 0 ? round(($optimizedTokens / $tokens) * 100, 1) : 100,
            'is_optimized' => $tokens === $optimizedTokens,
            'potential_savings' => $tokens - $optimizedTokens,
            'recommendations' => $this->getOptimizationRecommendations($prompt),
        ];
    }

    /**
     * Get optimization recommendations
     */
    private function getOptimizationRecommendations(string $prompt): array
    {
        $recommendations = [];

        // Check for verbose patterns
        if (preg_match('/tu dois absolument|il est très important/i', $prompt)) {
            $recommendations[] = 'Utiliser langage plus concis (éviter "tu dois absolument")';
        }

        if (preg_match('/\n\n\n+/', $prompt)) {
            $recommendations[] = 'Réduire espaces vides excessifs';
        }

        if (str_word_count($prompt) > 1000) {
            $recommendations[] = 'Prompt très long (>1000 mots) - envisager découpage';
        }

        if (substr_count($prompt, 'Note :') > 3) {
            $recommendations[] = 'Trop de notes - regrouper informations similaires';
        }

        if (empty($recommendations)) {
            $recommendations[] = 'Prompt déjà bien optimisé';
        }

        return $recommendations;
    }
}
