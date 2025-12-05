<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * Model DossierSection - Sections d'un dossier de presse
 * 
 * Types de sections :
 * - cover : Page de couverture
 * - intro : Introduction
 * - chapter : Chapitre principal
 * - conclusion : Conclusion
 * - methodology : Méthodologie
 * - table_of_contents : Table des matières
 * - appendix : Annexe
 * - bibliography : Bibliographie
 * 
 * @package App\Models
 */
class DossierSection extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'dossier_id',
        'section_type',
        'title',
        'content',
        'word_count',
        'page_number',
        'order_index',
        'show_in_toc',
        'page_break_before',
        'page_break_after',
        'styling',
    ];

    protected $casts = [
        'styling' => 'array',
        'word_count' => 'integer',
        'page_number' => 'integer',
        'order_index' => 'integer',
        'show_in_toc' => 'boolean',
        'page_break_before' => 'boolean',
        'page_break_after' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
            
            // Auto-calculer word_count si content est défini
            if ($model->content && !$model->word_count) {
                $model->word_count = str_word_count(strip_tags($model->content));
            }
        });
        
        static::updating(function ($model) {
            // Recalculer word_count si content a changé
            if ($model->isDirty('content')) {
                $model->word_count = str_word_count(strip_tags($model->content));
            }
        });
    }

    // ============================================
    // RELATIONS
    // ============================================

    /**
     * Dossier parent
     */
    public function dossier(): BelongsTo
    {
        return $this->belongsTo(PressDossier::class, 'dossier_id');
    }

    /**
     * Médias attachés à cette section
     */
    public function media(): HasMany
    {
        return $this->hasMany(DossierMedia::class, 'section_id')->orderBy('order_index');
    }

    /**
     * ✅ CORRECTION: Relation traductions
     */
    public function translations(): HasMany
    {
        return $this->hasMany(DossierSectionTranslation::class);
    }

    public function getTranslation(string $languageCode)
    {
        return $this->translations()
                    ->where('language_code', $languageCode)
                    ->first();
    }

    // ============================================
    // SCOPES
    // ============================================

    /**
     * Filtrer par type de section
     */
    public function scopeType($query, string $type)
    {
        return $query->where('section_type', $type);
    }

    /**
     * Sections visibles dans la table des matières
     */
    public function scopeInToc($query)
    {
        return $query->where('show_in_toc', true);
    }

    /**
     * Ordonner par order_index
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order_index');
    }

    // ============================================
    // MÉTHODES
    // ============================================

    /**
     * Déplacer la section vers le haut
     */
    public function moveUp(): bool
    {
        $previousSection = static::where('dossier_id', $this->dossier_id)
            ->where('order_index', '<', $this->order_index)
            ->orderBy('order_index', 'desc')
            ->first();

        if ($previousSection) {
            $tempIndex = $this->order_index;
            $this->order_index = $previousSection->order_index;
            $previousSection->order_index = $tempIndex;
            
            $this->save();
            $previousSection->save();
            
            return true;
        }

        return false;
    }

    /**
     * Déplacer la section vers le bas
     */
    public function moveDown(): bool
    {
        $nextSection = static::where('dossier_id', $this->dossier_id)
            ->where('order_index', '>', $this->order_index)
            ->orderBy('order_index', 'asc')
            ->first();

        if ($nextSection) {
            $tempIndex = $this->order_index;
            $this->order_index = $nextSection->order_index;
            $nextSection->order_index = $tempIndex;
            
            $this->save();
            $nextSection->save();
            
            return true;
        }

        return false;
    }

    /**
     * Obtenir le nom du type de section en français
     */
    public function getTypeNameAttribute(): string
    {
        $types = [
            'cover' => 'Page de Couverture',
            'intro' => 'Introduction',
            'chapter' => 'Chapitre',
            'conclusion' => 'Conclusion',
            'methodology' => 'Méthodologie',
            'table_of_contents' => 'Table des Matières',
            'appendix' => 'Annexe',
            'bibliography' => 'Bibliographie',
        ];

        return $types[$this->section_type] ?? $this->section_type;
    }

    /**
     * Obtenir un extrait du contenu
     */
    public function getExcerptAttribute(int $length = 150): string
    {
        if (!$this->content) {
            return '';
        }

        $text = strip_tags($this->content);
        
        if (mb_strlen($text) <= $length) {
            return $text;
        }

        return mb_substr($text, 0, $length) . '...';
    }

    /**
     * Vérifier si la section a du contenu
     */
    public function hasContent(): bool
    {
        return !empty($this->content) && $this->word_count > 0;
    }

    /**
     * Obtenir les images de la section
     */
    public function getImages()
    {
        return $this->media()->whereIn('media_type', ['photo', 'logo', 'infographic'])->get();
    }

    /**
     * Obtenir les graphiques de la section
     */
    public function getCharts()
    {
        return $this->media()->whereIn('media_type', ['chart', 'table', 'diagram'])->get();
    }
}