<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ArticleTranslation extends Model
{
    protected $fillable = [
        'article_id',
        'language_id',
        'title',
        'slug',
        'excerpt',
        'content',
        'meta_title',
        'meta_description',
        'canonical_url',
        'json_ld',
        'image_alt',
        'status',
        'translation_cost',
    ];

    protected $casts = [
        'json_ld' => 'array',
        'translation_cost' => 'decimal:4',
    ];

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class);
    }

    public function faqs(): HasMany
    {
        return $this->article->faqs()->where('language_id', $this->language_id);
    }
}