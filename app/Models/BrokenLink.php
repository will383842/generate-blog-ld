<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BrokenLink extends Model
{
    use HasFactory;

    protected $fillable = [
        'article_id',
        'platform_id',
        'url',
        'link_type',
        'http_status',
        'error_message',
        'status',
        'detected_at',
        'fixed_at',
    ];

    protected $casts = [
        'http_status' => 'integer',
        'detected_at' => 'datetime',
        'fixed_at' => 'datetime',
    ];

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    public function scopeDetected($query)
    {
        return $query->where('status', 'detected');
    }

    public function scopeFixed($query)
    {
        return $query->where('status', 'fixed');
    }

    public function markAsFixed(): void
    {
        $this->update([
            'status' => 'fixed',
            'fixed_at' => now(),
        ]);
    }

    public function markAsIgnored(): void
    {
        $this->update(['status' => 'ignored']);
    }
}
