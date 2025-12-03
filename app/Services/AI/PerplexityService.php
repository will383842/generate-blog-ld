<?php

namespace App\Services\AI;

use App\Services\AI\Contracts\AIServiceInterface;
use App\Services\AI\Traits\HandlesAIRequests;
use App\Services\AI\Exceptions\RateLimitException;
use App\Services\AI\Exceptions\ServerException;
use App\Services\AI\Exceptions\InvalidRequestException;
use App\Services\AI\Exceptions\ApiException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class PerplexityService implements AIServiceInterface
{
    use HandlesAIRequests;

    // =========================================================================
    // CONFIGURATION
    // =========================================================================

    protected string $apiKey;
    protected string $baseUrl = 'https://api.perplexity.ai';
    protected int $cacheTtl;

    // Modèles disponibles
    const MODEL_SMALL = 'sonar-small-online';
    const MODEL_LARGE = 'sonar';
    const MODEL_HUGE = 'sonar-pro';

    // Tarifs par 1000 tokens (USD)
    protected array $pricing = [
        'sonar-small-online' => ['input' => 0.0002, 'output' => 0.0002],
        'sonar' => ['input' => 0.001, 'output' => 0.001],
        'sonar-pro' => ['input' => 0.005, 'output' => 0.005],
    ];

    // =========================================================================
    // CONSTRUCTEUR
    // =========================================================================

    public function __construct()
    {
        $this->apiKey = config('ai.perplexity.api_key');
        $this->cacheTtl = config('ai.perplexity.cache_ttl', 60 * 60 * 24 * 7); // 7 jours
        
        // 🔧 AMÉLIORATION : Log warning au lieu d'exception (Perplexity est optionnel)
        if (empty($this->apiKey)) {
            Log::warning('Perplexity API key not configured - source search will be disabled');
        }
    }

    // =========================================================================
    // INTERFACE IMPLEMENTATION
    // =========================================================================

    public function isAvailable(): bool
    {
        return !empty($this->apiKey);
    }

    public function getServiceName(): string
    {
        return 'perplexity';
    }

    public function estimateCost(string $operation, array $params = []): float
    {
        $model = $params['model'] ?? self::MODEL_LARGE;
        $inputTokens = $params['input_tokens'] ?? 500;
        $outputTokens = $params['output_tokens'] ?? 1000;

        if (!isset($this->pricing[$model])) {
            return 0;
        }

        $inputCost = ($inputTokens / 1000) * $this->pricing[$model]['input'];
        $outputCost = ($outputTokens / 1000) * $this->pricing[$model]['output'];

        return round($inputCost + $outputCost, 6);
    }

    public function getUsageStats(): array
    {
        $today = now()->format('Y-m-d');

        return [
            'daily_cost' => Cache::get("ai_costs:perplexity:{$today}", 0),
            'requests_today' => Cache::get("ai_requests:perplexity:{$today}", 0),
            'cache_hits_today' => Cache::get("ai_cache_hits:perplexity:{$today}", 0),
        ];
    }

    // =========================================================================
    // MÉTHODES PRINCIPALES
    // =========================================================================

    /**
     * Rechercher des sources officielles sur un sujet
     * 
     * @param array $params Paramètres de recherche
     * @return array Résultats avec sources
     */
    public function findSources(array $params): array
    {
        $topic = $params['topic'] ?? '';
        $country = $params['country'] ?? '';
        $language = $params['language'] ?? 'fr';
        $maxSources = $params['max_sources'] ?? 5;
        $forceRefresh = $params['force_refresh'] ?? false; // 🔧 AJOUT : Option force refresh

        // 🔧 AMÉLIORATION : Vérifier le cache avec option force refresh
        $cacheKey = $this->getCacheKey('sources', $params);
        
        if (!$forceRefresh && Cache::has($cacheKey)) {
            $this->incrementCacheHits();
            Log::debug('Perplexity cache hit', ['type' => 'sources', 'topic' => $topic]);
            return Cache::get($cacheKey);
        }

        $query = $this->buildSourceQuery($topic, $country, $language);
        
        $response = $this->search([
            'query' => $query,
            'focus' => 'official', // Focus sur sources officielles
        ]);

        $sources = $this->parseSourcesResponse($response, $maxSources);

        // 🔧 AMÉLIORATION : TTL personnalisable
        $cacheTtl = $params['cache_ttl'] ?? $this->cacheTtl;
        Cache::put($cacheKey, $sources, $cacheTtl);

        return $sources;
    }

    /**
     * Obtenir des informations actualisées sur un sujet
     */
    public function getLatestInfo(array $params): array
    {
        $topic = $params['topic'] ?? '';
        $country = $params['country'] ?? '';
        $language = $params['language'] ?? 'fr';
        $context = $params['context'] ?? 'expatriation';
        $forceRefresh = $params['force_refresh'] ?? false; // 🔧 AJOUT

        // Cache plus court pour les infos actualisées (24h)
        $cacheKey = $this->getCacheKey('latest', $params);
        
        if (!$forceRefresh && Cache::has($cacheKey)) {
            $this->incrementCacheHits();
            return Cache::get($cacheKey);
        }

        $systemPrompt = "Tu es un assistant de recherche spécialisé dans l'expatriation. " .
            "Tu fournis des informations actualisées, vérifiées et sourcées.";

        $userPrompt = <<<PROMPT
Recherche les informations les plus récentes sur: "{$topic}"
Pays concerné: {$country}
Contexte: {$context}

Fournis:
1. Les informations clés actualisées
2. Les sources officielles consultées
3. La date de dernière mise à jour si disponible
4. Les points d'attention ou changements récents

Réponds en {$language}.
PROMPT;

        $response = $this->chat([
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userPrompt],
            ],
        ]);

        $result = [
            'content' => $response['content'],
            'citations' => $response['citations'] ?? [],
            'retrieved_at' => now()->toISOString(),
        ];

        // Cache 24h pour les infos actualisées
        Cache::put($cacheKey, $result, 60 * 60 * 24);

        return $result;
    }

    /**
     * Vérifier/fact-check une information
     */
    public function factCheck(string $claim, string $country = ''): array
    {
        $forceRefresh = false; // Par défaut pas de force refresh pour fact-check
        $cacheKey = $this->getCacheKey('factcheck', ['claim' => $claim, 'country' => $country]);
        
        if (!$forceRefresh && Cache::has($cacheKey)) {
            $this->incrementCacheHits();
            return Cache::get($cacheKey);
        }

        $countryContext = $country ? " dans le contexte de {$country}" : '';

        $response = $this->chat([
            'messages' => [
                [
                    'role' => 'system',
                    'content' => "Tu es un fact-checker rigoureux. Tu vérifies les affirmations avec des sources fiables."
                ],
                [
                    'role' => 'user',
                    'content' => "Vérifie cette affirmation{$countryContext}:\n\"{$claim}\"\n\n" .
                        "Réponds en JSON:\n" .
                        '{"verified": true/false, "confidence": 0-100, "explanation": "...", "sources": [...]}'
                ],
            ],
        ]);

        $result = $this->parseJsonResponse($response['content']);
        $result['citations'] = $response['citations'] ?? [];

        Cache::put($cacheKey, $result, $this->cacheTtl);

        return $result;
    }

    /**
     * Obtenir les liens officiels pour un sujet
     */
    public function getOfficialLinks(string $topic, string $country): array
    {
        $cacheKey = $this->getCacheKey('links', ['topic' => $topic, 'country' => $country]);
        
        if (Cache::has($cacheKey)) {
            $this->incrementCacheHits();
            return Cache::get($cacheKey);
        }

        $response = $this->chat([
            'messages' => [
                [
                    'role' => 'system',
                    'content' => "Tu recherches les liens officiels et sites gouvernementaux pertinents."
                ],
                [
                    'role' => 'user',
                    'content' => "Trouve les sites et liens officiels pour: {$topic}\n" .
                        "Pays: {$country}\n\n" .
                        "Réponds en JSON:\n" .
                        '{"links": [{"title": "...", "url": "...", "type": "government|embassy|official|ngo", "description": "..."}]}'
                ],
            ],
        ]);

        $result = $this->parseJsonResponse($response['content']);
        $result['links'] = array_map(function ($link) {
            return [
                'title' => $link['title'] ?? '',
                'url' => $link['url'] ?? '',
                'type' => $link['type'] ?? 'official',
                'description' => $link['description'] ?? '',
            ];
        }, $result['links'] ?? []);

        Cache::put($cacheKey, $result, $this->cacheTtl);

        return $result;
    }

    /**
     * 🔧 AJOUT : Invalider le cache pour une requête spécifique
     */
    public function invalidateCache(string $type, array $params): bool
    {
        $cacheKey = $this->getCacheKey($type, $params);
        return Cache::forget($cacheKey);
    }

    /**
     * 🔧 AJOUT : Vider tout le cache Perplexity
     */
    public function clearAllCache(): int
    {
        try {
            return \DB::table('perplexity_cache')->delete();
        } catch (\Exception $e) {
            Log::warning('Failed to clear Perplexity cache: ' . $e->getMessage());
            return 0;
        }
    }

    // =========================================================================
    // MÉTHODE SEARCH PRINCIPALE
    // =========================================================================

    /**
     * Recherche simple
     */
    public function search(array $params): array
    {
        $query = $params['query'] ?? '';
        $focus = $params['focus'] ?? null;

        return $this->chat([
            'messages' => [
                ['role' => 'user', 'content' => $query],
            ],
            'search_focus' => $focus,
        ]);
    }

    /**
     * Appel API Perplexity Chat
     */
    public function chat(array $params): array
    {
        if (!$this->isAvailable()) {
            throw new \RuntimeException(
                'Perplexity API key not configured. ' .
                'Please set PERPLEXITY_API_KEY in your .env file'
            );
        }

        return $this->executeWithRetry(function () use ($params) {
            $model = $params['model'] ?? self::MODEL_LARGE;

            $payload = [
                'model' => $model,
                'messages' => $params['messages'],
                'temperature' => $params['temperature'] ?? 0.2,
                'max_tokens' => $params['max_tokens'] ?? 2000,
            ];

            // Ajouter search_recency_filter si spécifié
            if (isset($params['recency'])) {
                $payload['search_recency_filter'] = $params['recency']; // day, week, month, year
            }

            // Construire le client HTTP
            $httpClient = Http::withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
                'Content-Type' => 'application/json',
            ])->timeout(config('ai.perplexity.timeout', 60));

            // 🔧 CORRECTION SSL : Désactiver vérification SSL en développement
            if (config('app.env') === 'local' || env('CURL_VERIFY_SSL') === 'false') {
                $httpClient = $httpClient->withOptions(['verify' => false]);
            }

            // Effectuer la requête
            $response = $httpClient->post("{$this->baseUrl}/chat/completions", $payload);

            // 🔧 AMÉLIORATION : Gestion détaillée des erreurs
            if (!$response->successful()) {
                $this->handleApiError($response);
            }

            $data = $response->json();
            $usage = $data['usage'] ?? [];

            // Calculer et enregistrer le coût
            $inputTokens = $usage['prompt_tokens'] ?? 0;
            $outputTokens = $usage['completion_tokens'] ?? 0;
            
            $cost = $this->calculateCost($model, $inputTokens, $outputTokens);
            
            $this->recordCost('search', $cost, [
                'model' => $model,
                'input_tokens' => $inputTokens,
                'output_tokens' => $outputTokens,
            ]);

            // Incrémenter le compteur
            Cache::increment("ai_requests:perplexity:" . now()->format('Y-m-d'));

            return [
                'content' => $data['choices'][0]['message']['content'] ?? '',
                'citations' => $data['citations'] ?? [],
                'usage' => $usage,
                'cost' => $cost,
            ];

        }, 'chat');
    }

    // =========================================================================
    // GESTION DES ERREURS
    // =========================================================================

    /**
     * 🔧 AMÉLIORATION : Gestion détaillée des erreurs API
     */
    protected function handleApiError($response): void
    {
        $status = $response->status();
        $error = $response->json()['error'] ?? [];
        $message = $error['message'] ?? $response->body();

        switch ($status) {
            case 429:
                throw new RateLimitException(
                    'Perplexity rate limit exceeded. ' . $message
                );

            case 400:
                throw new InvalidRequestException('Invalid request to Perplexity: ' . $message);

            case 401:
                throw new ApiException('Invalid Perplexity API key: ' . $message);

            case 500:
            case 502:
            case 503:
                throw new ServerException(
                    'Perplexity server error (will retry automatically): ' . $message
                );

            default:
                throw new ApiException("Perplexity API error {$status}: " . $message);
        }
    }

    // =========================================================================
    // MÉTHODES PRIVÉES
    // =========================================================================

    /**
     * Calculer le coût
     */
    private function calculateCost(string $model, int $inputTokens, int $outputTokens): float
    {
        if (!isset($this->pricing[$model])) {
            return 0;
        }

        $inputCost = ($inputTokens / 1000) * $this->pricing[$model]['input'];
        $outputCost = ($outputTokens / 1000) * $this->pricing[$model]['output'];

        return round($inputCost + $outputCost, 6);
    }

    /**
     * Construire une requête pour les sources
     */
    private function buildSourceQuery(string $topic, string $country, string $language): string
    {
        $countryContext = $country ? " en/au {$country}" : '';
        
        return "Quelles sont les sources officielles et gouvernementales sur {$topic}{$countryContext}? " .
            "Liste uniquement les sites officiels (gouvernement, ambassades, organismes publics). " .
            "Réponds en {$language}.";
    }

    /**
     * Parser la réponse pour extraire les sources
     */
    private function parseSourcesResponse(array $response, int $maxSources): array
    {
        $sources = [];

        // Extraire les citations de Perplexity
        foreach ($response['citations'] ?? [] as $index => $url) {
            if (count($sources) >= $maxSources) break;

            $sources[] = [
                'url' => $url,
                'title' => $this->extractDomainName($url),
                'type' => $this->detectSourceType($url),
                'index' => $index + 1,
            ];
        }

        return [
            'sources' => $sources,
            'summary' => $response['content'] ?? '',
            'retrieved_at' => now()->toISOString(),
        ];
    }

    /**
     * Extraire le nom de domaine d'une URL
     */
    private function extractDomainName(string $url): string
    {
        $parsed = parse_url($url);
        $host = $parsed['host'] ?? $url;
        
        // Retirer www.
        return preg_replace('/^www\./', '', $host);
    }

    /**
     * Détecter le type de source
     */
    private function detectSourceType(string $url): string
    {
        $host = strtolower($this->extractDomainName($url));

        if (preg_match('/\.gouv\.|\.gov\.|government|gouvernement/', $host)) {
            return 'government';
        }
        if (preg_match('/ambassade|embassy|consulat|consulate/', $host)) {
            return 'embassy';
        }
        if (preg_match('/\.org$/', $host)) {
            return 'ngo';
        }
        if (preg_match('/\.edu$|universi/', $host)) {
            return 'academic';
        }

        return 'official';
    }

    /**
     * Générer une clé de cache
     */
    private function getCacheKey(string $type, array $params): string
    {
        $hash = md5(json_encode($params));
        return "perplexity:{$type}:{$hash}";
    }

    /**
     * Incrémenter le compteur de cache hits
     */
    private function incrementCacheHits(): void
    {
        Cache::increment("ai_cache_hits:perplexity:" . now()->format('Y-m-d'));
    }
}