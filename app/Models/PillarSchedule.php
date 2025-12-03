<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PillarSchedule extends Model
{
    use HasFactory;

    protected $table = 'pillar_schedule';

    protected $fillable = [
        'platform_id',
        'country_id',
        'theme_id',
        'template_type',
        'title',
        'scheduled_date',
        'status',
        'priority',
        'article_id',
        'error_message',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'priority' => 'integer',
    ];

    // =========================================================================
    // CONSTANTES
    // =========================================================================

    const STATUS_PLANNED = 'planned';
    const STATUS_GENERATING = 'generating';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';

    const TEMPLATE_GUIDE_ULTIME = 'guide_ultime';
    const TEMPLATE_ANALYSE_MARCHE = 'analyse_marche';
    const TEMPLATE_WHITEPAPER = 'whitepaper';
    const TEMPLATE_DOSSIER_THEMATIQUE = 'dossier_thematique';
    const TEMPLATE_MEGA_GUIDE_PAYS = 'mega_guide_pays';

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
     * Thème associé
     */
    public function theme(): BelongsTo
    {
        return $this->belongsTo(Theme::class);
    }

    /**
     * Article généré
     */
    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    /**
     * Articles planifiés pour aujourd'hui
     */
    public function scopeToday($query)
    {
        return $query->whereDate('scheduled_date', today());
    }

    /**
     * Articles en attente
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PLANNED);
    }

    /**
     * Articles par statut
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    // =========================================================================
    // MÉTHODES UTILITAIRES
    // =========================================================================

    /**
     * Marquer comme en cours de génération
     */
    public function markAsGenerating(): void
    {
        $this->update(['status' => self::STATUS_GENERATING]);
    }

    /**
     * Marquer comme complété
     */
    public function markAsCompleted(int $articleId): void
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'article_id' => $articleId,
            'error_message' => null,
        ]);
    }

    /**
     * Marquer comme échoué
     */
    public function markAsFailed(string $errorMessage): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'error_message' => $errorMessage,
        ]);
    }

    /**
     * Vérifier si c'est aujourd'hui
     */
    public function isToday(): bool
    {
        return $this->scheduled_date->isToday();
    }

    /**
     * Vérifier si c'est complété
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }
}
