<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlatformProviderType extends Model
{
    use HasFactory;

    protected $fillable = [
        'platform_id',
        'provider_type_id',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    public function providerType(): BelongsTo
    {
        return $this->belongsTo(ProviderType::class);
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }
}
