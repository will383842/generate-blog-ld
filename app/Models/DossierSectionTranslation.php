<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ✅ CORRECTION BUG #1: Model traductions Sections Dossiers
 */
class DossierSectionTranslation extends Model
{
    protected $fillable = [
        'dossier_section_id',
        'language_code',
        'title',
        'content',
        'translation_status',
        'word_count',
    ];

    protected $casts = [
        'word_count' => 'integer',
    ];

    /**
     * Relations
     */
    public function dossierSection(): BelongsTo
    {
        return $this->belongsTo(DossierSection::class);
    }

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class, 'language_code', 'code');
    }

    /**
     * Calculate word count
     */
    public function calculateWordCount(): int
    {
        $content = $this->title . ' ' . $this->content;
        return str_word_count(strip_tags($content));
    }

    /**
     * Boot
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($translation) {
            if ($translation->word_count === 0) {
                $translation->word_count = $translation->calculateWordCount();
            }
        });

        static::updating(function ($translation) {
            if ($translation->isDirty(['title', 'content'])) {
                $translation->word_count = $translation->calculateWordCount();
            }
        });
    }
}
