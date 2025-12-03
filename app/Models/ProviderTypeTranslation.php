<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProviderTypeTranslation extends Model
{
    use HasFactory;

    protected $fillable = [
        'provider_type_id',
        'language_code',
        'singular',
        'plural',
        'article_singular',
        'article_plural',
        'slug',
        'description',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function providerType(): BelongsTo
    {
        return $this->belongsTo(ProviderType::class);
    }

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class, 'language_code', 'code');
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Obtenir le nom avec article
     */
    public function getWithArticle(bool $plural = false): string
    {
        if ($plural) {
            $article = $this->article_plural ?? '';
            $name = $this->plural ?? $this->singular;
        } else {
            $article = $this->article_singular ?? '';
            $name = $this->singular;
        }
        
        return trim("{$article} {$name}");
    }
}
