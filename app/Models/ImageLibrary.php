<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ImageLibrary extends Model
{
    use HasFactory;

    protected $table = 'image_library';

    protected $fillable = [
        'filename',
        'original_filename',
        'path',
        'url',
        'cdn_url',
        'source',
        'source_id',
        'source_url',
        'photographer',
        'photographer_url',
        'mime_type',
        'width',
        'height',
        'file_size',
        'tags',
        'country_code',
        'theme',
        'usage_count',
        'is_active',
    ];

    protected $casts = [
        'tags' => 'array',
        'width' => 'integer',
        'height' => 'integer',
        'file_size' => 'integer',
        'usage_count' => 'integer',
        'is_active' => 'boolean',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function altTexts(): HasMany
    {
        return $this->hasMany(ImageAltText::class, 'image_id');
    }

    public function generations(): HasMany
    {
        return $this->hasMany(ImageGeneration::class, 'image_id');
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeFromSource($query, string $source)
    {
        return $query->where('source', $source);
    }

    public function scopeForCountry($query, string $countryCode)
    {
        return $query->where('country_code', $countryCode);
    }

    public function scopeForTheme($query, string $theme)
    {
        return $query->where('theme', $theme);
    }

    public function scopeWithTags($query, array $tags)
    {
        foreach ($tags as $tag) {
            $query->whereJsonContains('tags', $tag);
        }
        return $query;
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    public function getPublicUrl(): string
    {
        return $this->cdn_url ?? $this->url;
    }

    public function getAltText(string $languageCode): ?string
    {
        $altText = $this->altTexts->where('language_code', $languageCode)->first();
        return $altText?->alt_text;
    }

    public function incrementUsage(): void
    {
        $this->increment('usage_count');
    }

    public function getFileSizeFormatted(): string
    {
        $bytes = $this->file_size;
        if ($bytes >= 1048576) {
            return round($bytes / 1048576, 2) . ' Mo';
        }
        return round($bytes / 1024, 2) . ' Ko';
    }

    public function getDimensions(): string
    {
        return "{$this->width}x{$this->height}";
    }

    public function getAspectRatio(): float
    {
        return $this->height > 0 ? round($this->width / $this->height, 2) : 0;
    }
}
