<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProgramRun extends Model
{
    use HasFactory;

    protected $fillable = [
        'program_id',
        'started_at',
        'completed_at',
        'status',
        'items_planned',
        'items_generated',
        'items_failed',
        'cost',
        'summary',
        'error_message',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'summary' => 'array',
        'cost' => 'decimal:4',
    ];

    // -------------------------------------------------------------------------
    // RELATIONS
    // -------------------------------------------------------------------------

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    /**
     * Relation vers les items du programme (articles, press releases, etc.)
     * CORRIGÉ: ProgramArticle::class -> ProgramItem::class
     */
    public function items(): HasMany
    {
        return $this->hasMany(ProgramItem::class);
    }

    // -------------------------------------------------------------------------
    // SCOPES
    // -------------------------------------------------------------------------

    public function scopeRunning($query)
    {
        return $query->where('status', 'running');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    // -------------------------------------------------------------------------
    // ACCESSORS
    // -------------------------------------------------------------------------

    public function getDurationAttribute(): ?int
    {
        if (!$this->completed_at) {
            return null;
        }
        
        return $this->started_at->diffInSeconds($this->completed_at);
    }

    public function getDurationFormattedAttribute(): string
    {
        $duration = $this->duration;
        
        if (is_null($duration)) {
            return 'En cours...';
        }

        if ($duration < 60) {
            return "{$duration}s";
        }

        $minutes = floor($duration / 60);
        $seconds = $duration % 60;
        
        if ($minutes < 60) {
            return "{$minutes}m {$seconds}s";
        }

        $hours = floor($minutes / 60);
        $minutes = $minutes % 60;
        
        return "{$hours}h {$minutes}m";
    }

    public function getSuccessRateAttribute(): float
    {
        if ($this->items_generated + $this->items_failed === 0) {
            return 0;
        }

        return round(($this->items_generated / ($this->items_generated + $this->items_failed)) * 100, 2);
    }

    public function getProgressAttribute(): float
    {
        if ($this->items_planned === 0) {
            return 0;
        }

        return round((($this->items_generated + $this->items_failed) / $this->items_planned) * 100, 2);
    }

    // -------------------------------------------------------------------------
    // METHODS
    // -------------------------------------------------------------------------

    public function markCompleted(): void
    {
        $this->update([
            'status' => 'completed',
            'completed_at' => now(),
            'summary' => $this->generateSummary(),
        ]);
    }

    public function markFailed(string $message): void
    {
        $this->update([
            'status' => 'failed',
            'completed_at' => now(),
            'error_message' => $message,
            'summary' => $this->generateSummary(),
        ]);
    }

    public function markCancelled(): void
    {
        $this->update([
            'status' => 'cancelled',
            'completed_at' => now(),
            'summary' => $this->generateSummary(),
        ]);
    }

    public function incrementGenerated(float $cost = 0): void
    {
        $this->increment('items_generated');
        $this->increment('cost', $cost);
    }

    public function incrementFailed(): void
    {
        $this->increment('items_failed');
    }

    protected function generateSummary(): array
    {
        $byContentType = $this->items()
            ->selectRaw('generation_type, status, COUNT(*) as count')
            ->groupBy('generation_type', 'status')
            ->get()
            ->groupBy('generation_type')
            ->map(fn($items) => $items->pluck('count', 'status')->toArray())
            ->toArray();

        $byCountry = $this->items()
            ->selectRaw('country_id, COUNT(*) as count')
            ->where('status', 'completed')
            ->groupBy('country_id')
            ->pluck('count', 'country_id')
            ->toArray();

        $byLanguage = $this->items()
            ->selectRaw('language_id, COUNT(*) as count')
            ->where('status', 'completed')
            ->groupBy('language_id')
            ->pluck('count', 'language_id')
            ->toArray();

        return [
            'by_generation_type' => $byContentType,
            'by_country' => $byCountry,
            'by_language' => $byLanguage,
            'total_cost' => $this->cost,
            'duration_seconds' => $this->duration,
            'success_rate' => $this->success_rate,
        ];
    }
}