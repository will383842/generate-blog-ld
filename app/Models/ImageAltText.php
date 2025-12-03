<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ImageAltText extends Model
{
    use HasFactory;

    protected $fillable = [
        'image_id',
        'language_code',
        'alt_text',
        'title',
        'description',
    ];

    public function image(): BelongsTo
    {
        return $this->belongsTo(ImageLibrary::class, 'image_id');
    }

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class, 'language_code', 'code');
    }
}
