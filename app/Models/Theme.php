<?php

namespace App\Models;

use App\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Theme extends Model
{
    use HasFactory, HasTranslations;

    protected $fillable = [
        'name_fr',
        'name_en',
        'slug',
        'description_fr',
        'description_en',
        'platform_id',
        'icon',
        'color',
        'is_active',
        'order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'order' => 'integer',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    public function translations(): HasMany
    {
        return $this->hasMany(ThemeTranslation::class);
    }

    public function articles(): HasMany
    {
        return $this->hasMany(Article::class);
    }

    public function templates(): HasMany
    {
        return $this->hasMany(Template::class);
    }

    public function promptTemplates(): HasMany
    {
        return $this->hasMany(PromptTemplate::class);
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('order');
    }

    public function scopeForPlatform($query, int $platformId)
    {
        return $query->where('platform_id', $platformId);
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    public function getName(string $languageCode = 'fr'): string
    {
        $column = "name_{$languageCode}";
        if (in_array($languageCode, ['fr', 'en']) && $this->$column) {
            return $this->$column;
        }
        return $this->translated('name', $languageCode, $this->name_fr);
    }

    public function getDescription(string $languageCode = 'fr'): ?string
    {
        $column = "description_{$languageCode}";
        if (in_array($languageCode, ['fr', 'en']) && $this->$column) {
            return $this->$column;
        }
        return $this->translated('description', $languageCode);
    }

    public function getSlug(string $languageCode = 'fr'): string
    {
        return $this->translated('slug', $languageCode, $this->slug);
    }
}