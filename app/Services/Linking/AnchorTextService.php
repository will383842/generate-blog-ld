<?php

namespace App\Services\Linking;

use App\Models\Article;

class AnchorTextService
{
    protected MultilingualLinkAdapter $multilingualAdapter;

    public function __construct(MultilingualLinkAdapter $multilingualAdapter)
    {
        $this->multilingualAdapter = $multilingualAdapter;
    }

    /**
     * Génère un anchor text pour un article cible
     */
    public function generateAnchor(Article $target, string $languageCode, string $type = 'exact_match'): string
    {
        return match ($type) {
            'exact_match' => $this->generateExactMatch($target),
            'long_tail' => $this->generateLongTail($target, $languageCode),
            'generic' => $this->generateGeneric($languageCode),
            'cta' => $this->generateCta($target, $languageCode),
            'question' => $this->generateQuestion($target, $languageCode),
            default => $this->generateExactMatch($target)
        };
    }

    /**
     * Génère un anchor exact match (titre ou partie du titre)
     */
    protected function generateExactMatch(Article $target): string
    {
        $title = $target->title;

        // Si le titre est trop long, extraire la partie principale
        if (mb_strlen($title) > 60) {
            // Essayer de couper sur une frontière de phrase/segment
            $parts = preg_split('/[\:\-\|–—]/', $title, 2);
            if (count($parts) > 1 && mb_strlen($parts[0]) >= 20) {
                return trim($parts[0]);
            }

            // Couper sur les mots
            $words = explode(' ', $title);
            $result = '';
            foreach ($words as $word) {
                if (mb_strlen($result . ' ' . $word) > 50) {
                    break;
                }
                $result .= ($result ? ' ' : '') . $word;
            }
            return $result;
        }

        return $title;
    }

    /**
     * Génère un anchor long-tail
     */
    protected function generateLongTail(Article $target, string $languageCode): string
    {
        $baseText = $this->extractMainTopic($target);
        return $this->multilingualAdapter->generateLocalizedAnchor($baseText, $languageCode, 'long_tail');
    }

    /**
     * Génère un anchor générique
     */
    protected function generateGeneric(string $languageCode): string
    {
        return $this->multilingualAdapter->generateLocalizedAnchor('', $languageCode, 'generic');
    }

    /**
     * Génère un anchor CTA (Call to Action)
     */
    protected function generateCta(Article $target, string $languageCode): string
    {
        $baseText = $this->extractMainTopic($target);
        return $this->multilingualAdapter->generateLocalizedAnchor($baseText, $languageCode, 'cta');
    }

    /**
     * Génère un anchor sous forme de question
     */
    protected function generateQuestion(Article $target, string $languageCode): string
    {
        $baseText = $this->extractMainTopic($target);
        return $this->multilingualAdapter->generateLocalizedAnchor($baseText, $languageCode, 'question');
    }

    /**
     * Extrait le sujet principal d'un article
     */
    protected function extractMainTopic(Article $target): string
    {
        $title = $target->title;

        // Supprimer les préfixes courants
        $prefixes = [
            'Guide complet', 'Guide', 'Tout savoir sur', 'Comment', 'Pourquoi',
            'Complete guide to', 'How to', 'Why', 'What is', "Qu'est-ce que",
            'Guía completa', 'Cómo', 'Por qué', 'Vollständiger Leitfaden',
        ];

        foreach ($prefixes as $prefix) {
            if (stripos($title, $prefix) === 0) {
                $title = trim(substr($title, strlen($prefix)));
                // Supprimer les deux-points ou tirets initiaux
                $title = ltrim($title, ':- ');
                break;
            }
        }

        // Supprimer les suffixes comme "en 2024", "- Guide", etc.
        $title = preg_replace('/\s*(en|in|im|für)\s*\d{4}$/i', '', $title);
        $title = preg_replace('/\s*[-–—]\s*(Guide|Guía|Leitfaden).*$/i', '', $title);

        // Limiter la longueur
        if (mb_strlen($title) > 40) {
            $words = explode(' ', $title);
            $result = '';
            foreach ($words as $word) {
                if (mb_strlen($result . ' ' . $word) > 35) {
                    break;
                }
                $result .= ($result ? ' ' : '') . $word;
            }
            $title = $result;
        }

        return $title;
    }

    /**
     * Valide un anchor text
     */
    public function validateAnchor(string $anchor): array
    {
        $issues = [];

        // Trop court
        if (mb_strlen($anchor) < 3) {
            $issues[] = 'Anchor too short';
        }

        // Trop long
        if (mb_strlen($anchor) > 80) {
            $issues[] = 'Anchor too long';
        }

        // Contient uniquement des génériques
        $generics = ['cliquez ici', 'click here', 'en savoir plus', 'learn more', 'lire plus', 'read more'];
        if (in_array(mb_strtolower($anchor), $generics)) {
            $issues[] = 'Generic anchor - consider using descriptive text';
        }

        return [
            'valid' => empty($issues),
            'issues' => $issues
        ];
    }

    /**
     * Suggère des variations d'anchor
     */
    public function suggestVariations(Article $target, string $languageCode, int $count = 5): array
    {
        $variations = [];
        $types = ['exact_match', 'long_tail', 'cta', 'question'];

        foreach ($types as $type) {
            $anchor = $this->generateAnchor($target, $languageCode, $type);
            if (!in_array($anchor, $variations)) {
                $variations[] = $anchor;
            }
            if (count($variations) >= $count) {
                break;
            }
        }

        return $variations;
    }

    /**
     * Analyse la diversité des anchors dans un article
     */
    public function analyzeAnchorDiversity(Article $article): array
    {
        $links = $article->internalLinksAsSource()->get();
        
        $types = [];
        $anchors = [];
        
        foreach ($links as $link) {
            $types[$link->anchor_type] = ($types[$link->anchor_type] ?? 0) + 1;
            $anchors[] = $link->anchor_text;
        }

        $uniqueAnchors = count(array_unique($anchors));
        $totalAnchors = count($anchors);

        return [
            'total_links' => $totalAnchors,
            'unique_anchors' => $uniqueAnchors,
            'diversity_ratio' => $totalAnchors > 0 ? round($uniqueAnchors / $totalAnchors, 2) : 0,
            'type_distribution' => $types,
            'needs_improvement' => $uniqueAnchors < $totalAnchors * 0.7
        ];
    }
}
