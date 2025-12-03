<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExpatDomainTranslation extends Model
{
    use HasFactory;

    protected $fillable = [
        'expat_domain_id',
        'language_code',
        'name',
        'slug',
        'description',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function expatDomain(): BelongsTo
    {
        return $this->belongsTo(ExpatDomain::class);
    }

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class, 'language_code', 'code');
    }
}
