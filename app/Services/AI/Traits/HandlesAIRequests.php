<?php

namespace App\Services\AI\Traits;

use App\Models\ApiCost;
use App\Services\AI\Exceptions\RateLimitException;
use App\Services\AI\Exceptions\ServerException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

trait HandlesAIRequests
{
    protected int $maxRetries = 3;
    protected int $baseRetryDelay = 1000; // millisecondes
    protected float $lastRequestCost = 0;
    protected array $lastRequestMeta = [];

    // Circuit Breaker configuration
    protected int $circuitBreakerThreshold = 5; // Nombre d'échecs avant ouverture
    protected int $circuitBreakerTimeout = 60;  // Secondes avant réessai

    /**
     * Exécuter une requête avec retry automatique et Circuit Breaker
     */
    protected function executeWithRetry(callable $callback, string $operation): mixed
    {
        // Vérifier si le circuit est ouvert
        if ($this->isCircuitOpen()) {
            $until = Cache::get("circuit_breaker:{$this->getServiceName()}:until", 0);
            $remainingSeconds = max(0, $until - time());
            throw new \RuntimeException(
                "Circuit breaker ouvert pour {$this->getServiceName()}. " .
                "Réessayez dans {$remainingSeconds} secondes."
            );
        }

        $attempts = 0;
        $lastException = null;

        while ($attempts < $this->maxRetries) {
            try {
                $startTime = microtime(true);
                $result = $callback();
                $duration = microtime(true) - $startTime;

                $this->logSuccess($operation, $duration);
                $this->recordCircuitSuccess();

                return $result;

            } catch (\Exception $e) {
                $lastException = $e;
                $attempts++;

                $this->logError($operation, $e, $attempts);

                // Ne pas retry pour certaines erreurs non-récupérables
                if (!$this->isRetryableException($e)) {
                    $this->recordCircuitFailure();
                    break;
                }

                if ($attempts < $this->maxRetries) {
                    $delay = $this->calculateRetryDelay($e, $attempts);
                    usleep($delay * 1000); // Convertir en microsecondes
                }
            }
        }

        // Enregistrer l'échec pour le circuit breaker
        $this->recordCircuitFailure();

        throw $lastException;
    }

    /**
     * Calculer le délai de retry intelligent
     * Priorité: Retry-After header > Backoff exponentiel
     */
    protected function calculateRetryDelay(\Exception $e, int $attempt): int
    {
        // Priorité 1: Utiliser Retry-After si présent (rate limiting)
        if ($e instanceof RateLimitException && $e->getRetryAfter()) {
            $retryAfterMs = $e->getRetryAfter() * 1000;
            Log::channel('ai')->info("Using Retry-After header: {$e->getRetryAfter()}s");
            return min($retryAfterMs, 120000); // Max 2 minutes
        }

        // Priorité 2: Backoff exponentiel avec jitter (1s, 2s, 4s, 8s...)
        $exponentialDelay = $this->baseRetryDelay * pow(2, $attempt - 1);
        $jitter = rand(0, 500); // Ajouter 0-500ms de jitter pour éviter thundering herd

        return min($exponentialDelay + $jitter, 30000); // Max 30 secondes
    }

    /**
     * Vérifier si une exception est récupérable (retry possible)
     */
    protected function isRetryableException(\Exception $e): bool
    {
        // Rate limit et erreurs serveur sont récupérables
        if ($e instanceof RateLimitException || $e instanceof ServerException) {
            return true;
        }

        // Erreurs réseau/timeout sont récupérables
        $message = strtolower($e->getMessage());
        $retryablePatterns = [
            'timeout',
            'connection',
            'temporarily unavailable',
            'service unavailable',
            'bad gateway',
            'gateway timeout',
        ];

        foreach ($retryablePatterns as $pattern) {
            if (str_contains($message, $pattern)) {
                return true;
            }
        }

        return false;
    }

    // =========================================================================
    // CIRCUIT BREAKER
    // =========================================================================

    /**
     * Vérifier si le circuit breaker est ouvert
     */
    protected function isCircuitOpen(): bool
    {
        $key = "circuit_breaker:{$this->getServiceName()}";
        $isOpen = Cache::get($key . ':open', false);
        $until = Cache::get($key . ':until', 0);

        return $isOpen && $until > time();
    }

    /**
     * Enregistrer un échec pour le circuit breaker
     */
    protected function recordCircuitFailure(): void
    {
        $key = "circuit_breaker:{$this->getServiceName()}";
        $failures = Cache::increment($key . ':failures');

        // TTL de 5 minutes pour le compteur d'échecs
        Cache::put($key . ':failures', $failures, 300);

        if ($failures >= $this->circuitBreakerThreshold) {
            Cache::put($key . ':open', true, $this->circuitBreakerTimeout);
            Cache::put($key . ':until', time() + $this->circuitBreakerTimeout, $this->circuitBreakerTimeout);

            Log::channel('ai')->warning("Circuit breaker OUVERT", [
                'service' => $this->getServiceName(),
                'failures' => $failures,
                'timeout_seconds' => $this->circuitBreakerTimeout,
            ]);
        }
    }

    /**
     * Enregistrer un succès et réinitialiser le circuit breaker
     */
    protected function recordCircuitSuccess(): void
    {
        $key = "circuit_breaker:{$this->getServiceName()}";
        Cache::forget($key . ':failures');
        Cache::forget($key . ':open');
        Cache::forget($key . ':until');
    }

    /**
     * Forcer la réouverture du circuit (pour tests ou admin)
     */
    public function resetCircuitBreaker(): void
    {
        $this->recordCircuitSuccess();
        Log::channel('ai')->info("Circuit breaker réinitialisé manuellement", [
            'service' => $this->getServiceName(),
        ]);
    }

    /**
     * Obtenir le statut du circuit breaker
     */
    public function getCircuitBreakerStatus(): array
    {
        $key = "circuit_breaker:{$this->getServiceName()}";
        $isOpen = $this->isCircuitOpen();
        $until = Cache::get($key . ':until', 0);
        $failures = Cache::get($key . ':failures', 0);

        return [
            'service' => $this->getServiceName(),
            'is_open' => $isOpen,
            'failures' => $failures,
            'threshold' => $this->circuitBreakerThreshold,
            'remaining_seconds' => $isOpen ? max(0, $until - time()) : 0,
        ];
    }

    /**
     * Logger une requête réussie
     */
    protected function logSuccess(string $operation, float $duration): void
    {
        Log::channel('ai')->info("AI Request Success", [
            'service' => $this->getServiceName(),
            'operation' => $operation,
            'duration_ms' => round($duration * 1000, 2),
            'cost' => $this->lastRequestCost,
        ]);
    }

    /**
     * Logger une erreur
     */
    protected function logError(string $operation, \Exception $e, int $attempt): void
    {
        Log::channel('ai')->warning("AI Request Failed", [
            'service' => $this->getServiceName(),
            'operation' => $operation,
            'attempt' => $attempt,
            'error' => $e->getMessage(),
        ]);
    }

    /**
     * Enregistrer le coût d'une requête (agrégation par jour)
     * 🔧 CORRIGÉ : Utilise firstOrCreate + increment au lieu de DB::raw
     */
    protected function recordCost(string $operation, float $cost, array $meta = []): void
    {
        $this->lastRequestCost = $cost;
        $this->lastRequestMeta = $meta;

        // Trouver ou créer l'enregistrement du jour
        $record = ApiCost::firstOrCreate(
            [
                'date' => now()->startOfDay(),
                'service' => $this->getServiceName(),
                'model' => $meta['model'] ?? null,
                'type' => $operation,
            ],
            [
                'requests_count' => 0,
                'input_tokens' => 0,
                'output_tokens' => 0,
                'cost' => 0,
            ]
        );

        // Incrémenter les valeurs (pas de problème de casting avec increment)
        $record->increment('requests_count', 1);
        $record->increment('input_tokens', $meta['input_tokens'] ?? 0);
        $record->increment('output_tokens', $meta['output_tokens'] ?? 0);
        $record->increment('cost', $cost);

        // Mettre à jour le cache des coûts quotidiens (pour vérification rapide)
        $this->updateCostCache($cost);
    }

    /**
     * Mettre à jour le cache des coûts
     */
    protected function updateCostCache(float $cost): void
    {
        $today = now()->format('Y-m-d');
        $service = $this->getServiceName();

        // Cache par service
        $serviceKey = "ai_costs:{$service}:{$today}";
        $serviceCost = Cache::get($serviceKey, 0);
        Cache::put($serviceKey, $serviceCost + $cost, now()->endOfDay());

        // Cache total
        $totalKey = "ai_costs:total:{$today}";
        $totalCost = Cache::get($totalKey, 0);
        Cache::put($totalKey, $totalCost + $cost, now()->endOfDay());

        // Compteur de requêtes
        $requestKey = "ai_requests:{$service}:{$today}";
        Cache::increment($requestKey);
    }

    /**
     * Obtenir le coût de la dernière requête
     */
    public function getLastRequestCost(): float
    {
        return $this->lastRequestCost;
    }

    /**
     * Obtenir les métadonnées de la dernière requête
     */
    public function getLastRequestMeta(): array
    {
        return $this->lastRequestMeta;
    }

    /**
     * Calculer le nombre de tokens (estimation améliorée par langue)
     *
     * Les coefficients sont basés sur les ratios tokens/caractères observés
     * pour chaque langue avec les tokenizers GPT-4.
     *
     * @param string $text Texte à estimer
     * @param string $language Code langue ISO (fr, en, de, etc.)
     * @return int Nombre de tokens estimé (avec marge de sécurité 10%)
     */
    protected function estimateTokens(string $text, string $language = 'en'): int
    {
        // Coefficients tokens/caractère par langue
        // Plus le coefficient est élevé, plus la langue génère de tokens par caractère
        $coefficients = [
            'en' => 0.25,   // ~4 caractères/token (langues latines, mots courts)
            'fr' => 0.30,   // ~3.3 caractères/token (accents, mots plus longs)
            'de' => 0.28,   // ~3.5 caractères/token (mots composés)
            'es' => 0.29,   // ~3.4 caractères/token
            'pt' => 0.29,   // ~3.4 caractères/token
            'it' => 0.28,   // ~3.5 caractères/token
            'nl' => 0.27,   // ~3.7 caractères/token
            'ru' => 0.35,   // ~2.8 caractères/token (cyrillique)
            'zh' => 0.50,   // ~2 caractères/token (idéogrammes = souvent 1 token)
            'ja' => 0.50,   // ~2 caractères/token (kanji/hiragana)
            'ko' => 0.45,   // ~2.2 caractères/token (hangul)
            'ar' => 0.38,   // ~2.6 caractères/token (arabe)
            'hi' => 0.40,   // ~2.5 caractères/token (devanagari)
            'he' => 0.35,   // ~2.8 caractères/token (hébreu)
            'th' => 0.45,   // ~2.2 caractères/token (thaï)
            'vi' => 0.32,   // ~3.1 caractères/token (vietnamien avec diacritiques)
            'pl' => 0.30,   // ~3.3 caractères/token (polonais)
            'tr' => 0.28,   // ~3.5 caractères/token (turc)
        ];

        // Coefficient par défaut pour langues non listées
        $coef = $coefficients[$language] ?? 0.30;

        // Calculer le nombre de caractères
        $charCount = mb_strlen($text);

        // Estimer avec marge de sécurité de 10%
        $estimated = (int) ceil($charCount * $coef * 1.10);

        return max($estimated, 1); // Minimum 1 token
    }

    /**
     * Estimer le coût d'une requête avant exécution
     *
     * @param string $prompt Prompt utilisateur
     * @param string $systemPrompt Prompt système
     * @param string $language Code langue
     * @param int $expectedOutputTokens Nombre de tokens de sortie attendus
     * @return array ['input_tokens', 'output_tokens', 'estimated_cost']
     */
    protected function estimateRequestCost(
        string $prompt,
        string $systemPrompt = '',
        string $language = 'en',
        int $expectedOutputTokens = 500
    ): array {
        $inputTokens = $this->estimateTokens($prompt . $systemPrompt, $language);

        return [
            'input_tokens' => $inputTokens,
            'output_tokens' => $expectedOutputTokens,
            'total_tokens' => $inputTokens + $expectedOutputTokens,
        ];
    }

    /**
     * Nettoyer et valider une réponse JSON
     */
    public function parseJsonResponse(string $content): array
    {
        // Nettoyer les balises markdown code
        $content = preg_replace('/```json\s*/', '', $content);
        $content = preg_replace('/```\s*/', '', $content);
        $content = trim($content);

        $decoded = json_decode($content, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \RuntimeException("Invalid JSON response: " . json_last_error_msg());
        }

        return $decoded;
    }

    /**
     * Construire un prompt système standard
     */
    protected function buildSystemPrompt(string $role, array $guidelines = []): string
    {
        $prompt = "Tu es un expert {$role}.\n\n";

        if (!empty($guidelines)) {
            $prompt .= "Instructions importantes:\n";
            foreach ($guidelines as $guideline) {
                $prompt .= "- {$guideline}\n";
            }
        }

        return $prompt;
    }
}