<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class PublicationSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'platform_id',
        'articles_per_day',
        'max_per_hour',
        'active_hours',
        'active_days',
        'min_interval_minutes',
        'timezone',
        'is_active',
        'pause_on_error',
        'max_errors_before_pause',
    ];

    protected $casts = [
        'articles_per_day' => 'integer',
        'max_per_hour' => 'integer',
        'active_hours' => 'array',
        'active_days' => 'array',
        'min_interval_minutes' => 'integer',
        'is_active' => 'boolean',
        'pause_on_error' => 'boolean',
        'max_errors_before_pause' => 'integer',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    public function queue(): HasMany
    {
        return $this->hasMany(PublicationQueue::class, 'platform_id', 'platform_id');
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Vérifie si on est dans les heures actives
     */
    public function isWithinActiveHours(): bool
    {
        $now = Carbon::now($this->timezone);
        $currentHour = $now->hour;
        $currentDay = $now->dayOfWeekIso; // 1 = Lundi, 7 = Dimanche
        
        return in_array($currentHour, $this->active_hours ?? [])
            && in_array($currentDay, $this->active_days ?? []);
    }

    /**
     * Calcule l'intervalle optimal entre publications
     */
    public function getOptimalInterval(): int
    {
        $hoursPerDay = count($this->active_hours ?? []);
        if ($hoursPerDay === 0) return 60;
        
        $minutesPerDay = $hoursPerDay * 60;
        $interval = $minutesPerDay / $this->articles_per_day;
        
        return max($this->min_interval_minutes, (int) $interval);
    }

    /**
     * Calcule le prochain créneau disponible
     */
    public function getNextAvailableSlot(): Carbon
    {
        $now = Carbon::now($this->timezone);
        $interval = $this->getOptimalInterval();
        
        // Trouver la dernière publication
        $lastPublication = PublicationQueue::where('platform_id', $this->platform_id)
            ->whereNotNull('scheduled_at')
            ->orderByDesc('scheduled_at')
            ->first();
        
        if ($lastPublication) {
            $nextSlot = Carbon::parse($lastPublication->scheduled_at)->addMinutes($interval);
            if ($nextSlot->isAfter($now)) {
                return $this->adjustToActiveHours($nextSlot);
            }
        }
        
        return $this->adjustToActiveHours($now);
    }

    /**
     * Ajuste une date aux heures actives
     */
    protected function adjustToActiveHours(Carbon $date): Carbon
    {
        $adjusted = $date->copy()->setTimezone($this->timezone);
        
        // Si l'heure n'est pas active, trouver la prochaine heure active
        while (!in_array($adjusted->hour, $this->active_hours ?? [])) {
            $adjusted->addHour();
        }
        
        // Si le jour n'est pas actif, trouver le prochain jour actif
        while (!in_array($adjusted->dayOfWeekIso, $this->active_days ?? [])) {
            $adjusted->addDay()->startOfDay();
            // Réajuster l'heure
            while (!in_array($adjusted->hour, $this->active_hours ?? [])) {
                $adjusted->addHour();
            }
        }
        
        return $adjusted;
    }

    /**
     * Nombre de publications possibles aujourd'hui
     */
    public function getRemainingCapacityToday(): int
    {
        $now = Carbon::now($this->timezone);
        
        $publishedToday = PublicationQueue::where('platform_id', $this->platform_id)
            ->where('status', 'published')
            ->whereDate('published_at', $now->toDateString())
            ->count();
        
        return max(0, $this->articles_per_day - $publishedToday);
    }
}
