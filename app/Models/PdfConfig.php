<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PdfConfig extends Model
{
    protected $fillable = [
        'platform_id',
        'content_type',
        'logo_path',
        'header_template',
        'footer_template',
        'fonts',
        'colors'
    ];

    protected $casts = [
        'fonts' => 'array',
        'colors' => 'array'
    ];

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }
}