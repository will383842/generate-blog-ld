<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TestimonialTranslation extends Model
{
    use HasFactory;

    protected $fillable = [
        'testimonial_id',
        'language_code',
        'quote',
        'service_used',
        'is_auto_translated',
    ];

    protected $casts = [
        'is_auto_translated' => 'boolean',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function testimonial(): BelongsTo
    {
        return $this->belongsTo(Testimonial::class);
    }

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class, 'language_code', 'code');
    }
}
