<?php

namespace App\Services\Linking;

use App\Models\AuthorityDomain;
use App\Models\LinkDiscoveryCache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class ExternalLinkDiscoveryService
{
    protected string $perplexityApiKey;
    protected int $timeout;
    protected int $retryAttempts;
    protected int $retryDelay;

    public function __construct()
    {
        $this->perplexityApiKey = config('ai.perplexity.api_key');
        $this->timeout = config('linking.discovery.perplexity_timeout', 30);
        $this->retryAttempts = config('linking.discovery.retry_attempts', 3);
        $this->retryDelay = config('linking.discovery.retry_delay', 2);
    }

    /**
     * Découvre des liens pertinents pour un topic/pays/langue
     */
    public function discoverLinks(string $topic, ?string $countryCode, string $languageCode): array
    {
        if (!config('linking.discovery.enabled', true)) {
            Log::info("ExternalLinkDiscoveryService: Discovery disabled");
            return [];
        }

        // Vérifier le cache d'abord
        $cached = LinkDiscoveryCache::findValid($topic, $countryCode, $languageCode);
        if ($cached) {
            $cached->incrementHits();
            return $cached->getLinks();
        }

        Log::info("ExternalLinkDiscoveryService: Discovering links", [
            'topic' => $topic,
            'country' => $countryCode,
            'language' => $languageCode
        ]);

        $allLinks = [];

        // 1. Recherche via Perplexity AI
        $perplexityLinks = $this->searchPerplexity($topic, $countryCode, $languageCode);
        $allLinks = array_merge($allLinks, $perplexityLinks);

        // 2. Recherche sites gouvernementaux
        if ($countryCode) {
            $govLinks = $this->searchGovernmentSites($countryCode, $topic);
            $allLinks = array_merge($allLinks, $govLinks);
        }

        // 3. Recherche organisations internationales
        $orgLinks = $this->searchOrganizations($topic, $countryCode);
        $allLinks = array_merge($allLinks, $orgLinks);

        // Filtrer et scorer
        $filteredLinks = $this->filterAndScoreLinks($allLinks);

        // Mettre en cache
        if (!empty($filteredLinks)) {
            $this->cacheDiscoveredLinks($topic, $countryCode, $languageCode, $filteredLinks);
        }

        return $filteredLinks;
    }

    /**
     * Recherche via Perplexity AI
     */
    public function searchPerplexity(string $topic, ?string $countryCode, string $languageCode): array
    {
        if (empty($this->perplexityApiKey)) {
            Log::warning("ExternalLinkDiscoveryService: Perplexity API key not configured");
            return [];
        }

        $query = $this->buildPerplexityQuery($topic, $countryCode, $languageCode);

        $attempt = 0;
        $lastError = null;

        while ($attempt < $this->retryAttempts) {
            try {
                $response = Http::timeout($this->timeout)
                    ->withHeaders([
                        'Authorization' => 'Bearer ' . $this->perplexityApiKey,
                        'Content-Type' => 'application/json'
                    ])
                    ->post('https://api.perplexity.ai/chat/completions', [
                        'model' => 'llama-3.1-sonar-small-128k-online',
                        'messages' => [
                            [
                                'role' => 'system',
                                'content' => $this->getPerplexitySystemPrompt($languageCode)
                            ],
                            [
                                'role' => 'user',
                                'content' => $query
                            ]
                        ],
                        'return_citations' => true,
                        'return_related_questions' => false
                    ]);

                if ($response->successful()) {
                    return $this->parsePerplexityResponse($response->json());
                }

                $lastError = "HTTP {$response->status()}: {$response->body()}";

            } catch (\Exception $e) {
                $lastError = $e->getMessage();
            }

            $attempt++;
            if ($attempt < $this->retryAttempts) {
                sleep($this->retryDelay);
            }
        }

        Log::error("ExternalLinkDiscoveryService: Perplexity search failed after {$attempt} attempts", [
            'error' => $lastError
        ]);

        return [];
    }

    /**
     * Recherche sites gouvernementaux spécifiques
     */
    public function searchGovernmentSites(?string $countryCode, string $topic): array
    {
        if (!$countryCode) {
            return [];
        }

        // Utiliser les domaines pré-configurés
        $domains = AuthorityDomain::active()
            ->forCountry($countryCode)
            ->byType('government')
            ->orderByAuthority()
            ->limit(5)
            ->get();

        $links = [];
        foreach ($domains as $domain) {
            if ($domain->hasTopic($topic) || empty($domain->topics)) {
                $links[] = [
                    'url' => $domain->getFullUrl(),
                    'domain' => $domain->domain,
                    'name' => $domain->name,
                    'source_type' => 'government',
                    'authority_score' => $domain->authority_score,
                    'country_code' => $countryCode,
                    'discovered_via' => 'authority_database'
                ];
            }
        }

        return $links;
    }

    /**
     * Recherche organisations reconnues
     */
    public function searchOrganizations(string $topic, ?string $countryCode): array
    {
        // Organisations internationales pertinentes par thème
        $topicOrganizations = [
            'visa' => ['iom.int', 'unhcr.org'],
            'immigration' => ['iom.int', 'unhcr.org', 'uscis.gov'],
            'health' => ['who.int', 'cdc.gov'],
            'tax' => ['oecd.org', 'imf.org'],
            'legal' => ['un.org', 'hcch.net'],
            'work' => ['ilo.org'],
            'education' => ['unesco.org'],
            'finance' => ['worldbank.org', 'imf.org'],
        ];

        $relevantOrgs = $topicOrganizations[$topic] ?? [];
        
        $domains = AuthorityDomain::active()
            ->whereIn('domain', $relevantOrgs)
            ->orderByAuthority()
            ->get();

        $links = [];
        foreach ($domains as $domain) {
            $links[] = [
                'url' => $domain->getFullUrl(),
                'domain' => $domain->domain,
                'name' => $domain->name,
                'source_type' => 'organization',
                'authority_score' => $domain->authority_score,
                'country_code' => null,
                'discovered_via' => 'topic_mapping'
            ];
        }

        return $links;
    }

    /**
     * Filtre et score les liens découverts
     */
    public function filterAndScoreLinks(array $links): array
    {
        $minAuthority = config('linking.external.min_authority_score', 60);
        $seen = [];
        $filtered = [];

        foreach ($links as $link) {
            $url = $link['url'] ?? null;
            if (!$url) continue;

            // Normaliser l'URL
            $normalizedUrl = rtrim(preg_replace('#^https?://(www\.)?#', '', $url), '/');
            
            // Éviter les doublons
            if (isset($seen[$normalizedUrl])) continue;
            $seen[$normalizedUrl] = true;

            // Extraire le domaine
            $domain = parse_url($url, PHP_URL_HOST);
            if (!$domain) continue;

            // Vérifier autorité minimum
            $authorityScore = $link['authority_score'] ?? $this->estimateAuthorityScore($domain);
            if ($authorityScore < $minAuthority) continue;

            // Exclure certains domaines
            if ($this->isExcludedDomain($domain)) continue;

            // Déterminer le type de source si non fourni
            $sourceType = $link['source_type'] ?? $this->detectSourceType($domain);

            $filtered[] = [
                'url' => $this->normalizeUrl($url),
                'domain' => $domain,
                'name' => $link['name'] ?? $this->extractSiteName($domain),
                'source_type' => $sourceType,
                'authority_score' => $authorityScore,
                'country_code' => $link['country_code'] ?? $this->detectCountryFromDomain($domain),
                'discovered_via' => $link['discovered_via'] ?? 'perplexity'
            ];
        }

        // Trier par score d'autorité
        usort($filtered, fn($a, $b) => $b['authority_score'] <=> $a['authority_score']);

        // Limiter le nombre de résultats
        $maxResults = config('linking.discovery.max_results_per_query', 10);
        return array_slice($filtered, 0, $maxResults);
    }

    /**
     * Met en cache les liens découverts
     */
    public function cacheDiscoveredLinks(string $topic, ?string $countryCode, string $languageCode, array $links): void
    {
        $ttl = config('linking.discovery.cache_ttl', 604800); // 7 jours

        LinkDiscoveryCache::store($topic, $countryCode, $languageCode, $links, $ttl);

        Log::info("ExternalLinkDiscoveryService: Cached {$count} links", [
            'topic' => $topic,
            'country' => $countryCode,
            'count' => count($links)
        ]);
    }

    /**
     * Construit la query Perplexity
     */
    protected function buildPerplexityQuery(string $topic, ?string $countryCode, string $languageCode): string
    {
        $patterns = config('linking.discovery.query_patterns', []);
        $pattern = $patterns[$topic] ?? '{country} official {topic} information {year}';

        $countryName = $countryCode ? $this->getCountryName($countryCode) : 'international';
        $year = date('Y');

        $query = str_replace(
            ['{country}', '{topic}', '{year}', '{target_country}'],
            [$countryName, $topic, $year, $countryName],
            $pattern
        );

        return $query;
    }

    /**
     * Prompt système pour Perplexity
     */
    protected function getPerplexitySystemPrompt(string $languageCode): string
    {
        return "You are a research assistant helping find authoritative, official sources for expatriate information. 
                Focus on:
                - Government websites (.gov, .gouv, .gob)
                - Official international organizations (UN, WHO, IOM)
                - Embassy and consulate websites
                - Recognized reference sites
                
                Return only highly authoritative, official sources. 
                Avoid forums, blogs, or commercial sites.
                Prefer sources in the target language: {$languageCode}";
    }

    /**
     * Parse la réponse Perplexity
     */
    protected function parsePerplexityResponse(array $response): array
    {
        $links = [];

        // Extraire les citations
        $citations = $response['citations'] ?? [];
        foreach ($citations as $citation) {
            if (is_string($citation)) {
                $links[] = ['url' => $citation];
            } elseif (is_array($citation) && isset($citation['url'])) {
                $links[] = [
                    'url' => $citation['url'],
                    'name' => $citation['title'] ?? null
                ];
            }
        }

        // Extraire les URLs du contenu si pas de citations
        if (empty($links)) {
            $content = $response['choices'][0]['message']['content'] ?? '';
            preg_match_all('/https?:\/\/[^\s\)\]]+/', $content, $matches);
            foreach ($matches[0] as $url) {
                $links[] = ['url' => rtrim($url, '.,;:')];
            }
        }

        return $links;
    }

    /**
     * Estime le score d'autorité d'un domaine
     */
    protected function estimateAuthorityScore(string $domain): int
    {
        // Vérifier d'abord la base de données
        $known = AuthorityDomain::where('domain', $domain)->first();
        if ($known) {
            return $known->authority_score;
        }

        // Estimation basée sur le TLD
        $tld = pathinfo($domain, PATHINFO_EXTENSION);
        
        $tldScores = [
            'gov' => 95,
            'gouv.fr' => 95,
            'gob' => 95,
            'edu' => 90,
            'int' => 90,
            'org' => 75,
            'net' => 60,
            'com' => 50,
        ];

        foreach ($tldScores as $pattern => $score) {
            if (str_ends_with($domain, $pattern)) {
                return $score;
            }
        }

        return 50; // Défaut
    }

    /**
     * Détecte le type de source
     */
    protected function detectSourceType(string $domain): string
    {
        if (preg_match('/\.(gov|gouv|gob|gc\.ca)(\.[a-z]{2})?$/', $domain)) {
            return 'government';
        }

        if (str_ends_with($domain, '.int') || str_ends_with($domain, '.org')) {
            $orgs = ['un.org', 'who.int', 'iom.int', 'unesco.org', 'ilo.org'];
            foreach ($orgs as $org) {
                if (str_ends_with($domain, $org)) {
                    return 'organization';
                }
            }
        }

        if (in_array($domain, ['wikipedia.org', 'britannica.com'])) {
            return 'reference';
        }

        if (preg_match('/(news|times|post|journal|guardian|bbc|reuters)/', $domain)) {
            return 'news';
        }

        return 'authority';
    }

    /**
     * Détecte le pays depuis le domaine
     */
    protected function detectCountryFromDomain(string $domain): ?string
    {
        $ccTlds = [
            '.fr' => 'FR', '.de' => 'DE', '.es' => 'ES', '.it' => 'IT',
            '.uk' => 'GB', '.ca' => 'CA', '.au' => 'AU', '.jp' => 'JP',
            '.cn' => 'CN', '.br' => 'BR', '.mx' => 'MX', '.ch' => 'CH',
            '.nl' => 'NL', '.be' => 'BE', '.at' => 'AT', '.pt' => 'PT',
        ];

        foreach ($ccTlds as $tld => $country) {
            if (str_ends_with($domain, $tld)) {
                return $country;
            }
        }

        return null;
    }

    /**
     * Vérifie si le domaine est exclu
     */
    protected function isExcludedDomain(string $domain): bool
    {
        $excluded = [
            'facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com',
            'youtube.com', 'tiktok.com', 'reddit.com', 'quora.com',
            'pinterest.com', 'amazon.com', 'ebay.com'
        ];

        foreach ($excluded as $excludedDomain) {
            if (str_contains($domain, $excludedDomain)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Normalise une URL
     */
    protected function normalizeUrl(string $url): string
    {
        // S'assurer que l'URL commence par https
        if (!preg_match('#^https?://#', $url)) {
            $url = 'https://' . $url;
        }

        // Supprimer les fragments
        $url = preg_replace('/#.*$/', '', $url);

        return $url;
    }

    /**
     * Extrait le nom du site depuis le domaine
     */
    protected function extractSiteName(string $domain): string
    {
        // Supprimer www et TLD
        $name = preg_replace('/^www\./', '', $domain);
        $name = preg_replace('/\.[a-z]{2,}(\.[a-z]{2})?$/', '', $name);
        
        // Capitaliser
        return ucwords(str_replace(['-', '_'], ' ', $name));
    }

    /**
     * Récupère le nom du pays
     */
    protected function getCountryName(string $code): string
    {
        $countries = [
            'FR' => 'France', 'DE' => 'Germany', 'ES' => 'Spain', 'IT' => 'Italy',
            'GB' => 'United Kingdom', 'US' => 'United States', 'CA' => 'Canada',
            'AU' => 'Australia', 'JP' => 'Japan', 'CN' => 'China', 'BR' => 'Brazil',
            'TH' => 'Thailand', 'SG' => 'Singapore', 'AE' => 'United Arab Emirates',
        ];

        return $countries[$code] ?? $code;
    }
}
