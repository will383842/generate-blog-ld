<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ImageGeneration extends Model
{
    use HasFactory;

    protected $fillable = [
        'image_id',
        'article_id',
        'prompt',
        'revised_prompt',
        'model',
        'size',
        'quality',
        'style',
        'cost',
        'status',
        'error_message',
    ];

    protected $casts = [
        'cost' => 'float',
    ];

    public function image(): BelongsTo
    {
        return $this->belongsTo(ImageLibrary::class, 'image_id');
    }

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function markAsCompleted(int $imageId): void
    {
        $this->update([
            'status' => 'completed',
            'image_id' => $imageId,
        ]);
    }

    public function markAsFailed(string $error): void
    {
        $this->update([
            'status' => 'failed',
            'error_message' => $error,
        ]);
    }
}
