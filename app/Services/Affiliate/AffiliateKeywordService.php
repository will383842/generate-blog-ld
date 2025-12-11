<?php

namespace App\Services\Affiliate;

/**
 * AffiliateKeywordService
 * 
 * Détecte opportunités affiliation dans contenus et injecte liens contextuels
 * 
 * OBJECTIF: Revenue +$5-15k/mois
 * 
 * PROGRAMMES SUPPORTÉS:
 * - Amazon Associates (produits voyage, tech, livres)
 * - Booking.com (hébergement)
 * - Wise (transfert argent)
 * - Revolut (banque)
 * - SafetyWing (assurance)
 * - WorldNomads (assurance voyage)
 * - Airbnb (hébergement court terme)
 * - GetYourGuide (activités)
 * 
 * UTILISATION:
 * 
 * $service = new AffiliateKeywordService();
 * 
 * // Détecter opportunités dans contenu
 * $opportunities = $service->detectOpportunities($content, $keyword);
 * 
 * // Injecter liens affiliés
 * $enrichedContent = $service->injectAffiliateLinks($content, $opportunities);
 */
class AffiliateKeywordService
{
    // Mapping keywords → programmes affiliés
    private const AFFILIATE_KEYWORDS = [
        // Assurance
        'assurance' => ['safetywing', 'worldnomads'],
        'assurance expatrié' => ['safetywing', 'worldnomads'],
        'assurance santé' => ['safetywing'],
        'assurance voyage' => ['worldnomads'],
        
        // Hébergement
        'hébergement' => ['booking', 'airbnb'],
        'hôtel' => ['booking'],
        'appartement' => ['airbnb', 'booking'],
        'logement' => ['airbnb', 'booking'],
        
        // Finance
        'transfert argent' => ['wise', 'revolut'],
        'banque' => ['revolut', 'wise'],
        'compte bancaire' => ['revolut', 'wise'],
        'carte bancaire' => ['revolut'],
        'virement international' => ['wise'],
        
        // Activités
        'activité' => ['getyourguide'],
        'excursion' => ['getyourguide'],
        'visite guidée' => ['getyourguide'],
        'attraction' => ['getyourguide'],
        
        // Produits
        'livre' => ['amazon'],
        'guide voyage' => ['amazon'],
        'équipement' => ['amazon'],
        'valise' => ['amazon'],
    ];
    
    // Configuration programmes
    private const PROGRAMS = [
        'safetywing' => [
            'name' => 'SafetyWing',
            'url_template' => 'https://safetywing.com/?referenceID={affiliate_id}&Ambassador',
            'commission' => 5, // %
        ],
        'worldnomads' => [
            'name' => 'World Nomads',
            'url_template' => 'https://www.worldnomads.com/affiliate/{affiliate_id}',
            'commission' => 6,
        ],
        'booking' => [
            'name' => 'Booking.com',
            'url_template' => 'https://www.booking.com/index.html?aid={affiliate_id}',
            'commission' => 4,
        ],
        'airbnb' => [
            'name' => 'Airbnb',
            'url_template' => 'https://www.airbnb.com?ref={affiliate_id}',
            'commission' => 3,
        ],
        'wise' => [
            'name' => 'Wise',
            'url_template' => 'https://wise.com/invite/u/{affiliate_id}',
            'commission' => 5,
        ],
        'revolut' => [
            'name' => 'Revolut',
            'url_template' => 'https://revolut.com/referral/{affiliate_id}',
            'commission' => 4,
        ],
        'getyourguide' => [
            'name' => 'GetYourGuide',
            'url_template' => 'https://www.getyourguide.com/?partner_id={affiliate_id}',
            'commission' => 8,
        ],
        'amazon' => [
            'name' => 'Amazon',
            'url_template' => 'https://www.amazon.com/dp/{product_id}?tag={affiliate_id}',
            'commission' => 3,
        ],
    ];
    
    /**
     * Détecter opportunités affiliation dans contenu
     * 
     * @param string $content - Contenu HTML ou texte
     * @param string $mainKeyword - Keyword principal article
     * @return array Opportunités détectées
     */
    public function detectOpportunities(string $content, string $mainKeyword): array
    {
        $opportunities = [];
        
        // Normaliser contenu
        $contentLower = mb_strtolower($content);
        
        // Scanner chaque keyword affiliable
        foreach (self::AFFILIATE_KEYWORDS as $keyword => $programs) {
            // Vérifier présence keyword
            if (mb_strpos($contentLower, mb_strtolower($keyword)) !== false) {
                foreach ($programs as $program) {
                    $opportunities[] = [
                        'keyword' => $keyword,
                        'program' => $program,
                        'program_name' => self::PROGRAMS[$program]['name'],
                        'commission' => self::PROGRAMS[$program]['commission'],
                        'confidence' => $this->calculateConfidence($keyword, $mainKeyword, $content),
                    ];
                }
            }
        }
        
        // Trier par confidence
        usort($opportunities, fn($a, $b) => $b['confidence'] <=> $a['confidence']);
        
        // Limiter à top 3-5 pour éviter sur-affiliation
        return array_slice($opportunities, 0, 5);
    }
    
    /**
     * Calculer confidence score opportunité
     */
    private function calculateConfidence(string $affiliateKeyword, string $mainKeyword, string $content): float
    {
        $score = 0.0;
        
        // Relevance avec keyword principal
        if (mb_stripos($mainKeyword, $affiliateKeyword) !== false) {
            $score += 50; // Très pertinent
        } elseif ($this->areSemanticallyRelated($affiliateKeyword, $mainKeyword)) {
            $score += 30; // Pertinent
        } else {
            $score += 10; // Faiblement pertinent
        }
        
        // Fréquence mentions
        $mentions = mb_substr_count(mb_strtolower($content), mb_strtolower($affiliateKeyword));
        $score += min($mentions * 5, 30); // Max +30
        
        // Position dans contenu (premier tiers = mieux)
        $firstPosition = mb_stripos($content, $affiliateKeyword);
        $contentLength = mb_strlen($content);
        if ($firstPosition < $contentLength / 3) {
            $score += 20; // Position prominente
        }
        
        return min($score, 100);
    }
    
    /**
     * Vérifier relation sémantique keywords
     */
    private function areSemanticallyRelated(string $keyword1, string $keyword2): bool
    {
        // Clusters sémantiques
        $clusters = [
            'finance' => ['assurance', 'banque', 'argent', 'transfert', 'compte', 'carte'],
            'voyage' => ['voyage', 'expatrié', 'destination', 'pays', 'international'],
            'logement' => ['hébergement', 'hôtel', 'appartement', 'logement', 'location'],
        ];
        
        foreach ($clusters as $cluster => $keywords) {
            $in1 = false;
            $in2 = false;
            
            foreach ($keywords as $clusterKeyword) {
                if (mb_stripos($keyword1, $clusterKeyword) !== false) $in1 = true;
                if (mb_stripos($keyword2, $clusterKeyword) !== false) $in2 = true;
            }
            
            if ($in1 && $in2) return true;
        }
        
        return false;
    }
    
    /**
     * Générer lien affilié
     * 
     * @param string $program - ID programme (safetywing, booking, etc.)
     * @param array $params - Paramètres additionnels
     * @return string URL affilié
     */
    public function generateAffiliateLink(string $program, array $params = []): string
    {
        if (!isset(self::PROGRAMS[$program])) {
            throw new \Exception("Programme affiliation inconnu: {$program}");
        }
        
        $config = self::PROGRAMS[$program];
        $url = $config['url_template'];
        
        // Récupérer affiliate ID depuis config
        $affiliateId = config("affiliate.{$program}.id", 'YOUR_ID_HERE');
        
        // Remplacer placeholders
        $url = str_replace('{affiliate_id}', $affiliateId, $url);
        
        foreach ($params as $key => $value) {
            $url = str_replace("{{$key}}", $value, $url);
        }
        
        // Ajouter tracking
        $url .= (parse_url($url, PHP_URL_QUERY) ? '&' : '?') . 'utm_source=platform&utm_medium=affiliate';
        
        return $url;
    }
    
    /**
     * Formater opportunité en HTML
     * 
     * @param array $opportunity - Opportunité détectée
     * @param string $context - 'text' | 'button' | 'card'
     * @return string HTML
     */
    public function formatOpportunity(array $opportunity, string $context = 'text'): string
    {
        $link = $this->generateAffiliateLink($opportunity['program']);
        $name = $opportunity['program_name'];
        
        switch ($context) {
            case 'text':
                return "<a href=\"{$link}\" target=\"_blank\" rel=\"nofollow sponsored\" class=\"affiliate-link\">{$name}</a>";
                
            case 'button':
                return "<a href=\"{$link}\" target=\"_blank\" rel=\"nofollow sponsored\" class=\"btn btn-affiliate\">Découvrir {$name} →</a>";
                
            case 'card':
                return "
                <div class=\"affiliate-card\">
                    <h4>{$name}</h4>
                    <p>Solution recommandée pour {$opportunity['keyword']}</p>
                    <a href=\"{$link}\" target=\"_blank\" rel=\"nofollow sponsored\" class=\"btn btn-primary\">En savoir plus</a>
                </div>
                ";
                
            default:
                return '';
        }
    }
    
    /**
     * Tracker événement affiliation
     */
    public function trackEvent(string $program, string $event, array $metadata = []): void
    {
        \DB::table('affiliate_events')->insert([
            'program' => $program,
            'event' => $event, // impression, click, conversion
            'metadata' => json_encode($metadata),
            'created_at' => now(),
        ]);
    }
}
