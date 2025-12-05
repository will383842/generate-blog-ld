<?php

namespace App\Models;

use App\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Model Country
 * 
 * Gère les 197 pays avec traductions en 9 langues.
 * 
 * Placement: app/Models/Country.php
 */
class Country extends Model
{
    use HasFactory, HasTranslations;

    /**
     * Les 9 langues supportées
     */
    protected static array $supportedLanguages = ['fr', 'en', 'de', 'es', 'pt', 'ru', 'zh', 'ar', 'hi'];

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
     * Attributs à ajouter lors de la sérialisation
     */
    protected $appends = ['name'];

    // =========================================================================
    // ACCESSEURS
    // =========================================================================

    /**
     * Accesseur pour 'name'
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

    public function scopeOrdered($query)
    {
        return $query->orderBy('priority')->orderBy('name_fr');
    }

    public function scopeInRegion($query, int $regionId)
    {
        return $query->where('region_id', $regionId);
    }

    /**
     * Scope pour chercher par slug dans n'importe quelle langue
     * 
     * Usage: Country::bySlug('allemagne')->first()
     *        Country::bySlug('germany')->first()
     *        Country::bySlug('deguo')->first()  // chinois
     */
    public function scopeBySlug($query, string $slug)
    {
        return $query->where(function ($q) use ($slug) {
            foreach (self::$supportedLanguages as $lang) {
                $q->orWhere("slug_{$lang}", $slug);
            }
        });
    }

    // =========================================================================
    // MÉTHODES STATIQUES
    // =========================================================================

    /**
     * Trouver un pays par son slug (dans n'importe quelle langue)
     * 
     * Usage: Country::findBySlug('allemagne')  // FR
     *        Country::findBySlug('germany')    // EN
     *        Country::findBySlug('deguo')      // ZH (pinyin)
     *        Country::findBySlug('almania')    // AR (translittéré)
     * 
     * @param string $slug Le slug à rechercher
     * @return Country|null
     */
    public static function findBySlug(string $slug): ?self
    {
        $slug = strtolower(trim($slug));
        
        foreach (self::$supportedLanguages as $lang) {
            $country = self::where("slug_{$lang}", $slug)->first();
            if ($country) {
                return $country;
            }
        }
        
        return null;
    }

    /**
     * Trouver un pays par son slug avec la langue détectée
     * 
     * Usage: [$country, $detectedLang] = Country::findBySlugWithLang('allemagne');
     *        // $country = Country model, $detectedLang = 'fr'
     * 
     * @param string $slug
     * @return array{0: Country|null, 1: string|null} [Country, langue]
     */
    public static function findBySlugWithLang(string $slug): array
    {
        $slug = strtolower(trim($slug));
        
        foreach (self::$supportedLanguages as $lang) {
            $country = self::where("slug_{$lang}", $slug)->first();
            if ($country) {
                return [$country, $lang];
            }
        }
        
        return [null, null];
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
     * Obtenir tous les slugs dans toutes les langues
     * 
     * Usage: $country->getAllSlugs()
     * Retourne: ['fr' => 'allemagne', 'en' => 'germany', 'de' => 'deutschland', ...]
     * 
     * @return array<string, string>
     */
    public function getAllSlugs(): array
    {
        $slugs = [];
        foreach (self::$supportedLanguages as $lang) {
            $slugs[$lang] = $this->getSlug($lang);
        }
        return $slugs;
    }

    /**
     * Obtenir tous les noms dans toutes les langues
     * 
     * @return array<string, string>
     */
    public function getAllNames(): array
    {
        $names = [];
        foreach (self::$supportedLanguages as $lang) {
            $names[$lang] = $this->getName($lang);
        }
        return $names;
    }

    /**
     * Obtenir le code ISO 3166-1 alpha-2 en majuscules
     * Utile pour les hreflang (fr-DE, en-DE, etc.)
     * 
     * @return string
     */
    public function getIsoCode(): string
    {
        return strtoupper($this->code);
    }

    /**
     * Obtenir le fuseau horaire par défaut
     */
    public function getTimezone(): string
    {
        return $this->timezone ?? 'UTC';
    }

    /**
     * Obtenir les langues supportées
     * 
     * @return array<string>
     */
    public static function getSupportedLanguages(): array
    {
        return self::$supportedLanguages;
    }
}