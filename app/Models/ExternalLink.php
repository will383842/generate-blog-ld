<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExternalLink extends Model
{
    protected $fillable = [
        'article_id',
        'url',
        'anchor_text',
        'source',
        'is_affiliate',
    ];

    protected $casts = [
        'is_affiliate' => 'boolean',
    ];

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }
}