<?php

namespace App\Services\Seo;

/**
 * AnchorTextDiversityService
 * 
 * CRITIQUE: Éviter penalty Google -15 points si over-optimization
 * 
 * Distribution optimale anchor texts:
 * - Exact match: 15% (keyword exact)
 * - Partial match: 25% (keyword + variations)
 * - Branded: 20% (nom plateforme)
 * - Generic: 20% ("cliquez ici", "en savoir plus")
 * - Naked URLs: 10% (https://...)
 * - Images: 10% (alt text)
 * 
 * Google pénalise si >30% exact match = sur-optimisation détectée
 */
class AnchorTextDiversityService
{
    // Distribution cible (%)
    private const TARGET_DISTRIBUTION = [
        'exact' => 15,
        'partial' => 25,
        'branded' => 20,
        'generic' => 20,
        'naked' => 10,
        'image' => 10,
    ];
    
    // Tolerance (±%)
    private const TOLERANCE = 2;
    
    /**
     * Générer anchor text varié pour lien interne
     * 
     * @param string $targetKeyword - Keyword page cible
     * @param string $platformName - Nom plateforme
     * @param array $currentDistribution - Distribution actuelle
     * @return array ['text' => '...', 'type' => 'exact|partial|...']
     */
    public function generateAnchor(
        string $targetKeyword,
        string $platformName,
        array $currentDistribution
    ): array {
        // Déterminer type à utiliser (équilibrage)
        $neededType = $this->getNeededType($currentDistribution);
        
        switch ($neededType) {
            case 'exact':
                return [
                    'text' => $targetKeyword,
                    'type' => 'exact'
                ];
                
            case 'partial':
                $variations = $this->getPartialVariations($targetKeyword);
                return [
                    'text' => $variations[array_rand($variations)],
                    'type' => 'partial'
                ];
                
            case 'branded':
                $branded = $this->getBrandedVariations($targetKeyword, $platformName);
                return [
                    'text' => $branded[array_rand($branded)],
                    'type' => 'branded'
                ];
                
            case 'generic':
                $generic = $this->getGenericVariations();
                return [
                    'text' => $generic[array_rand($generic)],
                    'type' => 'generic'
                ];
                
            case 'naked':
                return [
                    'text' => 'URL', // Will be replaced with actual URL
                    'type' => 'naked'
                ];
                
            case 'image':
                return [
                    'text' => $this->getImageAlt($targetKeyword),
                    'type' => 'image'
                ];
        }
    }
    
    /**
     * Déterminer type anchor text nécessaire pour équilibrage
     */
    private function getNeededType(array $current): string
    {
        $needed = [];
        
        foreach (self::TARGET_DISTRIBUTION as $type => $target) {
            $currentPercent = $current[$type] ?? 0;
            $gap = $target - $currentPercent;
            
            // Si en-dessous target, ajouter à needs
            if ($gap > self::TOLERANCE) {
                $needed[$type] = $gap;
            }
        }
        
        // Si tous équilibrés, utiliser target distribution
        if (empty($needed)) {
            return $this->selectByTargetDistribution();
        }
        
        // Sinon, prioriser type avec plus grand gap
        arsort($needed);
        return array_key_first($needed);
    }
    
    /**
     * Variations partial match
     */
    private function getPartialVariations(string $keyword): array
    {
        $words = explode(' ', $keyword);
        
        return [
            // Ajouter adjectifs
            "meilleur {$keyword}",
            "guide {$keyword}",
            "{$keyword} complet",
            
            // Partial keyword
            count($words) > 1 ? $words[0] . ' ' . $words[1] : $keyword,
            
            // Avec action
            "découvrir {$keyword}",
            "tout sur {$keyword}",
        ];
    }
    
    /**
     * Variations branded
     */
    private function getBrandedVariations(string $keyword, string $platform): array
    {
        return [
            "{$platform} {$keyword}",
            "{$keyword} sur {$platform}",
            "{$keyword} - {$platform}",
            "guide {$platform}",
            "plateforme {$platform}",
        ];
    }
    
    /**
     * Variations generic (action-based)
     */
    private function getGenericVariations(): array
    {
        return [
            'en savoir plus',
            'lire la suite',
            'découvrir',
            'consulter le guide',
            'voir les détails',
            'accéder au contenu',
            'cliquez ici',
            'plus d\'informations',
        ];
    }
    
    /**
     * Image alt text avec keyword
     */
    private function getImageAlt(string $keyword): string
    {
        return "{$keyword} - illustration guide complet";
    }
    
    /**
     * Sélection aléatoire selon target distribution
     */
    private function selectByTargetDistribution(): string
    {
        $rand = rand(1, 100);
        $cumulative = 0;
        
        foreach (self::TARGET_DISTRIBUTION as $type => $percent) {
            $cumulative += $percent;
            if ($rand <= $cumulative) {
                return $type;
            }
        }
        
        return 'partial'; // Fallback
    }
    
    /**
     * Calculer distribution actuelle
     * 
     * @param int $articleId
     * @return array ['exact' => %, 'partial' => %, ...]
     */
    public function getCurrentDistribution(int $articleId): array
    {
        // Query DB pour compter types anchor texts
        $links = \DB::table('internal_links')
            ->where('source_article_id', $articleId)
            ->select('anchor_type', \DB::raw('count(*) as count'))
            ->groupBy('anchor_type')
            ->get();
        
        $total = $links->sum('count');
        if ($total === 0) return array_fill_keys(array_keys(self::TARGET_DISTRIBUTION), 0);
        
        $distribution = [];
        foreach ($links as $link) {
            $distribution[$link->anchor_type] = round(($link->count / $total) * 100, 1);
        }
        
        // Fill missing types
        foreach (self::TARGET_DISTRIBUTION as $type => $target) {
            if (!isset($distribution[$type])) {
                $distribution[$type] = 0;
            }
        }
        
        return $distribution;
    }
    
    /**
     * Vérifier si distribution est dans tolérance
     * 
     * @return array ['compliant' => bool, 'issues' => [...]]
     */
    public function validateDistribution(array $distribution): array
    {
        $issues = [];
        
        foreach (self::TARGET_DISTRIBUTION as $type => $target) {
            $current = $distribution[$type] ?? 0;
            $gap = abs($target - $current);
            
            if ($gap > self::TOLERANCE) {
                $issues[] = [
                    'type' => $type,
                    'target' => $target,
                    'current' => $current,
                    'gap' => $gap,
                    'severity' => $gap > 10 ? 'high' : 'medium'
                ];
            }
        }
        
        // CRITIQUE: Exact match >30% = penalty Google
        if (($distribution['exact'] ?? 0) > 30) {
            $issues[] = [
                'type' => 'exact',
                'target' => 15,
                'current' => $distribution['exact'],
                'gap' => $distribution['exact'] - 15,
                'severity' => 'critical', // PENALTY GOOGLE -15 pts
                'message' => 'DANGER: Over-optimization détectée (>30% exact match)'
            ];
        }
        
        return [
            'compliant' => empty($issues),
            'issues' => $issues
        ];
    }
}
