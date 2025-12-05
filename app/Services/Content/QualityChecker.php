<?php

namespace App\Services\Content;

use App\Models\PressRelease;
use App\Models\PressDossier;
use App\Models\QualityCheck;
use Illuminate\Support\Str;

/**
 * QualityChecker - Évaluation qualité des articles générés
 * 
 * Système de scoring sur 100 points évaluant :
 * - Longueur du contenu (15 pts)
 * - Structure et titres (15 pts)
 * - FAQs (10 pts)
 * - Liens internes/externes (15 pts)
 * - Meta tags SEO (15 pts)
 * - CTA call-to-action (10 pts)
 * - JSON-LD structured data (10 pts)
 * - Optimisation GEO (10 pts)
 * 
 * Le score final permet de :
 * - Valider la qualité avant publication
 * - Identifier les points d'amélioration
 * - Comparer les performances entre articles
 * - Filtrer les articles de qualité insuffisante
 * 
 * @package App\Services\Content
 */
class QualityChecker
{
    // Seuils de qualité
    const QUALITY_EXCELLENT = 90;  // Publication immédiate
    const QUALITY_GOOD = 75;       // Publication après revue rapide
    const QUALITY_ACCEPTABLE = 60; // Nécessite améliorations
    const QUALITY_POOR = 40;       // Nécessite refonte

    // Poids des critères (total = 100)
    protected array $weights = [
        'word_count' => 15,      // Longueur du contenu
        'structure' => 15,       // Titres H2/H3, paragraphes
        'faqs' => 10,            // Questions-réponses
        'links' => 15,           // Liens internes/externes
        'meta' => 15,            // Meta title/description/keywords
        'cta' => 10,             // Call-to-action
        'json_ld' => 10,         // Structured data
        'geo' => 10,             // Optimisation GEO
    ];

    // Configuration des seuils
    protected array $thresholds = [
        'word_count_min' => 1200,
        'word_count_ideal' => 1500,
        'word_count_max' => 2000,
        'h2_min' => 6,
        'h2_ideal' => 8,
        'h3_min' => 3,
        'faqs_min' => 6,
        'faqs_ideal' => 8,
        'internal_links_min' => 3,
        'internal_links_ideal' => 5,
        'external_links_min' => 2,
        'external_links_ideal' => 4,
        'meta_title_max' => 60,
        'meta_description_min' => 120,
        'meta_description_max' => 155,
        'cta_min' => 2,
        'cta_ideal' => 3,
    ];

    /**
     * Évaluer la qualité d'un article
     * 
     * @param array $article Données de l'article :
     *   - title (string) : Titre
     *   - content (string) : Contenu HTML
     *   - meta (array) : Meta tags
     *   - faqs (array) : Questions-réponses
     *   - sources (array) : Sources Perplexity
     * 
     * @return int Score de qualité sur 100
     */
    public function check(array $article): int
    {
        $scores = [
            'word_count' => $this->checkWordCount($article['content']),
            'structure' => $this->checkStructure($article['content']),
            'faqs' => $this->checkFaqs($article['faqs'] ?? []),
            'links' => $this->checkLinks($article['content']),
            'meta' => $this->checkMeta($article['meta'] ?? []),
            'cta' => $this->checkCta($article['content']),
            'json_ld' => $this->checkJsonLd($article),
            'geo' => $this->checkGeo($article['content']),
        ];

        // Calcul du score pondéré
        $totalScore = 0;
        foreach ($scores as $criterion => $score) {
            $totalScore += ($score / 100) * $this->weights[$criterion];
        }

        return (int) round($totalScore);
    }

    /**
     * Obtenir le détail complet de l'évaluation avec recommandations
     */
    public function checkDetailed(array $article): array
    {
        $scores = [
            'word_count' => $this->checkWordCount($article['content']),
            'structure' => $this->checkStructure($article['content']),
            'faqs' => $this->checkFaqs($article['faqs'] ?? []),
            'links' => $this->checkLinks($article['content']),
            'meta' => $this->checkMeta($article['meta'] ?? []),
            'cta' => $this->checkCta($article['content']),
            'json_ld' => $this->checkJsonLd($article),
            'geo' => $this->checkGeo($article['content']),
        ];

        // Calcul du score total
        $totalScore = 0;
        foreach ($scores as $criterion => $score) {
            $totalScore += ($score / 100) * $this->weights[$criterion];
        }
        $totalScore = (int) round($totalScore);

        // Génération des recommandations
        $recommendations = $this->generateRecommendations($scores, $article);

        // Détermination du niveau de qualité
        $qualityLevel = $this->getQualityLevel($totalScore);

        return [
            'total_score' => $totalScore,
            'quality_level' => $qualityLevel,
            'scores_by_criterion' => array_map(function ($criterion) use ($scores) {
                return [
                    'score' => $scores[$criterion],
                    'weight' => $this->weights[$criterion],
                    'weighted_score' => ($scores[$criterion] / 100) * $this->weights[$criterion],
                ];
            }, array_combine(array_keys($scores), array_keys($scores))),
            'recommendations' => $recommendations,
            'stats' => $this->getArticleStats($article),
        ];
    }

    /**
     * Vérifier la longueur du contenu
     */
    protected function checkWordCount(string $content): int
    {
        $wordCount = $this->countWords($content);

        if ($wordCount < $this->thresholds['word_count_min']) {
            // Moins de 1200 mots : proportionnel
            return (int) (($wordCount / $this->thresholds['word_count_min']) * 60);
        }

        if ($wordCount >= $this->thresholds['word_count_ideal'] && 
            $wordCount <= $this->thresholds['word_count_max']) {
            // 1500-2000 mots : score parfait
            return 100;
        }

        if ($wordCount < $this->thresholds['word_count_ideal']) {
            // 1200-1500 mots : 60-100
            $progress = ($wordCount - $this->thresholds['word_count_min']) / 
                       ($this->thresholds['word_count_ideal'] - $this->thresholds['word_count_min']);
            return (int) (60 + ($progress * 40));
        }

        // Plus de 2000 mots : pénalité légère (trop long)
        $excess = $wordCount - $this->thresholds['word_count_max'];
        $penalty = min(20, $excess / 100); // -1 point tous les 100 mots en plus
        return (int) max(80, 100 - $penalty);
    }

    /**
     * Vérifier la structure (titres H2/H3, paragraphes)
     */
    protected function checkStructure(string $content): int
    {
        $score = 0;

        // Compter les titres H2
        $h2Count = substr_count($content, '<h2');
        if ($h2Count >= $this->thresholds['h2_ideal']) {
            $score += 40; // 6-8 H2 : parfait
        } elseif ($h2Count >= $this->thresholds['h2_min']) {
            $score += 30; // Minimum acceptable
        } else {
            $score += ($h2Count / $this->thresholds['h2_min']) * 30;
        }

        // Compter les titres H3
        $h3Count = substr_count($content, '<h3');
        if ($h3Count >= $this->thresholds['h3_min']) {
            $score += 20; // Sous-sections présentes
        } else {
            $score += ($h3Count / $this->thresholds['h3_min']) * 20;
        }

        // Vérifier les listes (ul/ol)
        $hasLists = (substr_count($content, '<ul') + substr_count($content, '<ol')) >= 2;
        if ($hasLists) {
            $score += 20; // Contenu scannable
        }

        // Vérifier les paragraphes courts (lisibilité)
        $paragraphs = explode('</p>', $content);
        $shortParagraphs = 0;
        foreach ($paragraphs as $p) {
            $words = $this->countWords($p);
            if ($words > 0 && $words <= 80) { // Paragraphes courts = lisibles
                $shortParagraphs++;
            }
        }
        if ($shortParagraphs >= count($paragraphs) * 0.7) { // 70% de paragraphes courts
            $score += 20;
        } else {
            $score += 10;
        }

        return min(100, $score);
    }

    /**
     * Vérifier les FAQs
     */
    protected function checkFaqs(array $faqs): int
    {
        $count = count($faqs);

        if ($count === 0) {
            return 0;
        }

        if ($count >= $this->thresholds['faqs_ideal']) {
            $score = 100; // 8+ FAQs : parfait
        } elseif ($count >= $this->thresholds['faqs_min']) {
            $score = 80; // 6-7 FAQs : bon
        } else {
            $score = ($count / $this->thresholds['faqs_min']) * 80;
        }

        // Vérifier la qualité des FAQs
        $qualityBonus = 0;
        foreach ($faqs as $faq) {
            // Question claire et naturelle
            if (isset($faq['question']) && 
                mb_strlen($faq['question']) >= 10 && 
                mb_strlen($faq['question']) <= 100) {
                $qualityBonus += 2;
            }

            // Réponse complète
            if (isset($faq['answer']) && 
                $this->countWords($faq['answer']) >= 30) {
                $qualityBonus += 2;
            }
        }

        return min(100, (int) ($score + $qualityBonus));
    }

    /**
     * Vérifier les liens internes et externes
     */
    protected function checkLinks(string $content): int
    {
        $score = 0;

        // Liens internes (vers d'autres articles du site)
        preg_match_all('/<a[^>]*href=["\'](?!http)[^"\']*["\'][^>]*>/i', $content, $internalLinks);
        $internalCount = count($internalLinks[0]);
        
        if ($internalCount >= $this->thresholds['internal_links_ideal']) {
            $score += 50;
        } elseif ($internalCount >= $this->thresholds['internal_links_min']) {
            $score += 40;
        } else {
            $score += ($internalCount / $this->thresholds['internal_links_min']) * 40;
        }

        // Liens externes (sources, autorités)
        preg_match_all('/<a[^>]*href=["\']https?:\/\/[^"\']*["\'][^>]*>/i', $content, $externalLinks);
        $externalCount = count($externalLinks[0]);
        
        if ($externalCount >= $this->thresholds['external_links_ideal']) {
            $score += 50;
        } elseif ($externalCount >= $this->thresholds['external_links_min']) {
            $score += 40;
        } else {
            $score += ($externalCount / $this->thresholds['external_links_min']) * 40;
        }

        return min(100, (int) $score);
    }

    /**
     * Vérifier les meta tags SEO
     */
    protected function checkMeta(array $meta): int
    {
        $score = 0;

        // Meta title
        if (!empty($meta['meta_title'])) {
            $titleLength = mb_strlen($meta['meta_title']);
            if ($titleLength <= $this->thresholds['meta_title_max']) {
                $score += 35; // Longueur optimale
            } else {
                $penalty = ($titleLength - $this->thresholds['meta_title_max']) * 0.5;
                $score += max(20, 35 - $penalty);
            }
        }

        // Meta description
        if (!empty($meta['meta_description'])) {
            $descLength = mb_strlen($meta['meta_description']);
            if ($descLength >= $this->thresholds['meta_description_min'] && 
                $descLength <= $this->thresholds['meta_description_max']) {
                $score += 35; // Longueur optimale
            } elseif ($descLength < $this->thresholds['meta_description_min']) {
                $score += ($descLength / $this->thresholds['meta_description_min']) * 35;
            } else {
                $score += 25; // Trop long mais acceptable
            }
        }

        // Focus keyword
        if (!empty($meta['focus_keyword'])) {
            $score += 15;
        }

        // Secondary keywords
        if (!empty($meta['secondary_keywords']) && count($meta['secondary_keywords']) >= 2) {
            $score += 15;
        } elseif (!empty($meta['secondary_keywords'])) {
            $score += 10;
        }

        return min(100, (int) $score);
    }

    /**
     * Vérifier les CTA (call-to-action)
     */
    protected function checkCta(string $content): int
    {
        // Compter les CTAs (boutons, liens avec classes spécifiques)
        $ctaCount = 0;
        
        // Boutons
        $ctaCount += substr_count($content, '<button');
        $ctaCount += substr_count($content, 'class="btn');
        $ctaCount += substr_count($content, 'class="cta');
        
        // Liens CTA spécifiques
        $ctaCount += substr_count($content, 'cta-link');
        $ctaCount += substr_count($content, 'action-link');

        if ($ctaCount >= $this->thresholds['cta_ideal']) {
            return 100; // 3+ CTAs : parfait
        } elseif ($ctaCount >= $this->thresholds['cta_min']) {
            return 80; // 2 CTAs : acceptable
        } elseif ($ctaCount === 1) {
            return 50; // 1 CTA : insuffisant
        }

        return 0;
    }

    /**
     * Vérifier la présence de JSON-LD structured data
     */
    protected function checkJsonLd(array $article): int
    {
        $score = 0;

        // Vérifier si des FAQs sont présentes (FAQ schema)
        if (!empty($article['faqs']) && count($article['faqs']) >= 3) {
            $score += 50; // Données structurées FAQ
        }

        // Vérifier si des sources sont présentes (sources schema potentiel)
        if (!empty($article['sources']) && count($article['sources']) >= 2) {
            $score += 25; // Références externes
        }

        // Présence de meta données complètes (Article schema)
        if (!empty($article['meta']['meta_title']) && 
            !empty($article['meta']['meta_description'])) {
            $score += 25;
        }

        return min(100, $score);
    }

    /**
     * Vérifier l'optimisation GEO (Generative Engine Optimization)
     */
    protected function checkGeo(string $content): int
    {
        $score = 0;

        // Réponses directes aux questions (détection de patterns)
        $questionPatterns = [
            'Comment' => 20,
            'Pourquoi' => 15,
            'Que faire' => 15,
            'Quand' => 10,
            'Où' => 10,
        ];

        foreach ($questionPatterns as $pattern => $points) {
            if (stripos($content, $pattern) !== false) {
                $score += $points;
            }
        }

        // Listes à puces (format scannable)
        $listCount = substr_count($content, '<ul') + substr_count($content, '<ol');
        if ($listCount >= 3) {
            $score += 15;
        } elseif ($listCount >= 1) {
            $score += 10;
        }

        // Informations chiffrées (crédibilité)
        if (preg_match_all('/\d+%|\d+\s*(jours|heures|euros|dollars)/', $content) >= 3) {
            $score += 15;
        }

        return min(100, $score);
    }

    /**
     * Générer des recommandations d'amélioration
     */
    protected function generateRecommendations(array $scores, array $article): array
    {
        $recommendations = [];

        // Word count
        if ($scores['word_count'] < 80) {
            $currentWords = $this->countWords($article['content']);
            $targetWords = $this->thresholds['word_count_ideal'];
            $recommendations[] = [
                'criterion' => 'word_count',
                'priority' => 'high',
                'message' => "Augmenter la longueur : {$currentWords} mots actuellement, objectif {$targetWords} mots.",
            ];
        }

        // Structure
        if ($scores['structure'] < 80) {
            $h2Count = substr_count($article['content'], '<h2');
            if ($h2Count < $this->thresholds['h2_min']) {
                $recommendations[] = [
                    'criterion' => 'structure',
                    'priority' => 'high',
                    'message' => "Ajouter plus de sections H2 : {$h2Count} actuellement, minimum {$this->thresholds['h2_min']}.",
                ];
            }
        }

        // FAQs
        if ($scores['faqs'] < 80) {
            $faqCount = count($article['faqs'] ?? []);
            $recommendations[] = [
                'criterion' => 'faqs',
                'priority' => 'medium',
                'message' => "Ajouter plus de FAQs : {$faqCount} actuellement, recommandé {$this->thresholds['faqs_ideal']}.",
            ];
        }

        // Links
        if ($scores['links'] < 80) {
            $recommendations[] = [
                'criterion' => 'links',
                'priority' => 'medium',
                'message' => "Ajouter des liens internes (vers d'autres articles) et externes (sources officielles).",
            ];
        }

        // Meta
        if ($scores['meta'] < 80) {
            $meta = $article['meta'] ?? [];
            if (empty($meta['meta_description'])) {
                $recommendations[] = [
                    'criterion' => 'meta',
                    'priority' => 'high',
                    'message' => "Ajouter une meta description (120-155 caractères).",
                ];
            }
            if (empty($meta['focus_keyword'])) {
                $recommendations[] = [
                    'criterion' => 'meta',
                    'priority' => 'medium',
                    'message' => "Définir un mot-clé principal (focus keyword).",
                ];
            }
        }

        // CTA
        if ($scores['cta'] < 80) {
            $recommendations[] = [
                'criterion' => 'cta',
                'priority' => 'medium',
                'message' => "Ajouter 2-3 call-to-action (boutons, liens vers services).",
            ];
        }

        return $recommendations;
    }

    /**
     * Obtenir les statistiques de l'article
     */
    protected function getArticleStats(array $article): array
    {
        $content = $article['content'];
        
        return [
            'word_count' => $this->countWords($content),
            'character_count' => mb_strlen(strip_tags($content)),
            'h2_count' => substr_count($content, '<h2'),
            'h3_count' => substr_count($content, '<h3'),
            'paragraph_count' => substr_count($content, '<p>'),
            'list_count' => substr_count($content, '<ul') + substr_count($content, '<ol'),
            'faq_count' => count($article['faqs'] ?? []),
            'link_count' => substr_count($content, '<a '),
            'image_count' => substr_count($content, '<img '),
        ];
    }

    /**
     * Déterminer le niveau de qualité
     */
    protected function getQualityLevel(int $score): string
    {
        return match (true) {
            $score >= self::QUALITY_EXCELLENT => 'excellent',
            $score >= self::QUALITY_GOOD => 'good',
            $score >= self::QUALITY_ACCEPTABLE => 'acceptable',
            $score >= self::QUALITY_POOR => 'poor',
            default => 'very_poor',
        };
    }

    /**
     * Compter les mots dans un texte HTML
     */
    protected function countWords(string $html): int
    {
        $text = strip_tags($html);
        $text = preg_replace('/\s+/', ' ', $text);
        $text = trim($text);
        return str_word_count($text);
    }

    /**
     * Check quality Press Release
     */
    public function checkPressRelease(PressRelease $pressRelease): QualityCheck
    {
        $scores = [];
        $issues = [];
        $recommendations = [];

        // Check title length
        $titleLength = strlen($pressRelease->title);
        if ($titleLength < 30) {
            $issues[] = 'Titre trop court (< 30 caractères)';
            $scores['title_length'] = 40;
        } elseif ($titleLength > 120) {
            $issues[] = 'Titre trop long (> 120 caractères)';
            $scores['title_length'] = 60;
        } else {
            $scores['title_length'] = 100;
        }

        // Check lead length
        $leadWords = str_word_count(strip_tags($pressRelease->lead));
        if ($leadWords < 50) {
            $issues[] = 'Lead trop court (< 50 mots)';
            $scores['lead_length'] = 50;
        } else {
            $scores['lead_length'] = 100;
        }

        // Check citation
        if (empty($pressRelease->quote)) {
            $issues[] = 'Aucune citation présente';
            $scores['quote'] = 0;
        } else {
            $scores['quote'] = 100;
        }

        // Check boilerplate
        if (empty($pressRelease->boilerplate)) {
            $issues[] = 'Boilerplate manquant';
            $scores['boilerplate'] = 0;
        } else {
            $scores['boilerplate'] = 100;
        }

        // Check contact
        if (empty($pressRelease->contact)) {
            $issues[] = 'Contact manquant';
            $scores['contact'] = 0;
        } else {
            $scores['contact'] = 100;
        }

        // Overall score
        $overall = round(array_sum($scores) / count($scores), 2);

        return QualityCheck::create([
            'checkable_type' => PressRelease::class,
            'checkable_id' => $pressRelease->id,
            'score' => $overall,
            'issues' => $issues,
            'recommendations' => $recommendations,
            'details' => $scores,
            'checked_at' => now(),
        ]);
    }

    /**
     * Check quality Dossier
     */
    public function checkDossier(PressDossier $dossier): QualityCheck
    {
        $scores = [];
        $issues = [];
        $recommendations = [];

        // Check title
        $titleLength = strlen($dossier->title);
        if ($titleLength < 30) {
            $issues[] = 'Titre trop court';
            $scores['title_length'] = 40;
        } else {
            $scores['title_length'] = 100;
        }

        // Check description
        if (empty($dossier->description)) {
            $issues[] = 'Description manquante';
            $scores['description'] = 0;
        } else {
            $scores['description'] = 100;
        }

        // Check sections count
        $sectionsCount = $dossier->sections()->count();
        if ($sectionsCount < 3) {
            $issues[] = 'Pas assez de sections (minimum 3)';
            $scores['sections_count'] = 30;
        } else {
            $scores['sections_count'] = 100;
        }

        // Overall score
        $overall = round(array_sum($scores) / count($scores), 2);

        return QualityCheck::create([
            'checkable_type' => PressDossier::class,
            'checkable_id' => $dossier->id,
            'score' => $overall,
            'issues' => $issues,
            'recommendations' => $recommendations,
            'details' => $scores,
            'checked_at' => now(),
        ]);
    }
}