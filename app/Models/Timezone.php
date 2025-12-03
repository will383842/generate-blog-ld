<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Timezone extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'offset_utc',
        'offset_minutes',
        'abbreviation',
        'is_active',
    ];

    protected $casts = [
        'offset_minutes' => 'integer',
        'is_active' => 'boolean',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function countries(): HasMany
    {
        return $this->hasMany(Country::class, 'timezone_default', 'name');
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    public function getFormattedOffset(): string
    {
        return "UTC{$this->offset_utc}";
    }
}
