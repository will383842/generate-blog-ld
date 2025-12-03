<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CtaTemplate extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'type',
        'platform_id',
        // Content 9 langues
        'content_fr',
        'content_en',
        'content_es',
        'content_de',
        'content_pt',
        'content_ru',
        'content_zh',
        'content_ar',
        'content_hi',
        // Button text 9 langues
        'button_text_fr',
        'button_text_en',
        'button_text_es',
        'button_text_de',
        'button_text_pt',
        'button_text_ru',
        'button_text_zh',
        'button_text_ar',
        'button_text_hi',
        // Autres
        'button_url',
        'style',
        'is_active',
        'usage_count',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'usage_count' => 'integer',
    ];

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    public function getContentByLocale(string $locale): string
    {
        $column = "content_{$locale}";
        return $this->$column ?? $this->content_en;
    }

    public function getButtonTextByLocale(string $locale): ?string
    {
        $column = "button_text_{$locale}";
        return $this->$column ?? $this->button_text_en;
    }

    public function incrementUsage(): void
    {
        $this->increment('usage_count');
    }
}