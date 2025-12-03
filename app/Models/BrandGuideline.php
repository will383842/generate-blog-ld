<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BrandGuideline extends Model
{
    protected $fillable = [
        'platform_id',
        'category',
        'rule_type',
        'description',
        'examples',
        'forbidden_terms',
        'preferred_terms',
        'severity',
        'is_active',
    ];

    protected $casts = [
        'examples' => 'array',
        'forbidden_terms' => 'array',
        'preferred_terms' => 'array',
        'severity' => 'integer',
        'is_active' => 'boolean',
    ];

    // Relations
    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    public function violations(): HasMany
    {
        return $this->hasMany(BrandViolation::class, 'guideline_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForPlatform($query, int $platformId)
    {
        return $query->where('platform_id', $platformId);
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }
}