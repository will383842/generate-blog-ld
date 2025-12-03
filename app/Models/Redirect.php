<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Redirect extends Model
{
    use HasFactory;

    protected $fillable = [
        'platform_id',
        'from_url',
        'to_url',
        'type',
        'hit_count',
        'last_hit_at',
        'is_active',
    ];

    protected $casts = [
        'hit_count' => 'integer',
        'last_hit_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function recordHit(): void
    {
        $this->update([
            'hit_count' => $this->hit_count + 1,
            'last_hit_at' => now(),
        ]);
    }
}
