<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PromptTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'name',
        'type',
        'theme_id',
        'language_code',
        'system_prompt',
        'user_prompt',
        'variables',
        'config',
        'model',
        'max_tokens',
        'temperature',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'variables' => 'array',
        'config' => 'array',
        'max_tokens' => 'integer',
        'temperature' => 'float',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function theme(): BelongsTo
    {
        return $this->belongsTo(Theme::class);
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeForTheme($query, int $themeId)
    {
        return $query->where('theme_id', $themeId);
    }

    public function scopeForLanguage($query, string $languageCode)
    {
        return $query->where('language_code', $languageCode);
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Remplacer les variables dans le prompt
     */
    public function buildPrompt(array $variables): string
    {
        $prompt = $this->user_prompt;
        
        foreach ($variables as $key => $value) {
            $prompt = str_replace("{{$key}}", $value, $prompt);
        }
        
        return $prompt;
    }

    /**
     * Obtenir la liste des variables disponibles
     */
    public function getAvailableVariables(): array
    {
        preg_match_all('/\{(\w+)\}/', $this->user_prompt, $matches);
        return $matches[1] ?? [];
    }
}
