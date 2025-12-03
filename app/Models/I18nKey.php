<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class I18nKey extends Model
{
    use HasFactory;

    protected $table = 'i18n_keys';

    protected $fillable = [
        'key_name',
        'category',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function translations(): HasMany
    {
        return $this->hasMany(I18nTranslation::class, 'i18n_key_id');
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeInCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Obtenir la traduction pour une langue
     */
    public function getTranslation(string $languageCode): ?string
    {
        $translation = $this->translations->where('language_code', $languageCode)->first();
        return $translation?->value;
    }

    /**
     * Obtenir toutes les traductions indexées par langue
     */
    public function getAllTranslations(): array
    {
        return $this->translations->pluck('value', 'language_code')->toArray();
    }
}
