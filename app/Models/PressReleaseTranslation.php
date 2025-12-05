<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * ✅ CORRECTION BUG #1: Model traductions Press Release
 */
class PressReleaseTranslation extends Model
{
    protected $fillable = [
        'press_release_id',
        'language_code',
        'title',
        'slug',
        'lead',
        'body1',
        'body2',
        'body3',
        'boilerplate',
        'meta_title',
        'meta_description',
        'keywords',
        'contact_name',
        'contact_title',
        'contact_phone',
        'contact_email',
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
    public function pressRelease(): BelongsTo
    {
        return $this->belongsTo(PressRelease::class);
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
        $content = $this->lead . ' ' . 
                   $this->body1 . ' ' . 
                   $this->body2 . ' ' . 
                   $this->body3;
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
            
            if ($translation->isDirty(['lead', 'body1', 'body2', 'body3'])) {
                $translation->word_count = $translation->calculateWordCount();
            }
        });
    }
}
