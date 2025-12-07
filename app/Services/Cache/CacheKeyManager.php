<?php

namespace App\Services\Cache;

use Illuminate\Support\Facades\Cache;

/**
 * Gestionnaire centralisé des clés de cache
 *
 * Utilisation:
 *   CacheKeyManager::get('stats.dashboard')
 *   CacheKeyManager::invalidateGroup('article')
 *   CacheKeyManager::remember('stats.dashboard', fn() => $data)
 */
class CacheKeyManager
{
    /**
     * Récupérer une clé de cache depuis la config
     */
    public static function get(string $path): string
    {
        return config("cache-keys.{$path}", $path);
    }

    /**
     * Récupérer le TTL pour un groupe
     */
    public static function getTtl(string $group): int
    {
        return config("cache-keys.ttl.{$group}", 300);
    }

    /**
     * Invalider un groupe de clés de cache
     */
    public static function invalidateGroup(string $group): void
    {
        $keys = config("cache-keys.invalidation_groups.{$group}", []);

        foreach ($keys as $key) {
            Cache::forget($key);
        }
    }

    /**
     * Invalider plusieurs groupes
     */
    public static function invalidateGroups(array $groups): void
    {
        foreach ($groups as $group) {
            self::invalidateGroup($group);
        }
    }

    /**
     * Invalider une clé spécifique
     */
    public static function forget(string $key): void
    {
        Cache::forget(self::get($key));
    }

    /**
     * Méthode remember avec clé et TTL centralisés
     */
    public static function remember(string $keyPath, callable $callback, ?int $ttl = null): mixed
    {
        $key = self::get($keyPath);

        if ($ttl === null) {
            // Extraire le groupe depuis le chemin (ex: 'stats.dashboard' -> 'stats')
            $group = explode('.', $keyPath)[0];
            $ttl = self::getTtl($group);
        }

        return Cache::remember($key, $ttl, $callback);
    }

    /**
     * Vérifier si une clé existe en cache
     */
    public static function has(string $keyPath): bool
    {
        return Cache::has(self::get($keyPath));
    }

    /**
     * Récupérer une valeur du cache
     */
    public static function pull(string $keyPath): mixed
    {
        return Cache::get(self::get($keyPath));
    }

    /**
     * Stocker une valeur en cache
     */
    public static function put(string $keyPath, mixed $value, ?int $ttl = null): void
    {
        $key = self::get($keyPath);

        if ($ttl === null) {
            $group = explode('.', $keyPath)[0];
            $ttl = self::getTtl($group);
        }

        Cache::put($key, $value, $ttl);
    }

    /**
     * Obtenir toutes les clés d'un groupe d'invalidation
     */
    public static function getGroupKeys(string $group): array
    {
        return config("cache-keys.invalidation_groups.{$group}", []);
    }
}
