<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Keyword extends Model
{
    use HasFactory;

    protected $fillable = [
        'platform_id',
        'language_id',
        'value',
        'slug',
        'search_volume',
        'difficulty',
        'cpc',
        'category',
        'priority',
        'is_active',
    ];

    protected $casts = [
        'platform_id' => 'integer',
        'language_id' => 'integer',
        'search_volume' => 'integer',
        'difficulty' => 'decimal:2',
        'cpc' => 'decimal:2',
        'priority' => 'integer',
        'is_active' => 'boolean',
    ];

    public function platform()
    {
        return $this->belongsTo(Platform::class);
    }

    public function language()
    {
        return $this->belongsTo(Language::class);
    }

    public function articles()
    {
        return $this->hasMany(Article::class, 'primary_keyword_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForPlatform($query, $platformId)
    {
        return $query->where('platform_id', $platformId);
    }

    public function scopeForLanguage($query, $languageId)
    {
        return $query->where('language_id', $languageId);
    }

    public function scopeByPriority($query)
    {
        return $query->orderBy('priority', 'desc');
    }
}