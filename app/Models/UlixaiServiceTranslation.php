<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UlixaiServiceTranslation extends Model
{
    use HasFactory;

    protected $fillable = [
        'ulixai_service_id',
        'language_code',
        'name',
        'slug',
        'description',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function ulixaiService(): BelongsTo
    {
        return $this->belongsTo(UlixaiService::class);
    }

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class, 'language_code', 'code');
    }
}
