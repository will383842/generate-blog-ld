<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

/**
 * Phase 27 - Fichier 9: Model AuthorityDomain
 * Domaines d'autorité pré-configurés pour liens externes
 */
class AuthorityDomain extends Model
{
    // Topics couverts par les domaines autorité
    const TOPICS = [
        'immigration' => 'Immigration & Visa',
        'tax' => 'Fiscalité',
        'health' => 'Santé',
        'legal' => 'Juridique',
        'banking' => 'Banque & Finance',
        'housing' => 'Logement',
        'education' => 'Éducation',
        'employment' => 'Emploi',
        'social' => 'Protection sociale',
        'travel' => 'Voyage',
        'general' => 'Général',
    ];
    
    // Scores par défaut selon le type
    const DEFAULT_SCORES = [
        'government' => 95,
        'organization' => 85,
        'reference' => 75,
        'news' => 70,
    ];
    
    protected $fillable = [
        'domain',
        'name',
        'source_type',
        'country_code',
        'languages',
        'topics',
        'authority_score',
        'is_active',
        'auto_discovered',
        'notes',
    ];

    protected $casts = [
        'languages' => 'array',
        'topics' => 'array',
        'authority_score' => 'integer',
        'is_active' => 'boolean',
        'auto_discovered' => 'boolean',
    ];
    
    protected $attributes = [
        'source_type' => 'reference',
        'authority_score' => 70,
        'is_active' => true,
        'auto_discovered' => false,
    ];

    // =========================================================================
    // SCOPES
    // =========================================================================
    
    /**
     * Domaines actifs uniquement
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
    
    /**
     * Pour un pays spécifique (inclut internationaux)
     */
    public function scopeForCountry(Builder $query, ?string $countryCode): Builder
    {
        return $query->where(function ($q) use ($countryCode) {
            $q->where('country_code', strtoupper($countryCode))
              ->orWhereNull('country_code');
        });
    }
    
    /**
     * Par type de source
     */
    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('source_type', $type);
    }
    
    /**
     * Par topic (un seul)
     */
    public function scopeByTopic(Builder $query, string $topic): Builder
    {
        return $query->whereJsonContains('topics', $topic);
    }
    
    /**
     * Par topics (plusieurs)
     */
    public function scopeByTopics(Builder $query, array $topics): Builder
    {
        return $query->where(function ($q) use ($topics) {
            foreach ($topics as $topic) {
                $q->orWhereJsonContains('topics', $topic);
            }
        });
    }
    
    /**
     * Haute autorité (score >= 80)
     */
    public function scopeHighAuthority(Builder $query, int $minScore = 80): Builder
    {
        return $query->where('authority_score', '>=', $minScore);
    }
    
    /**
     * Supporte une langue spécifique
     */
    public function scopeSupportsLanguage(Builder $query, string $langCode): Builder
    {
        return $query->where(function ($q) use ($langCode) {
            $q->whereJsonContains('languages', strtolower($langCode))
              ->orWhereNull('languages');
        });
    }
    
    /**
     * Découverts automatiquement
     */
    public function scopeAutoDiscovered(Builder $query): Builder
    {
        return $query->where('auto_discovered', true);
    }
    
    /**
     * Ajoutés manuellement
     */
    public function scopeManual(Builder $query): Builder
    {
        return $query->where('auto_discovered', false);
    }
    
    /**
     * Trier par score d'autorité
     */
    public function scopeOrderByAuthority(Builder $query, string $direction = 'desc'): Builder
    {
        return $query->orderBy('authority_score', $direction);
    }

    // =========================================================================
    // MÉTHODES
    // =========================================================================
    
    /**
     * Vérifie si le domaine supporte une langue
     */
    public function supportsLanguage(string $langCode): bool
    {
        if (empty($this->languages)) {
            return true; // Si pas de restriction, supporte tout
        }
        
        return in_array(strtolower($langCode), $this->languages);
    }
    
    /**
     * Obtenir les topics pertinents pour un pays
     */
    public function getTopicsForCountry(string $countryCode): array
    {
        if ($this->country_code && $this->country_code !== strtoupper($countryCode)) {
            return [];
        }
        
        return $this->topics ?? array_keys(self::TOPICS);
    }
    
    /**
     * Vérifie si le domaine couvre un topic
     */
    public function hasTopic(string $topic): bool
    {
        if (empty($this->topics)) {
            return true; // Si pas de restriction, couvre tout
        }
        
        return in_array($topic, $this->topics);
    }
    
    /**
     * Obtenir l'URL complète du domaine
     */
    public function getFullUrl(): string
    {
        return 'https://' . $this->domain;
    }
    
    /**
     * Trouver ou créer un domaine depuis une URL
     */
    public static function findOrCreateFromUrl(string $url, array $attributes = []): self
    {
        $domain = parse_url($url, PHP_URL_HOST);
        $domain = preg_replace('/^www\./', '', $domain);
        
        return self::firstOrCreate(
            ['domain' => $domain],
            array_merge([
                'name' => $domain,
                'source_type' => 'reference',
                'authority_score' => self::DEFAULT_SCORES['reference'],
                'auto_discovered' => true,
            ], $attributes)
        );
    }
    
    /**
     * Rechercher des domaines par mot-clé
     */
    public static function search(string $keyword): Builder
    {
        return self::query()
            ->where(function ($q) use ($keyword) {
                $q->where('domain', 'like', "%{$keyword}%")
                  ->orWhere('name', 'like', "%{$keyword}%");
            })
            ->active();
    }
}
