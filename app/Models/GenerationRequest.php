<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class GenerationRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'manual_title_id',
        'status',
        'article_id',
        'error_message',
        'started_at',
        'completed_at',
        'processing_duration_seconds',
        'generation_cost',
        'attempts',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'processing_duration_seconds' => 'integer',
        'generation_cost' => 'float',
        'attempts' => 'integer',
    ];

    // =========================================================================
    // CONSTANTES STATUS
    // =========================================================================

    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';

    // =========================================================================
    // RELATIONS
    // =========================================================================

    /**
     * Titre manuel associé
     */
    public function manualTitle(): BelongsTo
    {
        return $this->belongsTo(ManualTitle::class);
    }

    /**
     * Article généré (si succès)
     */
    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    /**
     * Requêtes en attente
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Requêtes en traitement
     */
    public function scopeProcessing($query)
    {
        return $query->where('status', self::STATUS_PROCESSING);
    }

    /**
     * Requêtes complétées
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    /**
     * Requêtes échouées
     */
    public function scopeFailed($query)
    {
        return $query->where('status', self::STATUS_FAILED);
    }

    // =========================================================================
    // MÉTHODES HELPER
    // =========================================================================

    /**
     * Démarrer le traitement
     */
    public function start(): void
    {
        $this->update([
            'status' => self::STATUS_PROCESSING,
            'started_at' => now(),
            'attempts' => $this->attempts + 1,
        ]);
    }

    /**
     * Marquer comme complété
     */
    public function complete(Article $article, float $cost = 0): void
    {
        $duration = $this->started_at ? now()->diffInSeconds($this->started_at) : 0;
        
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'article_id' => $article->id,
            'completed_at' => now(),
            'processing_duration_seconds' => $duration,
            'generation_cost' => $cost,
            'error_message' => null,
        ]);
    }

    /**
     * Marquer comme échoué
     */
    public function fail(string $errorMessage): void
    {
        $duration = $this->started_at ? now()->diffInSeconds($this->started_at) : 0;
        
        $this->update([
            'status' => self::STATUS_FAILED,
            'completed_at' => now(),
            'processing_duration_seconds' => $duration,
            'error_message' => $errorMessage,
        ]);
    }

    /**
     * Obtenir la durée de traitement formatée
     */
    public function getFormattedDuration(): string
    {
        if (!$this->processing_duration_seconds) {
            return 'N/A';
        }
        
        $seconds = $this->processing_duration_seconds;
        
        if ($seconds < 60) {
            return "{$seconds}s";
        }
        
        $minutes = floor($seconds / 60);
        $remainingSeconds = $seconds % 60;
        
        return "{$minutes}m {$remainingSeconds}s";
    }

    /**
     * Obtenir le coût formaté
     */
    public function getFormattedCost(): string
    {
        return '$' . number_format($this->generation_cost, 4);
    }

    /**
     * Vérifier si la requête peut être retentée
     */
    public function canRetry(int $maxAttempts = 3): bool
    {
        return $this->status === self::STATUS_FAILED && $this->attempts < $maxAttempts;
    }

    /**
     * Réinitialiser pour retry
     */
    public function resetForRetry(): void
    {
        $this->update([
            'status' => self::STATUS_PENDING,
            'error_message' => null,
            'started_at' => null,
        ]);
    }
}