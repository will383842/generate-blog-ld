<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * =============================================================================
 * PHASE 13 - FICHIER 4/14 : Model GoldenExample
 * =============================================================================
 * 
 * EMPLACEMENT : app/Models/GoldenExample.php
 * 
 * DESCRIPTION : Model pour les exemples de haute qualité (score ≥90)
 * Utilisés pour enrichir les prompts IA et améliorer les générations
 * 
 * =============================================================================
 */

class GoldenExample extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'article_id',
        'platform_id',
        'language_code',
        'content_type',
        'example_type',
        'category',
        'title',
        'excerpt',
        'word_count',
        'quality_score',
        'times_used',
        'improvement_impact',
        'use_in_prompts',
        'marked_by',
        'marked_by_user',
    ];

    protected $casts = [
        'quality_score' => 'decimal:2',
        'improvement_impact' => 'decimal:2',
        'use_in_prompts' => 'boolean',
        'times_used' => 'integer',
        'word_count' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    /**
     * Relation vers Article source
     */
    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    /**
     * Relation vers Platform
     */
    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    /**
     * Scope : Actifs pour enrichissement prompts
     */
    public function scopeActive($query)
    {
        return $query->where('use_in_prompts', true);
    }

    /**
     * Scope : Par plateforme
     */
    public function scopeForPlatform($query, $platformId)
    {
        return $query->where('platform_id', $platformId);
    }

    /**
     * Scope : Par langue
     */
    public function scopeForLanguage($query, string $languageCode)
    {
        return $query->where('language_code', $languageCode);
    }

    /**
     * Scope : Par type de contenu
     */
    public function scopeForContentType($query, string $contentType)
    {
        return $query->where('content_type', $contentType);
    }

    /**
     * Scope : Par type d'exemple
     */
    public function scopeForExampleType($query, string $exampleType)
    {
        return $query->where('example_type', $exampleType);
    }

    /**
     * Scope : Par catégorie
     */
    public function scopeForCategory($query, ?string $category)
    {
        if (!$category) {
            return $query;
        }
        return $query->where('category', $category);
    }

    /**
     * Scope : Marqués automatiquement
     */
    public function scopeAutoMarked($query)
    {
        return $query->where('marked_by', 'auto');
    }

    /**
     * Scope : Marqués manuellement
     */
    public function scopeManuallyMarked($query)
    {
        return $query->where('marked_by', 'manual');
    }

    /**
     * Scope : Score minimum
     */
    public function scopeMinQuality($query, float $minScore = 90)
    {
        return $query->where('quality_score', '>=', $minScore);
    }

    /**
     * Scope : Tri par score qualité décroissant
     */
    public function scopeByQuality($query)
    {
        return $query->orderBy('quality_score', 'desc');
    }

    /**
     * Scope : Tri par utilisation décroissante
     */
    public function scopeByUsage($query)
    {
        return $query->orderBy('times_used', 'desc');
    }

    /**
     * Scope : Tri par impact décroissant
     */
    public function scopeByImpact($query)
    {
        return $query->orderBy('improvement_impact', 'desc');
    }

    /**
     * Scope : Les plus récents
     */
    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    /**
     * Scope : Peu utilisés (candidats archivage)
     */
    public function scopeUnderutilized($query, int $maxUsage = 5)
    {
        return $query->where('times_used', '<', $maxUsage);
    }

    // =========================================================================
    // MÉTHODES UTILITAIRES
    // =========================================================================

    /**
     * Vérifier si l'exemple est actif
     */
    public function isActive(): bool
    {
        return $this->use_in_prompts === true;
    }

    /**
     * Activer l'exemple pour utilisation prompts
     */
    public function activate(): bool
    {
        return $this->update(['use_in_prompts' => true]);
    }

    /**
     * Désactiver l'exemple
     */
    public function deactivate(): bool
    {
        return $this->update(['use_in_prompts' => false]);
    }

    /**
     * Incrémenter compteur utilisation
     */
    public function incrementUsage(): void
    {
        $this->increment('times_used');
    }

    /**
     * Mettre à jour impact mesuré
     */
    public function updateImpact(float $impact): bool
    {
        return $this->update(['improvement_impact' => $impact]);
    }

    /**
     * Vérifier si marqué automatiquement
     */
    public function isAutoMarked(): bool
    {
        return $this->marked_by === 'auto';
    }

    /**
     * Vérifier si marqué manuellement
     */
    public function isManuallyMarked(): bool
    {
        return $this->marked_by === 'manual';
    }

    /**
     * Récupérer extrait formaté pour prompt
     */
    public function getFormattedExcerpt(): string
    {
        return sprintf(
            "## Exemple %s : %s - Score %.1f%%\n%s\n",
            ucfirst($this->example_type),
            $this->category ?? 'Général',
            $this->quality_score,
            $this->excerpt
        );
    }

    /**
     * Récupérer statistiques utilisation
     */
    public function getUsageStats(): array
    {
        return [
            'times_used' => $this->times_used,
            'improvement_impact' => $this->improvement_impact,
            'age_days' => $this->created_at->diffInDays(now()),
            'usage_per_day' => $this->times_used / max(1, $this->created_at->diffInDays(now())),
        ];
    }

    // =========================================================================
    // MÉTHODES STATIQUES
    // =========================================================================

    /**
     * Récupérer exemples pour contexte donné
     */
    public static function getForContext(
        int $platformId,
        string $contentType,
        string $languageCode,
        string $exampleType,
        ?string $category = null,
        int $limit = 5
    ): \Illuminate\Support\Collection {
        return self::active()
            ->forPlatform($platformId)
            ->forContentType($contentType)
            ->forLanguage($languageCode)
            ->forExampleType($exampleType)
            ->forCategory($category)
            ->byQuality()
            ->limit($limit)
            ->get();
    }

    /**
     * Marquer article comme golden (auto)
     */
    public static function createFromArticle(
        Article $article,
        string $exampleType,
        string $excerpt,
        int $wordCount
    ): self {
        return self::create([
            'article_id' => $article->id,
            'platform_id' => $article->platform_id,
            'language_code' => $article->language_code,
            'content_type' => 'article',
            'example_type' => $exampleType,
            'category' => $article->theme?->slug,
            'title' => $article->title,
            'excerpt' => $excerpt,
            'word_count' => $wordCount,
            'quality_score' => $article->quality_score,
            'times_used' => 0,
            'use_in_prompts' => true,
            'marked_by' => 'auto',
        ]);
    }

    /**
     * Statistiques globales
     */
    public static function getGlobalStats(): array
    {
        return [
            'total_examples' => self::count(),
            'active_examples' => self::active()->count(),
            'by_type' => self::selectRaw('example_type, COUNT(*) as count')
                ->groupBy('example_type')
                ->pluck('count', 'example_type')
                ->toArray(),
            'avg_quality_score' => round(self::avg('quality_score'), 2),
            'avg_times_used' => round(self::avg('times_used'), 2),
            'avg_impact' => round(self::whereNotNull('improvement_impact')->avg('improvement_impact'), 2),
            'total_usage' => self::sum('times_used'),
        ];
    }

    /**
     * Archiver exemples obsolètes
     */
    public static function archiveOld(int $days = 90, int $maxUsage = 5): int
    {
        return self::where('created_at', '<', now()->subDays($days))
            ->where('times_used', '<', $maxUsage)
            ->delete(); // Soft delete
    }

    /**
     * Top exemples par utilisation
     */
    public static function getTopUsed(int $limit = 10): \Illuminate\Support\Collection
    {
        return self::active()
            ->byUsage()
            ->limit($limit)
            ->get();
    }

    /**
     * Top exemples par impact
     */
    public static function getTopImpact(int $limit = 10): \Illuminate\Support\Collection
    {
        return self::active()
            ->whereNotNull('improvement_impact')
            ->byImpact()
            ->limit($limit)
            ->get();
    }
}

/*
 * =============================================================================
 * EXEMPLES D'UTILISATION
 * =============================================================================
 * 
 * // Créer golden example manuellement
 * $example = GoldenExample::create([
 *     'article_id' => 123,
 *     'platform_id' => 1,
 *     'language_code' => 'fr',
 *     'content_type' => 'article',
 *     'example_type' => 'intro',
 *     'category' => 'avocat-immigration',
 *     'title' => 'Avocat immigration Espagne',
 *     'excerpt' => 'Vous envisagez de vous expatrier...',
 *     'word_count' => 68,
 *     'quality_score' => 94.50,
 *     'use_in_prompts' => true,
 *     'marked_by' => 'manual',
 *     'marked_by_user' => 'williams@ulixai.com',
 * ]);
 * 
 * // Créer depuis article (auto)
 * $example = GoldenExample::createFromArticle(
 *     $article,
 *     'intro',
 *     substr($article->content, 0, 300),
 *     68
 * );
 * 
 * // Récupérer pour contexte
 * $examples = GoldenExample::getForContext(
 *     platformId: 1,
 *     contentType: 'article',
 *     languageCode: 'fr',
 *     exampleType: 'intro',
 *     category: 'avocat-immigration',
 *     limit: 5
 * );
 * 
 * // Incrémenter utilisation
 * $example->incrementUsage();
 * 
 * // Mettre à jour impact
 * $example->updateImpact(5.2); // +5.2% score avec cet exemple
 * 
 * // Désactiver temporairement
 * $example->deactivate();
 * 
 * // Formater pour prompt
 * echo $example->getFormattedExcerpt();
 * 
 * // Statistiques
 * $stats = GoldenExample::getGlobalStats();
 * 
 * // Top 10 plus utilisés
 * $topUsed = GoldenExample::getTopUsed(10);
 * 
 * // Archiver anciens peu utilisés
 * $archived = GoldenExample::archiveOld(days: 90, maxUsage: 5);
 * echo "$archived exemples archivés";
 * 
 * // Récupérer incluant archivés
 * $withTrashed = GoldenExample::withTrashed()->find($id);
 * 
 * // Restaurer archivé
 * $example->restore();
 */