<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PublicationQueue extends Model
{
    use HasFactory;

    protected $table = 'publication_queue';

    protected $fillable = [
        'article_id',
        'platform_id',
        'priority',
        'status',
        'scheduled_at',
        'published_at',
        'attempts',
        'max_attempts',
        'error_message',
        'metadata',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'published_at' => 'datetime',
        'attempts' => 'integer',
        'max_attempts' => 'integer',
        'metadata' => 'array',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeScheduled($query)
    {
        return $query->where('status', 'scheduled');
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopeReadyToPublish($query)
    {
        return $query->where('status', 'scheduled')
                     ->where('scheduled_at', '<=', now());
    }

    public function scopeByPriority($query)
    {
        return $query->orderByRaw("FIELD(priority, 'high', 'default', 'low')")
                     ->orderBy('scheduled_at');
    }

    public function scopeForPlatform($query, int $platformId)
    {
        return $query->where('platform_id', $platformId);
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    public function markAsScheduled(\Carbon\Carbon $scheduledAt): void
    {
        $this->update([
            'status' => 'scheduled',
            'scheduled_at' => $scheduledAt,
        ]);
    }

    public function markAsPublishing(): void
    {
        $this->update([
            'status' => 'publishing',
            'attempts' => $this->attempts + 1,
        ]);
    }

    public function markAsPublished(): void
    {
        $this->update([
            'status' => 'published',
            'published_at' => now(),
            'error_message' => null,
        ]);
    }

    public function markAsFailed(string $error): void
    {
        $this->update([
            'status' => $this->attempts >= $this->max_attempts ? 'failed' : 'pending',
            'error_message' => $error,
        ]);
    }

    public function markAsCancelled(): void
    {
        $this->update(['status' => 'cancelled']);
    }

    public function canRetry(): bool
    {
        return $this->attempts < $this->max_attempts;
    }

    public function setPriority(string $priority): void
    {
        $this->update(['priority' => $priority]);
    }
}
