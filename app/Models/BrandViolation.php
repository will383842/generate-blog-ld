<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BrandViolation extends Model
{
    protected $fillable = [
        'article_id',
        'guideline_id',
        'violation_type',
        'context',
        'suggestion',
        'severity',
        'status',
    ];

    protected $casts = [
        'severity' => 'integer',
    ];

    // Relations
    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    public function guideline(): BelongsTo
    {
        return $this->belongsTo(BrandGuideline::class, 'guideline_id');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeFixed($query)
    {
        return $query->where('status', 'fixed');
    }

    public function scopeDismissed($query)
    {
        return $query->where('status', 'dismissed');
    }

    public function scopeHighSeverity($query, int $threshold = 70)
    {
        return $query->where('severity', '>=', $threshold);
    }

    // Methods
    public function markAsFixed(): void
    {
        $this->update(['status' => 'fixed']);
    }

    public function dismiss(): void
    {
        $this->update(['status' => 'dismissed']);
    }
}