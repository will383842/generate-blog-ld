<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class ManualTitle extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'platform_id',
        'country_id',
        'language_code',
        'suggested_template',
        'context',
        'status',
        'scheduled_at',
        'batch_uuid',
    ];

    protected $casts = [
        'context' => 'array',
        'scheduled_at' => 'datetime',
    ];

    // =========================================================================
    // CONSTANTES STATUS
    // =========================================================================

    const STATUS_PENDING = 'pending';
    const STATUS_QUEUED = 'queued';
    const STATUS_SCHEDULED = 'scheduled';
    const STATUS_PROCESSING = 'processing';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';

    // =========================================================================
    // RELATIONS
    // =========================================================================

    /**
     * Plateforme associée
     */
    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    /**
     * Pays associé
     */
    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    /**
     * Requêtes de génération
     */
    public function generationRequests(): HasMany
    {
        return $this->hasMany(GenerationRequest::class);
    }

    /**
     * Dernière requête de génération
     */
    public function latestGenerationRequest(): HasOne
    {
        return $this->hasOne(GenerationRequest::class)->latestOfMany();
    }

    /**
     * Article généré (via la dernière requête complétée)
     */
    public function generatedArticle(): ?Article
    {
        $request = $this->generationRequests()
            ->where('status', GenerationRequest::STATUS_COMPLETED)
            ->whereNotNull('article_id')
            ->latest()
            ->first();
        
        return $request?->article;
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    /**
     * Titres en attente de génération
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Titres en queue
     */
    public function scopeQueued($query)
    {
        return $query->where('status', self::STATUS_QUEUED);
    }

    /**
     * Titres complétés
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    /**
     * Titres échoués
     */
    public function scopeFailed($query)
    {
        return $query->where('status', self::STATUS_FAILED);
    }

    /**
     * Par plateforme
     */
    public function scopeByPlatform($query, $platformId)
    {
        return $query->where('platform_id', $platformId);
    }

    /**
     * Par pays
     */
    public function scopeByCountry($query, $countryId)
    {
        return $query->where('country_id', $countryId);
    }

    /**
     * Par langue
     */
    public function scopeByLanguage($query, $languageCode)
    {
        return $query->where('language_code', $languageCode);
    }

    // =========================================================================
    // MÉTHODES HELPER
    // =========================================================================

    /**
     * Marquer comme mis en queue
     */
    public function markAsQueued(): void
    {
        $this->update([
            'status' => self::STATUS_QUEUED,
            'scheduled_at' => null,
        ]);
    }

    /**
     * Marquer comme programmé
     *
     * @param \DateTimeInterface|string $scheduledAt Date de programmation
     */
    public function markAsScheduled($scheduledAt): void
    {
        $this->update([
            'status' => self::STATUS_SCHEDULED,
            'scheduled_at' => $scheduledAt,
        ]);
    }

    /**
     * Vérifier si la génération est programmée
     */
    public function isScheduled(): bool
    {
        return $this->status === self::STATUS_SCHEDULED && $this->scheduled_at !== null;
    }

    /**
     * Vérifier si la génération programmée est prête à être exécutée
     */
    public function isReadyToProcess(): bool
    {
        if ($this->status !== self::STATUS_SCHEDULED) {
            return false;
        }

        return $this->scheduled_at && $this->scheduled_at->isPast();
    }

    /**
     * Obtenir le délai restant avant exécution
     *
     * @return int Délai en secondes (0 si déjà passé)
     */
    public function getDelayInSeconds(): int
    {
        if (!$this->scheduled_at) {
            return 0;
        }

        $delay = now()->diffInSeconds($this->scheduled_at, false);
        return max(0, $delay);
    }

    /**
     * Marquer comme en traitement
     */
    public function markAsProcessing(): void
    {
        $this->update(['status' => self::STATUS_PROCESSING]);
    }

    /**
     * Marquer comme complété
     */
    public function markAsCompleted(): void
    {
        $this->update(['status' => self::STATUS_COMPLETED]);
    }

    /**
     * Marquer comme échoué
     */
    public function markAsFailed(): void
    {
        $this->update(['status' => self::STATUS_FAILED]);
    }

    /**
     * Obtenir le contexte thématique si disponible
     */
    public function getThemeContext(): ?array
    {
        $context = $this->context ?? [];
        
        if (!isset($context['theme_type']) || !isset($context['theme_id'])) {
            return null;
        }
        
        return [
            'theme_type' => $context['theme_type'],
            'theme_id' => $context['theme_id'],
        ];
    }

    /**
     * Vérifier si un template a été suggéré
     */
    public function hasSuggestedTemplate(): bool
    {
        return !empty($this->suggested_template);
    }

    /**
     * Obtenir le template suggéré ou null
     */
    public function getTemplateCode(): ?string
    {
        return $this->suggested_template;
    }
}