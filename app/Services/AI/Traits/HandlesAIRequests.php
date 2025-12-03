<?php

namespace App\Services\AI\Traits;

use App\Models\ApiCost;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

trait HandlesAIRequests
{
    protected int $maxRetries = 3;
    protected int $retryDelay = 1000; // millisecondes
    protected float $lastRequestCost = 0;
    protected array $lastRequestMeta = [];

    /**
     * Exécuter une requête avec retry automatique
     */
    protected function executeWithRetry(callable $callback, string $operation): mixed
    {
        $attempts = 0;
        $lastException = null;

        while ($attempts < $this->maxRetries) {
            try {
                $startTime = microtime(true);
                $result = $callback();
                $duration = microtime(true) - $startTime;

                $this->logSuccess($operation, $duration);
                return $result;

            } catch (\Exception $e) {
                $lastException = $e;
                $attempts++;

                $this->logError($operation, $e, $attempts);

                if ($attempts < $this->maxRetries) {
                    usleep($this->retryDelay * 1000 * $attempts); // Backoff exponentiel
                }
            }
        }

        throw $lastException;
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
     * Calculer le nombre de tokens (estimation)
     */
    protected function estimateTokens(string $text): int
    {
        // Approximation: 1 token ≈ 4 caractères en anglais, 2-3 en français
        return (int) ceil(mb_strlen($text) / 3.5);
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