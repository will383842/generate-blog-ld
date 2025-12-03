<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CountryTranslation extends Model
{
    use HasFactory;

    protected $fillable = [
        'country_id',
        'language_code',
        'name',
        'name_in',
        'name_from',
        'adjective',
        'adjective_plural',
        'adjective_feminine',
        'adjective_feminine_plural',
        'slug',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class, 'language_code', 'code');
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Obtenir le nom avec préposition "en/au/aux"
     */
    public function getNameWithPreposition(): string
    {
        return $this->name_in ?? "en {$this->name}";
    }

    /**
     * Obtenir l'adjectif accordé
     */
    public function getAdjective(bool $plural = false, bool $feminine = false): string
    {
        if ($feminine && $plural) {
            return $this->adjective_feminine_plural ?? $this->adjective_plural ?? $this->adjective ?? '';
        }
        if ($feminine) {
            return $this->adjective_feminine ?? $this->adjective ?? '';
        }
        if ($plural) {
            return $this->adjective_plural ?? $this->adjective ?? '';
        }
        return $this->adjective ?? '';
    }
}
