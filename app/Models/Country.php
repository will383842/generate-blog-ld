<?php

namespace App\Models;

use App\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Country extends Model
{
    use HasFactory, HasTranslations;

    protected $fillable = [
        'code',
        'code_alpha3',
        'name',
        'name_fr',
        'name_en',
        'name_de',
        'name_es',
        'name_pt',
        'name_ru',
        'name_zh',
        'name_ar',
        'name_hi',
        'slug_fr',
        'slug_en',
        'slug_de',
        'slug_es',
        'slug_pt',
        'slug_ru',
        'slug_zh',
        'slug_ar',
        'slug_hi',
        'region_id',
        'currency_id',
        'phone_code',
        'timezone',
        'flag_svg',
        'priority',
        'is_active',
    ];

    protected $casts = [
        'priority' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * ✅ AJOUT : Attributs à ajouter lors de la sérialisation
     */
    protected $appends = ['name'];

    // =========================================================================
    // ACCESSEURS
    // =========================================================================

    /**
     * ✅ AJOUT : Accesseur pour 'name'
     * Retourne le nom du pays dans la langue actuelle (défaut: français)
     */
    public function getNameAttribute(): string
    {
        // Si 'name' existe déjà dans les attributs bruts, le retourner
        if (isset($this->attributes['name']) && !empty($this->attributes['name'])) {
            return $this->attributes['name'];
        }

        // Sinon, utiliser la langue actuelle
        $locale = app()->getLocale() ?? 'fr';
        $field = "name_{$locale}";
        
        // Si le champ localisé existe, le retourner
        if (isset($this->attributes[$field]) && !empty($this->attributes[$field])) {
            return $this->attributes[$field];
        }
        
        // Sinon retourner name_fr par défaut
        return $this->attributes['name_fr'] ?? '';
    }

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function translations(): HasMany
    {
        return $this->hasMany(CountryTranslation::class);
    }

    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class);
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }

    public function languages(): BelongsToMany
    {
        return $this->belongsToMany(Language::class, 'country_language')
                    ->withPivot(['is_primary', 'is_active'])
                    ->withTimestamps();
    }

    public function articles(): HasMany
    {
        return $this->hasMany(Article::class);
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('priority')->orderBy('name_fr');
    }

    public function scopeInRegion($query, int $regionId)
    {
        return $query->where('region_id', $regionId);
    }

    // =========================================================================
    // HELPERS - TRADUCTIONS
    // =========================================================================

    /**
     * Obtenir le nom traduit
     */
    public function getName(string $languageCode = 'fr'): string
    {
        $column = "name_{$languageCode}";
        return $this->$column ?? $this->name_fr ?? $this->name ?? '';
    }

    /**
     * Obtenir le nom avec préposition (en France, au Japon, aux États-Unis)
     */
    public function getNameIn(string $languageCode = 'fr'): string
    {
        return $this->translated('name_in', $languageCode, "en {$this->getName($languageCode)}");
    }

    /**
     * Obtenir le nom avec préposition "de/d'/du/des"
     */
    public function getNameFrom(string $languageCode = 'fr'): string
    {
        return $this->translated('name_from', $languageCode, "de {$this->getName($languageCode)}");
    }

    /**
     * Obtenir l'adjectif (français, japonais)
     */
    public function getAdjective(string $languageCode = 'fr', bool $plural = false, bool $feminine = false): string
    {
        $translation = $this->getTranslation($languageCode);
        
        if (!$translation) {
            return '';
        }

        if ($feminine && $plural && $translation->adjective_feminine_plural) {
            return $translation->adjective_feminine_plural;
        }
        if ($feminine && $translation->adjective_feminine) {
            return $translation->adjective_feminine;
        }
        if ($plural && $translation->adjective_plural) {
            return $translation->adjective_plural;
        }
        
        return $translation->adjective ?? '';
    }

    /**
     * Obtenir le slug traduit
     */
    public function getSlug(string $languageCode = 'fr'): string
    {
        $column = "slug_{$languageCode}";
        return $this->$column ?? strtolower($this->code);
    }

    /**
     * Obtenir le fuseau horaire par défaut
     */
    public function getTimezone(): string
    {
        return $this->timezone ?? 'UTC';
    }
}