<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LawyerSpecialtyTranslation extends Model
{
    use HasFactory;

    protected $fillable = [
        'lawyer_specialty_id',
        'language_code',
        'name',
        'slug',
        'description',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function lawyerSpecialty(): BelongsTo
    {
        return $this->belongsTo(LawyerSpecialty::class);
    }

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class, 'language_code', 'code');
    }
}
