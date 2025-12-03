<?php

namespace App\Services\Quality;

use App\Models\Article;
use App\Models\Platform;
use App\Models\GoldenExample;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

/**
 * =============================================================================
 * PHASE 13 - FICHIER 8/14 : Golden Examples Service
 * =============================================================================
 * 
 * EMPLACEMENT : app/Services/Quality/GoldenExamplesService.php
 * 
 * DESCRIPTION : Gestion des exemples de haute qualité pour enrichissement prompts
 * Auto-marking articles score ≥90, enrichissement IA, export training
 * 
 * =============================================================================
 */

class GoldenExamplesService
{
    /**
     * Récupérer exemples pour contexte donné
     */
    public function getExamplesForContext(
        Platform $platform,
        string $contentType,
        string $lang,
        string $exampleType,
        ?string $category = null,
        int $limit = 5
    ): Collection {
        $query = GoldenExample::active()
            ->forPlatform($platform->id)
            ->forContentType($contentType)
            ->forLanguage($lang)
            ->forExampleType($exampleType)
            ->byQuality();
        
        if ($category) {
            $query->forCategory($category);
        }
        
        return $query->limit($limit)->get();
    }

    /**
     * Enrichir prompt avec exemples golden
     */
    public function enrichPromptWithExamples(
        string $basePrompt,
        Collection $examples
    ): string {
        if ($examples->count() === 0) {
            return $basePrompt;
        }
        
        $enrichedPrompt = $basePrompt . "\n\n";
        $enrichedPrompt .= "# 🏆 EXEMPLES D'EXCELLENTE QUALITÉ (score ≥90)\n\n";
        $enrichedPrompt .= "Voici des exemples d'intros/conclusions/sections excellentes issues d'articles ";
        $enrichedPrompt .= "précédents hautement notés. Inspire-toi du style, ton, structure (mais ne copie pas verbatim).\n\n";
        
        foreach ($examples as $index => $example) {
            $enrichedPrompt .= "## Exemple " . ($index + 1) . " : ";
            $enrichedPrompt .= ($example->category ?? 'Général');
            $enrichedPrompt .= " - Score " . number_format($example->quality_score, 1) . "%\n";
            $enrichedPrompt .= $example->excerpt . "\n\n";
            
            // Incrémenter compteur utilisation
            $example->incrementUsage();
        }
        
        $enrichedPrompt .= "---\n\n";
        
        Log::info('GoldenExamplesService: Prompt enrichi', [
            'examples_count' => $examples->count(),
            'avg_quality' => round($examples->avg('quality_score'), 2),
        ]);
        
        return $enrichedPrompt;
    }

    /**
     * Auto-marking articles score ≥90 (derniers X jours)
     */
    public function autoMarkGoldenExamples(int $days = 7): int
    {
        $articles = Article::where('quality_score', '>=', 90)
            ->where('created_at', '>=', now()->subDays($days))
            ->whereDoesntHave('goldenExamples') // Pas déjà marqués
            ->get();
        
        $markedCount = 0;
        
        foreach ($articles as $article) {
            try {
                $this->markArticleAsGolden($article);
                $markedCount++;
            } catch (\Exception $e) {
                Log::error('GoldenExamplesService: Erreur marking', [
                    'article_id' => $article->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
        
        Log::info('GoldenExamplesService: Auto-marking terminé', [
            'articles_processed' => $articles->count(),
            'examples_created' => $markedCount,
        ]);
        
        return $markedCount;
    }

    /**
     * Marquer article comme golden (extrait intro/conclusion/section)
     */
    protected function markArticleAsGolden(Article $article): void
    {
        $content = $article->content;
        $plainText = strip_tags($content);
        
        // INTRO
        $intro = mb_substr($plainText, 0, 300);
        if (mb_strlen($intro) >= 200) {
            GoldenExample::createFromArticle(
                $article,
                'intro',
                $intro,
                str_word_count($intro)
            );
        }
        
        // CONCLUSION
        $conclusion = mb_substr($plainText, -300);
        if (mb_strlen($conclusion) >= 200) {
            GoldenExample::createFromArticle(
                $article,
                'conclusion',
                $conclusion,
                str_word_count($conclusion)
            );
        }
        
        // MEILLEURE SECTION H2
        preg_match_all('/<h2[^>]*>(.*?)<\/h2>(.*?)(?=<h2|$)/s', $content, $sections, PREG_SET_ORDER);
        
        $longestSection = null;
        $maxLength = 0;
        
        foreach ($sections as $section) {
            $sectionText = strip_tags($section[2]);
            $length = mb_strlen($sectionText);
            if ($length > $maxLength) {
                $maxLength = $length;
                $longestSection = $sectionText;
            }
        }
        
        if ($longestSection && mb_strlen($longestSection) >= 200) {
            GoldenExample::createFromArticle(
                $article,
                'section',
                mb_substr($longestSection, 0, 500),
                str_word_count($longestSection)
            );
        }
    }

    /**
     * Export pour fine-tuning OpenAI (format JSONL)
     */
    public function exportForTraining(string $format = 'jsonl'): string
    {
        $examples = GoldenExample::active()
            ->where('quality_score', '>=', 92) // Top qualité seulement
            ->orderBy('quality_score', 'desc')
            ->limit(1000) // Max 1000 pour training
            ->get();
        
        $filename = storage_path('app/exports/golden_examples_' . now()->format('Y-m-d') . '.jsonl');
        
        $handle = fopen($filename, 'w');
        
        foreach ($examples as $example) {
            $prompt = "Écris un(e) {$example->example_type} de haute qualité pour un article sur {$example->category}";
            $completion = $example->excerpt;
            
            $line = json_encode([
                'prompt' => $prompt,
                'completion' => $completion,
                'metadata' => [
                    'quality_score' => $example->quality_score,
                    'language' => $example->language_code,
                    'platform' => $example->platform->slug,
                ],
            ]) . "\n";
            
            fwrite($handle, $line);
        }
        
        fclose($handle);
        
        Log::info('GoldenExamplesService: Export training créé', [
            'filename' => $filename,
            'examples_count' => $examples->count(),
        ]);
        
        return $filename;
    }

    /**
     * Archiver exemples obsolètes (>90 jours, <5 utilisations)
     */
    public function archiveOldExamples(int $days = 90, int $maxUsage = 5): int
    {
        $archived = GoldenExample::where('created_at', '<', now()->subDays($days))
            ->where('times_used', '<', $maxUsage)
            ->delete(); // Soft delete
        
        Log::info('GoldenExamplesService: Archivage terminé', [
            'archived_count' => $archived,
        ]);
        
        return $archived;
    }

    /**
     * Statistiques utilisation
     */
    public function getUsageStats(int $days = 30): array
    {
        $examples = GoldenExample::active()
            ->where('created_at', '>=', now()->subDays($days))
            ->get();
        
        return [
            'total_examples' => $examples->count(),
            'total_usage' => $examples->sum('times_used'),
            'avg_usage_per_example' => round($examples->avg('times_used'), 2),
            'by_type' => $examples->groupBy('example_type')->map(function($group) {
                return [
                    'count' => $group->count(),
                    'avg_quality' => round($group->avg('quality_score'), 2),
                    'total_usage' => $group->sum('times_used'),
                ];
            })->toArray(),
            'top_10_used' => GoldenExample::getTopUsed(10)->map(function($ex) {
                return [
                    'id' => $ex->id,
                    'type' => $ex->example_type,
                    'category' => $ex->category,
                    'quality_score' => $ex->quality_score,
                    'times_used' => $ex->times_used,
                ];
            })->toArray(),
        ];
    }

    /**
     * Mesurer impact golden examples
     */
    public function measureImpact(int $days = 30): array
    {
        // Articles générés AVEC golden examples
        $withExamples = Article::where('created_at', '>=', now()->subDays($days))
            ->whereJsonContains('generation_metadata->used_golden_examples', true)
            ->avg('quality_score');
        
        // Articles générés SANS golden examples
        $withoutExamples = Article::where('created_at', '>=', now()->subDays($days))
            ->whereJsonDoesntContain('generation_metadata->used_golden_examples', true)
            ->avg('quality_score');
        
        $improvement = round($withExamples - $withoutExamples, 2);
        
        return [
            'with_examples' => round($withExamples, 2),
            'without_examples' => round($withoutExamples, 2),
            'improvement' => $improvement,
            'improvement_percent' => round(($improvement / $withoutExamples) * 100, 2),
        ];
    }
}