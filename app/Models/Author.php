<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Author extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'name',
        'email',
        'photo_url',
        'photo_source',
        'photo_photographer',
        'photo_photographer_url',
        'photo_attribution',
        'credentials',
        'countries',
        'specialties',
        'themes',
        'linkedin_url',
        'twitter_url',
        'website_url',
        'article_count',
        'is_default',
        'is_active',
    ];

    protected $casts = [
        'credentials' => 'array',
        'countries' => 'array',
        'specialties' => 'array',
        'themes' => 'array',
        'article_count' => 'integer',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function translations(): HasMany
    {
        return $this->hasMany(AuthorTranslation::class);
    }

    public function articles(): HasMany
    {
        return $this->hasMany(Article::class);
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    public function scopeForCountry($query, string $countryCode)
    {
        return $query->whereJsonContains('countries', $countryCode);
    }

    public function scopeForSpecialty($query, string $specialty)
    {
        return $query->whereJsonContains('specialties', $specialty);
    }

    public function scopeForTheme($query, string $theme)
    {
        return $query->whereJsonContains('themes', $theme);
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Trouver le meilleur auteur pour un contexte
     */
    public static function findBestMatch(string $countryCode, ?string $specialty = null, ?string $theme = null): ?self
    {
        $query = self::active();
        
        // Priorité 1 : Correspond au pays ET spécialité
        if ($specialty) {
            $match = (clone $query)->forCountry($countryCode)->forSpecialty($specialty)->first();
            if ($match) return $match;
        }
        
        // Priorité 2 : Correspond au pays
        $match = (clone $query)->forCountry($countryCode)->first();
        if ($match) return $match;
        
        // Priorité 3 : Correspond au thème
        if ($theme) {
            $match = (clone $query)->forTheme($theme)->first();
            if ($match) return $match;
        }
        
        // Fallback : Auteur par défaut
        return self::active()->default()->first();
    }

    /**
     * Obtenir la bio dans une langue
     */
    public function getBio(string $languageCode): ?string
    {
        $translation = $this->translations->where('language_code', $languageCode)->first();
        return $translation?->bio;
    }

    /**
     * Obtenir le titre de job dans une langue
     */
    public function getJobTitle(string $languageCode): ?string
    {
        $translation = $this->translations->where('language_code', $languageCode)->first();
        return $translation?->job_title;
    }

    /**
     * Vérifier si la photo vient d'Unsplash
     */
    public function hasUnsplashPhoto(): bool
    {
        return $this->photo_source === 'unsplash';
    }

    /**
     * Obtenir l'attribution HTML de la photo
     */
    public function getPhotoAttributionHtml(): ?string
    {
        return $this->hasUnsplashPhoto() ? $this->photo_attribution : null;
    }

    /**
     * Générer le JSON-LD pour cet auteur
     */
    public function toJsonLd(string $languageCode, string $baseUrl): array
    {
        $sameAs = array_filter([
            $this->linkedin_url,
            $this->twitter_url,
            $this->website_url,
        ]);

        return [
            '@type' => 'Person',
            'name' => $this->name,
            'url' => "{$baseUrl}/authors/{$this->slug}",
            'image' => $this->photo_url,
            'jobTitle' => $this->getJobTitle($languageCode),
            'description' => $this->getBio($languageCode),
            'sameAs' => $sameAs,
            'knowsAbout' => $this->specialties ?? [],
        ];
    }

    /**
     * Incrémenter le compteur d'articles
     */
    public function incrementArticleCount(): void
    {
        $this->increment('article_count');
    }
}