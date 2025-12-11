<?php

namespace App\Services\Seo;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * Service de génération meta tags optimisés CTR
 */
class MetaService
{
    // Power words par langue
    const POWER_WORDS = [
        'fr' => ['Guide', 'Complet', '2025', 'Meilleur', 'Top', 'Ultime', 'Essentiel', 'Rapide', 'Facile', 'Gratuit', 'Nouveau', 'Exclusif'],
        'en' => ['Guide', 'Complete', '2025', 'Best', 'Top', 'Ultimate', 'Essential', 'Quick', 'Easy', 'Free', 'New', 'Exclusive'],
        'es' => ['Guía', 'Completa', '2025', 'Mejor', 'Top', 'Definitiva', 'Esencial', 'Rápido', 'Fácil', 'Gratis', 'Nuevo'],
    ];

    // Émojis par thématique (boostent CTR +2-5%)
    const EMOJIS = [
        'finance' => ['💰', '💵', '💳', '📊', '📈'],
        'travel' => ['✈️', '🌍', '🗺️', '🏖️', '🎒'],
        'health' => ['⚕️', '💊', '🏥', '❤️', '🩺'],
        'legal' => ['⚖️', '📋', '✅', '📝', '🔒'],
        'tech' => ['💻', '📱', '⚡', '🚀', '🔧'],
        'education' => ['📚', '🎓', '✏️', '📖', '🧠'],
        'default' => ['✓', '⚡', '🎯', '💡', '🔥']
    ];

    /**
     * Génère meta tags optimisés CTR
     */
    public function generateOptimizedMeta(string $title, string $content, array $params): array
    {
        $language = $params['language'] ?? 'en';
        $keyword = $params['keyword'] ?? '';

        // Meta title optimisé
        $metaTitle = $this->generateMetaTitle($title, $keyword, $language, $params);

        // Meta description optimisée
        $metaDescription = $this->generateMetaDescription($content, $keyword, $language, $params);

        // Meta keywords (moins important mais utile)
        $metaKeywords = $this->generateMetaKeywords($keyword, $params);

        return [
            'title' => $metaTitle,
            'description' => $metaDescription,
            'keywords' => $metaKeywords,
            'og_title' => $metaTitle,
            'og_description' => $metaDescription,
            'twitter_title' => $metaTitle,
            'twitter_description' => $metaDescription
        ];
    }

    /**
     * Meta title optimisé CTR (max 60 chars)
     */
    protected function generateMetaTitle(string $title, string $keyword, string $language, array $params): string
    {
        // Si titre déjà optimal (<60 chars), on garde
        if (mb_strlen($title) <= 60 && str_contains(strtolower($title), strtolower($keyword))) {
            return $title;
        }

        // Construction optimisée
        $metaTitle = '';

        // 1. Power word si absent
        $hasPowerWord = false;
        foreach (self::POWER_WORDS[$language] ?? self::POWER_WORDS['en'] as $powerWord) {
            if (stripos($title, $powerWord) !== false) {
                $hasPowerWord = true;
                break;
            }
        }

        if (!$hasPowerWord) {
            $metaTitle = $this->getRandomPowerWord($language) . ' ';
        }

        // 2. Keyword principal
        $metaTitle .= $keyword;

        // 3. Année courante (2025)
        if (!str_contains($title, '2025')) {
            $metaTitle .= ' 2025';
        }

        // 4. Émoji si thématique détectée
        $theme = $params['theme'] ?? $this->detectTheme($keyword);
        $emoji = $this->getRelevantEmoji($theme);
        $metaTitle = $emoji . ' ' . $metaTitle;

        // 5. Tronquer à 60 chars
        if (mb_strlen($metaTitle) > 60) {
            $metaTitle = mb_substr($metaTitle, 0, 57) . '...';
        }

        return $metaTitle;
    }

    /**
     * Meta description optimisée CTR (150-160 chars)
     */
    protected function generateMetaDescription(string $content, string $keyword, string $language, array $params): string
    {
        // Extraction première phrase du contenu
        $cleanContent = strip_tags($content);
        $firstSentence = Str::before($cleanContent, '.');

        // Construction optimisée
        $description = '';

        // 1. Donnée chiffrée si disponible
        $statistic = $this->extractStatistic($cleanContent);
        if ($statistic) {
            $description = $statistic . ' ';
        }

        // 2. Valeur proposition avec keyword
        $description .= $this->generateValueProposition($keyword, $language);

        // 3. CTA implicite
        $description .= ' ' . $this->getCTA($language);

        // 4. Validation longueur 150-160 chars
        if (mb_strlen($description) < 150) {
            // Ajouter contexte
            $description .= ' ' . mb_substr($firstSentence, 0, 150 - mb_strlen($description));
        }

        if (mb_strlen($description) > 160) {
            $description = mb_substr($description, 0, 157) . '...';
        }

        return trim($description);
    }

    /**
     * Extrait statistique du contenu (boost CTR)
     */
    protected function extractStatistic(string $content): ?string
    {
        // Recherche patterns statistiques
        $patterns = [
            '/(\d{1,3}%)/u',                    // 67%
            '/(\d+\s*sur\s*\d+)/iu',           // 3 sur 10
            '/(\d+\s*€)/u',                     // 50000€
            '/(\d+\s*\$)/u',                    // $50000
            '/(plus\s*de\s*\d+)/iu',          // plus de 1000
            '/(\d+\s*millions?)/iu'            // 2 millions
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $content, $matches)) {
                return $matches[1];
            }
        }

        return null;
    }

    /**
     * Génère proposition de valeur claire
     */
    protected function generateValueProposition(string $keyword, string $language): string
    {
        $templates = [
            'fr' => [
                "Découvrez tout sur {keyword}",
                "Guide complet {keyword}",
                "{keyword} expliqué simplement",
                "Maîtrisez {keyword} rapidement"
            ],
            'en' => [
                "Discover everything about {keyword}",
                "Complete {keyword} guide",
                "{keyword} explained simply",
                "Master {keyword} quickly"
            ]
        ];

        $languageTemplates = $templates[$language] ?? $templates['en'];
        $template = $languageTemplates[array_rand($languageTemplates)];

        return str_replace('{keyword}', $keyword, $template);
    }

    /**
     * CTA implicite par langue
     */
    protected function getCTA(string $language): string
    {
        $ctas = [
            'fr' => ['En savoir plus', 'Découvrez', 'Apprenez', 'Commencez maintenant'],
            'en' => ['Learn more', 'Discover', 'Get started', 'Read now'],
            'es' => ['Más información', 'Descubra', 'Empiece ahora']
        ];

        $languageCtas = $ctas[$language] ?? $ctas['en'];
        return $languageCtas[array_rand($languageCtas)] . '.';
    }

    /**
     * Meta keywords (3-5 mots-clés)
     */
    protected function generateMetaKeywords(string $mainKeyword, array $params): string
    {
        $keywords = [$mainKeyword];

        // LSI keywords si disponibles
        if (isset($params['lsi_keywords'])) {
            $keywords = array_merge($keywords, array_slice($params['lsi_keywords'], 0, 4));
        }

        return implode(', ', array_unique($keywords));
    }

    /**
     * Détecte thématique pour émojis
     */
    protected function detectTheme(string $keyword): string
    {
        $keyword = strtolower($keyword);

        if (preg_match('/visa|passport|immigration|expatriation|travel/', $keyword)) {
            return 'travel';
        }

        if (preg_match('/insurance|health|medical|santé|assurance/', $keyword)) {
            return 'health';
        }

        if (preg_match('/finance|banking|money|argent|banque/', $keyword)) {
            return 'finance';
        }

        if (preg_match('/legal|law|droit|juridique/', $keyword)) {
            return 'legal';
        }

        if (preg_match('/tech|software|app|digital/', $keyword)) {
            return 'tech';
        }

        return 'default';
    }

    /**
     * Émoji pertinent selon thème
     */
    protected function getRelevantEmoji(string $theme): string
    {
        $emojis = self::EMOJIS[$theme] ?? self::EMOJIS['default'];
        return $emojis[array_rand($emojis)];
    }

    /**
     * Power word aléatoire
     */
    protected function getRandomPowerWord(string $language): string
    {
        $words = self::POWER_WORDS[$language] ?? self::POWER_WORDS['en'];
        return $words[array_rand($words)];
    }

    /**
     * Validation meta tags
     */
    public function validateMeta(array $meta): array
    {
        $issues = [];

        // Meta title
        $titleLength = mb_strlen($meta['title']);
        if ($titleLength > 60) {
            $issues[] = "Meta title trop long: {$titleLength}/60 chars";
        }
        if ($titleLength < 30) {
            $issues[] = "Meta title trop court: {$titleLength}/60 chars";
        }

        // Meta description
        $descLength = mb_strlen($meta['description']);
        if ($descLength > 160) {
            $issues[] = "Meta description trop longue: {$descLength}/160 chars";
        }
        if ($descLength < 120) {
            $issues[] = "Meta description trop courte: {$descLength}/160 chars";
        }

        return [
            'valid' => empty($issues),
            'issues' => $issues,
            'title_length' => $titleLength,
            'description_length' => $descLength
        ];
    }
}
