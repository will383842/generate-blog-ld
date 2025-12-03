<?php

namespace App\Services\AI\Contracts;

interface AIServiceInterface
{
    /**
     * Vérifier si le service est disponible
     */
    public function isAvailable(): bool;

    /**
     * Obtenir le nom du service
     */
    public function getServiceName(): string;

    /**
     * Estimer le coût d'une requête
     */
    public function estimateCost(string $operation, array $params = []): float;

    /**
     * Obtenir les statistiques d'utilisation
     */
    public function getUsageStats(): array;
}