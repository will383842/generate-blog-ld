<?php

namespace App\Services\Research;

use App\Models\ResearchQuery;
use App\Models\ResearchResult;
use App\Models\ResearchCache;
use App\Services\AI\PerplexityService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ResearchAggregatorService
{
    protected PerplexityService $perplexityService;
    protected string $newsApiKey;
    protected int $cacheTtl = 86400; // 24h par défaut

    public function __construct(PerplexityService $perplexityService)
    {
        $this->perplexityService = $perplexityService;
        $this->newsApiKey = config('services.news_api.key', '');
    }

    // =========================================================================
    // MÉTHODE PRINCIPALE
    // =========================================================================

    /**
     * Rechercher des informations multi-sources avec cache
     * 
     * @param string $query Requête de recherche
     * @param string $languageCode Code langue (fr, en, es...)
     * @param array $sources Sources à utiliser ['perplexity', 'news_api']
     * @return array Résultats agrégés
     */
    public function search(string $query, string $languageCode, array $sources = ['perplexity', 'news_api']): array
    {
        // 1. Générer cache key
        $cacheKey = $this->generateCacheKey($query, $languageCode);

        // 2. Vérifier le cache
        $cachedResults = $this->getCachedResults($cacheKey);
        if ($cachedResults !== null) {
            Log::info('Research cache HIT', ['query' => $query, 'lang' => $languageCode]);
            
            // Créer enregistrement query avec cache_hit = true
            $this->recordQuery($query, $languageCode, $cacheKey, true, count($cachedResults));
            
            return $cachedResults;
        }

        Log::info('Research cache MISS - Fetching new data', ['query' => $query, 'lang' => $languageCode]);

        // 3. Collecter les résultats des différentes sources
        $perplexityResults = [];
        $newsResults = [];

        if (in_array('perplexity', $sources) && $this->perplexityService->isAvailable()) {
            $perplexityResults = $this->searchPerplexity($query, $languageCode);
        }

        if (in_array('news_api', $sources) && !empty($this->newsApiKey)) {
            $newsResults = $this->searchNewsAPI($query, $languageCode);
        }

        // 4. Agréger les résultats
        $aggregatedResults = $this->aggregateResults($perplexityResults, $newsResults, $query);

        // 5. Stocker dans le cache
        $this->cacheResults($cacheKey, $query, $languageCode, $aggregatedResults);

        // 6. Enregistrer la query avec cache_hit = false
        $queryRecord = $this->recordQuery($query, $languageCode, $cacheKey, false, count($aggregatedResults));

        // 7. Enregistrer les résultats individuels
        $this->recordResults($queryRecord->id, $aggregatedResults);

        return $aggregatedResults;
    }

    // =========================================================================
    // RECHERCHES PAR SOURCE
    // =========================================================================

    /**
     * Rechercher via Perplexity
     */
    protected function searchPerplexity(string $query, string $languageCode): array
    {
        try {
            $response = $this->perplexityService->search([
                'query' => $query,
                'language' => $languageCode,
            ]);

            $results = [];

            // Parser la réponse Perplexity
            if (!empty($response['content'])) {
                $results[] = [
                    'source_type' => 'perplexity',
                    'title' => 'Perplexity AI - ' . mb_substr($query, 0, 100),
                    'url' => 'https://perplexity.ai',
                    'excerpt' => mb_substr($response['content'], 0, 500),
                    'published_date' => now(),
                    'relevance_score' => 85, // Score élevé par défaut pour Perplexity
                ];
            }

            // Ajouter les citations comme résultats séparés
            if (!empty($response['citations'])) {
                foreach ($response['citations'] as $index => $url) {
                    $results[] = [
                        'source_type' => 'perplexity',
                        'title' => $this->extractDomainName($url),
                        'url' => $url,
                        'excerpt' => '',
                        'published_date' => now(),
                        'relevance_score' => max(80 - ($index * 5), 50), // Score décroissant
                    ];
                }
            }

            Log::info('Perplexity search completed', [
                'query' => $query,
                'results_count' => count($results)
            ]);

            return $results;

        } catch (\Exception $e) {
            Log::error('Perplexity search failed', [
                'query' => $query,
                'error' => $e->getMessage()
            ]);
            
            return [];
        }
    }

    /**
     * Rechercher via News API
     */
    protected function searchNewsAPI(string $query, string $languageCode): array
    {
        try {
            // Mapper les codes langues aux codes News API
            $newsApiLang = $this->mapLanguageCode($languageCode);

            $response = Http::timeout(30)
                ->get('https://newsapi.org/v2/everything', [
                    'apiKey' => $this->newsApiKey,
                    'q' => $query,
                    'language' => $newsApiLang,
                    'sortBy' => 'relevancy',
                    'pageSize' => 10,
                    'from' => now()->subMonths(3)->toISOString(),
                ]);

            if (!$response->successful()) {
                Log::warning('News API request failed', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return [];
            }

            $data = $response->json();
            $articles = $data['articles'] ?? [];

            $results = [];
            foreach ($articles as $article) {
                $relevanceScore = $this->scoreRelevance($article, $query);
                
                $results[] = [
                    'source_type' => 'news_api',
                    'title' => $article['title'] ?? '',
                    'url' => $article['url'] ?? '',
                    'excerpt' => $article['description'] ?? '',
                    'published_date' => isset($article['publishedAt']) ? \Carbon\Carbon::parse($article['publishedAt']) : now(),
                    'relevance_score' => $relevanceScore,
                ];
            }

            Log::info('News API search completed', [
                'query' => $query,
                'results_count' => count($results)
            ]);

            return $results;

        } catch (\Exception $e) {
            Log::error('News API search failed', [
                'query' => $query,
                'error' => $e->getMessage()
            ]);
            
            return [];
        }
    }

    // =========================================================================
    // AGRÉGATION ET SCORING
    // =========================================================================

    /**
     * Agréger les résultats de plusieurs sources
     */
    protected function aggregateResults(array $perplexityResults, array $newsResults, string $query): array
    {
        // Merger les résultats
        $allResults = array_merge($perplexityResults, $newsResults);

        // Dédupliquer par URL
        $uniqueResults = [];
        $seenUrls = [];

        foreach ($allResults as $result) {
            $url = $result['url'];
            
            if (in_array($url, $seenUrls)) {
                // URL déjà vue, augmenter le score de pertinence
                foreach ($uniqueResults as &$uniqueResult) {
                    if ($uniqueResult['url'] === $url) {
                        $uniqueResult['relevance_score'] = min(100, $uniqueResult['relevance_score'] + 10);
                        break;
                    }
                }
            } else {
                $seenUrls[] = $url;
                $uniqueResults[] = $result;
            }
        }

        // Trier par pertinence
        usort($uniqueResults, function ($a, $b) {
            return $b['relevance_score'] <=> $a['relevance_score'];
        });

        // Retourner top 15 résultats
        return array_slice($uniqueResults, 0, 15);
    }

    /**
     * Calculer le score de pertinence (TF-IDF basique)
     */
    protected function scoreRelevance(array $result, string $query): int
    {
        $title = strtolower($result['title'] ?? '');
        $description = strtolower($result['description'] ?? '');
        $content = $title . ' ' . $description;
        
        // Tokeniser la requête
        $queryTerms = preg_split('/\s+/', strtolower($query));
        
        $score = 0;
        foreach ($queryTerms as $term) {
            if (empty($term) || strlen($term) < 3) continue;
            
            // Compter les occurrences
            $occurrences = substr_count($content, $term);
            
            // Score de base par occurrence
            $score += $occurrences * 10;
            
            // Bonus si le terme est dans le titre
            if (str_contains($title, $term)) {
                $score += 20;
            }
        }
        
        // Normaliser entre 0-100
        return min(100, $score);
    }

    // =========================================================================
    // CACHE
    // =========================================================================

    /**
     * Générer une clé de cache
     */
    protected function generateCacheKey(string $query, string $languageCode): string
    {
        return md5($query . '_' . $languageCode);
    }

    /**
     * Récupérer les résultats du cache
     */
    protected function getCachedResults(string $cacheKey): ?array
    {
        $cache = ResearchCache::where('cache_key', $cacheKey)
            ->where('expires_at', '>', now())
            ->first();

        if ($cache) {
            $cache->incrementHits();
            return $cache->results;
        }

        return null;
    }

    /**
     * Stocker les résultats dans le cache
     */
    protected function cacheResults(string $cacheKey, string $query, string $languageCode, array $results): void
    {
        ResearchCache::updateOrCreate(
            ['cache_key' => $cacheKey],
            [
                'query_text' => $query,
                'language_code' => $languageCode,
                'results' => $results,
                'hit_count' => 0,
                'expires_at' => now()->addSeconds($this->cacheTtl),
            ]
        );
    }

    // =========================================================================
    // ENREGISTREMENT
    // =========================================================================

    /**
     * Enregistrer une query dans la base
     */
    protected function recordQuery(string $query, string $languageCode, string $cacheKey, bool $cacheHit, int $resultsCount): ResearchQuery
    {
        return ResearchQuery::create([
            'query_text' => $query,
            'language_code' => $languageCode,
            'cache_key' => $cacheKey,
            'cache_hit' => $cacheHit,
            'results_count' => $resultsCount,
        ]);
    }

    /**
     * Enregistrer les résultats dans la base
     */
    protected function recordResults(int $queryId, array $results): void
    {
        foreach ($results as $result) {
            ResearchResult::create([
                'query_id' => $queryId,
                'source_type' => $result['source_type'],
                'title' => $result['title'],
                'url' => $result['url'],
                'excerpt' => $result['excerpt'],
                'published_date' => $result['published_date'],
                'relevance_score' => $result['relevance_score'],
            ]);
        }
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Extraire le nom de domaine
     */
    protected function extractDomainName(string $url): string
    {
        $parsed = parse_url($url);
        $host = $parsed['host'] ?? $url;
        return preg_replace('/^www\./', '', $host);
    }

    /**
     * Mapper les codes de langue aux codes News API
     */
    protected function mapLanguageCode(string $code): string
    {
        $mapping = [
            'fr' => 'fr',
            'en' => 'en',
            'es' => 'es',
            'de' => 'de',
            'it' => 'it',
            'pt' => 'pt',
            'ar' => 'ar',
            'zh' => 'zh',
            'hi' => 'hi',
        ];

        return $mapping[$code] ?? 'en';
    }

    /**
     * Définir le TTL du cache
     */
    public function setCacheTtl(int $seconds): void
    {
        $this->cacheTtl = $seconds;
    }
}