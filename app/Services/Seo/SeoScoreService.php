<?php

namespace App\Services\Seo;

use App\Models\Article;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

/**
 * Service d'analyse et scoring SEO des articles
 * Calcule un score 0-100 et fournit des suggestions d'amélioration
 */
class SeoScoreService
{
    // Poids des critères (total = 100)
    const WEIGHT_TITLE = 15;
    const WEIGHT_META_DESC = 10;
    const WEIGHT_CONTENT_LENGTH = 15;
    const WEIGHT_HEADINGS = 10;
    const WEIGHT_KEYWORDS = 15;
    const WEIGHT_INTERNAL_LINKS = 10;
    const WEIGHT_IMAGES = 10;
    const WEIGHT_READABILITY = 15;

    // Seuils
    const MIN_WORDS = 300;
    const OPTIMAL_WORDS_MIN = 1000;
    const OPTIMAL_WORDS_MAX = 2500;
    const KEYWORD_DENSITY_MIN = 0.5; // %
    const KEYWORD_DENSITY_MAX = 2.5; // %
    const MIN_IMAGES = 1;
    const MIN_INTERNAL_LINKS = 2;

    // =========================================================================
    // SCORING PRINCIPAL
    // =========================================================================

    /**
     * Calcule le score SEO complet d'un article
     * 
     * @param Article $article Article à analyser
     * @return array Score + détails + suggestions
     */
    public function calculateScore(Article $article): array
    {
        $scores = [
            'title' => $this->scoreTitleTag($article),
            'meta_description' => $this->scoreMetaDescription($article),
            'content_length' => $this->scoreContentLength($article),
            'headings' => $this->scoreHeadings($article),
            'keywords' => $this->scoreKeywords($article),
            'internal_links' => $this->scoreInternalLinks($article),
            'images' => $this->scoreImages($article),
            'readability' => $this->scoreReadability($article),
        ];

        // Score total pondéré
        $totalScore = 
            ($scores['title']['score'] * self::WEIGHT_TITLE / 100) +
            ($scores['meta_description']['score'] * self::WEIGHT_META_DESC / 100) +
            ($scores['content_length']['score'] * self::WEIGHT_CONTENT_LENGTH / 100) +
            ($scores['headings']['score'] * self::WEIGHT_HEADINGS / 100) +
            ($scores['keywords']['score'] * self::WEIGHT_KEYWORDS / 100) +
            ($scores['internal_links']['score'] * self::WEIGHT_INTERNAL_LINKS / 100) +
            ($scores['images']['score'] * self::WEIGHT_IMAGES / 100) +
            ($scores['readability']['score'] * self::WEIGHT_READABILITY / 100);

        $totalScore = round($totalScore);

        // Grade
        $grade = $this->getGrade($totalScore);

        // Suggestions d'amélioration
        $suggestions = $this->generateSuggestions($scores);

        return [
            'total_score' => $totalScore,
            'grade' => $grade,
            'details' => $scores,
            'suggestions' => $suggestions,
            'article_id' => $article->id,
            'analyzed_at' => now()->toIso8601String(),
        ];
    }

    // =========================================================================
    // SCORING PAR CRITÈRE
    // =========================================================================

    /**
     * Score du title tag
     */
    protected function scoreTitleTag(Article $article): array
    {
        $title = $article->meta_title ?? $article->title;
        $length = mb_strlen($title);

        $score = 0;
        $issues = [];

        // Longueur optimale (50-60 caractères)
        if ($length >= 50 && $length <= 60) {
            $score = 100;
        } elseif ($length >= 40 && $length < 50) {
            $score = 80;
            $issues[] = "Titre un peu court ({$length} caractères). Idéal : 50-60.";
        } elseif ($length > 60 && $length <= 70) {
            $score = 70;
            $issues[] = "Titre un peu long ({$length} caractères). Risque de troncature Google.";
        } elseif ($length < 40) {
            $score = 50;
            $issues[] = "Titre trop court ({$length} caractères). Minimum recommandé : 40.";
        } else {
            $score = 40;
            $issues[] = "Titre trop long ({$length} caractères). Sera tronqué par Google.";
        }

        // Vérification du mot-clé principal dans le titre
        $mainKeyword = $this->extractMainKeyword($article);
        $keywordCheck = $this->checkKeywordInTitle($title, $mainKeyword);

        if (!$keywordCheck['present']) {
            $score = max(0, $score - 20);
            $issues[] = "Mot-clé principal '{$mainKeyword}' absent du titre.";
        } elseif (!$keywordCheck['at_start']) {
            $score = max(0, $score - 10);
            $issues[] = "Mot-clé principal '{$mainKeyword}' présent mais pas au début du titre.";
        }

        return [
            'score' => $score,
            'value' => $title,
            'length' => $length,
            'main_keyword' => $mainKeyword,
            'keyword_in_title' => $keywordCheck['present'],
            'keyword_at_start' => $keywordCheck['at_start'],
            'issues' => $issues,
        ];
    }

    /**
     * Extraire le mot-clé principal d'un article
     * Utilise le meta title, theme ou les 3 premiers mots significatifs du titre
     *
     * @param Article $article
     * @return string
     */
    protected function extractMainKeyword(Article $article): string
    {
        // Priorité 1: Mot-clé SEO explicite (si défini dans metadata)
        $metadata = $article->metadata ?? [];
        if (!empty($metadata['seo_keyword'])) {
            return strtolower(trim($metadata['seo_keyword']));
        }

        // Priorité 2: Utiliser le nom du thème si disponible
        if ($article->theme && $article->theme->name) {
            return strtolower(trim($article->theme->name));
        }

        // Priorité 3: Extraire les mots significatifs du titre
        $title = $article->title;

        // Mots à ignorer (stop words français et anglais)
        $stopWords = [
            'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'à', 'au', 'aux',
            'et', 'ou', 'en', 'sur', 'pour', 'par', 'avec', 'sans', 'dans', 'ce',
            'cette', 'ces', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses',
            'the', 'a', 'an', 'and', 'or', 'in', 'on', 'for', 'with', 'without', 'to',
            'of', 'at', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been',
            'comment', 'how', 'why', 'what', 'when', 'where', 'which', 'who', 'whom',
            'quoi', 'qui', 'que', 'dont', 'où', 'quel', 'quelle', 'quels', 'quelles',
        ];

        // Extraire les mots et filtrer
        $words = preg_split('/[\s\-_:,;.!?]+/', strtolower($title), -1, PREG_SPLIT_NO_EMPTY);
        $significantWords = array_filter($words, function ($word) use ($stopWords) {
            return mb_strlen($word) > 2 && !in_array($word, $stopWords);
        });

        // Prendre les 2-3 premiers mots significatifs
        $keywordWords = array_slice(array_values($significantWords), 0, 3);

        return implode(' ', $keywordWords);
    }

    /**
     * Vérifier la présence du mot-clé dans le titre
     *
     * @param string $title
     * @param string $keyword
     * @return array ['present' => bool, 'at_start' => bool, 'position' => int|null]
     */
    protected function checkKeywordInTitle(string $title, string $keyword): array
    {
        $titleLower = strtolower($title);
        $keywordLower = strtolower($keyword);

        // Vérifier si le mot-clé est présent
        $position = mb_strpos($titleLower, $keywordLower);
        $present = $position !== false;

        // Vérifier si le mot-clé est au début (dans les 30 premiers caractères)
        $atStart = $present && $position <= 30;

        // Alternative: vérifier si les mots du keyword sont présents
        if (!$present) {
            $keywordWords = explode(' ', $keywordLower);
            $matchedWords = 0;

            foreach ($keywordWords as $word) {
                if (mb_strlen($word) > 2 && mb_strpos($titleLower, $word) !== false) {
                    $matchedWords++;
                }
            }

            // Si au moins 60% des mots sont présents, considérer comme partiellement présent
            if (count($keywordWords) > 0 && ($matchedWords / count($keywordWords)) >= 0.6) {
                $present = true;
                $atStart = false; // Pas exactement au début si c'est une correspondance partielle
            }
        }

        return [
            'present' => $present,
            'at_start' => $atStart,
            'position' => $position,
        ];
    }

    /**
     * Score de la meta description
     */
    protected function scoreMetaDescription(Article $article): array
    {
        $description = $article->meta_description ?? $article->excerpt;
        $length = mb_strlen($description);
        
        $score = 0;
        $issues = [];

        // Longueur optimale (150-160 caractères)
        if ($length >= 150 && $length <= 160) {
            $score = 100;
        } elseif ($length >= 120 && $length < 150) {
            $score = 80;
            $issues[] = "Description un peu courte ({$length} caractères). Idéal : 150-160.";
        } elseif ($length > 160 && $length <= 180) {
            $score = 70;
            $issues[] = "Description un peu longue ({$length} caractères). Risque de troncature.";
        } elseif ($length < 120) {
            $score = 50;
            $issues[] = "Description trop courte ({$length} caractères). Minimum : 120.";
        } else {
            $score = 40;
            $issues[] = "Description trop longue ({$length} caractères). Sera tronquée.";
        }

        return [
            'score' => $score,
            'value' => $description,
            'length' => $length,
            'issues' => $issues,
        ];
    }

    /**
     * Score de la longueur du contenu
     */
    protected function scoreContentLength(Article $article): array
    {
        $wordCount = $article->word_count;
        
        $score = 0;
        $issues = [];

        if ($wordCount >= self::OPTIMAL_WORDS_MIN && $wordCount <= self::OPTIMAL_WORDS_MAX) {
            $score = 100;
        } elseif ($wordCount >= self::MIN_WORDS && $wordCount < self::OPTIMAL_WORDS_MIN) {
            $score = 70;
            $issues[] = "Contenu acceptable ({$wordCount} mots) mais court. Idéal : 1000-2500 mots.";
        } elseif ($wordCount > self::OPTIMAL_WORDS_MAX) {
            $score = 80;
            $issues[] = "Contenu long ({$wordCount} mots). Bien mais attention à la lisibilité.";
        } else {
            $score = 30;
            $issues[] = "Contenu trop court ({$wordCount} mots). Minimum : 300 mots.";
        }

        return [
            'score' => $score,
            'word_count' => $wordCount,
            'issues' => $issues,
        ];
    }

    /**
     * Score de la structure des headings (H1, H2, H3)
     */
    protected function scoreHeadings(Article $article): array
    {
        $content = $article->content;
        
        // Comptage des headings
        $h1Count = substr_count($content, '<h1');
        $h2Count = substr_count($content, '<h2');
        $h3Count = substr_count($content, '<h3');
        
        $score = 0;
        $issues = [];

        // H1 : doit être 1 (unique)
        if ($h1Count === 1) {
            $score += 40;
        } elseif ($h1Count === 0) {
            $score += 0;
            $issues[] = "Aucun H1 détecté. Ajouter un H1 avec mot-clé principal.";
        } else {
            $score += 20;
            $issues[] = "Plusieurs H1 ({$h1Count}). Un seul H1 recommandé.";
        }

        // H2 : au moins 2-3
        if ($h2Count >= 2 && $h2Count <= 8) {
            $score += 40;
        } elseif ($h2Count === 1) {
            $score += 20;
            $issues[] = "Un seul H2. Ajouter plus de sous-sections (2-8 H2).";
        } elseif ($h2Count === 0) {
            $score += 0;
            $issues[] = "Aucun H2. Structurer le contenu avec des sous-titres.";
        } else {
            $score += 30;
            $issues[] = "Beaucoup de H2 ({$h2Count}). Attention à la sur-structuration.";
        }

        // H3 : présence bonus
        if ($h3Count > 0) {
            $score += 20;
        }

        return [
            'score' => min($score, 100),
            'h1_count' => $h1Count,
            'h2_count' => $h2Count,
            'h3_count' => $h3Count,
            'issues' => $issues,
        ];
    }

    /**
     * Score de la densité des mots-clés
     */
    protected function scoreKeywords(Article $article): array
    {
        $content = strip_tags($article->content);
        $wordCount = $article->word_count;
        
        // Extraction mot-clé principal (simplifiée : 3 premiers mots du titre)
        $mainKeyword = strtolower(Str::words($article->title, 3, ''));
        
        // Comptage occurrences
        $keywordCount = substr_count(strtolower($content), $mainKeyword);
        $density = $wordCount > 0 ? ($keywordCount / $wordCount) * 100 : 0;
        
        $score = 0;
        $issues = [];

        // Densité optimale : 0.5% - 2.5%
        if ($density >= self::KEYWORD_DENSITY_MIN && $density <= self::KEYWORD_DENSITY_MAX) {
            $score = 100;
        } elseif ($density > 0 && $density < self::KEYWORD_DENSITY_MIN) {
            $score = 60;
            $issues[] = "Densité mot-clé faible (" . round($density, 2) . "%). Idéal : 0.5-2.5%.";
        } elseif ($density > self::KEYWORD_DENSITY_MAX) {
            $score = 40;
            $issues[] = "Sur-optimisation (" . round($density, 2) . "%). Risque de keyword stuffing.";
        } else {
            $score = 20;
            $issues[] = "Mot-clé principal absent ou très rare.";
        }

        return [
            'score' => $score,
            'main_keyword' => $mainKeyword,
            'keyword_count' => $keywordCount,
            'density' => round($density, 2),
            'issues' => $issues,
        ];
    }

    /**
     * Score des liens internes
     */
    protected function scoreInternalLinks(Article $article): array
    {
        $linksCount = $article->internalLinks()->count();
        
        $score = 0;
        $issues = [];

        if ($linksCount >= 3 && $linksCount <= 10) {
            $score = 100;
        } elseif ($linksCount >= self::MIN_INTERNAL_LINKS) {
            $score = 70;
            $issues[] = "Quelques liens internes ({$linksCount}) mais pourrait être amélioré. Idéal : 3-10.";
        } elseif ($linksCount === 1) {
            $score = 40;
            $issues[] = "Un seul lien interne. Ajouter 2-3 liens vers autres articles.";
        } else {
            $score = 0;
            $issues[] = "Aucun lien interne. Ajouter 3-10 liens vers contenus connexes.";
        }

        return [
            'score' => $score,
            'internal_links_count' => $linksCount,
            'issues' => $issues,
        ];
    }

    /**
     * Score des images
     */
    protected function scoreImages(Article $article): array
    {
        $hasMainImage = !empty($article->image_url);
        $hasAltText = !empty($article->image_alt);
        
        // Extraction images du contenu
        preg_match_all('/<img[^>]+>/i', $article->content, $matches);
        $contentImagesCount = count($matches[0]);
        
        $totalImages = ($hasMainImage ? 1 : 0) + $contentImagesCount;
        
        $score = 0;
        $issues = [];

        // Image principale
        if ($hasMainImage) {
            $score += 40;
            
            if ($hasAltText) {
                $score += 30;
            } else {
                $issues[] = "Image principale sans alt text. Ajouter description.";
            }
        } else {
            $issues[] = "Aucune image principale. Ajouter une image d'en-tête.";
        }

        // Images dans contenu
        if ($contentImagesCount >= 2) {
            $score += 30;
        } elseif ($contentImagesCount === 1) {
            $score += 15;
        } else {
            $issues[] = "Pas d'images dans le contenu. Ajouter 2-3 images illustratives.";
        }

        return [
            'score' => min($score, 100),
            'main_image' => $hasMainImage,
            'has_alt_text' => $hasAltText,
            'content_images_count' => $contentImagesCount,
            'total_images' => $totalImages,
            'issues' => $issues,
        ];
    }

    /**
     * Score de lisibilité (Flesch Reading Ease adapté)
     */
    protected function scoreReadability(Article $article): array
    {
        $content = strip_tags($article->content);
        $sentences = preg_split('/[.!?]+/', $content, -1, PREG_SPLIT_NO_EMPTY);
        $sentenceCount = count($sentences);
        $wordCount = $article->word_count;
        
        $avgWordsPerSentence = $sentenceCount > 0 ? $wordCount / $sentenceCount : 0;
        
        $score = 0;
        $issues = [];

        // Phrases idéales : 15-20 mots
        if ($avgWordsPerSentence >= 15 && $avgWordsPerSentence <= 20) {
            $score = 100;
        } elseif ($avgWordsPerSentence < 15) {
            $score = 80;
            // Phrases courtes = bon pour web
        } elseif ($avgWordsPerSentence <= 25) {
            $score = 70;
            $issues[] = "Phrases un peu longues (" . round($avgWordsPerSentence, 1) . " mots/phrase). Idéal : 15-20.";
        } else {
            $score = 50;
            $issues[] = "Phrases trop longues (" . round($avgWordsPerSentence, 1) . " mots/phrase). Difficile à lire.";
        }

        return [
            'score' => $score,
            'avg_words_per_sentence' => round($avgWordsPerSentence, 1),
            'sentence_count' => $sentenceCount,
            'issues' => $issues,
        ];
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Détermine le grade selon le score
     */
    protected function getGrade(int $score): array
    {
        if ($score >= 90) {
            return ['label' => 'A+', 'color' => 'green', 'description' => 'Excellent'];
        } elseif ($score >= 80) {
            return ['label' => 'A', 'color' => 'green', 'description' => 'Très bon'];
        } elseif ($score >= 70) {
            return ['label' => 'B', 'color' => 'blue', 'description' => 'Bon'];
        } elseif ($score >= 60) {
            return ['label' => 'C', 'color' => 'yellow', 'description' => 'Correct'];
        } elseif ($score >= 50) {
            return ['label' => 'D', 'color' => 'orange', 'description' => 'Passable'];
        } else {
            return ['label' => 'F', 'color' => 'red', 'description' => 'À améliorer'];
        }
    }

    /**
     * Génère des suggestions d'amélioration prioritaires
     */
    protected function generateSuggestions(array $scores): array
    {
        $suggestions = [];

        foreach ($scores as $criterion => $data) {
            if ($data['score'] < 70 && !empty($data['issues'])) {
                $priority = $data['score'] < 50 ? 'high' : 'medium';
                
                foreach ($data['issues'] as $issue) {
                    $suggestions[] = [
                        'criterion' => $criterion,
                        'priority' => $priority,
                        'message' => $issue,
                        'score' => $data['score'],
                    ];
                }
            }
        }

        // Tri par priorité et score
        usort($suggestions, function($a, $b) {
            if ($a['priority'] === 'high' && $b['priority'] !== 'high') return -1;
            if ($a['priority'] !== 'high' && $b['priority'] === 'high') return 1;
            return $a['score'] <=> $b['score'];
        });

        return array_slice($suggestions, 0, 5); // Top 5 suggestions
    }

    /**
     * Analyse rapide (score seulement, pas de détails)
     */
    public function quickScore(Article $article): int
    {
        $fullScore = $this->calculateScore($article);
        return $fullScore['total_score'];
    }
}