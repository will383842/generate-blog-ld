<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TitleTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'template',
        'type',
        'platform_id',
        'theme_type',
        'content_type',
        'variables',
        'weight',
        'is_active',
        'usage_count',
        'language_code',  // ✅ AJOUTÉ
    ];

    protected $casts = [
        'variables' => 'array',
        'weight' => 'integer',
        'is_active' => 'boolean',
        'usage_count' => 'integer',
    ];

    // =========================================================================
    // CONSTANTES
    // =========================================================================

    const TYPE_ARTICLE = 'article';
    const TYPE_LANDING = 'landing';

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForPlatform($query, int $platformId)
    {
        return $query->where('platform_id', $platformId);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeForThemeType($query, string $themeType)
    {
        return $query->where('theme_type', $themeType);
    }

    public function scopeForContentType($query, string $contentType)
    {
        return $query->where('content_type', $contentType);
    }

    public function scopeOrderedByWeight($query)
    {
        return $query->orderByDesc('weight');
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    public function incrementUsage(): void
    {
        $this->increment('usage_count');
    }

    /**
     * Génère un titre en remplaçant les variables
     */
    public function generate(array $data): string
    {
        $title = $this->template;
        
        foreach ($data as $key => $value) {
            $title = str_replace("{{{$key}}}", $value, $title);
            $title = str_replace("{{" . $key . "}}", $value, $title);
        }
        
        return $title;
    }

    /**
     * Vérifie si toutes les variables requises sont présentes
     */
    public function hasAllVariables(array $data): bool
    {
        if (empty($this->variables)) {
            return true;
        }

        foreach ($this->variables as $variable) {
            if (!isset($data[$variable])) {
                return false;
            }
        }

        return true;
    }
}