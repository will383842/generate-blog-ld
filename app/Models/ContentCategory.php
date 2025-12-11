<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContentCategory extends Model
{
    protected $fillable = [
        'code',
        'name_translations',
        'description',
        'target_audience',
        'icon',
        'color',
        'is_active',
        'sort_order'
    ];

    protected $casts = [
        'name_translations' => 'array',
        'is_active' => 'boolean',
        'sort_order' => 'integer'
    ];

    public function articles(): HasMany
    {
        return $this->hasMany(Article::class, 'category_id');
    }

    public function generationRequests(): HasMany
    {
        return $this->hasMany(GenerationRequest::class, 'category_id');
    }

    /**
     * Obtient le nom traduit
     */
    public function getTranslatedName(string $locale = 'fr'): string
    {
        return $this->name_translations[$locale] ?? $this->name_translations['fr'] ?? $this->code;
    }

    /**
     * Scope actif
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)->orderBy('sort_order');
    }
}
