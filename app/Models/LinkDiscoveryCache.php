<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class LinkDiscoveryCache extends Model
{
    use HasFactory;

    protected $table = 'link_discovery_cache';

    protected $fillable = [
        'query_hash',
        'query_params',
        'country_code',
        'language_code',
        'theme',
        'discovered_links',
        'source',
        'expires_at',
    ];

    protected $casts = [
        'query_params' => 'array',
        'discovered_links' => 'array',
        'expires_at' => 'datetime',
    ];

    /**
     * Scope: entrées non expirées
     */
    public function scopeValid(Builder $query): Builder
    {
        return $query->where('expires_at', '>', now());
    }

    /**
     * Scope: par hash de requête
     */
    public function scopeByHash(Builder $query, string $hash): Builder
    {
        return $query->where('query_hash', $hash);
    }

    /**
     * Scope: par pays
     */
    public function scopeForCountry(Builder $query, string $countryCode): Builder
    {
        return $query->where('country_code', $countryCode);
    }

    /**
     * Scope: par langue
     */
    public function scopeForLanguage(Builder $query, string $languageCode): Builder
    {
        return $query->where('language_code', $languageCode);
    }

    /**
     * Scope: par thème
     */
    public function scopeForTheme(Builder $query, string $theme): Builder
    {
        return $query->where('theme', $theme);
    }

    /**
     * Scope: par source (perplexity, government, organization)
     */
    public function scopeFromSource(Builder $query, string $source): Builder
    {
        return $query->where('source', $source);
    }

    /**
     * Génère un hash unique pour une requête
     */
    public static function generateHash(array $params): string
    {
        ksort($params);
        return md5(json_encode($params));
    }

    /**
     * Récupère du cache ou null si expiré/inexistant
     */
    public static function getFromCache(array $params): ?array
    {
        $hash = self::generateHash($params);

        $cached = self::byHash($hash)->valid()->first();

        if ($cached) {
            return $cached->discovered_links;
        }

        return null;
    }

    /**
     * Stocke dans le cache
     */
    public static function storeInCache(
        array $params,
        array $links,
        string $source = 'perplexity',
        int $ttlDays = 7
    ): self {
        $hash = self::generateHash($params);

        return self::updateOrCreate(
            ['query_hash' => $hash],
            [
                'query_params' => $params,
                'country_code' => $params['country_code'] ?? null,
                'language_code' => $params['language_code'] ?? null,
                'theme' => $params['theme'] ?? null,
                'discovered_links' => $links,
                'source' => $source,
                'expires_at' => now()->addDays($ttlDays),
            ]
        );
    }

    /**
     * Vérifie si l'entrée est expirée
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Prolonge la durée de vie du cache
     */
    public function extend(int $days = 7): void
    {
        $this->update(['expires_at' => now()->addDays($days)]);
    }

    /**
     * Nettoie les entrées expirées
     */
    public static function cleanExpired(): int
    {
        return self::where('expires_at', '<', now())->delete();
    }

    /**
     * Récupère les statistiques du cache
     */
    public static function getStats(): array
    {
        return [
            'total_entries' => self::count(),
            'valid_entries' => self::valid()->count(),
            'expired_entries' => self::where('expires_at', '<', now())->count(),
            'by_source' => self::selectRaw('source, COUNT(*) as count')
                ->groupBy('source')
                ->pluck('count', 'source')
                ->toArray(),
            'by_country' => self::valid()
                ->whereNotNull('country_code')
                ->selectRaw('country_code, COUNT(*) as count')
                ->groupBy('country_code')
                ->orderByDesc('count')
                ->limit(10)
                ->pluck('count', 'country_code')
                ->toArray(),
            'oldest_entry' => self::valid()->min('created_at'),
            'newest_entry' => self::valid()->max('created_at'),
        ];
    }

    /**
     * Récupère les liens découverts avec filtrage
     */
    public function getLinksFiltered(int $minAuthority = 0, ?string $sourceType = null): array
    {
        $links = $this->discovered_links ?? [];

        return array_filter($links, function ($link) use ($minAuthority, $sourceType) {
            if (($link['authority_score'] ?? 0) < $minAuthority) {
                return false;
            }

            if ($sourceType && ($link['source_type'] ?? '') !== $sourceType) {
                return false;
            }

            return true;
        });
    }

    /**
     * Ajoute des liens au cache existant
     */
    public function addLinks(array $newLinks): void
    {
        $existingLinks = $this->discovered_links ?? [];
        $existingUrls = array_column($existingLinks, 'url');

        foreach ($newLinks as $link) {
            if (!in_array($link['url'], $existingUrls)) {
                $existingLinks[] = $link;
            }
        }

        $this->update(['discovered_links' => $existingLinks]);
    }

    /**
     * Trouve une entrée valide du cache (alias pour compatibilité)
     */
    public static function findValid(string $topic, ?string $countryCode = null, ?string $languageCode = null): ?array
    {
        $params = [
            'topic' => $topic,
            'country_code' => $countryCode,
            'language_code' => $languageCode,
        ];
        
        return self::getFromCache($params);
    }

    /**
     * Stocke dans le cache (alias pour compatibilité)
     */
    public static function store(
        string $topic, 
        ?string $countryCode, 
        ?string $languageCode, 
        array $links, 
        int $ttlDays = 7
    ): self {
        $params = [
            'topic' => $topic,
            'country_code' => $countryCode,
            'language_code' => $languageCode,
        ];
        
        return self::storeInCache($params, $links, 'discovery', $ttlDays);
    }
}
