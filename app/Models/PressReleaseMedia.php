<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class PressReleaseMedia extends Model
{
    protected $table = 'press_release_media';

    protected $fillable = [
        'press_release_id', 'media_type', 'file_path', 'caption',
        'source_type', 'photographer', 'photographer_url', 'attribution_html',
        'width', 'height', 'source_id', 'metadata', 'order_index',
    ];

    protected $casts = [
        'metadata' => 'array',
        'order_index' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
    ];

    // Relations
    public function pressRelease(): BelongsTo 
    { 
        return $this->belongsTo(PressRelease::class); 
    }

    // Scopes
    public function scopeType($query, $type) 
    { 
        return $query->where('media_type', $type); 
    }
    
    public function scopePhotos($query) 
    { 
        return $query->where('media_type', 'photo'); 
    }
    
    public function scopeCharts($query) 
    { 
        return $query->where('media_type', 'chart'); 
    }

    // Accessors
    public function getFileUrlAttribute(): string
    {
        return filter_var($this->file_path, FILTER_VALIDATE_URL)
            ? $this->file_path
            : Storage::url($this->file_path);
    }

    /**
     * Vérifier si l'image vient d'Unsplash
     */
    public function isUnsplash(): bool
    {
        return $this->source_type === 'unsplash';
    }

    /**
     * Obtenir l'URL optimisée
     */
    public function getOptimizedUrl(int $width = 1200): string
    {
        if ($this->isUnsplash() && str_contains($this->file_path, 'unsplash.com')) {
            $separator = str_contains($this->file_path, '?') ? '&' : '?';
            return $this->file_path . $separator . 'w=' . $width;
        }
        
        return $this->getFileUrlAttribute();
    }

    // Methods
    public function fileExists(): bool
    {
        return filter_var($this->file_path, FILTER_VALIDATE_URL) 
            ? true 
            : Storage::exists($this->file_path);
    }

    protected static function boot()
    {
        parent::boot();
        
        static::deleting(function ($media) {
            if (!filter_var($media->file_path, FILTER_VALIDATE_URL)) {
                Storage::delete($media->file_path);
            }
        });
    }
}