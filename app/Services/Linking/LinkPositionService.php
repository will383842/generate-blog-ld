<?php

namespace App\Services\Linking;

class LinkPositionService
{
    /**
     * Suggère une position pour un lien
     */
    public function suggestPosition(string $content, int $linkIndex, int $totalLinks): array
    {
        $structure = $this->analyzeContent($content);
        
        if (empty($structure['paragraphs'])) {
            return ['position' => 0, 'type' => 'body'];
        }

        // Calculer l'intervalle idéal
        $availableParagraphs = count($structure['paragraphs']);
        $step = max(1, floor($availableParagraphs / ($totalLinks + 1)));
        
        // Position cible pour ce lien
        $targetParagraphIndex = min(($linkIndex + 1) * $step, $availableParagraphs - 1);
        $paragraph = $structure['paragraphs'][$targetParagraphIndex] ?? $structure['paragraphs'][0];

        return [
            'position' => $paragraph['start'],
            'type' => $this->determinePositionType($targetParagraphIndex, $availableParagraphs),
            'paragraph_index' => $targetParagraphIndex
        ];
    }

    /**
     * Analyse la structure du contenu
     */
    public function analyzeContent(string $content): array
    {
        $structure = [
            'paragraphs' => [],
            'headings' => [],
            'lists' => [],
            'length' => strlen($content)
        ];

        // Trouver les paragraphes
        preg_match_all('/<p[^>]*>(.+?)<\/p>/is', $content, $matches, PREG_OFFSET_CAPTURE);
        
        foreach ($matches[0] as $index => $match) {
            $text = strip_tags($match[0]);
            $wordCount = str_word_count($text);
            
            $structure['paragraphs'][] = [
                'index' => $index,
                'start' => $match[1],
                'end' => $match[1] + strlen($match[0]),
                'word_count' => $wordCount,
                'has_link' => strpos($match[0], '<a ') !== false
            ];
        }

        // Trouver les headings
        preg_match_all('/<h([2-6])[^>]*>(.+?)<\/h\1>/is', $content, $headings, PREG_OFFSET_CAPTURE);
        
        foreach ($headings[0] as $index => $match) {
            $structure['headings'][] = [
                'level' => $headings[1][$index][0],
                'position' => $match[1],
                'text' => strip_tags($headings[2][$index][0])
            ];
        }

        return $structure;
    }

    /**
     * Détermine le type de position
     */
    protected function determinePositionType(int $index, int $total): string
    {
        $ratio = $total > 0 ? $index / $total : 0;

        if ($ratio < 0.2) {
            return 'introduction';
        } elseif ($ratio > 0.8) {
            return 'conclusion';
        } else {
            return 'body';
        }
    }

    /**
     * Trouve les points d'insertion appropriés
     */
    public function findInsertionPoints(string $content, int $count): array
    {
        $structure = $this->analyzeContent($content);
        $points = [];

        // Filtrer les paragraphes éligibles (assez longs, pas déjà trop de liens)
        $eligibleParagraphs = array_filter($structure['paragraphs'], function ($p) {
            return $p['word_count'] >= 20 && !$p['has_link'];
        });

        if (empty($eligibleParagraphs)) {
            // Fallback: utiliser tous les paragraphes
            $eligibleParagraphs = array_filter($structure['paragraphs'], fn($p) => $p['word_count'] >= 10);
        }

        $eligibleParagraphs = array_values($eligibleParagraphs);
        $eligibleCount = count($eligibleParagraphs);

        if ($eligibleCount === 0) {
            return [];
        }

        // Distribuer uniformément
        $step = max(1, floor($eligibleCount / $count));

        for ($i = 0; $i < $count && $i * $step < $eligibleCount; $i++) {
            $paraIndex = $i * $step;
            $paragraph = $eligibleParagraphs[$paraIndex];

            $points[] = [
                'position' => $paragraph['start'],
                'paragraph_end' => $paragraph['end'],
                'type' => $this->determinePositionType($paragraph['index'], count($structure['paragraphs']))
            ];
        }

        return $points;
    }

    /**
     * Trouve la fin de phrase la plus proche
     */
    public function findSentenceEnd(string $content, int $startPosition): int
    {
        $searchArea = substr($content, $startPosition, 500);
        
        // Chercher la fin de phrase
        if (preg_match('/[.!?]\s+(?=[A-ZÀ-Ý])|[.!?](?=<)/u', $searchArea, $match, PREG_OFFSET_CAPTURE)) {
            return $startPosition + $match[0][1] + strlen($match[0][0]);
        }

        // Fallback: fin du paragraphe
        $closingTag = strpos($searchArea, '</p>');
        if ($closingTag !== false) {
            return $startPosition + $closingTag;
        }

        return $startPosition + min(200, strlen($searchArea));
    }

    /**
     * Vérifie si une position est valide pour l'insertion
     */
    public function isValidInsertPosition(string $content, int $position): bool
    {
        // Ne pas insérer au milieu d'une balise
        $before = substr($content, max(0, $position - 50), 50);
        $after = substr($content, $position, 50);

        // Vérifier qu'on n'est pas dans une balise ouverte
        $lastOpen = strrpos($before, '<');
        $lastClose = strrpos($before, '>');
        
        if ($lastOpen !== false && ($lastClose === false || $lastOpen > $lastClose)) {
            return false;
        }

        // Vérifier qu'on n'est pas dans une balise <a>
        if (preg_match('/<a[^>]*>[^<]*$/i', $before)) {
            return false;
        }

        return true;
    }

    /**
     * Ajuste une position pour qu'elle soit valide
     */
    public function adjustPosition(string $content, int $position): int
    {
        // Avancer jusqu'à une position valide
        $maxAttempts = 100;
        $originalPosition = $position;

        while (!$this->isValidInsertPosition($content, $position) && $maxAttempts > 0) {
            $position++;
            $maxAttempts--;
        }

        // Si on n'a pas trouvé, essayer en arrière
        if ($maxAttempts === 0) {
            $position = $originalPosition;
            $maxAttempts = 100;
            
            while (!$this->isValidInsertPosition($content, $position) && $maxAttempts > 0) {
                $position--;
                $maxAttempts--;
            }
        }

        return max(0, $position);
    }

    /**
     * Calcule la densité de liens dans le contenu
     */
    public function calculateLinkDensity(string $content): array
    {
        $structure = $this->analyzeContent($content);
        $totalWords = array_sum(array_column($structure['paragraphs'], 'word_count'));
        
        // Compter les liens existants
        preg_match_all('/<a\s/i', $content, $matches);
        $linkCount = count($matches[0]);

        $density = $totalWords > 0 ? ($linkCount / $totalWords) * 100 : 0;

        return [
            'total_words' => $totalWords,
            'total_links' => $linkCount,
            'density_percent' => round($density, 2),
            'links_per_1000_words' => $totalWords > 0 ? round(($linkCount / $totalWords) * 1000, 1) : 0,
            'is_optimal' => $density >= 0.5 && $density <= 3.0,
            'recommendation' => $this->getDensityRecommendation($density)
        ];
    }

    /**
     * Génère une recommandation basée sur la densité
     */
    protected function getDensityRecommendation(float $density): string
    {
        if ($density < 0.5) {
            return 'Consider adding more internal links to improve navigation and SEO';
        } elseif ($density > 3.0) {
            return 'Link density is high. Consider reducing links to avoid over-optimization';
        } else {
            return 'Link density is within optimal range';
        }
    }
}
