<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Platform extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'name',
        'domain',
        'description',
        'logo_url',
        'primary_color',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function articles(): HasMany
    {
        return $this->hasMany(Article::class);
    }

    public function providerTypes(): BelongsToMany
    {
        return $this->belongsToMany(ProviderType::class, 'platform_provider_types')
                    ->withPivot(['is_active', 'sort_order'])
                    ->withTimestamps();
    }

    public function expatDomains(): HasMany
    {
        return $this->hasMany(ExpatDomain::class);
    }

    public function affiliateLinks(): HasMany
    {
        return $this->hasMany(AffiliateLink::class);
    }

    public function testimonials(): HasMany
    {
        return $this->hasMany(Testimonial::class);
    }

    public function publicationSchedule(): HasOne
    {
        return $this->hasOne(PublicationSchedule::class);
    }

    public function publicationQueue(): HasMany
    {
        return $this->hasMany(PublicationQueue::class);
    }

    public function redirects(): HasMany
    {
        return $this->hasMany(Redirect::class);
    }

    public function brokenLinks(): HasMany
    {
        return $this->hasMany(BrokenLink::class);
    }

    public function sitemapEntries(): HasMany
    {
        return $this->hasMany(SitemapEntry::class);
    }

    public function imageConfigs(): HasMany
    {
        return $this->hasMany(ImageConfig::class);
    }

    public function countries()
{
    return $this->hasMany(Country::class);
}
    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    public function isSosExpat(): bool
    {
        return $this->slug === 'sos-expat';
    }

    public function isUlixai(): bool
    {
        return $this->slug === 'ulixai';
    }

    public function isUlysseAi(): bool
    {
        return $this->slug === 'ulysse-ai';
    }

    /**
     * Obtenir les types de prestataires actifs pour cette plateforme
     */
    public function getActiveProviderTypes()
    {
        return $this->providerTypes()
                    ->wherePivot('is_active', true)
                    ->orderBy('platform_provider_types.sort_order')
                    ->get();
    }

    /**
     * Obtenir les statistiques de la plateforme
     */
    public function getStats(): array
    {
        return [
            'articles_total' => $this->articles()->count(),
            'articles_published' => $this->articles()->where('status', 'published')->count(),
            'articles_draft' => $this->articles()->where('status', 'draft')->count(),
            'testimonials' => $this->testimonials()->where('is_active', true)->count(),
            'queue_pending' => $this->publicationQueue()->where('status', 'pending')->count(),
        ];
    }
}
