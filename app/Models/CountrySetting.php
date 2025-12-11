<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CountrySetting extends Model
{
    protected $fillable = [
        'country_id', 'platform_id', 'priority', 'is_active', 
        'generation_frequency', 'auto_publish', 'seo_settings', 'content_settings'
    ];
    
    protected $casts = [
        'is_active' => 'boolean',
        'auto_publish' => 'boolean',
        'seo_settings' => 'array',
        'content_settings' => 'array',
    ];

    public const PRIORITY_LOW = 'low';
    public const PRIORITY_MEDIUM = 'medium';
    public const PRIORITY_HIGH = 'high';
    public const PRIORITY_CRITICAL = 'critical';

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    public function isHighPriority(): bool
    {
        return in_array($this->priority, [self::PRIORITY_HIGH, self::PRIORITY_CRITICAL]);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByPriority($query, string $priority)
    {
        return $query->where('priority', $priority);
    }
}
