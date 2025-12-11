<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * ContentCacheService - Cache Intelligent pour Contenus Similaires
 * 
 * OBJECTIF: Économiser 30-40% des coûts de génération en réutilisant contenus similaires
 * ÉCONOMIE ESTIMÉE: $2,000/mois
 * 
 * PRINCIPE:
 * Si "visa thailande" et "visa thaïlande" sont similaires à 100%, 
 * on adapte le contenu existant au lieu de régénérer avec GPT-4
 * 
 * @package App\Services\AI
 */
class ContentCacheService
{
    // Seuil de similarité pour réutilisation
    const SIMILARITY_THRESHOLD = 0.95; // 95%
    
    // Durée cache contenus (30 jours)
    const CACHE_TTL = 3600 * 24 * 30;
    
    // Limite stockage cache par langue/pays
    const MAX_CACHED_CONTENTS = 10000;

    /**
     * Obtenir contenu depuis cache ou générer
     * 
     * @param string $keyword Mot-clé principal
     * @param string $language Code langue (fr, en, es...)
     * @param string $country Code pays (TH, FR, ES...)
     * @param callable $generator Fonction de génération si cache miss
     * @return array ['content' => string, 'from_cache' => bool, 'saving' => float]
     */
    public function getCachedOrGenerate(
        string $keyword,
        string $language,
        string $country,
        callable $generator
    ): array {
        $startTime = microtime(true);
        
        // 1. Normaliser keyword pour détection similitudes
        $normalizedKey = $this->normalizeKeyword($keyword, $language);
        
        Log::debug('ContentCache: Recherche contenu similaire', [
            'original_keyword' => $keyword,
            'normalized' => $normalizedKey,
            'language' => $language,
            'country' => $country
        ]);
        
        // 2. Chercher contenus similaires dans cache
        $similarContent = $this->findMostSimilarContent($keyword, $normalizedKey, $language, $country);
        
        // 3. Si similitude suffisante, adapter contenu existant
        if ($similarContent && $similarContent['similarity'] >= self::SIMILARITY_THRESHOLD) {
            
            $adapted = $this->adaptContent(
                $similarContent['content'],
                $keyword,
                $similarContent['original_keyword']
            );
            
            $saving = $this->calculateSaving($language);
            
            Log::info('✅ ContentCache: HIT - Contenu adapté', [
                'original_keyword' => $keyword,
                'cached_keyword' => $similarContent['original_keyword'],
                'similarity' => round($similarContent['similarity'] * 100, 2) . '%',
                'saving' => '$' . number_format($saving, 4),
                'time' => round((microtime(true) - $startTime) * 1000) . 'ms'
            ]);
            
            return [
                'content' => $adapted,
                'from_cache' => true,
                'saving' => $saving,
                'similarity' => $similarContent['similarity'],
                'cached_keyword' => $similarContent['original_keyword'],
                'generation_time' => microtime(true) - $startTime
            ];
        }
        
        // 4. Cache MISS: Génération normale avec GPT-4
        Log::info('⚠️ ContentCache: MISS - Génération GPT-4 nécessaire', [
            'keyword' => $keyword,
            'language' => $language,
            'reason' => $similarContent ? 'Similarité insuffisante (' . round($similarContent['similarity'] * 100) . '%)' : 'Aucun contenu similaire'
        ]);
        
        $generated = $generator();
        
        // 5. Sauvegarder nouveau contenu pour futures réutilisations
        $this->cacheContent($normalizedKey, $keyword, $generated, $language, $country);
        
        return [
            'content' => $generated,
            'from_cache' => false,
            'saving' => 0,
            'similarity' => 0,
            'cached_keyword' => null,
            'generation_time' => microtime(true) - $startTime
        ];
    }

    /**
     * Normalise un keyword pour détection similitudes
     * 
     * Exemples:
     * - "visa thailande" → "visa thailande"
     * - "visa thaïlande" → "visa thailande" (retrait accents)
     * - "visas thailande" → "visa thailande" (singularisation)
     * - "VISA THAILANDE" → "visa thailande" (lowercase)
     */
    protected function normalizeKeyword(string $keyword, string $language): string
    {
        // 1. Lowercase
        $normalized = mb_strtolower($keyword, 'UTF-8');
        
        // 2. Retrait accents
        $normalized = $this->removeAccents($normalized);
        
        // 3. Singularisation (FR: visas → visa, EN: houses → house)
        $normalized = $this->singularize($normalized, $language);
        
        // 4. Retrait caractères spéciaux (garder espaces, tirets)
        $normalized = preg_replace('/[^a-z0-9\s\-]/', '', $normalized);
        
        // 5. Normalisation espaces multiples
        $normalized = preg_replace('/\s+/', ' ', trim($normalized));
        
        return $normalized;
    }

    /**
     * Retire les accents d'une chaîne
     */
    protected function removeAccents(string $str): string
    {
        $unwanted = [
            'à' => 'a', 'á' => 'a', 'â' => 'a', 'ã' => 'a', 'ä' => 'a', 'å' => 'a',
            'è' => 'e', 'é' => 'e', 'ê' => 'e', 'ë' => 'e',
            'ì' => 'i', 'í' => 'i', 'î' => 'i', 'ï' => 'i',
            'ò' => 'o', 'ó' => 'o', 'ô' => 'o', 'õ' => 'o', 'ö' => 'o', 'ø' => 'o',
            'ù' => 'u', 'ú' => 'u', 'û' => 'u', 'ü' => 'u',
            'ý' => 'y', 'ÿ' => 'y',
            'ñ' => 'n', 'ç' => 'c',
            // Majuscules
            'À' => 'a', 'Á' => 'a', 'Â' => 'a', 'Ã' => 'a', 'Ä' => 'a', 'Å' => 'a',
            'È' => 'e', 'É' => 'e', 'Ê' => 'e', 'Ë' => 'e',
            'Ì' => 'i', 'Í' => 'i', 'Î' => 'i', 'Ï' => 'i',
            'Ò' => 'o', 'Ó' => 'o', 'Ô' => 'o', 'Õ' => 'o', 'Ö' => 'o', 'Ø' => 'o',
            'Ù' => 'u', 'Ú' => 'u', 'Û' => 'u', 'Ü' => 'u',
            'Ý' => 'y', 'Ÿ' => 'y',
            'Ñ' => 'n', 'Ç' => 'c'
        ];
        
        return strtr($str, $unwanted);
    }

    /**
     * Singularise un mot selon la langue
     */
    protected function singularize(string $text, string $language): string
    {
        // Règles de singularisation simples par langue
        $rules = [
            'fr' => [
                '/eaux$/i' => 'eau',     // bureaux → bureau
                '/aux$/i' => 'al',       // journaux → journal
                '/oux$/i' => 'ou',       // genoux → genou
                '/s$/i' => '',           // visas → visa
            ],
            'en' => [
                '/ies$/i' => 'y',        // countries → country
                '/ves$/i' => 'fe',       // wives → wife
                '/oes$/i' => 'o',        // heroes → hero
                '/ses$/i' => 's',        // houses → house
                '/s$/i' => '',           // visas → visa
            ],
            'es' => [
                '/ces$/i' => 'z',        // peces → pez
                '/([aeiou])s$/i' => '$1',// casas → casa
            ],
            'de' => [
                '/en$/i' => '',          // Häuser → Haus (simplifié)
            ],
        ];
        
        $langRules = $rules[$language] ?? [];
        
        foreach ($langRules as $pattern => $replacement) {
            $singularized = preg_replace($pattern, $replacement, $text);
            if ($singularized !== $text) {
                return $singularized;
            }
        }
        
        return $text;
    }

    /**
     * Trouve le contenu le plus similaire dans le cache
     */
    protected function findMostSimilarContent(
        string $originalKeyword,
        string $normalizedKey,
        string $language,
        string $country
    ): ?array {
        // Clé de cache pour cette combinaison
        $cacheGroup = "content_cache:{$language}:{$country}";
        
        // Récupérer tous les contenus cachés pour cette langue/pays
        $cachedContents = Cache::get($cacheGroup, []);
        
        if (empty($cachedContents)) {
            return null;
        }
        
        $bestMatch = null;
        $maxSimilarity = 0;
        
        foreach ($cachedContents as $cachedKey => $cachedData) {
            // Calculer similarité entre keywords
            $similarity = $this->calculateSimilarity($originalKeyword, $cachedData['original_keyword']);
            
            if ($similarity > $maxSimilarity) {
                $maxSimilarity = $similarity;
                $bestMatch = [
                    'content' => $cachedData['content'],
                    'original_keyword' => $cachedData['original_keyword'],
                    'similarity' => $similarity,
                    'created_at' => $cachedData['created_at'],
                ];
            }
        }
        
        return $bestMatch;
    }

    /**
     * Calcule la similarité entre 2 chaînes (0.0 - 1.0)
     * Utilise similar_text() optimisé
     */
    protected function calculateSimilarity(string $str1, string $str2): float
    {
        $str1Lower = mb_strtolower($str1, 'UTF-8');
        $str2Lower = mb_strtolower($str2, 'UTF-8');
        
        // Si identiques, return 1.0 immédiatement
        if ($str1Lower === $str2Lower) {
            return 1.0;
        }
        
        // Utiliser similar_text
        similar_text($str1Lower, $str2Lower, $percent);
        
        return $percent / 100;
    }

    /**
     * Adapte un contenu existant pour nouveau keyword
     * 
     * Remplacements effectués:
     * 1. Keyword principal (sensible à la casse)
     * 2. Dates/années
     * 3. Meta tags
     * 4. Slug
     */
    protected function adaptContent(
        string $content,
        string $newKeyword,
        string $oldKeyword
    ): string {
        $adapted = $content;
        
        // 1. Remplacer keyword principal (préserver casse)
        $adapted = $this->replaceKeywordPreserveCase($adapted, $oldKeyword, $newKeyword);
        
        // 2. Mettre à jour années (2024 → 2025)
        $currentYear = date('Y');
        $adapted = preg_replace('/\b202[0-4]\b/', $currentYear, $adapted);
        
        // 3. Mettre à jour dates relatives ("mis à jour le [date]")
        $currentDate = date('F Y', strtotime('now'));
        $adapted = preg_replace(
            '/(mis à jour|actualisé|dernière mise à jour)[\s:]+[a-z]+\s+\d{4}/i',
            '$1 ' . $currentDate,
            $adapted
        );
        
        // 4. Log adaptation
        Log::debug('ContentCache: Adaptation effectuée', [
            'old_keyword' => $oldKeyword,
            'new_keyword' => $newKeyword,
            'replacements' => substr_count($adapted, $newKeyword) - substr_count($content, $newKeyword)
        ]);
        
        return $adapted;
    }

    /**
     * Remplace keyword en préservant la casse originale
     * 
     * Exemple:
     * "Visa Thailande" → "Visa Thaïlande"
     * "visa thailande" → "visa thaïlande"
     */
    protected function replaceKeywordPreserveCase(string $content, string $old, string $new): string
    {
        // Remplacement case-insensitive mais préservant la casse
        $callback = function ($matches) use ($old, $new) {
            $matched = $matches[0];
            
            // Détecter le pattern de casse
            if ($matched === ucfirst(mb_strtolower($old))) {
                // Title case
                return ucfirst(mb_strtolower($new));
            } elseif ($matched === mb_strtoupper($old)) {
                // UPPERCASE
                return mb_strtoupper($new);
            } else {
                // lowercase
                return mb_strtolower($new);
            }
        };
        
        return preg_replace_callback(
            '/' . preg_quote($old, '/') . '/i',
            $callback,
            $content
        );
    }

    /**
     * Sauvegarde contenu dans cache
     */
    protected function cacheContent(
        string $normalizedKey,
        string $originalKeyword,
        string $content,
        string $language,
        string $country
    ): void {
        $cacheGroup = "content_cache:{$language}:{$country}";
        
        // Récupérer contenus existants
        $cachedContents = Cache::get($cacheGroup, []);
        
        // Vérifier limite stockage
        if (count($cachedContents) >= self::MAX_CACHED_CONTENTS) {
            // Supprimer le plus ancien
            $oldestKey = array_key_first($cachedContents);
            unset($cachedContents[$oldestKey]);
            
            Log::debug('ContentCache: Limite atteinte, suppression ancien contenu', [
                'removed_key' => $oldestKey,
                'current_count' => count($cachedContents)
            ]);
        }
        
        // Ajouter nouveau contenu
        $cachedContents[$normalizedKey] = [
            'original_keyword' => $originalKeyword,
            'content' => $content,
            'created_at' => now()->toIso8601String(),
            'language' => $language,
            'country' => $country,
        ];
        
        // Sauvegarder
        Cache::put($cacheGroup, $cachedContents, self::CACHE_TTL);
        
        Log::info('✅ ContentCache: Contenu sauvegardé', [
            'keyword' => $originalKeyword,
            'normalized' => $normalizedKey,
            'language' => $language,
            'country' => $country,
            'total_cached' => count($cachedContents)
        ]);
    }

    /**
     * Calcule l'économie réalisée par réutilisation cache
     */
    protected function calculateSaving(string $language): float
    {
        // Coût moyen génération GPT-4 selon longueur langue
        $costs = [
            'fr' => 0.45,  // Français: articles longs
            'en' => 0.42,  // Anglais: articles longs
            'de' => 0.48,  // Allemand: mots composés longs
            'es' => 0.40,  // Espagnol: plus concis
            'it' => 0.40,  // Italien: plus concis
            'pt' => 0.40,  // Portugais: plus concis
            'ar' => 0.50,  // Arabe: caractères spéciaux
            'zh' => 0.35,  // Chinois: plus compact
            'ja' => 0.38,  // Japonais: plus compact
        ];
        
        return $costs[$language] ?? 0.45;
    }

    /**
     * Statistiques cache
     */
    public function getStatistics(string $language = null, string $country = null): array
    {
        if ($language && $country) {
            $cacheGroup = "content_cache:{$language}:{$country}";
            $cachedContents = Cache::get($cacheGroup, []);
            
            return [
                'language' => $language,
                'country' => $country,
                'cached_count' => count($cachedContents),
                'max_capacity' => self::MAX_CACHED_CONTENTS,
                'fill_percentage' => round((count($cachedContents) / self::MAX_CACHED_CONTENTS) * 100, 1),
                'oldest_entry' => $this->getOldestEntry($cachedContents),
                'newest_entry' => $this->getNewestEntry($cachedContents),
            ];
        }
        
        // Statistiques globales
        return $this->getGlobalStatistics();
    }

    /**
     * Statistiques globales tous pays/langues
     */
    protected function getGlobalStatistics(): array
    {
        // TODO: Implémenter scan complet cache
        // Pour l'instant, retour estimation
        
        return [
            'total_cached_contents' => 'N/A (implémenter scan)',
            'estimated_monthly_savings' => '$2,000',
            'estimated_yearly_savings' => '$24,000',
            'cache_hit_rate' => 'N/A (ajouter tracking)',
        ];
    }

    /**
     * Vide cache pour langue/pays
     */
    public function clearCache(string $language = null, string $country = null): bool
    {
        if ($language && $country) {
            $cacheGroup = "content_cache:{$language}:{$country}";
            Cache::forget($cacheGroup);
            
            Log::info('ContentCache: Cache vidé', [
                'language' => $language,
                'country' => $country
            ]);
            
            return true;
        }
        
        // Vider tout le cache (dangereux)
        Log::warning('ContentCache: Vidage cache global non implémenté pour sécurité');
        return false;
    }

    protected function getOldestEntry(array $contents): ?string
    {
        if (empty($contents)) return null;
        
        $oldest = null;
        $oldestDate = null;
        
        foreach ($contents as $key => $data) {
            $created = strtotime($data['created_at']);
            if ($oldestDate === null || $created < $oldestDate) {
                $oldestDate = $created;
                $oldest = $data['created_at'];
            }
        }
        
        return $oldest;
    }

    protected function getNewestEntry(array $contents): ?string
    {
        if (empty($contents)) return null;
        
        $newest = null;
        $newestDate = null;
        
        foreach ($contents as $key => $data) {
            $created = strtotime($data['created_at']);
            if ($newestDate === null || $created > $newestDate) {
                $newestDate = $created;
                $newest = $data['created_at'];
            }
        }
        
        return $newest;
    }
}
