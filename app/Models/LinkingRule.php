<?php

namespace App\Models;

use App\Models\Platform;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;

class LinkingRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'platform_id',
        'language_code',
        'min_internal_links',
        'max_internal_links',
        'min_external_links',
        'max_external_links',
        'max_affiliate_per_article',
        'max_links_per_paragraph',
        'exclude_intro',
        'exclude_conclusion',
        'allowed_anchor_types',
        'anchor_distribution',
        'external_source_priority',
        'min_authority_score',
        'enable_pillar_linking',
        'enable_affiliate_injection',
        'enable_auto_discovery',
        'custom_rules',
        'is_active',
    ];

    protected $casts = [
        'min_internal_links' => 'integer',
        'max_internal_links' => 'integer',
        'min_external_links' => 'integer',
        'max_external_links' => 'integer',
        'max_affiliate_per_article' => 'integer',
        'max_links_per_paragraph' => 'integer',
        'exclude_intro' => 'boolean',
        'exclude_conclusion' => 'boolean',
        'allowed_anchor_types' => 'array',
        'anchor_distribution' => 'array',
        'external_source_priority' => 'array',
        'min_authority_score' => 'integer',
        'enable_pillar_linking' => 'boolean',
        'enable_affiliate_injection' => 'boolean',
        'enable_auto_discovery' => 'boolean',
        'custom_rules' => 'array',
        'is_active' => 'boolean',
    ];

    protected $attributes = [
        'min_internal_links' => 5,
        'max_internal_links' => 12,
        'min_external_links' => 2,
        'max_external_links' => 5,
        'max_affiliate_per_article' => 3,
        'max_links_per_paragraph' => 1,
        'exclude_intro' => true,
        'exclude_conclusion' => true,
        'min_authority_score' => 60,
        'enable_pillar_linking' => true,
        'enable_affiliate_injection' => true,
        'enable_auto_discovery' => true,
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
     * Récupère les règles pour une plateforme (avec cache)
     */
    public static function forPlatform(int $platformId, ?string $languageCode = null): ?self
    {
        $cacheKey = "linking_rules:{$platformId}:" . ($languageCode ?? 'default');

        return Cache::remember($cacheKey, now()->addHours(1), function () use ($platformId, $languageCode) {
            $query = self::where('platform_id', $platformId)
                ->where('is_active', true);

            if ($languageCode) {
                $query->where(function ($q) use ($languageCode) {
                    $q->where('language_code', $languageCode)
                        ->orWhereNull('language_code');
                })
                ->orderByRaw('language_code IS NULL ASC');
            }

            return $query->first();
        });
    }

    /**
     * Récupère les règles actives
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Récupère les règles pour une langue
     */
    public function scopeForLanguage($query, ?string $languageCode)
    {
        if ($languageCode) {
            return $query->where(function ($q) use ($languageCode) {
                $q->where('language_code', $languageCode)
                    ->orWhereNull('language_code');
            });
        }
        return $query->whereNull('language_code');
    }

    /**
     * Vérifie si un type d'ancre est autorisé
     */
    public function isAnchorTypeAllowed(string $type): bool
    {
        if (empty($this->allowed_anchor_types)) {
            return true; // Tous autorisés par défaut
        }

        return in_array($type, $this->allowed_anchor_types);
    }

    /**
     * Récupère la distribution d'anchors
     */
    public function getAnchorDistribution(): array
    {
        if (!empty($this->anchor_distribution)) {
            return $this->anchor_distribution;
        }

        return config('linking.internal.anchor_distribution', [
            'exact_match' => 30,
            'long_tail' => 25,
            'generic' => 20,
            'cta' => 15,
            'question' => 10,
        ]);
    }

    /**
     * Récupère la priorité des sources externes
     */
    public function getExternalSourcePriority(): array
    {
        if (!empty($this->external_source_priority)) {
            return $this->external_source_priority;
        }

        return config('linking.external.source_priority', [
            'government',
            'organization',
            'reference',
            'news',
            'authority',
        ]);
    }

    /**
     * Valide une configuration
     */
    public function validate(): array
    {
        $errors = [];

        if ($this->min_internal_links > $this->max_internal_links) {
            $errors[] = 'min_internal_links cannot be greater than max_internal_links';
        }

        if ($this->min_external_links > $this->max_external_links) {
            $errors[] = 'min_external_links cannot be greater than max_external_links';
        }

        if ($this->min_authority_score < 0 || $this->min_authority_score > 100) {
            $errors[] = 'min_authority_score must be between 0 and 100';
        }

        if ($this->max_links_per_paragraph < 1) {
            $errors[] = 'max_links_per_paragraph must be at least 1';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Invalide le cache des règles
     */
    public static function clearCache(int $platformId): void
    {
        Cache::forget("linking_rules:{$platformId}:default");
        
        $languages = ['fr', 'en', 'es', 'de', 'pt', 'ru', 'zh', 'ar', 'hi'];
        foreach ($languages as $lang) {
            Cache::forget("linking_rules:{$platformId}:{$lang}");
        }
    }

    /**
     * Boot du model
     */
    protected static function boot()
    {
        parent::boot();

        static::saved(function ($rule) {
            self::clearCache($rule->platform_id);
        });

        static::deleted(function ($rule) {
            self::clearCache($rule->platform_id);
        });
    }
}
