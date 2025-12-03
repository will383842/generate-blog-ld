<?php

namespace App\Models;

use App\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UlixaiService extends Model
{
    use HasFactory, HasTranslations;

    protected $fillable = [
        'code',
        'slug',
        'name_fr',
        'name_en',
        'name_es',
        'name_de',
        'name_pt',
        'name_ru',
        'name_zh',
        'name_ar',
        'name_hi',
        'description_fr',
        'description_en',
        'parent_id',
        'level',
        'icon',
        'order',
        'is_active',
    ];

    protected $casts = [
        'level' => 'integer',
        'order' => 'integer',
        'is_active' => 'boolean',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function translations(): HasMany
    {
        return $this->hasMany(UlixaiServiceTranslation::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(UlixaiService::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(UlixaiService::class, 'parent_id');
    }

    public function articles(): HasMany
    {
        return $this->hasMany(Article::class, 'service_id');
    }

    public function testimonials(): HasMany
    {
        return $this->hasMany(Testimonial::class, 'service_id');
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
        return $query->orderBy('order')->orderBy('name_fr');
    }

    public function scopeRoots($query)
    {
        return $query->whereNull('parent_id');
    }

    public function scopeLevel($query, int $level)
    {
        return $query->where('level', $level);
    }

    public function scopeByCode($query, string $code)
    {
        return $query->where('code', $code);
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    public function getName(string $languageCode = 'fr'): string
    {
        $column = "name_{$languageCode}";
        if ($this->$column) {
            return $this->$column;
        }
        return $this->translated('name', $languageCode, $this->name_fr);
    }

    public function getSlug(string $languageCode = 'fr'): string
    {
        return $this->translated('slug', $languageCode, $this->slug);
    }

    public function getDescription(string $languageCode = 'fr'): ?string
    {
        $column = "description_{$languageCode}";
        if (in_array($languageCode, ['fr', 'en']) && $this->$column) {
            return $this->$column;
        }
        return $this->translated('description', $languageCode);
    }

    /**
     * Obtenir le chemin complet (parent > sous-catégorie > service)
     */
    public function getFullPath(string $languageCode = 'fr', string $separator = ' > '): string
    {
        $path = [$this->getName($languageCode)];
        $parent = $this->parent;
        
        while ($parent) {
            array_unshift($path, $parent->getName($languageCode));
            $parent = $parent->parent;
        }
        
        return implode($separator, $path);
    }

    /**
     * Obtenir tous les ancêtres
     */
    public function getAncestors(): array
    {
        $ancestors = [];
        $parent = $this->parent;
        
        while ($parent) {
            array_unshift($ancestors, $parent);
            $parent = $parent->parent;
        }
        
        return $ancestors;
    }

    /**
     * Obtenir tous les descendants (récursif)
     */
    public function getAllDescendants(): \Illuminate\Support\Collection
    {
        $descendants = collect();
        
        foreach ($this->children as $child) {
            $descendants->push($child);
            $descendants = $descendants->merge($child->getAllDescendants());
        }
        
        return $descendants;
    }

    /**
     * Vérifier si c'est un service racine
     */
    public function isRoot(): bool
    {
        return is_null($this->parent_id);
    }

    /**
     * Vérifier si c'est une feuille (pas d'enfants)
     */
    public function isLeaf(): bool
    {
        return $this->children->isEmpty();
    }
}