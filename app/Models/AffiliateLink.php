<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

/**
 * Model AffiliateLink - Liens affiliés avec ciblage géographique mondial
 * 
 * Supporte 197 pays × 7 régions
 */
class AffiliateLink extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'category',
        'url',
        'anchor_text',
        'description',
        'is_global',
        'regions',
        'countries',
        'excluded_countries',
        'platform_id',
        'keywords',
        'commission_type',
        'commission_rate',
        'commission_currency',
        'cookie_duration_days',
        'usage_count',
        'click_count',
        'revenue_total',
        'is_active',
        'priority',
    ];

    protected $casts = [
        'is_global' => 'boolean',
        'is_active' => 'boolean',
        'regions' => 'array',
        'countries' => 'array',
        'excluded_countries' => 'array',
        'keywords' => 'array',
        'commission_rate' => 'decimal:2',
        'revenue_total' => 'decimal:2',
        'cookie_duration_days' => 'integer',
        'usage_count' => 'integer',
        'click_count' => 'integer',
        'priority' => 'integer',
    ];

    /**
     * Régions disponibles
     */
    const REGIONS = [
        'europe' => ['AD', 'AL', 'AT', 'BA', 'BE', 'BG', 'BY', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GB', 'GR', 'HR', 'HU', 'IE', 'IS', 'IT', 'LI', 'LT', 'LU', 'LV', 'MC', 'MD', 'ME', 'MK', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'RS', 'RU', 'SE', 'SI', 'SK', 'SM', 'UA', 'VA', 'XK'],
        'asia' => ['AE', 'AF', 'AM', 'AZ', 'BD', 'BH', 'BN', 'BT', 'CN', 'GE', 'HK', 'ID', 'IL', 'IN', 'IQ', 'IR', 'JO', 'JP', 'KG', 'KH', 'KP', 'KR', 'KW', 'KZ', 'LA', 'LB', 'LK', 'MM', 'MN', 'MO', 'MV', 'MY', 'NP', 'OM', 'PH', 'PK', 'PS', 'QA', 'SA', 'SG', 'SY', 'TH', 'TJ', 'TL', 'TM', 'TR', 'TW', 'UZ', 'VN', 'YE'],
        'africa' => ['AO', 'BF', 'BI', 'BJ', 'BW', 'CD', 'CF', 'CG', 'CI', 'CM', 'CV', 'DJ', 'DZ', 'EG', 'EH', 'ER', 'ET', 'GA', 'GH', 'GM', 'GN', 'GQ', 'GW', 'KE', 'KM', 'LR', 'LS', 'LY', 'MA', 'MG', 'ML', 'MR', 'MU', 'MW', 'MZ', 'NA', 'NE', 'NG', 'RW', 'SC', 'SD', 'SL', 'SN', 'SO', 'SS', 'ST', 'SZ', 'TD', 'TG', 'TN', 'TZ', 'UG', 'ZA', 'ZM', 'ZW'],
        'middle_east' => ['AE', 'BH', 'EG', 'IL', 'IQ', 'IR', 'JO', 'KW', 'LB', 'OM', 'PS', 'QA', 'SA', 'SY', 'TR', 'YE'],
        'north_america' => ['CA', 'MX', 'US'],
        'latin_america' => ['AR', 'BO', 'BR', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'GT', 'HN', 'HT', 'JM', 'NI', 'PA', 'PE', 'PR', 'PY', 'SV', 'TT', 'UY', 'VE'],
        'oceania' => ['AU', 'FJ', 'NZ', 'PG', 'WS'],
    ];

    /**
     * Catégories de partenaires
     */
    const CATEGORIES = [
        'transfer' => 'Transferts d\'argent',
        'insurance' => 'Assurances',
        'housing' => 'Hébergement',
        'moving' => 'Déménagement',
        'bank' => 'Banques',
        'language' => 'Langues',
        'vpn' => 'VPN & Sécurité',
        'telecom' => 'Télécom & SIM',
        'community' => 'Communauté',
        'legal' => 'Services juridiques',
        'job' => 'Emploi',
    ];

    /**
     * Plateforme associée
     */
    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    /**
     * Scope : Actifs uniquement
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope : Par catégorie
     */
    public function scopeCategory(Builder $query, string $category): Builder
    {
        return $query->where('category', $category);
    }

    /**
     * Scope : Disponibles pour un pays donné
     */
    public function scopeForCountry(Builder $query, string $countryCode): Builder
    {
        $countryCode = strtoupper($countryCode);
        $region = $this->getRegionForCountry($countryCode);

        return $query->where(function ($q) use ($countryCode, $region) {
            // Global
            $q->where('is_global', true)
              // Ou pays spécifique
              ->orWhereJsonContains('countries', $countryCode)
              // Ou région
              ->orWhereJsonContains('regions', $region);
        })
        // Exclure si dans excluded_countries
        ->where(function ($q) use ($countryCode) {
            $q->whereNull('excluded_countries')
              ->orWhereJsonDoesntContain('excluded_countries', $countryCode);
        });
    }

    /**
     * Scope : Matching par mots-clés
     */
    public function scopeMatchingKeywords(Builder $query, array $keywords): Builder
    {
        return $query->where(function ($q) use ($keywords) {
            foreach ($keywords as $keyword) {
                $q->orWhereJsonContains('keywords', strtolower($keyword));
            }
        });
    }

    /**
     * Trouver la région d'un pays
     */
    public static function getRegionForCountry(string $countryCode): ?string
    {
        $countryCode = strtoupper($countryCode);
        
        foreach (self::REGIONS as $region => $countries) {
            if (in_array($countryCode, $countries)) {
                return $region;
            }
        }
        
        return null;
    }

    /**
     * Vérifier si le lien est disponible pour un pays
     */
    public function isAvailableForCountry(string $countryCode): bool
    {
        $countryCode = strtoupper($countryCode);
        
        // Exclu ?
        if ($this->excluded_countries && in_array($countryCode, $this->excluded_countries)) {
            return false;
        }
        
        // Global ?
        if ($this->is_global) {
            return true;
        }
        
        // Pays spécifique ?
        if ($this->countries && in_array($countryCode, $this->countries)) {
            return true;
        }
        
        // Région ?
        if ($this->regions) {
            $region = self::getRegionForCountry($countryCode);
            if ($region && in_array($region, $this->regions)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Trouver les meilleurs affiliés pour un contenu
     */
    public static function findForContent(string $countryCode, array $keywords, int $limit = 3): \Illuminate\Database\Eloquent\Collection
    {
        return self::active()
            ->forCountry($countryCode)
            ->matchingKeywords($keywords)
            ->orderByDesc('priority')
            ->orderByDesc('commission_rate')
            ->limit($limit)
            ->get();
    }

    /**
     * Incrémenter le compteur d'utilisation
     */
    public function incrementUsage(): void
    {
        $this->increment('usage_count');
    }

    /**
     * Incrémenter le compteur de clics
     */
    public function incrementClick(): void
    {
        $this->increment('click_count');
    }

    /**
     * Ajouter des revenus
     */
    public function addRevenue(float $amount): void
    {
        $this->increment('revenue_total', $amount);
    }
}