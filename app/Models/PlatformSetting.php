<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlatformSetting extends Model
{
    protected $fillable = ['platform_id', 'key', 'value', 'type', 'description', 'is_public'];
    protected $casts = ['value' => 'array', 'is_public' => 'boolean'];

    public const TYPE_STRING = 'string';
    public const TYPE_NUMBER = 'number';
    public const TYPE_BOOLEAN = 'boolean';
    public const TYPE_JSON = 'json';
    public const TYPE_ARRAY = 'array';

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    public function scopeByKey($query, string $key)
    {
        return $query->where('key', $key);
    }

    public function scopeByPlatform($query, int $platformId)
    {
        return $query->where('platform_id', $platformId);
    }

    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }
}
