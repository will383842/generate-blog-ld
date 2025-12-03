<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PillarStatistic extends Model
{
    use HasFactory;

    protected $table = 'pillar_statistics';

    public $timestamps = false;

    protected $fillable = [
        'article_id',
        'stat_key',
        'stat_value',
        'stat_unit',
        'source_url',
        'verified',
    ];

    protected $casts = [
        'verified' => 'boolean',
        'created_at' => 'datetime',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    /**
     * Article associé
     */
    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    /**
     * Statistiques vérifiées
     */
    public function scopeVerified($query)
    {
        return $query->where('verified', true);
    }

    /**
     * Statistiques par clé
     */
    public function scopeByKey($query, string $key)
    {
        return $query->where('stat_key', $key);
    }

    // =========================================================================
    // MÉTHODES UTILITAIRES
    // =========================================================================

    /**
     * Marquer comme vérifiée
     */
    public function markAsVerified(): void
    {
        $this->update(['verified' => true]);
    }

    /**
     * Obtenir la valeur formatée avec unité
     */
    public function getFormattedValue(): string
    {
        if (!$this->stat_unit) {
            return $this->stat_value;
        }

        // Gérer les unités spéciales
        if ($this->stat_unit === 'percent') {
            return $this->stat_value . '%';
        }

        if ($this->stat_unit === 'people') {
            return number_format((float) $this->stat_value, 0, ',', ' ') . ' personnes';
        }

        if ($this->stat_unit === 'USD') {
            return '$' . number_format((float) $this->stat_value, 2, '.', ',');
        }

        if ($this->stat_unit === 'EUR') {
            return number_format((float) $this->stat_value, 2, ',', ' ') . ' €';
        }

        return $this->stat_value . ' ' . $this->stat_unit;
    }

    /**
     * Vérifier si la statistique a une source
     */
    public function hasSource(): bool
    {
        return !empty($this->source_url);
    }

    /**
     * Obtenir la clé formatée pour affichage
     */
    public function getFormattedKey(): string
    {
        // Convertir snake_case en Title Case
        return ucwords(str_replace('_', ' ', $this->stat_key));
    }
}
