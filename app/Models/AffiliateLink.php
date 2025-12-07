<?php

namespace App\Models;

use App\Models\Platform;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class AffiliateLink extends Model
{
    use HasFactory;

    protected $fillable = [
        'platform_id',
        'service_name',
        'service_slug',
        'tracking_url',
        'landing_url',
        'commission_rate',
        'commission_type',
        'country_codes',
        'language_codes',
        'themes',
        'custom_anchors',
        'description',
        'logo_url',
        'priority',
        'clicks',
        'conversions',
        'revenue',
        'is_active',
        'starts_at',
        'expires_at',
        'last_performance_update',
    ];

    protected $casts = [
        'commission_rate' => 'float',
        'country_codes' => 'array',
        'language_codes' => 'array',
        'themes' => 'array',
        'custom_anchors' => 'array',
        'priority' => 'integer',
        'clicks' => 'integer',
        'conversions' => 'integer',
        'revenue' => 'float',
        'is_active' => 'boolean',
        'starts_at' => 'datetime',
        'expires_at' => 'datetime',
        'last_performance_update' => 'datetime',
    ];

    protected $attributes = [
        'commission_type' => 'percentage',
        'priority' => 5,
        'clicks' => 0,
        'conversions' => 0,
        'revenue' => 0,
        'is_active' => true,
    ];

    /**
     * Relation avec la plateforme
     */
    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    /**
     * Scope: liens actifs
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('starts_at')
                    ->orWhere('starts_at', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }

    /**
     * Scope: par pays
     */
    public function scopeForCountry(Builder $query, string $countryCode): Builder
    {
        return $query->where(function ($q) use ($countryCode) {
            $q->whereNull('country_codes')
                ->orWhereJsonContains('country_codes', $countryCode);
        });
    }

    /**
     * Scope: par langue
     */
    public function scopeForLanguage(Builder $query, string $languageCode): Builder
    {
        return $query->where(function ($q) use ($languageCode) {
            $q->whereNull('language_codes')
                ->orWhereJsonContains('language_codes', $languageCode);
        });
    }

    /**
     * Scope: par thème
     */
    public function scopeForTheme(Builder $query, string $theme): Builder
    {
        return $query->where(function ($q) use ($theme) {
            $q->whereNull('themes')
                ->orWhereJsonContains('themes', $theme);
        });
    }

    /**
     * Scope: triés par performance
     */
    public function scopeOrderByPerformance(Builder $query): Builder
    {
        return $query->orderByRaw('CASE WHEN clicks > 0 THEN conversions / clicks ELSE 0 END DESC')
            ->orderByDesc('conversions');
    }

    /**
     * Calcule le taux de conversion
     */
    public function getConversionRateAttribute(): float
    {
        if ($this->clicks === 0) {
            return 0;
        }

        return round(($this->conversions / $this->clicks) * 100, 2);
    }

    /**
     * Calcule le revenu par clic
     */
    public function getRevenuePerClickAttribute(): float
    {
        if ($this->clicks === 0) {
            return 0;
        }

        return round($this->revenue / $this->clicks, 2);
    }

    /**
     * Vérifie si le lien est disponible pour un contexte donné
     */
    public function isAvailableFor(?string $countryCode, ?string $languageCode, ?string $theme): bool
    {
        // Vérifier l'état actif
        if (!$this->is_active) {
            return false;
        }

        // Vérifier les dates
        if ($this->starts_at && $this->starts_at->isFuture()) {
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        // Vérifier le pays
        if ($countryCode && !empty($this->country_codes)) {
            if (!in_array($countryCode, $this->country_codes)) {
                return false;
            }
        }

        // Vérifier la langue
        if ($languageCode && !empty($this->language_codes)) {
            if (!in_array($languageCode, $this->language_codes)) {
                return false;
            }
        }

        // Vérifier le thème
        if ($theme && !empty($this->themes)) {
            if (!in_array($theme, $this->themes)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Récupère l'anchor text approprié pour une langue
     */
    public function getAnchorFor(string $languageCode): string
    {
        if (!empty($this->custom_anchors[$languageCode])) {
            $anchors = $this->custom_anchors[$languageCode];
            return $anchors[array_rand($anchors)];
        }

        // Fallback sur anglais
        if (!empty($this->custom_anchors['en'])) {
            $anchors = $this->custom_anchors['en'];
            return $anchors[array_rand($anchors)];
        }

        return $this->service_name;
    }

    /**
     * Incrémente les clics
     */
    public function incrementClicks(): void
    {
        $this->increment('clicks');
    }

    /**
     * Enregistre une conversion
     */
    public function recordConversion(float $revenue = 0): void
    {
        $this->increment('conversions');
        
        if ($revenue > 0) {
            $this->increment('revenue', $revenue);
        }
    }

    /**
     * Génère l'URL de tracking avec paramètres
     */
    public function getTrackingUrlWithParams(array $params = []): string
    {
        $url = $this->tracking_url;

        $defaultParams = [
            'utm_source' => 'content',
            'utm_medium' => 'affiliate',
            'utm_campaign' => $this->service_slug,
        ];

        $allParams = array_merge($defaultParams, $params);
        
        $separator = strpos($url, '?') !== false ? '&' : '?';
        
        return $url . $separator . http_build_query($allParams);
    }

    /**
     * Récupère les statistiques
     */
    public function getStats(): array
    {
        return [
            'clicks' => $this->clicks,
            'conversions' => $this->conversions,
            'revenue' => $this->revenue,
            'conversion_rate' => $this->conversion_rate,
            'revenue_per_click' => $this->revenue_per_click,
            'is_active' => $this->is_active,
            'days_until_expiry' => $this->expires_at ? now()->diffInDays($this->expires_at, false) : null,
        ];
    }
}
