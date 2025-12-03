<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class I18nTranslation extends Model
{
    use HasFactory;

    protected $table = 'i18n_translations';

    protected $fillable = [
        'i18n_key_id',
        'language_code',
        'value',
        'is_auto_translated',
        'is_reviewed',
        'reviewed_at',
        'reviewed_by',
    ];

    protected $casts = [
        'is_auto_translated' => 'boolean',
        'is_reviewed' => 'boolean',
        'reviewed_at' => 'datetime',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function key(): BelongsTo
    {
        return $this->belongsTo(I18nKey::class, 'i18n_key_id');
    }

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class, 'language_code', 'code');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'reviewed_by');
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeForLanguage($query, string $languageCode)
    {
        return $query->where('language_code', $languageCode);
    }

    public function scopeNeedsReview($query)
    {
        return $query->where('is_auto_translated', true)
                     ->where('is_reviewed', false);
    }
}
