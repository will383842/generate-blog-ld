<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * ✅ CORRECTION BUG #1: Model traductions Dossiers
 */
class PressDossierTranslation extends Model
{
    protected $fillable = [
        'press_dossier_id',
        'language_code',
        'title',
        'slug',
        'description',
        'meta_title',
        'meta_description',
        'keywords',
        'translation_status',
        'word_count',
    ];

    protected $casts = [
        'keywords' => 'array',
        'word_count' => 'integer',
    ];

    /**
     * Relations
     */
    public function pressDossier(): BelongsTo
    {
        return $this->belongsTo(PressDossier::class, 'press_dossier_id');
    }

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class, 'language_code', 'code');
    }

    /**
     * Generate slug
     */
    public function generateSlug(string $title): string
    {
        $slug = Str::slug($title);
        $count = 1;

        while (self::where('slug', $slug)
                  ->where('id', '!=', $this->id ?? 0)
                  ->exists()) {
            $slug = Str::slug($title) . '-' . $count;
            $count++;
        }

        return $slug;
    }

    /**
     * Calculate word count
     */
    public function calculateWordCount(): int
    {
        $content = $this->title . ' ' . $this->description;
        return str_word_count(strip_tags($content));
    }

    /**
     * Boot
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($translation) {
            if (empty($translation->slug)) {
                $translation->slug = $translation->generateSlug($translation->title);
            }
            
            if ($translation->word_count === 0) {
                $translation->word_count = $translation->calculateWordCount();
            }
        });

        static::updating(function ($translation) {
            if ($translation->isDirty('title')) {
                $translation->slug = $translation->generateSlug($translation->title);
            }
            
            if ($translation->isDirty(['title', 'description'])) {
                $translation->word_count = $translation->calculateWordCount();
            }
        });
    }
}
