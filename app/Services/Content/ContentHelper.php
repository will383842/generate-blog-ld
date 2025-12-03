<?php

namespace App\Services\Content;

use Illuminate\Support\Str;

/**
 * ContentHelper - Helpers communs pour la génération de contenu
 * 
 * Fonctions utilitaires utilisées par tous les services de contenu :
 * - Nettoyage et formatage HTML
 * - Extraction et analyse de texte
 * - Calculs de métriques
 * - Conversion et formatage
 * 
 * @package App\Services\Content
 */
class ContentHelper
{
    /**
     * Nettoyer le HTML généré par les IA
     * 
     * Supprime :
     * - Balises markdown (```html, ```)
     * - Espaces multiples
     * - Balises HTML dangereuses
     * - Attributs non autorisés
     */
    public static function cleanHtml(string $html): string
    {
        // Retirer les marqueurs markdown
        $html = preg_replace('/```html\s*/i', '', $html);
        $html = preg_replace('/```\s*/i', '', $html);

        // Retirer les balises script et style
        $html = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $html);
        $html = preg_replace('/<style\b[^>]*>(.*?)<\/style>/is', '', $html);

        // Nettoyer les espaces multiples
        $html = preg_replace('/\s+/', ' ', $html);
        $html = preg_replace('/>\s+</', '><', $html);

        // Nettoyer les attributs dangereux
        $html = preg_replace('/\s*on\w+\s*=\s*["\'][^"\']*["\']/i', '', $html);

        return trim($html);
    }

    /**
     * Extraire le texte brut d'un HTML
     */
    public static function extractText(string $html): string
    {
        $text = strip_tags($html);
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = preg_replace('/\s+/', ' ', $text);
        return trim($text);
    }

    /**
     * Compter les mots dans un texte (gère multi-langues)
     */
    public static function countWords(string $text): int
    {
        $text = self::extractText($text);
        
        // Pour les langues sans espaces (chinois, japonais)
        if (preg_match('/[\x{4e00}-\x{9fa5}]/u', $text)) {
            // Compter les caractères CJK
            preg_match_all('/[\x{4e00}-\x{9fa5}]/u', $text, $matches);
            $cjkChars = count($matches[0]);
            
            // Compter les mots non-CJK
            $nonCjkText = preg_replace('/[\x{4e00}-\x{9fa5}]/u', '', $text);
            $nonCjkWords = str_word_count($nonCjkText);
            
            return $cjkChars + $nonCjkWords;
        }

        // Pour les autres langues
        return str_word_count($text);
    }

    /**
     * Compter les caractères (sans espaces)
     */
    public static function countCharacters(string $text, bool $withSpaces = false): int
    {
        $text = self::extractText($text);
        
        if ($withSpaces) {
            return mb_strlen($text);
        }
        
        return mb_strlen(preg_replace('/\s/', '', $text));
    }

    /**
     * Estimer le temps de lecture (en minutes)
     */
    public static function estimateReadingTime(string $content, int $wordsPerMinute = 200): int
    {
        $wordCount = self::countWords($content);
        return max(1, (int) ceil($wordCount / $wordsPerMinute));
    }

    /**
     * Extraire le premier paragraphe (pour excerpt)
     */
    public static function extractFirstParagraph(string $html, int $maxLength = 160): string
    {
        // Chercher le premier <p> avec contenu significatif
        preg_match('/<p[^>]*>(.*?)<\/p>/is', $html, $matches);
        
        if (!empty($matches[1])) {
            $text = self::extractText($matches[1]);
            return Str::limit($text, $maxLength);
        }

        // Fallback : premiers mots du texte
        $text = self::extractText($html);
        return Str::limit($text, $maxLength);
    }

    /**
     * Générer un slug unique à partir d'un titre
     */
    public static function generateSlug(string $title, string $languageCode = 'fr'): string
    {
        $slug = Str::slug($title);
        
        // Ajouter un suffixe unique si besoin
        $baseSlug = $slug;
        $counter = 1;
        
        while (\App\Models\Article::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    /**
     * Extraire les titres H2 d'un contenu
     */
    public static function extractH2Titles(string $html): array
    {
        preg_match_all('/<h2[^>]*>(.*?)<\/h2>/is', $html, $matches);
        
        return array_map(function ($title) {
            return self::extractText($title);
        }, $matches[1] ?? []);
    }

    /**
     * Extraire les titres H3 d'un contenu
     */
    public static function extractH3Titles(string $html): array
    {
        preg_match_all('/<h3[^>]*>(.*?)<\/h3>/is', $html, $matches);
        
        return array_map(function ($title) {
            return self::extractText($title);
        }, $matches[1] ?? []);
    }

    /**
     * Extraire toutes les images d'un contenu
     */
    public static function extractImages(string $html): array
    {
        preg_match_all('/<img[^>]*src=["\']([^"\']+)["\'][^>]*>/i', $html, $matches);
        
        return $matches[1] ?? [];
    }

    /**
     * Extraire tous les liens d'un contenu
     */
    public static function extractLinks(string $html): array
    {
        preg_match_all('/<a[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)<\/a>/is', $html, $matches, PREG_SET_ORDER);
        
        $links = [];
        foreach ($matches as $match) {
            $links[] = [
                'url' => $match[1],
                'text' => self::extractText($match[2]),
            ];
        }
        
        return $links;
    }

    /**
     * Générer une table des matières à partir des H2/H3
     */
    public static function generateTableOfContents(string $html): array
    {
        $toc = [];
        
        // Extraire H2 et H3 avec leurs positions
        preg_match_all('/<(h[23])[^>]*>(.*?)<\/\1>/is', $html, $matches, PREG_SET_ORDER);
        
        foreach ($matches as $match) {
            $level = $match[1]; // h2 ou h3
            $title = self::extractText($match[2]);
            $id = Str::slug($title);
            
            $toc[] = [
                'level' => $level,
                'title' => $title,
                'id' => $id,
            ];
        }
        
        return $toc;
    }

    /**
     * Ajouter des IDs aux titres pour ancres
     */
    public static function addIdsToHeadings(string $html): string
    {
        // H2
        $html = preg_replace_callback(
            '/<h2[^>]*>(.*?)<\/h2>/is',
            function ($matches) {
                $id = Str::slug(self::extractText($matches[1]));
                return "<h2 id=\"{$id}\">{$matches[1]}</h2>";
            },
            $html
        );

        // H3
        $html = preg_replace_callback(
            '/<h3[^>]*>(.*?)<\/h3>/is',
            function ($matches) {
                $id = Str::slug(self::extractText($matches[1]));
                return "<h3 id=\"{$id}\">{$matches[1]}</h3>";
            },
            $html
        );

        return $html;
    }

    /**
     * Vérifier si le contenu contient des balises HTML invalides
     */
    public static function validateHtml(string $html): array
    {
        $errors = [];

        // Vérifier l'équilibre des balises
        $tags = ['p', 'h2', 'h3', 'ul', 'ol', 'li', 'div', 'section', 'article'];
        
        foreach ($tags as $tag) {
            $openCount = substr_count($html, "<{$tag}");
            $closeCount = substr_count($html, "</{$tag}>");
            
            if ($openCount !== $closeCount) {
                $errors[] = "Balise <{$tag}> : {$openCount} ouvertures, {$closeCount} fermetures";
            }
        }

        // Vérifier les balises orphelines
        if (preg_match('/<\/\w+>/', $html, $matches, PREG_OFFSET_CAPTURE, 0) && 
            $matches[0][1] === 0) {
            $errors[] = "Balise fermante orpheline au début : {$matches[0][0]}";
        }

        return $errors;
    }

    /**
     * Optimiser les images dans le HTML (lazy loading, dimensions)
     */
    public static function optimizeImages(string $html): string
    {
        // Ajouter loading="lazy" aux images
        $html = preg_replace(
            '/<img(?![^>]*loading=)([^>]*)>/i',
            '<img loading="lazy"$1>',
            $html
        );

        // Ajouter alt vide si manquant (accessibilité)
        $html = preg_replace(
            '/<img(?![^>]*alt=)([^>]*)>/i',
            '<img alt=""$1>',
            $html
        );

        return $html;
    }

    /**
     * Formater les prix selon la locale
     */
    public static function formatPrice(float $amount, string $currency = 'EUR', string $locale = 'fr_FR'): string
    {
        $formatter = new \NumberFormatter($locale, \NumberFormatter::CURRENCY);
        return $formatter->formatCurrency($amount, $currency);
    }

    /**
     * Formater les dates selon la langue
     */
    public static function formatDate(\DateTime $date, string $languageCode = 'fr'): string
    {
        $formats = [
            'fr' => 'd F Y',
            'en' => 'F d, Y',
            'de' => 'd. F Y',
            'es' => 'd \d\e F \d\e Y',
            'pt' => 'd \d\e F \d\e Y',
        ];

        $format = $formats[$languageCode] ?? 'd F Y';
        
        // Configurer la locale pour les noms de mois
        $locales = [
            'fr' => 'fr_FR',
            'en' => 'en_US',
            'de' => 'de_DE',
            'es' => 'es_ES',
            'pt' => 'pt_PT',
        ];

        $locale = $locales[$languageCode] ?? 'en_US';
        setlocale(LC_TIME, $locale . '.UTF-8');

        return strftime($format, $date->getTimestamp());
    }

    /**
     * Calculer le score de lisibilité (Flesch-Kincaid adapté)
     */
    public static function calculateReadabilityScore(string $text): int
    {
        $text = self::extractText($text);
        
        // Compter mots, phrases, syllabes
        $wordCount = self::countWords($text);
        $sentenceCount = substr_count($text, '.') + substr_count($text, '!') + substr_count($text, '?');
        $sentenceCount = max(1, $sentenceCount);
        
        // Estimation simple des syllabes (français)
        $syllableCount = self::estimateSyllables($text);
        
        // Formule Flesch adaptée
        $score = 206.835 - 1.015 * ($wordCount / $sentenceCount) - 84.6 * ($syllableCount / $wordCount);
        
        // Normaliser entre 0 et 100
        return (int) max(0, min(100, $score));
    }

    /**
     * Estimer le nombre de syllabes (approximation française)
     */
    protected static function estimateSyllables(string $text): int
    {
        $text = mb_strtolower($text);
        
        // Voyelles
        $vowels = ['a', 'e', 'i', 'o', 'u', 'y', 'é', 'è', 'ê', 'ë', 'à', 'â', 'ù', 'û', 'ô', 'î', 'ï'];
        
        $syllables = 0;
        $inVowelGroup = false;
        
        for ($i = 0; $i < mb_strlen($text); $i++) {
            $char = mb_substr($text, $i, 1);
            
            if (in_array($char, $vowels)) {
                if (!$inVowelGroup) {
                    $syllables++;
                    $inVowelGroup = true;
                }
            } else {
                $inVowelGroup = false;
            }
        }
        
        return max(1, $syllables);
    }

    /**
     * Générer un hash SHA256 pour un contenu
     */
    public static function generateHash(string $content): string
    {
        return hash('sha256', $content);
    }

    /**
     * Comparer deux contenus et retourner le % de similarité
     */
    public static function calculateSimilarity(string $content1, string $content2): float
    {
        $text1 = self::extractText($content1);
        $text2 = self::extractText($content2);
        
        similar_text($text1, $text2, $percent);
        
        return round($percent, 2);
    }

    /**
     * Extraire les mots-clés les plus fréquents
     */
    public static function extractKeywords(string $content, int $limit = 10): array
    {
        $text = self::extractText($content);
        $text = mb_strtolower($text);
        
        // Découper en mots
        $words = preg_split('/[\s\.,;:!?\(\)\[\]]+/', $text);
        
        // Stop words français
        $stopWords = [
            'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'en', 'pour', 
            'avec', 'dans', 'sur', 'est', 'sont', 'plus', 'comme', 'qui', 'que',
            'au', 'aux', 'ce', 'cette', 'ces', 'être', 'avoir', 'faire', 'peut',
            'tout', 'tous', 'toute', 'toutes', 'son', 'sa', 'ses', 'leur', 'leurs',
        ];
        
        // Compter les occurrences
        $wordCounts = [];
        foreach ($words as $word) {
            if (mb_strlen($word) > 3 && !in_array($word, $stopWords)) {
                $wordCounts[$word] = ($wordCounts[$word] ?? 0) + 1;
            }
        }

        // Trier par fréquence
        arsort($wordCounts);

        return array_slice($wordCounts, 0, $limit, true);
    }

    /**
     * Générer un excerpt intelligent (début + fin si trop long)
     */
    public static function smartExcerpt(string $text, int $maxLength = 160): string
    {
        $text = self::extractText($text);
        
        if (mb_strlen($text) <= $maxLength) {
            return $text;
        }

        // Si trop long : début + "..." + fin
        $partLength = (int) (($maxLength - 3) / 2);
        
        return mb_substr($text, 0, $partLength) . '...' . mb_substr($text, -$partLength);
    }

    /**
     * Convertir les URLs en liens cliquables
     */
    public static function autolink(string $text): string
    {
        $pattern = '/(https?:\/\/[^\s<>"]+)/i';
        
        return preg_replace(
            $pattern,
            '<a href="$1" target="_blank" rel="noopener">$1</a>',
            $text
        );
    }

    /**
     * Tronquer un texte HTML intelligemment (sans casser les balises)
     */
    public static function truncateHtml(string $html, int $maxLength = 500): string
    {
        $text = self::extractText($html);
        
        if (mb_strlen($text) <= $maxLength) {
            return $html;
        }

        // Tronquer le texte
        $truncatedText = mb_substr($text, 0, $maxLength);
        
        // Chercher le dernier espace complet
        $lastSpace = mb_strrpos($truncatedText, ' ');
        if ($lastSpace !== false) {
            $truncatedText = mb_substr($truncatedText, 0, $lastSpace);
        }
        
        return $truncatedText . '...';
    }
}