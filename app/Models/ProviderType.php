<?php

namespace App\Models;

use App\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProviderType extends Model
{
    use HasFactory, HasTranslations;

    protected $fillable = [
        'slug',
        'name_fr',
        'name_en',
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

    public function translations(): HasMany
    {
        return $this->hasMany(ProviderTypeTranslation::class);
    }

    public function platforms(): BelongsToMany
    {
        return $this->belongsToMany(Platform::class, 'platform_provider_types')
                    ->withPivot(['is_active', 'sort_order'])
                    ->withTimestamps();
    }

    public function articles(): HasMany
    {
        return $this->hasMany(Article::class);
    }

    public function specialties(): HasMany
    {
        return $this->hasMany(LawyerSpecialty::class);
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
        return $query->whereHas('platforms', function ($q) use ($platformId) {
            $q->where('platforms.id', $platformId)
              ->where('platform_provider_types.is_active', true);
        });
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Obtenir le nom au singulier traduit
     */
    public function getSingular(string $languageCode = 'fr'): string
    {
        return $this->translated('singular', $languageCode, $this->name_fr);
    }

    /**
     * Obtenir le nom au pluriel traduit
     */
    public function getPlural(string $languageCode = 'fr'): string
    {
        return $this->translated('plural', $languageCode, $this->getSingular($languageCode) . 's');
    }

    /**
     * Obtenir avec article (un avocat, des avocats)
     */
    public function getWithArticle(string $languageCode = 'fr', bool $plural = false): string
    {
        $translation = $this->getTranslation($languageCode);
        
        if (!$translation) {
            return $plural ? $this->getPlural($languageCode) : $this->getSingular($languageCode);
        }

        $article = $plural 
            ? ($translation->article_plural ?? '') 
            : ($translation->article_singular ?? '');
        
        $name = $plural 
            ? ($translation->plural ?? $translation->singular) 
            : $translation->singular;
        
        return trim("{$article} {$name}");
    }

    /**
     * Obtenir le slug traduit
     */
    public function getSlug(string $languageCode = 'fr'): string
    {
        return $this->translated('slug', $languageCode, $this->slug);
    }
}