<?php

namespace App\Services\AI;

use App\Services\AI\Contracts\AIServiceInterface;
use App\Services\AI\Traits\HandlesAIRequests;
use App\Services\AI\Exceptions\RateLimitException;
use App\Services\AI\Exceptions\InsufficientQuotaException;
use App\Services\AI\Exceptions\ContextLengthException;
use App\Services\AI\Exceptions\ServerException;
use App\Services\AI\Exceptions\InvalidRequestException;
use App\Services\AI\Exceptions\ApiException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class GptService implements AIServiceInterface
{
    use HandlesAIRequests;

    // =========================================================================
    // CONFIGURATION
    // =========================================================================

    protected string $apiKey;
    protected string $baseUrl = 'https://api.openai.com/v1';
    
    // Modèles disponibles
    const MODEL_GPT4 = 'gpt-4-turbo-preview';
    const MODEL_GPT4O = 'gpt-4o';
    const MODEL_GPT4O_MINI = 'gpt-4o-mini';
    const MODEL_GPT35 = 'gpt-3.5-turbo';

    // Tarifs par 1000 tokens (USD) - Décembre 2025
    protected array $pricing = [
        'gpt-4-turbo-preview' => ['input' => 0.01, 'output' => 0.03],
        'gpt-4o' => ['input' => 0.0025, 'output' => 0.01],       // $2.50/1M input, $10/1M output
        'gpt-4o-mini' => ['input' => 0.00015, 'output' => 0.0006], // $0.15/1M input, $0.60/1M output
        'gpt-3.5-turbo' => ['input' => 0.0005, 'output' => 0.0015],
    ];

    // =========================================================================
    // CONSTRUCTEUR
    // =========================================================================

    public function __construct()
    {
        $this->apiKey = config('ai.openai.api_key');
        
        // 🔧 CORRECTION : Validation stricte de la clé API
        if (empty($this->apiKey)) {
            throw new \RuntimeException(
                'OPENAI_API_KEY is required but not configured. ' .
                'Please set it in your .env file or config/ai.php'
            );
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
        return 'openai';
    }

    public function estimateCost(string $operation, array $params = []): float
    {
        $model = $params['model'] ?? self::MODEL_GPT4O;
        $inputTokens = $params['input_tokens'] ?? 0;
        $outputTokens = $params['output_tokens'] ?? 500;

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
        $month = now()->format('Y-m');

        return [
            'daily_cost' => Cache::get("ai_costs:openai:{$today}", 0),
            'monthly_cost' => $this->getMonthlyUsage(),
            'requests_today' => Cache::get("ai_requests:openai:{$today}", 0),
        ];
    }

    // =========================================================================
    // MÉTHODES PRINCIPALES
    // =========================================================================

    /**
     * Générer du contenu (articles, guides, etc.)
     */
    public function generateContent(array $params): array
    {
        $theme = $params['theme'] ?? '';
        $country = $params['country'] ?? '';
        $countryIn = $params['country_in'] ?? "en {$country}";
        $language = $params['language'] ?? 'fr';
        $wordCount = $params['word_count'] ?? 1500;
        $platform = $params['platform'] ?? 'sos-expat';
        $specialty = $params['specialty'] ?? null;
        $domain = $params['domain'] ?? null;

        // Construire le prompt selon le type de contenu
        $systemPrompt = $this->buildContentSystemPrompt($platform, $language);
        $userPrompt = $this->buildContentUserPrompt([
            'theme' => $theme,
            'country' => $country,
            'country_in' => $countryIn,
            'language' => $language,
            'word_count' => $wordCount,
            'specialty' => $specialty,
            'domain' => $domain,
        ]);

        $response = $this->chat([
            'model' => self::MODEL_GPT4O,
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userPrompt],
            ],
            'temperature' => 0.7,
            'max_tokens' => 4000,
        ]);

        return $this->parseContentResponse($response);
    }

    /**
     * Traduire du texte (utilise GPT-4o-mini = 99% moins cher)
     */
    public function translateText(string $text, string $targetLanguage, string $sourceLanguage = 'fr'): string
    {
        $languageNames = [
            'fr' => 'français',
            'en' => 'anglais',
            'de' => 'allemand',
            'es' => 'espagnol',
            'pt' => 'portugais',
            'ru' => 'russe',
            'zh' => 'chinois simplifié',
            'ar' => 'arabe',
            'hi' => 'hindi',
        ];

        $targetName = $languageNames[$targetLanguage] ?? $targetLanguage;
        $sourceName = $languageNames[$sourceLanguage] ?? $sourceLanguage;

        $systemPrompt = "Tu es un traducteur professionnel spécialisé dans le contenu pour expatriés. " .
            "Traduis fidèlement en conservant le ton, le style et les nuances culturelles. " .
            "Ne traduis PAS les noms propres, les marques ou les termes techniques internationaux. " .
            "Adapte les expressions idiomatiques au contexte culturel de la langue cible.";

        $userPrompt = "Traduis le texte suivant du {$sourceName} vers le {$targetName}.\n\n" .
            "Texte à traduire:\n\"\"\"\n{$text}\n\"\"\"\n\n" .
            "Réponds UNIQUEMENT avec la traduction, sans commentaire ni explication.";

        $response = $this->chat([
            'model' => self::MODEL_GPT4O_MINI, // 99% moins cher!
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userPrompt],
            ],
            'temperature' => 0.3, // Plus déterministe pour les traductions
            'max_tokens' => $this->estimateTokens($text) * 2,
        ]);

        return trim($response['content']);
    }

    /**
     * Générer les meta title et description SEO
     */
    public function generateMeta(array $params): array
    {
        $title = $params['title'] ?? '';
        $content = $params['content'] ?? '';
        $language = $params['language'] ?? 'fr';
        $country = $params['country'] ?? '';

        // Limiter le contenu pour réduire les coûts
        $contentExcerpt = mb_substr($content, 0, 1000);

        $systemPrompt = "Tu es un expert SEO spécialisé dans le référencement international. " .
            "Tu génères des meta tags optimisés pour le référencement Google.";

        $userPrompt = <<<PROMPT
Génère les meta tags SEO pour cet article en {$language}.

Titre de l'article: {$title}
Pays concerné: {$country}

Extrait du contenu:
"{$contentExcerpt}"

Réponds en JSON avec ce format exact:
{
    "meta_title": "Titre SEO (max 60 caractères)",
    "meta_description": "Description SEO (max 155 caractères)",
    "focus_keyword": "mot-clé principal",
    "secondary_keywords": ["mot-clé 2", "mot-clé 3"]
}
PROMPT;

        $response = $this->chat([
            'model' => self::MODEL_GPT4O_MINI,
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userPrompt],
            ],
            'temperature' => 0.5,
            'max_tokens' => 500,
        ]);

        return $this->parseJsonResponse($response['content']);
    }

    /**
     * Générer des FAQs pour un article
     */
    public function generateFaqs(array $params): array
    {
        $title = $params['title'] ?? '';
        $content = $params['content'] ?? '';
        $language = $params['language'] ?? 'fr';
        $count = $params['count'] ?? 5;

        // Limiter le contenu
        $contentExcerpt = mb_substr($content, 0, 2000);

        $systemPrompt = "Tu es un expert en création de FAQ pertinentes et utiles pour les lecteurs.";

        $userPrompt = <<<PROMPT
Génère {$count} questions-réponses FAQ pour cet article en {$language}.

Titre: {$title}

Contenu:
"{$contentExcerpt}"

Règles:
- Questions naturelles que les lecteurs se posent vraiment
- Réponses concises (50-100 mots)
- Évite les questions trop génériques

Réponds en JSON:
{
    "faqs": [
        {"question": "...", "answer": "..."},
        ...
    ]
}
PROMPT;

        $response = $this->chat([
            'model' => self::MODEL_GPT4O_MINI,
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userPrompt],
            ],
            'temperature' => 0.6,
            'max_tokens' => 1500,
        ]);

        $parsed = $this->parseJsonResponse($response['content']);
        return $parsed['faqs'] ?? [];
    }

    /**
     * Générer un résumé/excerpt
     */
    public function generateExcerpt(string $content, int $maxLength = 160, string $language = 'fr'): string
    {
        $systemPrompt = "Tu génères des résumés accrocheurs et informatifs.";

        $userPrompt = "Génère un résumé de maximum {$maxLength} caractères pour ce texte en {$language}.\n\n" .
            "Texte:\n\"{$content}\"\n\n" .
            "Réponds UNIQUEMENT avec le résumé.";

        $response = $this->chat([
            'model' => self::MODEL_GPT4O_MINI,
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userPrompt],
            ],
            'temperature' => 0.5,
            'max_tokens' => 100,
        ]);

        return mb_substr(trim($response['content']), 0, $maxLength);
    }

    /**
     * Améliorer du contenu existant
     */
    public function improveContent(string $content, array $options = []): string
    {
        $tone = $options['tone'] ?? 'professionnel mais accessible';
        $focus = $options['focus'] ?? 'clarté et engagement';
        $language = $options['language'] ?? 'fr';

        $systemPrompt = "Tu es un rédacteur expert qui améliore des textes pour les rendre plus engageants et clairs.";

        $userPrompt = <<<PROMPT
Améliore ce texte en {$language}.

Objectifs:
- Ton: {$tone}
- Focus: {$focus}
- Garder la même structure générale
- Améliorer la lisibilité et l'engagement
- Corriger les erreurs grammaticales

Texte à améliorer:
"{$content}"

Réponds UNIQUEMENT avec le texte amélioré, sans commentaire.
PROMPT;

        $response = $this->chat([
            'model' => self::MODEL_GPT4O_MINI,
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userPrompt],
            ],
            'temperature' => 0.6,
            'max_tokens' => $this->estimateTokens($content) * 1.5,
        ]);

        return trim($response['content']);
    }

    // =========================================================================
    // MÉTHODE CHAT PRINCIPALE
    // =========================================================================

    /**
     * Appel API OpenAI Chat Completions
     */
    public function chat(array $params): array
    {
        if (!$this->isAvailable()) {
            throw new \RuntimeException('OpenAI API key not configured');
        }

        return $this->executeWithRetry(function () use ($params) {
            // Construire le client HTTP avec timeouts
            $httpClient = Http::withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
                'Content-Type' => 'application/json',
            ])
            ->timeout(config('ai.openai.timeout', 180))
            ->connectTimeout(config('ai.openai.connect_timeout', 10));

            // 🔧 CORRECTION SSL : Désactiver vérification SSL en développement
            if (config('app.env') === 'local' || !config('ai.http.verify_ssl')) {
                $httpClient = $httpClient->withOptions([
                    'verify' => false
                ]);
            }

            // Effectuer la requête
            $response = $httpClient->post("{$this->baseUrl}/chat/completions", [
                'model' => $params['model'] ?? self::MODEL_GPT4O,
                'messages' => $params['messages'],
                'temperature' => $params['temperature'] ?? 0.7,
                'max_tokens' => $params['max_tokens'] ?? 2000,
                'response_format' => $params['response_format'] ?? null,
            ]);

            // 🔧 AMÉLIORATION : Gestion détaillée des erreurs API
            if (!$response->successful()) {
                $this->handleApiError($response);
            }

            $data = $response->json();
            $usage = $data['usage'] ?? [];

            // Calculer et enregistrer le coût
            $model = $params['model'] ?? self::MODEL_GPT4O;
            $inputTokens = $usage['prompt_tokens'] ?? 0;
            $outputTokens = $usage['completion_tokens'] ?? 0;
            
            $cost = $this->calculateCost($model, $inputTokens, $outputTokens);
            
            $this->recordCost('chat', $cost, [
                'model' => $model,
                'input_tokens' => $inputTokens,
                'output_tokens' => $outputTokens,
                'total_tokens' => $usage['total_tokens'] ?? 0,
            ]);

            // Incrémenter le compteur de requêtes
            $cacheKey = "ai_requests:openai:" . now()->format('Y-m-d');
            Cache::increment($cacheKey);

            return [
                'content' => $data['choices'][0]['message']['content'] ?? '',
                'model' => $model,
                'usage' => $usage,
                'cost' => $cost,
            ];

        }, 'chat');
    }

    /**
     * Appel API avec cache pour requêtes déterministes
     *
     * Utilisez cette méthode pour les appels à faible température (< 0.5)
     * où les résultats sont reproductibles (meta, traductions, etc.)
     *
     * @param array $params Paramètres de la requête
     * @param int $ttl Durée de vie du cache en secondes (défaut: 24h)
     * @return array Réponse (depuis cache ou API)
     */
    public function chatWithCache(array $params, int $ttl = 86400): array
    {
        // Vérifier que la température est suffisamment basse pour être cacheable
        $temperature = $params['temperature'] ?? 0.7;
        if ($temperature > 0.5) {
            Log::channel('ai')->warning('chatWithCache appelé avec température élevée', [
                'temperature' => $temperature,
                'recommendation' => 'Utilisez chat() pour les appels créatifs (temperature > 0.5)',
            ]);
        }

        // Générer une clé de cache unique basée sur les paramètres
        $cacheKey = 'gpt:' . md5(json_encode([
            'model' => $params['model'] ?? self::MODEL_GPT4O,
            'messages' => $params['messages'],
            'temperature' => $temperature,
            'max_tokens' => $params['max_tokens'] ?? 2000,
        ]));

        // Vérifier le cache
        $cached = Cache::get($cacheKey);
        if ($cached !== null) {
            Log::channel('ai')->info('GPT Cache HIT', [
                'cache_key' => substr($cacheKey, 0, 50) . '...',
            ]);

            // Retourner avec indicateur de cache
            return array_merge($cached, ['from_cache' => true, 'cost' => 0]);
        }

        // Pas de cache, appeler l'API
        $response = $this->chat($params);

        // Stocker en cache (sans le flag 'from_cache')
        Cache::put($cacheKey, $response, $ttl);

        Log::channel('ai')->info('GPT Cache MISS - Stored', [
            'cache_key' => substr($cacheKey, 0, 50) . '...',
            'ttl_hours' => round($ttl / 3600, 1),
        ]);

        return array_merge($response, ['from_cache' => false]);
    }

    /**
     * Invalider le cache pour un pattern de clé
     */
    public function invalidateCache(string $pattern = 'gpt:*'): int
    {
        // Note: Cette méthode nécessite Redis pour le pattern matching
        // Pour les autres drivers, on ne peut pas facilement invalider par pattern
        if (config('cache.default') === 'redis') {
            $redis = Cache::getRedis();
            $keys = $redis->keys($pattern);
            if (!empty($keys)) {
                $redis->del($keys);
                return count($keys);
            }
        }

        return 0;
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
                $retryAfter = $response->header('Retry-After') ?? $error['retry_after'] ?? 60;
                throw new RateLimitException(
                    'OpenAI rate limit exceeded. ' . $message,
                    (int) $retryAfter
                );

            case 402:
                throw new InsufficientQuotaException(
                    'OpenAI quota exceeded. Please check your billing. ' . $message
                );

            case 400:
                if (str_contains($message, 'context_length_exceeded')) {
                    throw new ContextLengthException(
                        'Content too long for model. Please reduce input length. ' . $message
                    );
                }
                throw new InvalidRequestException('Invalid request: ' . $message);

            case 500:
            case 502:
            case 503:
                throw new ServerException(
                    'OpenAI server error (will retry automatically): ' . $message
                );

            case 401:
                throw new ApiException('Invalid API key: ' . $message);

            case 404:
                throw new ApiException('Model not found: ' . $message);

            default:
                throw new ApiException("OpenAI API error {$status}: " . $message);
        }
    }

    // =========================================================================
    // MÉTHODES PRIVÉES
    // =========================================================================

    /**
     * Calculer le coût réel d'une requête
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
     * Obtenir l'utilisation mensuelle
     */
    private function getMonthlyUsage(): float
    {
        $total = 0;
        $startOfMonth = now()->startOfMonth();
        
        for ($day = 0; $day < now()->day; $day++) {
            $date = $startOfMonth->copy()->addDays($day)->format('Y-m-d');
            $total += Cache::get("ai_costs:openai:{$date}", 0);
        }

        return $total;
    }

    /**
     * Construire le prompt système pour la génération de contenu
     */
    private function buildContentSystemPrompt(string $platform, string $language): string
    {
        $platformContext = match ($platform) {
            'sos-expat' => "Tu écris pour SOS-Expat, une plateforme d'aide urgente aux expatriés français. " .
                "Le ton est professionnel, rassurant et orienté solutions.",
            'ulixai' => "Tu écris pour Ulixai, une marketplace de services pour expatriés. " .
                "Le ton est informatif, pratique et engageant.",
            default => "Tu écris du contenu pour expatriés.",
        };

        return <<<PROMPT
{$platformContext}

Tu es un expert en expatriation avec une connaissance approfondie des démarches administratives, 
juridiques et pratiques pour les Français vivant à l'étranger.

Règles de rédaction:
- Écris en {$language} avec un style naturel et fluide
- Structure claire avec des titres H2 et H3
- Informations précises, actuelles et vérifiables
- Conseils pratiques et actionables
- Ton empathique (tu comprends les difficultés des expatriés)
- Évite le jargon technique sauf si expliqué
- Inclus des exemples concrets quand pertinent
PROMPT;
    }

    /**
     * Construire le prompt utilisateur pour la génération de contenu
     */
    private function buildContentUserPrompt(array $params): string
    {
        $theme = $params['theme'];
        $countryIn = $params['country_in'];
        $wordCount = $params['word_count'];
        $specialty = $params['specialty'] ?? null;
        $domain = $params['domain'] ?? null;

        $context = "";
        if ($specialty) {
            $context .= "Spécialité juridique: {$specialty}\n";
        }
        if ($domain) {
            $context .= "Domaine: {$domain}\n";
        }

        return <<<PROMPT
Rédige un article complet sur le thème: "{$theme}" pour les expatriés français {$countryIn}.

{$context}

Longueur cible: environ {$wordCount} mots

Structure attendue:
1. Introduction engageante (contexte + problématique)
2. Sections principales avec sous-titres H2
3. Conseils pratiques
4. Points d'attention / pièges à éviter
5. Conclusion avec appel à l'action

Réponds en JSON avec ce format:
{
    "title": "Titre accrocheur de l'article",
    "excerpt": "Résumé de 150-160 caractères",
    "content": "Contenu HTML de l'article avec balises h2, h3, p, ul, li",
    "word_count": nombre_de_mots,
    "key_points": ["point clé 1", "point clé 2", "point clé 3"]
}
PROMPT;
    }

    /**
     * Parser la réponse de génération de contenu
     */
    private function parseContentResponse(array $response): array
    {
        $parsed = $this->parseJsonResponse($response['content']);

        return [
            'title' => $parsed['title'] ?? '',
            'excerpt' => $parsed['excerpt'] ?? '',
            'content' => $parsed['content'] ?? '',
            'word_count' => $parsed['word_count'] ?? 0,
            'key_points' => $parsed['key_points'] ?? [],
            'usage' => $response['usage'] ?? [],
            'cost' => $response['cost'] ?? 0,
        ];
    }
}