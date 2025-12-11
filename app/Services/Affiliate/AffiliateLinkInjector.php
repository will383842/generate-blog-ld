<?php

namespace App\Services\Affiliate;

use App\Services\Affiliate\AffiliateKeywordService;

/**
 * AffiliateLinkInjector
 * 
 * Injecte liens affiliés contextuels dans contenus générés
 * 
 * STRATÉGIE:
 * - Max 3-5 liens affiliés par article (éviter sur-affiliation)
 * - Position naturelle (dans contexte pertinent)
 * - Formats variés (texte, boutons, cards)
 * - Tracking complet
 * 
 * UTILISATION:
 * 
 * $injector = new AffiliateLinkInjector();
 * 
 * $enrichedContent = $injector->inject($content, $keyword, [
 *     'max_links' => 3,
 *     'formats' => ['text', 'button'],
 *     'density' => 0.02 // 2% du contenu
 * ]);
 */
class AffiliateLinkInjector
{
    private AffiliateKeywordService $keywordService;
    
    public function __construct()
    {
        $this->keywordService = new AffiliateKeywordService();
    }
    
    /**
     * Injecter liens affiliés dans contenu
     * 
     * @param string $content - Contenu HTML
     * @param string $mainKeyword - Keyword principal
     * @param array $options - Options injection
     * @return string Contenu enrichi
     */
    public function inject(string $content, string $mainKeyword, array $options = []): string
    {
        // Options par défaut
        $maxLinks = $options['max_links'] ?? 3;
        $formats = $options['formats'] ?? ['text', 'button'];
        $density = $options['density'] ?? 0.02; // 2%
        
        // Détecter opportunités
        $opportunities = $this->keywordService->detectOpportunities($content, $mainKeyword);
        
        if (empty($opportunities)) {
            return $content; // Pas d'opportunités
        }
        
        // Limiter nombre liens
        $opportunities = array_slice($opportunities, 0, $maxLinks);
        
        // Injecter chaque opportunité
        foreach ($opportunities as $index => $opportunity) {
            $format = $formats[$index % count($formats)];
            
            $content = $this->injectOpportunity(
                $content,
                $opportunity,
                $format,
                $index
            );
        }
        
        return $content;
    }
    
    /**
     * Injecter une opportunité spécifique
     */
    private function injectOpportunity(
        string $content,
        array $opportunity,
        string $format,
        int $position
    ): string {
        $keyword = $opportunity['keyword'];
        $html = $this->keywordService->formatOpportunity($opportunity, $format);
        
        // Stratégies injection selon format
        switch ($format) {
            case 'text':
                // Remplacer première occurrence keyword par lien
                $content = $this->replaceFirstOccurrence($content, $keyword, $html);
                break;
                
            case 'button':
                // Insérer après section pertinente
                $content = $this->insertAfterSection($content, $html, $keyword);
                break;
                
            case 'card':
                // Insérer dans sidebar ou fin article
                $content = $this->insertCard($content, $html);
                break;
        }
        
        // Tracker impression
        $this->keywordService->trackEvent($opportunity['program'], 'impression', [
            'keyword' => $keyword,
            'format' => $format,
            'position' => $position,
        ]);
        
        return $content;
    }
    
    /**
     * Remplacer première occurrence (texte inline)
     */
    private function replaceFirstOccurrence(string $content, string $keyword, string $replacement): string
    {
        // Chercher keyword dans texte (pas dans balises HTML)
        $pattern = '/(?<=>)([^<]*?)' . preg_quote($keyword, '/') . '/i';
        
        return preg_replace($pattern, '$1' . $replacement, $content, 1);
    }
    
    /**
     * Insérer bouton après section pertinente
     */
    private function insertAfterSection(string $content, string $html, string $keyword): string
    {
        // Chercher section H2/H3 contenant keyword
        $pattern = '/<(h[23])[^>]*>.*?' . preg_quote($keyword, '/') . '.*?<\/\1>(.*?)(<h[23]|$)/is';
        
        if (preg_match($pattern, $content, $matches, PREG_OFFSET_CAPTURE)) {
            $insertPos = $matches[2][1];
            
            $before = substr($content, 0, $insertPos);
            $after = substr($content, $insertPos);
            
            return $before . "\n\n<div class=\"affiliate-cta\">{$html}</div>\n\n" . $after;
        }
        
        // Fallback: insérer à 60% du contenu
        $insertPos = (int)(strlen($content) * 0.6);
        $before = substr($content, 0, $insertPos);
        $after = substr($content, $insertPos);
        
        return $before . "\n\n<div class=\"affiliate-cta\">{$html}</div>\n\n" . $after;
    }
    
    /**
     * Insérer card (sidebar ou fin)
     */
    private function insertCard(string $content, string $html): string
    {
        // Insérer avant conclusion ou à la fin
        $conclusionPos = stripos($content, '<h2>Conclusion</h2>');
        
        if ($conclusionPos !== false) {
            $before = substr($content, 0, $conclusionPos);
            $after = substr($content, $conclusionPos);
            
            return $before . "\n\n{$html}\n\n" . $after;
        }
        
        // Fallback: fin de contenu
        return $content . "\n\n{$html}\n\n";
    }
    
    /**
     * Injecter tableau comparatif affilié
     * 
     * Utile pour articles comparatifs (ex: "Meilleures assurances expatriés")
     */
    public function injectComparisonTable(string $content, array $programs): string
    {
        $rows = [];
        
        foreach ($programs as $program) {
            $link = $this->keywordService->generateAffiliateLink($program['id']);
            $rows[] = "
                <tr>
                    <td>{$program['name']}</td>
                    <td>{$program['rating']}/5</td>
                    <td>{$program['price']}</td>
                    <td><a href=\"{$link}\" target=\"_blank\" rel=\"nofollow sponsored\" class=\"btn btn-sm\">Voir offre</a></td>
                </tr>
            ";
        }
        
        $table = "
        <div class=\"comparison-table affiliate-table\">
            <h3>Comparatif Solutions Recommandées</h3>
            <table>
                <thead>
                    <tr>
                        <th>Service</th>
                        <th>Note</th>
                        <th>Prix</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    " . implode('', $rows) . "
                </tbody>
            </table>
            <p class=\"affiliate-disclaimer\"><small>Les liens ci-dessus peuvent générer une commission d'affiliation.</small></p>
        </div>
        ";
        
        // Insérer après premier H2
        $pattern = '/(<h2[^>]*>.*?<\/h2>.*?)(<h2|$)/is';
        
        return preg_replace($pattern, '$1' . $table . '$2', $content, 1);
    }
    
    /**
     * Vérifier densité liens affiliés
     * 
     * Éviter sur-affiliation (max 2-3% du contenu)
     */
    public function checkDensity(string $content): array
    {
        $totalLinks = substr_count($content, '<a ');
        $affiliateLinks = substr_count($content, 'rel="nofollow sponsored"');
        
        $density = $totalLinks > 0 ? ($affiliateLinks / $totalLinks) * 100 : 0;
        
        return [
            'total_links' => $totalLinks,
            'affiliate_links' => $affiliateLinks,
            'density' => round($density, 2),
            'compliant' => $density <= 30, // Max 30% liens = affiliés
            'recommendation' => $density > 30 ? 'Réduire nombre liens affiliés' : 'OK'
        ];
    }
}
