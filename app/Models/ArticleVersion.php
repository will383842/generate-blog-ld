<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArticleVersion extends Model
{
    use HasFactory;

    protected $fillable = [
        'article_id',
        'language_code',
        'version_number',
        'title',
        'content',
        'metadata',
        'change_summary',
        'created_by',
    ];

    protected $casts = [
        'version_number' => 'integer',
        'metadata' => 'array',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'created_by');
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeForLanguage($query, string $languageCode)
    {
        return $query->where('language_code', $languageCode);
    }

    public function scopeLatest($query)
    {
        return $query->orderByDesc('version_number');
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Créer une nouvelle version depuis une traduction
     */
    public static function createFromTranslation(ArticleTranslation $translation, ?string $changeSummary = null, ?int $createdBy = null): self
    {
        $lastVersion = self::where('article_id', $translation->article_id)
                          ->where('language_code', $translation->language_code)
                          ->max('version_number') ?? 0;

        return self::create([
            'article_id' => $translation->article_id,
            'language_code' => $translation->language_code,
            'version_number' => $lastVersion + 1,
            'title' => $translation->title,
            'content' => $translation->content,
            'metadata' => [
                'hook' => $translation->hook,
                'introduction' => $translation->introduction,
                'conclusion' => $translation->conclusion,
                'meta_title' => $translation->meta_title,
                'meta_description' => $translation->meta_description,
            ],
            'change_summary' => $changeSummary,
            'created_by' => $createdBy,
        ]);
    }
}
