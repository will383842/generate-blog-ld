<?php

namespace App\Models;

use App\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LawyerSpecialty extends Model
{
    use HasFactory, HasTranslations;

    protected $fillable = [
        'name_fr',
        'name_en',
        'slug',
        'description_fr',
        'description_en',
        'provider_type_id',
        'category_code',
        'code',
        'icon',
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

    public function providerType(): BelongsTo
    {
        return $this->belongsTo(ProviderType::class);
    }

    public function translations(): HasMany
    {
        return $this->hasMany(LawyerSpecialtyTranslation::class);
    }

    public function articles(): HasMany
    {
        return $this->hasMany(Article::class, 'specialty_id');
    }

    public function testimonials(): HasMany
    {
        return $this->hasMany(Testimonial::class, 'specialty_id');
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

    public function scopeForProviderType($query, int $providerTypeId)
    {
        return $query->where('provider_type_id', $providerTypeId);
    }

    public function scopeInCategory($query, string $categoryCode)
    {
        return $query->where('category_code', $categoryCode);
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