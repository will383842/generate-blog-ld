<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Model DossierMedia - Médias attachés aux dossiers de presse
 * 
 * Types de médias supportés :
 * - photo : Photos haute qualité
 * - logo : Logos (entreprise, partenaires)
 * - chart : Graphiques générés automatiquement
 * - table : Tableaux de données
 * - infographic : Infographies
 * - diagram : Diagrammes
 * - dataset : Fichiers de données bruts (CSV, Excel)
 * 
 * @package App\Models
 */
class DossierMedia extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'dossier_id',
        'section_id',
        'media_type',
        'file_path',
        'original_filename',
        'mime_type',
        'file_size',
        'width',
        'height',
        'caption',
        'alt_text',
        'source',
        'source_type',
        'photographer',
        'photographer_url',
        'attribution_html',
        'source_id',
        'order_index',
        'display_size',
        'alignment',
        'chart_config',
        'table_data',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
        'order_index' => 'integer',
        'chart_config' => 'array',
        'table_data' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
        
        // Supprimer le fichier lors de la suppression du modèle
        static::deleting(function ($model) {
            // Ne supprimer que si c'est un fichier local (pas Unsplash)
            if ($model->source_type !== 'unsplash' && $model->file_path && Storage::exists($model->file_path)) {
                Storage::delete($model->file_path);
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
     * Section parente (optionnelle)
     */
    public function section(): BelongsTo
    {
        return $this->belongsTo(DossierSection::class, 'section_id');
    }

    // ============================================
    // SCOPES
    // ============================================

    /**
     * Filtrer par type de média
     */
    public function scopeType($query, string $type)
    {
        return $query->where('media_type', $type);
    }

    /**
     * Médias de type image
     */
    public function scopeImages($query)
    {
        return $query->whereIn('media_type', ['photo', 'logo', 'infographic']);
    }

    /**
     * Médias de type graphique
     */
    public function scopeCharts($query)
    {
        return $query->whereIn('media_type', ['chart', 'table', 'diagram']);
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
     * Obtenir l'URL publique du fichier
     */
    public function getUrlAttribute(): string
    {
        // Si URL Unsplash, retourner directement
        if ($this->source_type === 'unsplash') {
            return $this->file_path;
        }
        
        // Sinon, Storage local
        return Storage::url($this->file_path);
    }

    /**
     * Obtenir l'URL complète du fichier
     */
    public function getFullUrlAttribute(): string
    {
        // Si Unsplash, file_path contient déjà l'URL complète
        if ($this->source_type === 'unsplash') {
            return $this->file_path;
        }
        
        return url(Storage::url($this->file_path));
    }

    /**
     * Vérifier si le fichier existe
     */
    public function fileExists(): bool
    {
        // Les images Unsplash existent toujours (URL externe)
        if ($this->source_type === 'unsplash') {
            return true;
        }
        
        return Storage::exists($this->file_path);
    }

    /**
     * Obtenir la taille du fichier formatée
     */
    public function getFormattedSizeAttribute(): string
    {
        if (!$this->file_size) {
            return 'N/A';
        }

        $units = ['B', 'KB', 'MB', 'GB'];
        $size = $this->file_size;
        $unitIndex = 0;

        while ($size >= 1024 && $unitIndex < count($units) - 1) {
            $size /= 1024;
            $unitIndex++;
        }

        return round($size, 2) . ' ' . $units[$unitIndex];
    }

    /**
     * Vérifier si c'est une image
     */
    public function isImage(): bool
    {
        return in_array($this->media_type, ['photo', 'logo', 'infographic']);
    }

    /**
     * Vérifier si c'est un graphique
     */
    public function isChart(): bool
    {
        return in_array($this->media_type, ['chart', 'table', 'diagram']);
    }

    /**
     * Vérifier si c'est un dataset
     */
    public function isDataset(): bool
    {
        return $this->media_type === 'dataset';
    }

    /**
     * Obtenir le nom du type de média en français
     */
    public function getTypeNameAttribute(): string
    {
        $types = [
            'photo' => 'Photo',
            'logo' => 'Logo',
            'chart' => 'Graphique',
            'table' => 'Tableau',
            'infographic' => 'Infographie',
            'diagram' => 'Diagramme',
            'dataset' => 'Dataset',
        ];

        return $types[$this->media_type] ?? $this->media_type;
    }

    /**
     * Obtenir les dimensions formatées
     */
    public function getDimensionsAttribute(): ?string
    {
        if (!$this->width || !$this->height) {
            return null;
        }

        return "{$this->width} × {$this->height} px";
    }

    /**
     * Déplacer le média vers le haut dans l'ordre
     */
    public function moveUp(): bool
    {
        $query = static::where('dossier_id', $this->dossier_id);
        
        if ($this->section_id) {
            $query->where('section_id', $this->section_id);
        }
        
        $previousMedia = $query->where('order_index', '<', $this->order_index)
            ->orderBy('order_index', 'desc')
            ->first();

        if ($previousMedia) {
            $tempIndex = $this->order_index;
            $this->order_index = $previousMedia->order_index;
            $previousMedia->order_index = $tempIndex;
            
            $this->save();
            $previousMedia->save();
            
            return true;
        }

        return false;
    }

    /**
     * Déplacer le média vers le bas dans l'ordre
     */
    public function moveDown(): bool
    {
        $query = static::where('dossier_id', $this->dossier_id);
        
        if ($this->section_id) {
            $query->where('section_id', $this->section_id);
        }
        
        $nextMedia = $query->where('order_index', '>', $this->order_index)
            ->orderBy('order_index', 'asc')
            ->first();

        if ($nextMedia) {
            $tempIndex = $this->order_index;
            $this->order_index = $nextMedia->order_index;
            $nextMedia->order_index = $tempIndex;
            
            $this->save();
            $nextMedia->save();
            
            return true;
        }

        return false;
    }

    // ============================================
    // MÉTHODES UNSPLASH (Phase 14)
    // ============================================

    /**
     * Vérifier si l'image vient d'Unsplash
     */
    public function isUnsplash(): bool
    {
        return $this->source_type === 'unsplash';
    }

    /**
     * Obtenir l'URL optimisée (avec paramètres Unsplash)
     */
    public function getOptimizedUrl(int $width = 1200, int $quality = 85): string
    {
        if ($this->isUnsplash() && str_contains($this->file_path, 'unsplash.com')) {
            $separator = str_contains($this->file_path, '?') ? '&' : '?';
            return $this->file_path . $separator . http_build_query([
                'w' => $width,
                'q' => $quality,
            ]);
        }
        
        return $this->getUrlAttribute();
    }

    /**
     * Obtenir l'attribution HTML formatée pour Unsplash
     */
    public function getAttributionHtml(): ?string
    {
        if ($this->isUnsplash() && $this->attribution_html) {
            return $this->attribution_html;
        }
        
        return null;
    }
}