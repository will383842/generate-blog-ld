<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WordConfig extends Model
{
    protected $fillable = [
        'platform_id',
        'content_type',
        'template_path',
        'styles',
        'fonts'
    ];

    protected $casts = [
        'styles' => 'array',
        'fonts' => 'array'
    ];

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }
}