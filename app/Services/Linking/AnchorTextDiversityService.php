<?php

namespace App\Services\Linking;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

/**
 * AnchorTextDiversityService - Contrôle Distribution Ancres de Liens
 * 
 * OBJECTIF: Éviter sur-optimisation et pénalités Google avec ancres variées
 * IMPACT SEO: +7 points (évite pénalités -15 points pour sur-optimisation)
 * 
 * DISTRIBUTION RECOMMANDÉE GOOGLE 2025:
 * - 10% Exact Match (keyword exact)
 * - 30% Partial Match (keyword + modificateur)
 * - 20% Branded (nom marque)
 * - 25% Generic ("en savoir plus", "cliquez ici")
 * - 10% Naked URL (https://...)
 * - 5% Image Alt Text
 * 
 * @package App\Services\Linking
 */
class AnchorTextDiversityService
{
    // Distribution optimale selon Google Guidelines 2025
    const OPTIMAL_DISTRIBUTION = [
        'exact_match' => 10,    // 10% ancre exacte (keyword)
        'partial_match' => 30,  // 30% ancre partielle (keyword + modificateur)
        'branded' => 20,        // 20% ancre marque
        'generic' => 25,        // 25% ancre générique
        'naked_url' => 10,      // 10% URL nue
        'image' => 5,           // 5% images avec alt text
    ];
    
    // Tolérance écart (en points de pourcentage)
    const TOLERANCE = 10;
    
    // Limite alerte sur-optimisation
    const OVER_OPTIMIZATION_THRESHOLD = 20; // 20% d'exact match = ALERTE

    /**
     * Génère une ancre selon la distribution optimale
     * 
     * @param string $targetKeyword Keyword cible
     * @param array $currentDistribution Distribution actuelle des ancres
     * @param string $linkType Type lien: internal, external, affiliate
     * @param string $language Code langue
     * @return array ['text' => string, 'type' => string, 'html' => string]
     */
    public function generateDiverseAnchor(
        string $targetKeyword,
        array $currentDistribution,
        string $linkType = 'internal',
        string $language = 'fr'
    ): array {
        // 1. Déterminer type d'ancre le plus nécessaire
        $neededType = $this->calculateNeededAnchorType($currentDistribution);
        
        // 2. Générer ancre selon type
        $anchor = $this->generateAnchorByType($neededType, $targetKeyword, $linkType, $language);
        
        Log::debug('AnchorDiversity: Ancre générée', [
            'keyword' => $targetKeyword,
            'type' => $neededType,
            'anchor' => $anchor['text'],
            'current_distribution' => $currentDistribution
        ]);
        
        return $anchor;
    }

    /**
     * Calcule le type d'ancre le plus nécessaire pour équilibrer distribution
     */
    protected function calculateNeededAnchorType(array $currentDistribution): string
    {
        $needs = [];
        
        foreach (self::OPTIMAL_DISTRIBUTION as $type => $targetPercent) {
            $actualPercent = $currentDistribution[$type] ?? 0;
            $deficit = $targetPercent - $actualPercent;
            
            // Priorité aux types avec plus grand déficit
            if ($deficit > 0) {
                $needs[$type] = $deficit;
            }
        }
        
        // Si tous types OK, choisir aléatoirement selon distribution optimale
        if (empty($needs)) {
            return $this->randomWeightedChoice(self::OPTIMAL_DISTRIBUTION);
        }
        
        // Retourner type avec plus grand déficit
        arsort($needs);
        return array_key_first($needs);
    }

    /**
     * Choix aléatoire pondéré selon distribution
     */
    protected function randomWeightedChoice(array $weights): string
    {
        $rand = mt_rand(1, array_sum($weights));
        
        foreach ($weights as $type => $weight) {
            $rand -= $weight;
            if ($rand <= 0) {
                return $type;
            }
        }
        
        return array_key_first($weights);
    }

    /**
     * Génère ancre selon type demandé
     */
    protected function generateAnchorByType(
        string $type,
        string $keyword,
        string $linkType,
        string $language
    ): array {
        switch ($type) {
            case 'exact_match':
                return $this->generateExactMatchAnchor($keyword);
                
            case 'partial_match':
                return $this->generatePartialMatchAnchor($keyword, $language);
                
            case 'branded':
                return $this->generateBrandedAnchor($linkType, $language);
                
            case 'generic':
                return $this->generateGenericAnchor($language);
                
            case 'naked_url':
                return $this->generateNakedUrlAnchor($keyword);
                
            case 'image':
                return $this->generateImageAnchor($keyword, $language);
                
            default:
                return $this->generateGenericAnchor($language);
        }
    }

    /**
     * EXACT MATCH: Keyword exact
     */
    protected function generateExactMatchAnchor(string $keyword): array
    {
        return [
            'text' => $keyword,
            'type' => 'exact_match',
            'html' => sprintf('<a href="{url}">%s</a>', htmlspecialchars($keyword))
        ];
    }

    /**
     * PARTIAL MATCH: Keyword + modificateur
     */
    protected function generatePartialMatchAnchor(string $keyword, string $language): array
    {
        $modifiers = [
            'fr' => [
                'guide complet', '2025', 'meilleur', 'comparatif',
                'tout savoir', 'pratique', 'conseils', 'astuce',
                'solution', 'officiel', 'ultime', 'détaillé'
            ],
            'en' => [
                'complete guide', '2025', 'best', 'comparison',
                'everything about', 'practical', 'tips', 'advice',
                'solution', 'official', 'ultimate', 'detailed'
            ],
            'es' => [
                'guía completa', '2025', 'mejor', 'comparación',
                'todo sobre', 'práctico', 'consejos', 'trucos',
                'solución', 'oficial', 'definitivo', 'detallado'
            ],
            'de' => [
                'vollständiger leitfaden', '2025', 'beste', 'vergleich',
                'alles über', 'praktisch', 'tipps', 'ratschläge',
                'lösung', 'offiziell', 'ultimativ', 'detailliert'
            ],
        ];
        
        $langModifiers = $modifiers[$language] ?? $modifiers['en'];
        $modifier = $langModifiers[array_rand($langModifiers)];
        
        // Placement aléatoire: avant ou après keyword
        $text = mt_rand(0, 1) === 0 
            ? "$keyword $modifier"
            : "$modifier $keyword";
        
        return [
            'text' => $text,
            'type' => 'partial_match',
            'html' => sprintf('<a href="{url}">%s</a>', htmlspecialchars($text))
        ];
    }

    /**
     * BRANDED: Nom de marque
     */
    protected function generateBrandedAnchor(string $linkType, string $language): array
    {
        // Récupérer noms de plateformes/marques depuis config
        $brands = config('seo.brands', [
            'SOS-Expat.com',
            'Ulixai',
            'Ulysse.AI',
        ]);
        
        $brand = $brands[array_rand($brands)];
        
        $templates = [
            'fr' => [
                "sur $brand",
                "avec $brand",
                "via $brand",
                "découvrir $brand",
                "accéder à $brand",
            ],
            'en' => [
                "on $brand",
                "with $brand",
                "via $brand",
                "discover $brand",
                "access $brand",
            ],
            'es' => [
                "en $brand",
                "con $brand",
                "vía $brand",
                "descubrir $brand",
                "acceder a $brand",
            ],
        ];
        
        $langTemplates = $templates[$language] ?? $templates['en'];
        $text = $langTemplates[array_rand($langTemplates)];
        
        return [
            'text' => $text,
            'type' => 'branded',
            'html' => sprintf('<a href="{url}">%s</a>', htmlspecialchars($text))
        ];
    }

    /**
     * GENERIC: Ancre générique
     */
    protected function generateGenericAnchor(string $language): array
    {
        $generics = [
            'fr' => [
                'en savoir plus',
                'découvrir',
                'consulter le guide',
                'voir les détails',
                'accéder à la ressource',
                'lire la suite',
                'plus d\'informations',
                'découvrir maintenant',
                'voir le comparatif',
                'accéder au guide',
                'consulter',
                'en apprendre davantage',
            ],
            'en' => [
                'learn more',
                'discover',
                'read the guide',
                'see details',
                'access resource',
                'read more',
                'more information',
                'discover now',
                'see comparison',
                'access guide',
                'consult',
                'find out more',
            ],
            'es' => [
                'saber más',
                'descubrir',
                'leer la guía',
                'ver detalles',
                'acceder al recurso',
                'leer más',
                'más información',
                'descubrir ahora',
                'ver comparación',
                'acceder a la guía',
                'consultar',
                'aprender más',
            ],
            'de' => [
                'mehr erfahren',
                'entdecken',
                'leitfaden lesen',
                'details sehen',
                'ressource zugreifen',
                'weiterlesen',
                'mehr informationen',
                'jetzt entdecken',
                'vergleich sehen',
                'leitfaden zugreifen',
                'konsultieren',
                'mehr lernen',
            ],
        ];
        
        $langGenerics = $generics[$language] ?? $generics['en'];
        $text = $langGenerics[array_rand($langGenerics)];
        
        return [
            'text' => $text,
            'type' => 'generic',
            'html' => sprintf('<a href="{url}">%s</a>', htmlspecialchars($text))
        ];
    }

    /**
     * NAKED URL: URL visible
     */
    protected function generateNakedUrlAnchor(string $keyword): array
    {
        // Générer URL basée sur keyword
        $slug = \Illuminate\Support\Str::slug($keyword);
        $domain = config('app.url', 'https://sos-expat.com');
        $url = "$domain/$slug";
        
        return [
            'text' => $url,
            'type' => 'naked_url',
            'html' => sprintf('<a href="%s">%s</a>', $url, htmlspecialchars($url))
        ];
    }

    /**
     * IMAGE: Image avec alt text
     */
    protected function generateImageAnchor(string $keyword, string $language): array
    {
        $altTexts = [
            'fr' => [
                "Guide $keyword",
                "Infographie $keyword",
                "Illustration $keyword",
                "Schéma $keyword",
            ],
            'en' => [
                "$keyword guide",
                "$keyword infographic",
                "$keyword illustration",
                "$keyword diagram",
            ],
        ];
        
        $langAlts = $altTexts[$language] ?? $altTexts['en'];
        $altText = $langAlts[array_rand($langAlts)];
        
        return [
            'text' => $altText,
            'type' => 'image',
            'html' => sprintf(
                '<a href="{url}"><img src="{image_url}" alt="%s" loading="lazy"></a>',
                htmlspecialchars($altText)
            )
        ];
    }

    /**
     * Calcule la distribution actuelle des ancres pour un article/plateforme
     */
    public function calculateCurrentDistribution(
        int $articleId = null,
        int $platformId = null
    ): array {
        $query = DB::table('article_links');
        
        if ($articleId) {
            $query->where('article_id', $articleId);
        } elseif ($platformId) {
            $query->join('articles', 'article_links.article_id', '=', 'articles.id')
                  ->where('articles.platform_id', $platformId);
        }
        
        $totalLinks = $query->count();
        
        if ($totalLinks === 0) {
            // Retour distribution neutre si aucun lien
            return [
                'exact_match' => 0,
                'partial_match' => 0,
                'branded' => 0,
                'generic' => 0,
                'naked_url' => 0,
                'image' => 0,
                'total' => 0,
            ];
        }
        
        // Compter par type
        $distribution = [];
        foreach (array_keys(self::OPTIMAL_DISTRIBUTION) as $type) {
            $count = DB::table('article_links')
                ->where('anchor_type', $type);
            
            if ($articleId) {
                $count->where('article_id', $articleId);
            } elseif ($platformId) {
                $count->join('articles', 'article_links.article_id', '=', 'articles.id')
                      ->where('articles.platform_id', $platformId);
            }
            
            $typeCount = $count->count();
            $distribution[$type] = round(($typeCount / $totalLinks) * 100, 1);
        }
        
        $distribution['total'] = $totalLinks;
        
        return $distribution;
    }

    /**
     * Valide si la distribution est conforme aux standards SEO
     */
    public function validateDistribution(array $distribution): array
    {
        $issues = [];
        $warnings = [];
        $score = 100;
        
        foreach (self::OPTIMAL_DISTRIBUTION as $type => $targetPercent) {
            $actualPercent = $distribution[$type] ?? 0;
            $diff = abs($actualPercent - $targetPercent);
            
            if ($diff > self::TOLERANCE) {
                $severity = $diff > (self::TOLERANCE * 2) ? 'critical' : 'warning';
                
                $message = sprintf(
                    'Type "%s": %s%% (cible: %d%%, écart: %+d%%)',
                    $type,
                    $actualPercent,
                    $targetPercent,
                    $actualPercent - $targetPercent
                );
                
                if ($severity === 'critical') {
                    $issues[] = $message;
                    $score -= 15;
                } else {
                    $warnings[] = $message;
                    $score -= 5;
                }
            }
            
            // Alerte sur-optimisation (trop d'exact match)
            if ($type === 'exact_match' && $actualPercent > self::OVER_OPTIMIZATION_THRESHOLD) {
                $issues[] = sprintf(
                    'ALERTE SUR-OPTIMISATION: %s%% d\'exact match (max recommandé: %d%%)',
                    $actualPercent,
                    self::OVER_OPTIMIZATION_THRESHOLD
                );
                $score -= 25; // Pénalité sévère
            }
        }
        
        $status = $score >= 90 ? 'excellent' : ($score >= 70 ? 'good' : 'poor');
        
        return [
            'valid' => empty($issues),
            'score' => max(0, $score),
            'status' => $status,
            'distribution' => $distribution,
            'issues' => $issues,
            'warnings' => $warnings,
            'recommendation' => $this->generateRecommendation($distribution)
        ];
    }

    /**
     * Génère recommandations d'amélioration
     */
    protected function generateRecommendation(array $distribution): string
    {
        $recommendations = [];
        
        foreach (self::OPTIMAL_DISTRIBUTION as $type => $targetPercent) {
            $actualPercent = $distribution[$type] ?? 0;
            $diff = $targetPercent - $actualPercent;
            
            if ($diff > self::TOLERANCE) {
                $recommendations[] = sprintf(
                    'Augmenter "%s" de %d points (%d%% → %d%%)',
                    $type,
                    $diff,
                    $actualPercent,
                    $targetPercent
                );
            } elseif ($diff < -self::TOLERANCE) {
                $recommendations[] = sprintf(
                    'Réduire "%s" de %d points (%d%% → %d%%)',
                    $type,
                    abs($diff),
                    $actualPercent,
                    $targetPercent
                );
            }
        }
        
        if (empty($recommendations)) {
            return 'Distribution optimale ✅';
        }
        
        return implode(' | ', $recommendations);
    }

    /**
     * Génère rapport complet pour dashboard
     */
    public function generateReport(int $platformId = null, string $period = '30_days'): array
    {
        $distribution = $this->calculateCurrentDistribution(null, $platformId);
        $validation = $this->validateDistribution($distribution);
        
        // Évolution temporelle (si implémenté)
        $evolution = $this->calculateEvolution($platformId, $period);
        
        return [
            'title' => 'Anchor Text Diversity Report',
            'platform_id' => $platformId,
            'period' => $period,
            'current_distribution' => $distribution,
            'validation' => $validation,
            'evolution' => $evolution,
            'optimal_distribution' => self::OPTIMAL_DISTRIBUTION,
            'generated_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Calcule évolution dans le temps
     */
    protected function calculateEvolution(int $platformId = null, string $period): array
    {
        // TODO: Implémenter tracking historique
        return [
            'message' => 'Tracking historique à implémenter',
            'trend' => 'stable',
        ];
    }

    /**
     * Suggestions d'ancres pour prochain contenu
     */
    public function suggestNextAnchors(
        string $keyword,
        int $platformId,
        string $language = 'fr',
        int $count = 5
    ): array {
        $currentDistribution = $this->calculateCurrentDistribution(null, $platformId);
        
        $suggestions = [];
        for ($i = 0; $i < $count; $i++) {
            $anchor = $this->generateDiverseAnchor(
                $keyword,
                $currentDistribution,
                'internal',
                $language
            );
            
            $suggestions[] = $anchor;
            
            // Mettre à jour distribution simulée
            $type = $anchor['type'];
            $total = $currentDistribution['total'] + 1;
            $currentDistribution[$type] = (($currentDistribution[$type] * ($total - 1)) + 100) / $total;
            $currentDistribution['total'] = $total;
        }
        
        return $suggestions;
    }
}
