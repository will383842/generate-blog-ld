<?php

namespace App\Services\Quality;

use App\Models\Article;
use Illuminate\Support\Facades\Log;

/**
 * QualityChecker - Basic quality checks for generated content
 *
 * This service provides quick quality validation during content generation.
 * For full quality analysis, use ContentQualityEnforcer instead.
 */
class QualityChecker
{
    /**
     * Minimum quality score to pass validation
     */
    protected int $minimumScore = 60;

    /**
     * Quick quality check for generated content
     *
     * @param string $content The content to check
     * @param array $options Additional options (language, type, etc.)
     * @return array Quality check result with score and issues
     */
    public function check(string $content, array $options = []): array
    {
        $issues = [];
        $score = 100;

        // Word count check
        $wordCount = str_word_count(strip_tags($content));
        if ($wordCount < 300) {
            $issues[] = "Content too short: {$wordCount} words (minimum 300)";
            $score -= 20;
        } elseif ($wordCount < 500) {
            $issues[] = "Content below recommended length: {$wordCount} words";
            $score -= 10;
        }

        // Basic structure checks
        $h2Count = substr_count($content, '<h2');
        if ($h2Count < 2) {
            $issues[] = "Not enough H2 sections: {$h2Count} (minimum 2)";
            $score -= 15;
        }

        // Check for empty content
        $plainText = trim(strip_tags($content));
        if (empty($plainText)) {
            $issues[] = "Content is empty";
            $score = 0;
        }

        // Check for placeholder text
        $placeholders = ['lorem ipsum', '[placeholder]', '{content}', '{{', '}}'];
        foreach ($placeholders as $placeholder) {
            if (stripos($content, $placeholder) !== false) {
                $issues[] = "Contains placeholder text: {$placeholder}";
                $score -= 25;
            }
        }

        // Ensure score doesn't go below 0
        $score = max(0, $score);

        return [
            'score' => $score,
            'passed' => $score >= $this->minimumScore,
            'issues' => $issues,
            'word_count' => $wordCount,
            'h2_count' => $h2Count,
        ];
    }

    /**
     * Validate article meets minimum quality requirements
     *
     * @param Article $article The article to validate
     * @return array Validation result
     */
    public function validateArticle(Article $article): array
    {
        $result = $this->check($article->content ?? '', [
            'language' => $article->language_code,
            'type' => $article->type,
        ]);

        // Additional article-specific checks
        if (empty($article->title)) {
            $result['issues'][] = "Article missing title";
            $result['score'] = max(0, $result['score'] - 10);
        }

        if (empty($article->meta_title)) {
            $result['issues'][] = "Article missing meta title";
            $result['score'] = max(0, $result['score'] - 5);
        }

        if (empty($article->meta_description)) {
            $result['issues'][] = "Article missing meta description";
            $result['score'] = max(0, $result['score'] - 5);
        }

        $result['passed'] = $result['score'] >= $this->minimumScore;

        Log::debug('QualityChecker: Article validation', [
            'article_id' => $article->id,
            'score' => $result['score'],
            'passed' => $result['passed'],
            'issues_count' => count($result['issues']),
        ]);

        return $result;
    }

    /**
     * Quick check if content meets minimum requirements
     *
     * @param string $content
     * @return bool
     */
    public function meetsMinimumRequirements(string $content): bool
    {
        $result = $this->check($content);
        return $result['passed'];
    }

    /**
     * Get quality score for content
     *
     * @param string $content
     * @return int Score from 0 to 100
     */
    public function getScore(string $content): int
    {
        $result = $this->check($content);
        return $result['score'];
    }

    /**
     * Set minimum score threshold
     *
     * @param int $score
     * @return self
     */
    public function setMinimumScore(int $score): self
    {
        $this->minimumScore = max(0, min(100, $score));
        return $this;
    }

    /**
     * Check readability of content
     *
     * @param string $content
     * @param string $language
     * @return array
     */
    public function checkReadability(string $content, string $language = 'fr'): array
    {
        $plainText = strip_tags($content);

        // Sentence count
        $sentences = preg_split('/[.!?]+/', $plainText, -1, PREG_SPLIT_NO_EMPTY);
        $sentenceCount = count($sentences);

        // Word count
        $words = str_word_count($plainText, 1);
        $wordCount = count($words);

        if ($sentenceCount === 0 || $wordCount === 0) {
            return [
                'score' => 0,
                'avg_sentence_length' => 0,
                'level' => 'unknown',
            ];
        }

        $avgSentenceLength = $wordCount / $sentenceCount;

        // Simple readability score (inverse of sentence length)
        // Target: 15-20 words per sentence
        if ($avgSentenceLength <= 20) {
            $score = 100;
            $level = 'easy';
        } elseif ($avgSentenceLength <= 25) {
            $score = 80;
            $level = 'moderate';
        } elseif ($avgSentenceLength <= 30) {
            $score = 60;
            $level = 'difficult';
        } else {
            $score = 40;
            $level = 'very_difficult';
        }

        return [
            'score' => $score,
            'avg_sentence_length' => round($avgSentenceLength, 1),
            'sentence_count' => $sentenceCount,
            'word_count' => $wordCount,
            'level' => $level,
        ];
    }
}
