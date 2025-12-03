<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IndexingQueue extends Model
{
    protected $table = 'indexing_queue';

    protected $fillable = [
        'article_id',
        'url',
        'type',
        'action',
        'status',
        'attempts',
        'response',
        'error_message',
        'processed_at',
    ];

    protected $casts = [
        'attempts' => 'integer',
        'processed_at' => 'datetime',
    ];

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    public function markAsProcessing(): void
    {
        $this->update([
            'status' => 'processing',
            'attempts' => $this->attempts + 1,
        ]);
    }

    public function markAsCompleted(?string $response = null): void
    {
        $this->update([
            'status' => 'completed',
            'response' => $response,
            'processed_at' => now(),
        ]);
    }

    public function markAsFailed(string $errorMessage): void
    {
        $this->update([
            'status' => 'failed',
            'error_message' => $errorMessage,
        ]);
    }
}