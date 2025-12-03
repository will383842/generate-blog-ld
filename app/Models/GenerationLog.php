<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GenerationLog extends Model
{
    protected $fillable = [
        'batch_uuid',
        'article_id',
        'type',
        'status',
        'message',
        'metadata',
        'cost',
        'duration_ms',
    ];

    protected $casts = [
        'metadata' => 'array',
        'cost' => 'decimal:4',
        'duration_ms' => 'integer',
    ];

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    public static function start(string $type, ?string $batchUuid = null, ?int $articleId = null): static
    {
        return static::create([
            'batch_uuid' => $batchUuid,
            'article_id' => $articleId,
            'type' => $type,
            'status' => 'started',
        ]);
    }

    public function complete(float $cost = 0, ?array $metadata = null): void
    {
        $this->update([
            'status' => 'completed',
            'cost' => $cost,
            'metadata' => $metadata,
            'duration_ms' => now()->diffInMilliseconds($this->created_at),
        ]);
    }

    public function fail(string $message, ?array $metadata = null): void
    {
        $this->update([
            'status' => 'failed',
            'message' => $message,
            'metadata' => $metadata,
            'duration_ms' => now()->diffInMilliseconds($this->created_at),
        ]);
    }
}