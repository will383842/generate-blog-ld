<?php

namespace App\Services\Publishing;

use App\Models\Article;
use App\Models\PublicationQueue;
use App\Models\PublicationSchedule;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

/**
 * Service de planification de publication
 * 
 * Gère la planification intelligente des publications en respectant
 * les règles anti-spam et en distribuant uniformément sur la journée.
 */
class PublicationScheduler
{
    protected PublicationConfigService $configService;
    protected AntiSpamChecker $antiSpamChecker;

    public function __construct(
        PublicationConfigService $configService,
        AntiSpamChecker $antiSpamChecker
    ) {
        $this->configService = $configService;
        $this->antiSpamChecker = $antiSpamChecker;
    }

    /**
     * Planifier un article pour publication
     * 
     * @param Article $article Article à publier
     * @param string $priority Priorité (high, default, low)
     * @return PublicationQueue
     */
    public function scheduleArticle(Article $article, string $priority = 'default'): PublicationQueue
    {
        // Calculer le prochain créneau disponible
        $scheduledAt = $this->getNextAvailableSlot($article->platform_id);

        // Créer l'entrée dans la queue
        $queueItem = PublicationQueue::create([
            'article_id' => $article->id,
            'platform_id' => $article->platform_id,
            'priority' => $priority,
            'status' => 'scheduled',
            'scheduled_at' => $scheduledAt,
            'attempts' => 0,
            'max_attempts' => config('publishing.max_attempts', 3),
            'metadata' => [
                'scheduled_by' => 'auto',
                'scheduled_method' => 'PublicationScheduler',
            ],
        ]);

        // Mettre à jour l'article
        $article->update([
            'status' => Article::STATUS_PENDING,
            'scheduled_at' => $scheduledAt,
        ]);

        Log::info('Article planifié pour publication', [
            'article_id' => $article->id,
            'platform_id' => $article->platform_id,
            'scheduled_at' => $scheduledAt->toDateTimeString(),
            'priority' => $priority,
        ]);

        return $queueItem;
    }

    /**
     * Calculer le prochain créneau disponible
     * 
     * @param int $platformId ID de la plateforme
     * @param Carbon|null $from Date de départ (par défaut maintenant)
     * @return Carbon
     */
    public function getNextAvailableSlot(int $platformId, ?Carbon $from = null): Carbon
    {
        $config = $this->configService->getConfig($platformId);
        $timezone = $config['timezone'];
        $from = $from ?? Carbon::now($timezone);

        // Vérifier si on peut publier maintenant
        $canPublish = $this->antiSpamChecker->canPublishNow($platformId);
        
        if ($canPublish['can_publish']) {
            return $this->adjustSlotWithRandomization($from->copy(), $config);
        }

        // Sinon, trouver le prochain créneau valide
        $slot = $this->findNextValidSlot($platformId, $from);

        return $this->adjustSlotWithRandomization($slot, $config);
    }

    /**
     * Trouver le prochain créneau valide
     * 
     * @param int $platformId
     * @param Carbon $from
     * @return Carbon
     */
    protected function findNextValidSlot(int $platformId, Carbon $from): Carbon
    {
        $config = $this->configService->getConfig($platformId);
        $timezone = $config['timezone'];
        $activeHours = $config['active_hours'];
        $activeDays = $config['active_days'];
        $minInterval = $config['min_interval_minutes'];

        // Commencer à partir de maintenant
        $slot = $from->copy()->setTimezone($timezone);

        // Trouver la dernière publication planifiée
        $lastScheduled = PublicationQueue::where('platform_id', $platformId)
            ->whereIn('status', ['scheduled', 'published'])
            ->orderByDesc('scheduled_at')
            ->first();

        if ($lastScheduled) {
            $lastTime = Carbon::parse($lastScheduled->scheduled_at, $timezone);
            
            // Ajouter l'intervalle minimum
            $slot = $lastTime->copy()->addMinutes($minInterval);

            // Si c'est dans le passé, partir de maintenant
            if ($slot->isPast()) {
                $slot = $from->copy()->setTimezone($timezone);
            }
        }

        // Ajuster au prochain jour actif si nécessaire
        $maxAttempts = 14; // 2 semaines max
        $attempts = 0;

        while (!in_array($slot->dayOfWeekIso, $activeDays) && $attempts < $maxAttempts) {
            $slot->addDay()->startOfDay();
            $attempts++;
        }

        // Ajuster à la prochaine heure active
        $attempts = 0;
        while (!in_array($slot->hour, $activeHours) && $attempts < 24) {
            $slot->addHour()->startOfHour();
            
            // Si on change de jour, revérifier que c'est un jour actif
            if ($slot->hour === 0) {
                while (!in_array($slot->dayOfWeekIso, $activeDays) && $attempts < $maxAttempts) {
                    $slot->addDay()->startOfDay();
                    $attempts++;
                }
            }
            $attempts++;
        }

        // Vérifier le quota horaire
        if (!$this->antiSpamChecker->hasRemainingHourlyCapacity($platformId, $slot)) {
            // Passer à l'heure suivante
            $slot->addHour()->startOfHour();
            return $this->findNextValidSlot($platformId, $slot);
        }

        return $slot;
    }

    /**
     * Calculer tous les créneaux disponibles sur une journée
     * 
     * @param int $platformId
     * @param Carbon|null $date Date cible (par défaut aujourd'hui)
     * @return array Array de Carbon
     */
    public function calculateDailySlots(int $platformId, ?Carbon $date = null): array
    {
        $config = $this->configService->getConfig($platformId);
        $timezone = $config['timezone'];
        $date = $date ?? Carbon::now($timezone);
        $activeHours = $config['active_hours'];
        $articlesPerDay = $config['articles_per_day'];
        $minInterval = $config['min_interval_minutes'];

        // Calculer le nombre de minutes actives dans la journée
        $totalActiveMinutes = count($activeHours) * 60;

        // Calculer l'intervalle optimal
        $interval = max($minInterval, $totalActiveMinutes / $articlesPerDay);

        $slots = [];
        $currentSlot = $date->copy()->setTimezone($timezone)->startOfDay();

        // Avancer jusqu'à la première heure active
        while (!in_array($currentSlot->hour, $activeHours)) {
            $currentSlot->addHour();
        }

        // Générer tous les créneaux
        $slotsGenerated = 0;
        while ($slotsGenerated < $articlesPerDay && $currentSlot->isSameDay($date)) {
            // Vérifier que c'est une heure active
            if (in_array($currentSlot->hour, $activeHours)) {
                $slots[] = $currentSlot->copy();
                $slotsGenerated++;
            }

            // Avancer de l'intervalle
            $currentSlot->addMinutes($interval);

            // Si on sort d'une heure active, avancer à la prochaine
            if (!in_array($currentSlot->hour, $activeHours)) {
                $nextActiveHour = $this->getNextActiveHourInDay($currentSlot, $activeHours);
                if ($nextActiveHour) {
                    $currentSlot = $nextActiveHour;
                } else {
                    break; // Plus d'heures actives aujourd'hui
                }
            }
        }

        // Appliquer la distribution avec poids si configuré
        if (config('publishing.distribution.spread_evenly', true)) {
            $slots = $this->distributeEvenly($slots, $config);
        }

        return $slots;
    }

    /**
     * Obtenir la prochaine heure active dans la même journée
     * 
     * @param Carbon $from
     * @param array $activeHours
     * @return Carbon|null
     */
    protected function getNextActiveHourInDay(Carbon $from, array $activeHours): ?Carbon
    {
        $next = $from->copy();
        
        for ($i = 0; $i < 24; $i++) {
            $next->addHour()->startOfHour();
            
            // Si on change de jour, retourner null
            if (!$next->isSameDay($from)) {
                return null;
            }
            
            if (in_array($next->hour, $activeHours)) {
                return $next;
            }
        }
        
        return null;
    }

    /**
     * Distribuer uniformément les créneaux avec poids optionnels
     * 
     * @param array $slots
     * @param array $config
     * @return array
     */
    protected function distributeEvenly(array $slots, array $config): array
    {
        $preferredHours = config('publishing.distribution.preferred_hours', []);
        
        if (empty($preferredHours)) {
            return $slots;
        }

        // Appliquer les poids
        $weightedSlots = [];
        foreach ($slots as $slot) {
            $weight = $preferredHours[$slot->hour] ?? 1.0;
            
            // Répéter le créneau selon son poids
            $repeatCount = (int) ceil($weight);
            for ($i = 0; $i < $repeatCount; $i++) {
                $weightedSlots[] = $slot->copy();
            }
        }

        // Mélanger et prendre le bon nombre
        shuffle($weightedSlots);
        return array_slice($weightedSlots, 0, count($slots));
    }

    /**
     * Ajuster un créneau avec randomisation
     * 
     * @param Carbon $slot
     * @param array $config
     * @return Carbon
     */
    protected function adjustSlotWithRandomization(Carbon $slot, array $config): Carbon
    {
        // Randomisation si activée
        if (config('publishing.anti_spam.randomize_time', true)) {
            $range = config('publishing.anti_spam.randomize_range', 5);
            $randomMinutes = rand(-$range, $range);
            $slot->addMinutes($randomMinutes);
        }

        // Éviter les bords d'heure si configuré
        if (config('publishing.distribution.avoid_hour_edges', true)) {
            $margin = config('publishing.distribution.edge_margin', 5);
            
            // Si on est dans les 5 premières minutes de l'heure
            if ($slot->minute < $margin) {
                $slot->addMinutes($margin - $slot->minute);
            }
            
            // Si on est dans les 5 dernières minutes de l'heure
            if ($slot->minute > (60 - $margin)) {
                $slot->addMinutes((60 - $margin) - $slot->minute);
            }
        }

        return $slot;
    }

    /**
     * Replanifier un article échoué
     * 
     * @param PublicationQueue $queueItem
     * @return PublicationQueue
     */
    public function reschedule(PublicationQueue $queueItem): PublicationQueue
    {
        $retryDelay = config('publishing.retry_delay', 15);
        
        // Calculer le prochain créneau (avec délai de retry)
        $nextSlot = $this->getNextAvailableSlot(
            $queueItem->platform_id,
            Carbon::now()->addMinutes($retryDelay)
        );

        $queueItem->update([
            'status' => 'scheduled',
            'scheduled_at' => $nextSlot,
            'error_message' => null,
        ]);

        Log::info('Article replanifié après échec', [
            'article_id' => $queueItem->article_id,
            'attempt' => $queueItem->attempts,
            'scheduled_at' => $nextSlot->toDateTimeString(),
        ]);

        return $queueItem;
    }

    /**
     * Planifier plusieurs articles en batch
     * 
     * @param array $articles Array d'Articles
     * @param string $priority
     * @return array Array de PublicationQueue
     */
    public function scheduleBatch(array $articles, string $priority = 'default'): array
    {
        $queued = [];

        DB::beginTransaction();
        
        try {
            foreach ($articles as $article) {
                $queued[] = $this->scheduleArticle($article, $priority);
            }
            
            DB::commit();
            
            Log::info('Batch de publications planifié', [
                'count' => count($queued),
                'priority' => $priority,
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Erreur lors de la planification batch', [
                'error' => $e->getMessage(),
                'count' => count($articles),
            ]);
            
            throw $e;
        }

        return $queued;
    }

    /**
     * Obtenir un aperçu de la planification pour les prochains jours
     * 
     * @param int $platformId
     * @param int $days Nombre de jours à prévisualiser
     * @return array
     */
    public function getSchedulePreview(int $platformId, int $days = 7): array
    {
        $config = $this->configService->getConfig($platformId);
        $timezone = $config['timezone'];
        $preview = [];

        for ($i = 0; $i < $days; $i++) {
            $date = Carbon::now($timezone)->addDays($i);
            
            $scheduled = PublicationQueue::where('platform_id', $platformId)
                ->where('status', 'scheduled')
                ->whereDate('scheduled_at', $date->toDateString())
                ->count();

            $preview[] = [
                'date' => $date->toDateString(),
                'day_name' => $date->format('l'),
                'is_active' => in_array($date->dayOfWeekIso, $config['active_days']),
                'scheduled_count' => $scheduled,
                'capacity' => $config['articles_per_day'],
                'remaining' => max(0, $config['articles_per_day'] - $scheduled),
            ];
        }

        return $preview;
    }
}