<?php

namespace App\Services\Publishing;

use App\Models\PublicationQueue;
use App\Models\PublicationSchedule;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Service de vérification anti-spam
 * 
 * Vérifie qu'une publication peut être effectuée en respectant
 * les règles anti-spam : heures actives, quotas, intervalles, etc.
 */
class AntiSpamChecker
{
    protected PublicationConfigService $configService;

    public function __construct(PublicationConfigService $configService)
    {
        $this->configService = $configService;
    }

    /**
     * Vérifie si on peut publier maintenant pour une plateforme
     * 
     * @param int $platformId ID de la plateforme
     * @return array ['can_publish' => bool, 'reason' => string|null]
     */
    public function canPublishNow(int $platformId): array
    {
        $config = $this->configService->getConfig($platformId);
        $timezone = $config['timezone'];
        $now = Carbon::now($timezone);

        // 1. Vérifier que la publication est active
        if (!$this->configService->isActive($platformId)) {
            return [
                'can_publish' => false,
                'reason' => 'Publication désactivée pour cette plateforme',
            ];
        }

        // 2. Vérifier les heures actives
        if (config('publishing.anti_spam.check_active_hours', true)) {
            if (!$this->isWithinActiveHours($platformId, $now)) {
                $nextHour = $this->getNextActiveHour($platformId, $now);
                return [
                    'can_publish' => false,
                    'reason' => "Hors des heures actives. Prochaine heure : {$nextHour->format('H:i')}",
                ];
            }
        }

        // 3. Vérifier les jours actifs
        if (config('publishing.anti_spam.check_active_days', true)) {
            if (!$this->isWithinActiveDays($platformId, $now)) {
                $nextDay = $this->getNextActiveDay($platformId, $now);
                return [
                    'can_publish' => false,
                    'reason' => "Hors des jours actifs. Prochain jour : {$nextDay->format('l d/m')}",
                ];
            }
        }

        // 4. Vérifier le quota journalier
        if (config('publishing.anti_spam.check_daily_limit', true)) {
            if (!$this->hasRemainingDailyCapacity($platformId, $now)) {
                return [
                    'can_publish' => false,
                    'reason' => 'Quota journalier atteint',
                ];
            }
        }

        // 5. Vérifier le quota horaire
        if (config('publishing.anti_spam.check_hourly_limit', true)) {
            if (!$this->hasRemainingHourlyCapacity($platformId, $now)) {
                return [
                    'can_publish' => false,
                    'reason' => 'Quota horaire atteint',
                ];
            }
        }

        // 6. Vérifier l'intervalle minimum
        if (config('publishing.anti_spam.check_min_interval', true)) {
            if (!$this->respectsMinInterval($platformId, $now)) {
                $nextTime = $this->getNextAvailableTime($platformId, $now);
                return [
                    'can_publish' => false,
                    'reason' => "Intervalle minimum non respecté. Prochain créneau : {$nextTime->format('H:i')}",
                ];
            }
        }

        // Tout est OK !
        return [
            'can_publish' => true,
            'reason' => null,
        ];
    }

    /**
     * Vérifie si on est dans les heures actives
     * 
     * @param int $platformId
     * @param Carbon $dateTime
     * @return bool
     */
    public function isWithinActiveHours(int $platformId, Carbon $dateTime): bool
    {
        $config = $this->configService->getConfig($platformId);
        $activeHours = $config['active_hours'];

        return in_array($dateTime->hour, $activeHours);
    }

    /**
     * Vérifie si on est dans les jours actifs
     * 
     * @param int $platformId
     * @param Carbon $dateTime
     * @return bool
     */
    public function isWithinActiveDays(int $platformId, Carbon $dateTime): bool
    {
        $config = $this->configService->getConfig($platformId);
        $activeDays = $config['active_days'];

        return in_array($dateTime->dayOfWeekIso, $activeDays);
    }

    /**
     * Vérifie si le quota journalier n'est pas atteint
     * 
     * @param int $platformId
     * @param Carbon $date
     * @return bool
     */
    public function hasRemainingDailyCapacity(int $platformId, Carbon $date): bool
    {
        $config = $this->configService->getConfig($platformId);
        $dailyLimit = $config['articles_per_day'];

        $publishedToday = PublicationQueue::where('platform_id', $platformId)
            ->whereIn('status', ['published', 'scheduled'])
            ->whereDate('created_at', $date->toDateString())
            ->count();

        return $publishedToday < $dailyLimit;
    }

    /**
     * Vérifie si le quota horaire n'est pas atteint
     * 
     * @param int $platformId
     * @param Carbon $dateTime
     * @return bool
     */
    public function hasRemainingHourlyCapacity(int $platformId, Carbon $dateTime): bool
    {
        $config = $this->configService->getConfig($platformId);
        $hourlyLimit = $config['max_per_hour'];

        $publishedThisHour = PublicationQueue::where('platform_id', $platformId)
            ->whereIn('status', ['published', 'scheduled'])
            ->where('scheduled_at', '>=', $dateTime->copy()->startOfHour())
            ->where('scheduled_at', '<', $dateTime->copy()->startOfHour()->addHour())
            ->count();

        return $publishedThisHour < $hourlyLimit;
    }

    /**
     * Vérifie si l'intervalle minimum est respecté
     * 
     * @param int $platformId
     * @param Carbon $dateTime
     * @return bool
     */
    public function respectsMinInterval(int $platformId, Carbon $dateTime): bool
    {
        $config = $this->configService->getConfig($platformId);
        $minInterval = $config['min_interval_minutes'];

        // Trouver la dernière publication
        $lastPublication = PublicationQueue::where('platform_id', $platformId)
            ->whereIn('status', ['published', 'scheduled'])
            ->orderByDesc('scheduled_at')
            ->first();

        if (!$lastPublication) {
            return true; // Pas de publication précédente
        }

        $lastTime = Carbon::parse($lastPublication->scheduled_at);
        $minutesSince = $lastTime->diffInMinutes($dateTime);

        return $minutesSince >= $minInterval;
    }

    /**
     * Obtenir la prochaine heure active
     * 
     * @param int $platformId
     * @param Carbon $from
     * @return Carbon
     */
    public function getNextActiveHour(int $platformId, Carbon $from): Carbon
    {
        $config = $this->configService->getConfig($platformId);
        $activeHours = $config['active_hours'];
        $next = $from->copy();

        // Chercher la prochaine heure active
        for ($i = 0; $i < 24; $i++) {
            $next->addHour();
            if (in_array($next->hour, $activeHours)) {
                return $next->startOfHour();
            }
        }

        // Si on n'a pas trouvé (ne devrait jamais arriver), retourner demain
        return $from->copy()->addDay()->startOfDay()->setHour($activeHours[0]);
    }

    /**
     * Obtenir le prochain jour actif
     * 
     * @param int $platformId
     * @param Carbon $from
     * @return Carbon
     */
    public function getNextActiveDay(int $platformId, Carbon $from): Carbon
    {
        $config = $this->configService->getConfig($platformId);
        $activeDays = $config['active_days'];
        $next = $from->copy();

        // Chercher le prochain jour actif (max 7 jours)
        for ($i = 0; $i < 7; $i++) {
            $next->addDay();
            if (in_array($next->dayOfWeekIso, $activeDays)) {
                return $next->startOfDay();
            }
        }

        // Si on n'a pas trouvé, retourner lundi prochain
        return $from->copy()->next(Carbon::MONDAY)->startOfDay();
    }

    /**
     * Obtenir le prochain créneau disponible en respectant l'intervalle minimum
     * 
     * @param int $platformId
     * @param Carbon $from
     * @return Carbon
     */
    public function getNextAvailableTime(int $platformId, Carbon $from): Carbon
    {
        $config = $this->configService->getConfig($platformId);
        $minInterval = $config['min_interval_minutes'];

        // Trouver la dernière publication
        $lastPublication = PublicationQueue::where('platform_id', $platformId)
            ->whereIn('status', ['published', 'scheduled'])
            ->orderByDesc('scheduled_at')
            ->first();

        if (!$lastPublication) {
            return $from->copy();
        }

        $lastTime = Carbon::parse($lastPublication->scheduled_at);
        $nextTime = $lastTime->copy()->addMinutes($minInterval);

        // S'assurer qu'on est après 'from'
        if ($nextTime->isBefore($from)) {
            return $from->copy();
        }

        return $nextTime;
    }

    /**
     * Calculer le nombre de publications restantes aujourd'hui
     * 
     * @param int $platformId
     * @return int
     */
    public function getRemainingCapacityToday(int $platformId): int
    {
        $config = $this->configService->getConfig($platformId);
        $dailyLimit = $config['articles_per_day'];
        $timezone = $config['timezone'];
        $today = Carbon::now($timezone)->toDateString();

        $publishedToday = PublicationQueue::where('platform_id', $platformId)
            ->whereIn('status', ['published', 'scheduled'])
            ->whereDate('created_at', $today)
            ->count();

        return max(0, $dailyLimit - $publishedToday);
    }

    /**
     * Obtenir un rapport détaillé de l'état actuel
     * 
     * @param int $platformId
     * @return array
     */
    public function getStatusReport(int $platformId): array
    {
        $config = $this->configService->getConfig($platformId);
        $timezone = $config['timezone'];
        $now = Carbon::now($timezone);

        $canPublish = $this->canPublishNow($platformId);

        return [
            'can_publish' => $canPublish['can_publish'],
            'reason' => $canPublish['reason'],
            'current_time' => $now->format('Y-m-d H:i:s'),
            'is_active_hour' => $this->isWithinActiveHours($platformId, $now),
            'is_active_day' => $this->isWithinActiveDays($platformId, $now),
            'remaining_today' => $this->getRemainingCapacityToday($platformId),
            'daily_limit' => $config['articles_per_day'],
            'hourly_limit' => $config['max_per_hour'],
            'min_interval' => $config['min_interval_minutes'],
            'next_available_slot' => $this->getNextAvailableTime($platformId, $now)->format('Y-m-d H:i:s'),
        ];
    }
}