<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ThemeTranslation extends Model
{
    use HasFactory;

    protected $fillable = [
        'theme_id',
        'language_code',
        'name',
        'slug',
        'description',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function theme(): BelongsTo
    {
        return $this->belongsTo(Theme::class);
    }

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class, 'language_code', 'code');
    }
}
