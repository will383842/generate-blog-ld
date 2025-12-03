<?php

namespace App\Traits;

trait HasTranslations
{
    /**
     * Boot the trait
     */
    public static function bootHasTranslations(): void
    {
        static::deleting(function ($model) {
            if (method_exists($model, 'translations')) {
                $model->translations()->delete();
            }
        });
    }

    /**
     * Get translation for a specific language
     */
    public function getTranslation(string $languageCode): ?object
    {
        return $this->translations->where('language_code', $languageCode)->first();
    }

    /**
     * Get translated attribute
     */
    public function translated(string $attribute, string $languageCode, ?string $fallback = null): ?string
    {
        $translation = $this->getTranslation($languageCode);
        
        if ($translation && isset($translation->{$attribute})) {
            return $translation->{$attribute};
        }
        
        if ($languageCode !== 'fr') {
            $frTranslation = $this->getTranslation('fr');
            if ($frTranslation && isset($frTranslation->{$attribute})) {
                return $frTranslation->{$attribute};
            }
        }
        
        return $fallback;
    }

    /**
     * Get all translations as array
     */
    public function getAllTranslations(): array
    {
        return $this->translations->keyBy('language_code')->toArray();
    }

    /**
     * Check if translation exists
     */
    public function hasTranslation(string $languageCode): bool
    {
        return $this->translations->where('language_code', $languageCode)->isNotEmpty();
    }

    /**
     * Get missing languages
     */
    public function getMissingLanguages(array $allLanguages = ['fr', 'en', 'de', 'es', 'pt', 'ru', 'zh', 'ar', 'hi']): array
    {
        $existing = $this->translations->pluck('language_code')->toArray();
        return array_diff($allLanguages, $existing);
    }

    /**
     * Scope with translations
     */
    public function scopeWithTranslations($query, ?string $languageCode = null)
    {
        if ($languageCode) {
            return $query->with(['translations' => fn($q) => $q->where('language_code', $languageCode)]);
        }
        return $query->with('translations');
    }
}
