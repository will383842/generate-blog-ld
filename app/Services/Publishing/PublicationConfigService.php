<?php

namespace App\Services\Publishing;

use App\Models\Platform;
use App\Models\PublicationSchedule;
use Illuminate\Support\Facades\Log;

/**
 * Service de configuration de la publication
 * 
 * Gère la configuration de publication par plateforme, avec possibilité
 * de surcharge des valeurs par défaut définies dans config/publishing.php
 */
class PublicationConfigService
{
    /**
     * Obtenir la configuration de publication pour une plateforme
     * 
     * @param int $platformId ID de la plateforme
     * @return array Configuration complète
     */
    public function getConfig(int $platformId): array
    {
        // Récupérer la configuration de la plateforme depuis la DB
        $schedule = PublicationSchedule::where('platform_id', $platformId)
            ->where('is_active', true)
            ->first();

        // Si pas de configuration spécifique, utiliser les valeurs par défaut
        if (!$schedule) {
            return $this->getDefaultConfig();
        }

        // Merger avec les valeurs par défaut
        return array_merge($this->getDefaultConfig(), [
            'articles_per_day' => $schedule->articles_per_day,
            'max_per_hour' => $schedule->max_per_hour,
            'active_hours' => $schedule->active_hours,
            'active_days' => $schedule->active_days,
            'min_interval_minutes' => $schedule->min_interval_minutes,
            'timezone' => $schedule->timezone ?? config('publishing.default_timezone'),
            'pause_on_error' => $schedule->pause_on_error,
            'max_errors_before_pause' => $schedule->max_errors_before_pause,
        ]);
    }

    /**
     * Obtenir la configuration par défaut depuis config/publishing.php
     * 
     * @return array Configuration par défaut
     */
    public function getDefaultConfig(): array
    {
        return [
            'articles_per_day' => config('publishing.articles_per_day', 100),
            'max_per_hour' => config('publishing.max_per_hour', 15),
            'active_hours' => config('publishing.active_hours', [9, 10, 11, 14, 15, 16, 17]),
            'active_days' => config('publishing.active_days', [1, 2, 3, 4, 5]),
            'min_interval_minutes' => config('publishing.min_interval_minutes', 6),
            'timezone' => config('publishing.default_timezone', 'Europe/Paris'),
            'max_attempts' => config('publishing.max_attempts', 3),
            'retry_delay' => config('publishing.retry_delay', 15),
            'pause_on_error' => config('publishing.pause_on_error', true),
            'max_errors_before_pause' => config('publishing.max_errors_before_pause', 5),
        ];
    }

    /**
     * Créer ou mettre à jour la configuration pour une plateforme
     * 
     * @param int $platformId ID de la plateforme
     * @param array $config Configuration à appliquer
     * @return PublicationSchedule
     */
    public function setConfig(int $platformId, array $config): PublicationSchedule
    {
        // Valider que la plateforme existe
        $platform = Platform::findOrFail($platformId);

        // Créer ou mettre à jour
        $schedule = PublicationSchedule::updateOrCreate(
            ['platform_id' => $platformId],
            [
                'articles_per_day' => $config['articles_per_day'] ?? 100,
                'max_per_hour' => $config['max_per_hour'] ?? 15,
                'active_hours' => $config['active_hours'] ?? [9, 10, 11, 14, 15, 16, 17],
                'active_days' => $config['active_days'] ?? [1, 2, 3, 4, 5],
                'min_interval_minutes' => $config['min_interval_minutes'] ?? 6,
                'timezone' => $config['timezone'] ?? 'Europe/Paris',
                'is_active' => $config['is_active'] ?? true,
                'pause_on_error' => $config['pause_on_error'] ?? true,
                'max_errors_before_pause' => $config['max_errors_before_pause'] ?? 5,
            ]
        );

        Log::info('Configuration de publication mise à jour', [
            'platform_id' => $platformId,
            'platform' => $platform->name,
            'articles_per_day' => $schedule->articles_per_day,
        ]);

        return $schedule;
    }

    /**
     * Activer/désactiver la publication pour une plateforme
     * 
     * @param int $platformId ID de la plateforme
     * @param bool $active Activer ou désactiver
     * @return void
     */
    public function setActive(int $platformId, bool $active): void
    {
        $schedule = PublicationSchedule::where('platform_id', $platformId)->first();

        if ($schedule) {
            $schedule->update(['is_active' => $active]);
            
            Log::info('Statut de publication modifié', [
                'platform_id' => $platformId,
                'is_active' => $active,
            ]);
        }
    }

    /**
     * Vérifier si la publication est active pour une plateforme
     * 
     * @param int $platformId ID de la plateforme
     * @return bool
     */
    public function isActive(int $platformId): bool
    {
        $schedule = PublicationSchedule::where('platform_id', $platformId)
            ->where('is_active', true)
            ->exists();

        return $schedule;
    }

    /**
     * Obtenir toutes les plateformes avec publication active
     * 
     * @return \Illuminate\Support\Collection
     */
    public function getActivePlatforms()
    {
        return PublicationSchedule::active()
            ->with('platform')
            ->get()
            ->pluck('platform');
    }

    /**
     * Calculer l'intervalle optimal entre publications
     * 
     * @param int $platformId ID de la plateforme
     * @return int Intervalle en minutes
     */
    public function getOptimalInterval(int $platformId): int
    {
        $config = $this->getConfig($platformId);
        
        $activeHours = count($config['active_hours']);
        if ($activeHours === 0) {
            return 60; // Défaut : 1 heure
        }

        // Calculer le nombre de minutes actives par jour
        $minutesPerDay = $activeHours * 60;

        // Diviser par le nombre d'articles à publier
        $interval = $minutesPerDay / $config['articles_per_day'];

        // S'assurer que l'intervalle respecte le minimum
        return max($config['min_interval_minutes'], (int) ceil($interval));
    }

    /**
     * Obtenir les statistiques de publication pour une plateforme
     * 
     * @param int $platformId ID de la plateforme
     * @return array Statistiques
     */
    public function getStats(int $platformId): array
    {
        $schedule = PublicationSchedule::where('platform_id', $platformId)->first();

        if (!$schedule) {
            return [
                'capacity_today' => 0,
                'published_today' => 0,
                'scheduled_today' => 0,
                'remaining_capacity' => 0,
            ];
        }

        $publishedToday = $schedule->queue()
            ->where('status', 'published')
            ->whereDate('published_at', now($schedule->timezone)->toDateString())
            ->count();

        $scheduledToday = $schedule->queue()
            ->where('status', 'scheduled')
            ->whereDate('scheduled_at', now($schedule->timezone)->toDateString())
            ->count();

        return [
            'capacity_today' => $schedule->articles_per_day,
            'published_today' => $publishedToday,
            'scheduled_today' => $scheduledToday,
            'remaining_capacity' => max(0, $schedule->articles_per_day - $publishedToday - $scheduledToday),
        ];
    }
}