<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * Model PressDossier - Dossiers de presse professionnels 4-8 pages
 * 
 * Templates supportés :
 * - press_kit_entreprise : Kit de presse entreprise (6-8 pages)
 * - rapport_annuel : Rapport annuel (8-12 pages)
 * - etude_barometre : Étude baromètre (10-15 pages)
 * - case_study : Étude de cas (4-6 pages)
 * - position_paper : Position paper (6-10 pages)
 * 
 * @package App\Models
 */
class PressDossier extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'platform_id',
        'template_type',
        'title',
        'slug',
        'subtitle',
        'total_pages',
        'language_code',
        'status',
        'error_message',
        'published_at',
        'generation_cost',
        'generation_time_seconds',
        'metadata',
        'meta_title',
        'meta_description',
        'keywords',
    ];

    protected $casts = [
        'metadata' => 'array',
        'keywords' => 'array',
        'published_at' => 'datetime',
        'generation_cost' => 'decimal:4',
        'generation_time_seconds' => 'integer',
        'total_pages' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
        
        // Calculer total_pages automatiquement après mise à jour des sections
        static::saved(function ($model) {
            if ($model->sections()->exists()) {
                $maxPage = $model->sections()->max('page_number');
                if ($maxPage && $maxPage != $model->total_pages) {
                    $model->update(['total_pages' => $maxPage]);
                }
            }
        });
    }

    // ============================================
    // RELATIONS
    // ============================================

    /**
     * Plateforme propriétaire du dossier
     */
    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    /**
     * Sections du dossier (chapitres, intro, conclusion, etc.)
     */
    public function sections(): HasMany
    {
        return $this->hasMany(DossierSection::class, 'dossier_id')->orderBy('order_index');
    }

    /**
     * Médias attachés (photos, graphiques, tableaux, etc.)
     */
    public function media(): HasMany
    {
        return $this->hasMany(DossierMedia::class, 'dossier_id')->orderBy('order_index');
    }

    /**
     * Exports générés (PDF, Word, Excel)
     */
    public function exports(): HasMany
    {
        return $this->hasMany(DossierExport::class, 'dossier_id');
    }

    /**
     * ✅ CORRECTION: Relation traductions
     */
    public function translations(): HasMany
    {
        return $this->hasMany(PressDossierTranslation::class, 'press_dossier_id');
    }

    public function getTranslation(string $languageCode)
    {
        return $this->translations()
                    ->where('language_code', $languageCode)
                    ->first();
    }

    public function hasTranslation(string $languageCode): bool
    {
        return $this->translations()
                    ->where('language_code', $languageCode)
                    ->exists();
    }

    // ============================================
    // SCOPES
    // ============================================

    /**
     * Filtrer par statut
     */
    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Filtrer par langue
     */
    public function scopeLanguage($query, string $code)
    {
        return $query->where('language_code', $code);
    }

    /**
     * Filtrer par template
     */
    public function scopeTemplate($query, string $type)
    {
        return $query->where('template_type', $type);
    }

    /**
     * Dossiers publiés
     */
    public function scopePublished($query)
    {
        return $query->where('status', 'published')
                     ->whereNotNull('published_at');
    }

    /**
     * Dossiers en brouillon
     */
    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    /**
     * Dossiers récents
     */
    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    // ============================================
    // MÉTHODES
    // ============================================

    /**
     * Publier le dossier
     */
    public function publish(): bool
    {
        return $this->update([
            'status' => 'published',
            'published_at' => now(),
        ]);
    }

    /**
     * Marquer comme en échec
     */
    public function markAsFailed(string $errorMessage): bool
    {
        return $this->update([
            'status' => 'failed',
            'error_message' => $errorMessage,
        ]);
    }

    /**
     * Obtenir le nombre total de mots
     */
    public function getTotalWordCountAttribute(): int
    {
        return $this->sections()->sum('word_count');
    }

    /**
     * Obtenir le nombre total de médias
     */
    public function getTotalMediaCountAttribute(): int
    {
        return $this->media()->count();
    }

    /**
     * Vérifier si le dossier est prêt pour export
     */
    public function isReadyForExport(): bool
    {
        return $this->status === 'published' 
            && $this->sections()->count() > 0;
    }

    /**
     * Obtenir le nom du template en français
     */
    public function getTemplateNameAttribute(): string
    {
        $templates = [
            'press_kit_entreprise' => 'Kit de Presse Entreprise',
            'rapport_annuel' => 'Rapport Annuel',
            'etude_barometre' => 'Étude Baromètre',
            'case_study' => 'Étude de Cas',
            'position_paper' => 'Position Paper',
        ];

        return $templates[$this->template_type] ?? $this->template_type;
    }

    /**
     * Obtenir la description du template
     */
    public function getTemplateDescriptionAttribute(): string
    {
        $descriptions = [
            'press_kit_entreprise' => 'Présentation complète : équipe, produits, services, contact',
            'rapport_annuel' => 'Résultats annuels, analyses, perspectives et recommandations',
            'etude_barometre' => 'Étude approfondie avec méthodologie, résultats détaillés et analyse',
            'case_study' => 'Cas pratique : problématique, solution, résultats mesurables',
            'position_paper' => 'Prise de position : contexte, arguments, recommandations',
        ];

        return $descriptions[$this->template_type] ?? '';
    }

    /**
     * Obtenir l'export le plus récent pour un format donné
     */
    public function getLatestExport(string $format, string $lang = null): ?DossierExport
    {
        $query = $this->exports()
                      ->where('export_format', $format)
                      ->where('status', 'completed');
        
        if ($lang) {
            $query->where('language_code', $lang);
        }
        
        return $query->latest()->first();
    }
}