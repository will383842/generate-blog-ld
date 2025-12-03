<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArticleSource extends Model
{
    protected $fillable = [
        'article_id',
        'url',
        'title',
        'domain',
        'snippet',
        'source_type',
        'relevance_score',
    ];

    protected $casts = [
        'relevance_score' => 'integer',
    ];

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }
}