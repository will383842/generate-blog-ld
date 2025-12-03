<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuthorTranslation extends Model
{
    use HasFactory;

    protected $fillable = [
        'author_id',
        'language_code',
        'bio',
        'job_title',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function author(): BelongsTo
    {
        return $this->belongsTo(Author::class);
    }

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class, 'language_code', 'code');
    }
}
