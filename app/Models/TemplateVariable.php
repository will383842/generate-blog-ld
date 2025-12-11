<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class TemplateVariable extends Model
{
    protected $fillable = [
        'key',
        'value',
        'type',
        'description',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    // Cache 1 heure
    const CACHE_TTL = 3600;
    const CACHE_KEY_ALL = 'template_variables.all';

    /**
     * Récupère toutes les variables actives (avec cache)
     */
    public static function getAllActive(): array
    {
        return Cache::remember(self::CACHE_KEY_ALL, self::CACHE_TTL, function () {
            return self::where('is_active', true)
                ->pluck('value', 'key')
                ->toArray();
        });
    }

    /**
     * Récupère une variable (avec cache)
     */
    public static function getValue(string $key, $default = null)
    {
        $cacheKey = "template_variable.{$key}";
        
        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($key, $default) {
            $variable = self::where('key', $key)
                ->where('is_active', true)
                ->first();
            
            return $variable ? $variable->value : $default;
        });
    }

    /**
     * Met à jour une variable et clear le cache
     */
    public static function updateVariable(string $key, $value): bool
    {
        $variable = self::where('key', $key)->first();
        
        if (!$variable) {
            return false;
        }

        $oldValue = $variable->value;
        $variable->update(['value' => $value]);
        
        // Clear cache
        self::clearCache($key);
        
        return true;
    }

    /**
     * Clear cache pour une variable ou toutes
     */
    public static function clearCache(?string $key = null): void
    {
        if ($key) {
            Cache::forget("template_variable.{$key}");
        }
        Cache::forget(self::CACHE_KEY_ALL);
    }

    /**
     * Formate la valeur selon le type
     */
    public function getFormattedValueAttribute()
    {
        return match($this->type) {
            'number' => (float) $this->value,
            'json' => json_decode($this->value, true),
            default => $this->value
        };
    }

    /**
     * Scope pour les variables actives
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
