<?php

namespace App\Services\Linking;

use App\Models\Article;
use App\Services\Linking\InternalLinkingService;
use App\Services\Linking\ExternalLinkingService;
use App\Services\Linking\AffiliateLinkService;
use Illuminate\Support\Facades\Log;

/**
 * Orchestrateur de maillage interne/externe avec TF-IDF
 */
class LinkingOrchestrator
{
    protected InternalLinkingService $internalLinking;
    protected ExternalLinkingService $externalLinking;
    protected AffiliateLinkService $affiliateLinking;

    // Règles maillage SEO V10
    const MIN_INTERNAL_LINKS = 3;
    const MAX_INTERNAL_LINKS = 8;
    const MIN_EXTERNAL_LINKS = 2;
    const MAX_EXTERNAL_LINKS = 5;
    const MAX_AFFILIATE_LINKS = 3;

    public function __construct(
        InternalLinkingService $internalLinking,
        ExternalLinkingService $externalLinking,
        AffiliateLinkService $affiliateLinking
    ) {
        $this->internalLinking = $internalLinking;
        $this->externalLinking = $externalLinking;
        $this->affiliateLinking = $affiliateLinking;
    }

    /**
     * Enrichit le contenu avec maillage optimal
     */
    public function enrichContent(string $content, array $params): string
    {
        Log::info('🔗 Enrichissement maillage', ['keyword' => $params['keyword']]);

        // 1. Analyse TF-IDF pour trouver opportunités linking
        $linkOpportunities = $this->analyzeTfIdf($content, $params);

        // 2. Injection liens internes (3-8 liens)
        $content = $this->injectInternalLinks($content, $linkOpportunities, $params);

        // 3. Injection liens externes (2-5 liens)
        $content = $this->injectExternalLinks($content, $linkOpportunities, $params);

        // 4. Injection liens affiliés (0-3 liens si pertinent)
        if (isset($params['enable_affiliate']) && $params['enable_affiliate']) {
            $content = $this->injectAffiliateLinks($content, $params);
        }

        return $content;
    }

    /**
     * Analyse TF-IDF pour identifier mots-clés importants
     */
    protected function analyzeTfIdf(string $content, array $params): array
    {
        $words = str_word_count(strtolower(strip_tags($content)), 1);
        $wordCount = array_count_values($words);

        // Calcul TF (Term Frequency)
        $totalWords = count($words);
        $tf = [];
        foreach ($wordCount as $word => $count) {
            if (strlen($word) >= 4) { // Ignorer mots courts
                $tf[$word] = $count / $totalWords;
            }
        }

        // Tri par importance
        arsort($tf);

        // Top 20 mots clés pour linking
        return array_slice(array_keys($tf), 0, 20);
    }

    /**
     * Injection liens internes avec diversité anchor text
     */
    protected function injectInternalLinks(string $content, array $opportunities, array $params): string
    {
        // Recherche articles connexes par TF-IDF
        $relatedArticles = $this->findRelatedArticles($opportunities, $params);

        if (empty($relatedArticles)) {
            Log::warning('Aucun article connexe trouvé pour maillage interne');
            return $content;
        }

        $linksAdded = 0;
        $maxLinks = min(count($relatedArticles), self::MAX_INTERNAL_LINKS);

        foreach ($relatedArticles as $article) {
            if ($linksAdded >= $maxLinks) break;

            // Générer anchor text diversifié
            $anchorText = $this->generateDiverseAnchor($article, $linksAdded);

            // Trouver position optimale dans contenu
            $position = $this->findOptimalLinkPosition($content, $anchorText);

            if ($position !== false) {
                $link = sprintf(
                    '<a href="%s" title="%s">%s</a>',
                    $article->url,
                    $article->title,
                    $anchorText
                );

                $content = substr_replace($content, $link, $position, strlen($anchorText));
                $linksAdded++;

                Log::debug('Lien interne ajouté', [
                    'anchor' => $anchorText,
                    'target' => $article->slug
                ]);
            }
        }

        Log::info("✅ Liens internes: {$linksAdded}/{$maxLinks}");

        return $content;
    }

    /**
     * Trouve articles connexes par similarité TF-IDF
     */
    protected function findRelatedArticles(array $keywords, array $params): array
    {
        return Article::where('platform_id', $params['platform_id'])
                     ->where('language', $params['language'])
                     ->where('status', 'published')
                     ->where(function ($query) use ($keywords) {
                         foreach (array_slice($keywords, 0, 10) as $keyword) {
                             $query->orWhere('content', 'LIKE', "%{$keyword}%");
                         }
                     })
                     ->limit(15)
                     ->get();
    }

    /**
     * Génère anchor text diversifié (pas toujours keyword exact)
     */
    protected function generateDiverseAnchor(Article $article, int $index): string
    {
        $variations = [
            $article->keyword,                          // Exact match
            substr($article->title, 0, 60),            // Titre tronqué
            "découvrez {$article->keyword}",           // Branded
            "en savoir plus sur {$article->keyword}",  // Long tail
            "guide complet {$article->keyword}",       // Descriptif
            "tout sur {$article->keyword}"             // Conversationnel
        ];

        // Rotation pour diversité
        return $variations[$index % count($variations)];
    }

    /**
     * Trouve position optimale pour insertion lien
     */
    protected function findOptimalLinkPosition(string $content, string $anchorText): int|false
    {
        // Cherche anchor text dans contenu (case insensitive)
        $position = stripos($content, $anchorText);

        if ($position === false) {
            // Cherche mots clés de l'anchor
            $keywords = explode(' ', $anchorText);
            foreach ($keywords as $keyword) {
                if (strlen($keyword) >= 5) {
                    $position = stripos($content, $keyword);
                    if ($position !== false) break;
                }
            }
        }

        return $position;
    }

    /**
     * Injection liens externes (sources fiables)
     */
    protected function injectExternalLinks(string $content, array $opportunities, array $params): string
    {
        $externalSources = $this->getAuthorityDomains($params['keyword']);

        $linksAdded = 0;
        $maxLinks = self::MIN_EXTERNAL_LINKS;

        foreach ($externalSources as $source) {
            if ($linksAdded >= $maxLinks) break;

            $link = sprintf(
                '<a href="%s" target="_blank" rel="nofollow noopener" title="%s">%s</a>',
                $source['url'],
                $source['title'],
                $source['anchor']
            );

            // Injection à position optimale
            $position = $this->findOptimalLinkPosition($content, $source['anchor']);

            if ($position !== false) {
                $content = substr_replace($content, $link, $position, strlen($source['anchor']));
                $linksAdded++;
            }
        }

        Log::info("✅ Liens externes: {$linksAdded}/{$maxLinks}");

        return $content;
    }

    /**
     * Domaines d'autorité par thématique
     */
    protected function getAuthorityDomains(string $keyword): array
    {
        // TODO: Base de données domaines d'autorité par thématique
        return [
            [
                'url' => 'https://www.gouvernement.fr',
                'title' => 'Site officiel gouvernement',
                'anchor' => 'gouvernement français',
                'domain_authority' => 95
            ],
            [
                'url' => 'https://www.service-public.fr',
                'title' => 'Service Public',
                'anchor' => 'service public',
                'domain_authority' => 90
            ]
        ];
    }

    /**
     * Injection liens affiliés (si pertinent)
     */
    protected function injectAffiliateLinks(string $content, array $params): string
    {
        // TODO: Implémentation liens affiliés
        return $content;
    }

    /**
     * Rapport qualité maillage
     */
    public function generateLinkingReport(string $content): array
    {
        $internalLinks = preg_match_all('/<a href=["\'](?!http)/', $content);
        $externalLinks = preg_match_all('/<a href=["\']http/', $content);
        $affiliateLinks = preg_match_all('/rel=["\']affiliate/', $content);

        $issues = [];

        if ($internalLinks < self::MIN_INTERNAL_LINKS) {
            $issues[] = "Liens internes insuffisants ({$internalLinks}/" . self::MIN_INTERNAL_LINKS . ")";
        }

        if ($externalLinks < self::MIN_EXTERNAL_LINKS) {
            $issues[] = "Liens externes insuffisants ({$externalLinks}/" . self::MIN_EXTERNAL_LINKS . ")";
        }

        return [
            'internal_links' => $internalLinks,
            'external_links' => $externalLinks,
            'affiliate_links' => $affiliateLinks,
            'valid' => empty($issues),
            'issues' => $issues,
            'score' => $this->calculateLinkingScore($internalLinks, $externalLinks)
        ];
    }

    protected function calculateLinkingScore(int $internal, int $external): int
    {
        $score = 0;

        // Liens internes (50 points max)
        $score += min(($internal / self::MAX_INTERNAL_LINKS) * 50, 50);

        // Liens externes (50 points max)
        $score += min(($external / self::MAX_EXTERNAL_LINKS) * 50, 50);

        return (int) $score;
    }
}
