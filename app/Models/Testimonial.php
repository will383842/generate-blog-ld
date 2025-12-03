<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Testimonial extends Model
{
    use HasFactory;

    protected $fillable = [
        'platform_id',
        'first_name',
        'last_name_initial',
        'country_code',
        'city',
        'service_id',
        'specialty_id',
        'photo_url',
        'rating',
        'source',
        'is_active',
        'is_featured',
        'sort_order',
    ];

    protected $casts = [
        'rating' => 'integer',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'sort_order' => 'integer',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class, 'country_code', 'code');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(UlixaiService::class, 'service_id');
    }

    public function specialty(): BelongsTo
    {
        return $this->belongsTo(LawyerSpecialty::class, 'specialty_id');
    }

    public function translations(): HasMany
    {
        return $this->hasMany(TestimonialTranslation::class);
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeForPlatform($query, int $platformId)
    {
        return $query->where('platform_id', $platformId);
    }

    public function scopeForCountry($query, string $countryCode)
    {
        return $query->where('country_code', $countryCode);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderByDesc('rating');
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Nom complet affiché (Prénom + initiale)
     */
    public function getDisplayName(): string
    {
        return "{$this->first_name} {$this->last_name_initial}";
    }

    /**
     * Localisation affichée
     */
    public function getLocation(string $languageCode = 'fr'): string
    {
        $parts = [];
        
        if ($this->city) {
            $parts[] = $this->city;
        }
        
        if ($this->country_code) {
            $countryTranslation = CountryTranslation::where('country_id', function ($q) {
                $q->select('id')->from('countries')->where('code', $this->country_code);
            })->where('language_code', $languageCode)->first();
            
            if ($countryTranslation) {
                $parts[] = $countryTranslation->name;
            }
        }
        
        return implode(', ', $parts);
    }

    /**
     * Obtenir le témoignage traduit
     */
    public function getQuote(string $languageCode): ?string
    {
        $translation = $this->translations->where('language_code', $languageCode)->first();
        return $translation?->quote;
    }

    /**
     * Étoiles en HTML
     */
    public function getRatingStars(): string
    {
        if (!$this->rating) return '';
        
        $full = str_repeat('⭐', $this->rating);
        $empty = str_repeat('☆', 5 - $this->rating);
        
        return $full . $empty;
    }

    /**
     * URL de la photo ou avatar par défaut
     */
    public function getPhotoUrl(): string
    {
        return $this->photo_url ?? '/images/default-avatar.png';
    }
}
