<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class PlatformKnowledge extends Model
{
    use HasFactory;

    protected $table = 'platform_knowledge';

    /**
     * Champs mass-assignables
     */
    protected $fillable = [
        'platform_id',
        'knowledge_type',
        'title',
        'content',
        'language_code',
        'priority',
        'is_active',
        'use_in_articles',
        'use_in_landings',
        'use_in_comparatives',
        'use_in_pillars',
        'use_in_press',
    ];

    /**
     * Casts
     */
    protected $casts = [
        'priority' => 'integer',
        'is_active' => 'boolean',
        'use_in_articles' => 'boolean',
        'use_in_landings' => 'boolean',
        'use_in_comparatives' => 'boolean',
        'use_in_pillars' => 'boolean',
        'use_in_press' => 'boolean',
    ];

    /**
     * Types de connaissance disponibles
     * 🆕 PHASE 12 : Ajout de 5 nouveaux types (grammar, formatting, headlines, cta, storytelling)
     */
    public const TYPES = [
        'about' => 'À propos',
        'services' => 'Services',
        'values' => 'Valeurs',
        'tone' => 'Ton de communication',
        'style' => 'Style rédactionnel',
        'facts' => 'Faits et chiffres',
        'differentiators' => 'Différenciateurs',
        'vocabulary' => 'Vocabulaire',
        'examples' => 'Exemples',
        'donts' => 'À éviter',
        'grammar' => 'Grammaire',           // 🆕 PHASE 12
        'formatting' => 'Formatage',         // 🆕 PHASE 12
        'headlines' => 'Titres',             // 🆕 PHASE 12
        'cta' => 'Appels à action',          // 🆕 PHASE 12
        'storytelling' => 'Storytelling',    // 🆕 PHASE 12
    ];

    /**
     * Ordre de priorité des types pour injection dans prompts
     * 🆕 PHASE 12 : Ordre mis à jour avec les 5 nouveaux types
     */
    public const TYPE_PRIORITY_ORDER = [
        'facts',
        'about',
        'services',
        'differentiators',
        'tone',
        'style',
        'grammar',        // 🆕 PHASE 12
        'formatting',     // 🆕 PHASE 12
        'vocabulary',
        'examples',
        'headlines',      // 🆕 PHASE 12
        'cta',            // 🆕 PHASE 12
        'storytelling',   // 🆕 PHASE 12
        'donts',
        'values',
    ];

    /**
     * Relation vers Platform
     */
    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    /**
     * Relation vers les traductions
     */
    public function translations(): HasMany
    {
        return $this->hasMany(PlatformKnowledgeTranslation::class, 'knowledge_id');
    }

    /**
     * Scope: Seulement les entrées actives
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: Filtrer par type de connaissance
     */
    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('knowledge_type', $type);
    }

    /**
     * Scope: Filtrer par langue
     */
    public function scopeByLanguage(Builder $query, string $languageCode): Builder
    {
        return $query->where('language_code', $languageCode);
    }

    /**
     * Scope: Filtrer par type de contenu (articles, landings, etc.)
     */
    public function scopeForContentType(Builder $query, string $contentType): Builder
    {
        $columnMap = [
            'articles' => 'use_in_articles',
            'landings' => 'use_in_landings',
            'comparatives' => 'use_in_comparatives',
            'pillars' => 'use_in_pillars',
            'press' => 'use_in_press',
        ];

        if (isset($columnMap[$contentType])) {
            return $query->where($columnMap[$contentType], true);
        }

        return $query;
    }

    /**
     * Scope: Ordonner par priorité (décroissant)
     */
    public function scopeByPriority(Builder $query): Builder
    {
        return $query->orderBy('priority', 'desc');
    }

    /**
     * Scope: Ordonner par ordre de priorité des types
     */
    public function scopeOrderedByTypePriority(Builder $query): Builder
    {
        // Créer un CASE pour l'ordre des types
        $cases = [];
        foreach (self::TYPE_PRIORITY_ORDER as $index => $type) {
            $cases[] = "WHEN knowledge_type = '{$type}' THEN {$index}";
        }
        $caseStatement = implode(' ', $cases);
        
        return $query->orderByRaw("CASE {$caseStatement} ELSE 99 END")
                     ->orderBy('priority', 'desc');
    }

    /**
     * Récupère la traduction pour une langue donnée
     */
    public function getTranslation(string $languageCode): ?PlatformKnowledgeTranslation
    {
        return $this->translations()
            ->where('language_code', $languageCode)
            ->first();
    }

    /**
     * Récupère le contenu dans la langue demandée, avec fallback
     */
    public function getContentForLanguage(string $languageCode): string
    {
        // Si la langue de base correspond, retourner directement
        if ($this->language_code === $languageCode) {
            return $this->content;
        }

        // Sinon, chercher dans les traductions
        $translation = $this->getTranslation($languageCode);
        
        if ($translation) {
            return $translation->content;
        }

        // Fallback sur le contenu de base
        return $this->content;
    }

    /**
     * Récupère le titre dans la langue demandée, avec fallback
     */
    public function getTitleForLanguage(string $languageCode): string
    {
        // Si la langue de base correspond, retourner directement
        if ($this->language_code === $languageCode) {
            return $this->title;
        }

        // Sinon, chercher dans les traductions
        $translation = $this->getTranslation($languageCode);
        
        if ($translation) {
            return $translation->title;
        }

        // Fallback sur le titre de base
        return $this->title;
    }

    /**
     * Vérifie si une traduction existe pour une langue
     */
    public function hasTranslation(string $languageCode): bool
    {
        return $this->translations()
            ->where('language_code', $languageCode)
            ->exists();
    }

    /**
     * Retourne toutes les langues disponibles pour cette entrée
     */
    public function getAvailableLanguages(): array
    {
        $languages = [$this->language_code];
        
        $translationLanguages = $this->translations()
            ->pluck('language_code')
            ->toArray();
        
        return array_unique(array_merge($languages, $translationLanguages));
    }
}