<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BrandSection extends Model
{
    protected $fillable = ['platform_id', 'section', 'content', 'language', 'is_active'];
    protected $casts = ['content' => 'array', 'is_active' => 'boolean'];

    public const SECTIONS = [
        'about' => 'À propos',
        'mission' => 'Mission',
        'values' => 'Valeurs',
        'team' => 'Équipe',
        'history' => 'Histoire',
        'partners' => 'Partenaires',
        'press' => 'Presse',
        'contact' => 'Contact',
        'legal' => 'Mentions légales',
        'privacy' => 'Confidentialité',
        'terms' => 'CGU',
    ];

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    public function scopeBySection($query, string $section)
    {
        return $query->where('section', $section);
    }

    public function scopeByPlatform($query, int $platformId)
    {
        return $query->where('platform_id', $platformId);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
