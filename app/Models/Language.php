<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Language extends Model
{
    protected $fillable = [
        'code',
        'name',
        'native_name',
        'direction',
        'script',
        'flag',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    /**
     * Pays qui parlent cette langue
     */
    public function countries(): BelongsToMany
    {
        return $this->belongsToMany(Country::class, 'country_language')
            ->withPivot('is_primary', 'is_active')
            ->withTimestamps();
    }

    /**
     * Articles dans cette langue
     */
    public function articles(): HasMany
    {
        return $this->hasMany(Article::class);
    }

    /**
     * Traductions d'articles dans cette langue
     */
    public function articleTranslations(): HasMany
    {
        return $this->hasMany(ArticleTranslation::class);
    }
}