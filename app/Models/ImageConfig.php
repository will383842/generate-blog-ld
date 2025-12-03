<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ImageConfig extends Model
{
    use HasFactory;

    protected $fillable = [
        'content_type',
        'platform_id',
        'source_priority',
        'width',
        'height',
        'format',
        'quality',
        'generate_alt_text',
        'dalle_prompt_template',
        'is_active',
    ];

    protected $casts = [
        'width' => 'integer',
        'height' => 'integer',
        'quality' => 'integer',
        'generate_alt_text' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForContentType($query, string $contentType)
    {
        return $query->where('content_type', $contentType);
    }

    /**
     * Obtenir la configuration pour un type de contenu et plateforme
     */
    public static function getConfig(string $contentType, ?int $platformId = null): ?self
    {
        $query = self::active()->forContentType($contentType);
        
        if ($platformId) {
            // Essayer d'abord avec la plateforme spécifique
            $config = (clone $query)->where('platform_id', $platformId)->first();
            if ($config) return $config;
        }
        
        // Fallback sur config globale (sans plateforme)
        return $query->whereNull('platform_id')->first();
    }

    public function getDimensions(): string
    {
        return "{$this->width}x{$this->height}";
    }
}
