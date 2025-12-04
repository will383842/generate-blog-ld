<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class Article extends Model
{
    use HasFactory;

    protected $fillable = [
        // Identifiants
        'uuid',
        'platform_id',
        'country_id',
        'language_id',
        'type',
        
        // Contenu
        'title',
        'title_hash',
        'slug',
        'excerpt',
        'content',
        'word_count',
        'reading_time',
        
        // SEO
        'meta_title',
        'meta_description',
        'canonical_url',
        'json_ld',
        
        // Image
        'image_url',
        'image_alt',
        'image_attribution',
        'image_photographer',
        'image_photographer_url',
        'image_width',
        'image_height',
        'image_color',
        'image_source',
        
        // Relations thématiques
        'theme_type',
        'theme_id',
        'author_id',
        
        // Qualité et statut
        'quality_score',
        'status',
        'published_at',
        'scheduled_at',
        'indexed_at',
        
        // Coûts
        'generation_cost',
    ];

    protected $casts = [
        'word_count' => 'integer',
        'reading_time' => 'integer',
        'quality_score' => 'integer',
        'generation_cost' => 'float',
        'image_width' => 'integer',
        'image_height' => 'integer',
        'json_ld' => 'array',
        'published_at' => 'datetime',
        'scheduled_at' => 'datetime',
        'indexed_at' => 'datetime',
    ];

    // =========================================================================
    // BOOT
    // =========================================================================

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($article) {
            if (empty($article->uuid)) {
                $article->uuid = (string) Str::uuid();
            }
        });
    }

    // =========================================================================
    // CONSTANTES STATUS
    // =========================================================================

    const STATUS_DRAFT = 'draft';
    const STATUS_PENDING = 'pending';
    const STATUS_PUBLISHED = 'published';
    const STATUS_FAILED = 'failed';

    const TYPE_ARTICLE = 'article';
    const TYPE_LANDING = 'landing';

    // =========================================================================
    // SLUG GENERATION (🔧 AJOUT)
    // =========================================================================

    /**
     * Générer un slug unique pour l'article
     * 
     * @param string $title Titre de l'article
     * @param int $platformId ID de la plateforme
     * @param int $languageId ID de la langue
     * @param int|null $excludeId ID de l'article à exclure (pour les updates)
     * @return string Slug unique
     */
    public static function generateUniqueSlug(
        string $title,
        int $platformId,
        int $languageId,
        ?int $excludeId = null
    ): string {
        // Générer le slug de base
        $baseSlug = Str::slug($title);
        $slug = $baseSlug;
        $counter = 1;
        
        // Vérifier l'unicité et incrémenter si nécessaire
        while (self::slugExists($slug, $platformId, $languageId, $excludeId)) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
            
            // Sécurité : éviter les boucles infinies
            if ($counter > 1000) {
                // Ajouter un UUID court en dernier recours
                $slug = $baseSlug . '-' . Str::random(6);
                break;
            }
        }
        
        return $slug;
    }

    /**
     * Vérifier si un slug existe déjà
     * 
     * @param string $slug Slug à vérifier
     * @param int $platformId ID de la plateforme
     * @param int $languageId ID de la langue
     * @param int|null $excludeId ID de l'article à exclure
     * @return bool True si le slug existe déjà
     */
    protected static function slugExists(
        string $slug,
        int $platformId,
        int $languageId,
        ?int $excludeId = null
    ): bool {
        $query = self::where('platform_id', $platformId)
            ->where('language_id', $languageId)
            ->where('slug', $slug);
        
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }
        
        return $query->exists();
    }

    /**
     * Générer un slug unique pour cet article (méthode d'instance)
     * 
     * @param string $title Titre de l'article
     * @return string Slug unique
     */
    public function generateSlug(string $title): string
    {
        return self::generateUniqueSlug(
            $title,
            $this->platform_id,
            $this->language_id,
            $this->id // Exclure l'article actuel si c'est un update
        );
    }

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class);
    }

    public function theme(): BelongsTo
    {
        return $this->belongsTo(Theme::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(Author::class);
    }

    public function translations(): HasMany
    {
        return $this->hasMany(ArticleTranslation::class);
    }

    public function faqs(): HasMany
    {
        return $this->hasMany(ArticleFaq::class);
    }

    public function internalLinks(): HasMany
    {
        return $this->hasMany(InternalLink::class);
    }

    public function externalLinks(): HasMany
    {
        return $this->hasMany(ExternalLink::class);
    }

    public function sources(): HasMany
    {
        return $this->hasMany(ArticleSource::class);
    }

    public function index(): HasOne
    {
        return $this->hasOne(ArticleIndex::class);
    }

    public function versions(): HasMany
    {
        return $this->hasMany(ArticleVersion::class);
    }

    public function exports(): HasMany
    {
        return $this->hasMany(ArticleExport::class);
    }

    public function publicationQueue(): HasOne
    {
        return $this->hasOne(PublicationQueue::class);
    }

    public function generationLogs(): HasMany
    {
        return $this->hasMany(GenerationLog::class);
    }

    public function indexingQueue(): HasOne
    {
        return $this->hasOne(IndexingQueue::class);
    }

    // =========================================================================
    // RELATIONS PHASE 13 (Quality & Golden Examples)
    // =========================================================================

    /**
     * Relation avec QualityCheck (Phase 13)
     */
    public function qualityChecks(): HasMany
    {
        return $this->hasMany(QualityCheck::class);
    }

    /**
     * Relation avec GoldenExample (Phase 13)
     */
    public function goldenExamples(): HasMany
    {
        return $this->hasMany(GoldenExample::class);
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopePublished($query)
    {
        return $query->where('status', self::STATUS_PUBLISHED);
    }

    public function scopeDraft($query)
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeFailed($query)
    {
        return $query->where('status', self::STATUS_FAILED);
    }

    public function scopeForPlatform($query, int $platformId)
    {
        return $query->where('platform_id', $platformId);
    }

    public function scopeForCountry($query, int $countryId)
    {
        return $query->where('country_id', $countryId);
    }

    public function scopeForLanguage($query, int $languageId)
    {
        return $query->where('language_id', $languageId);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    public function isPublished(): bool
    {
        return $this->status === self::STATUS_PUBLISHED;
    }

    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    public function publish(): void
    {
        $this->update([
            'status' => self::STATUS_PUBLISHED,
            'published_at' => now(),
        ]);
    }

    public function markAsIndexed(): void
    {
        $this->update([
            'indexed_at' => now(),
        ]);
    }

    public function getFullUrl(): string
    {
        return $this->canonical_url ?? url($this->slug);
    }

    public function getReadingTime(): int
    {
        // Moyenne de 200 mots par minute
        return max(1, (int) ceil($this->word_count / 200));
    }

    // =========================================================================
    // IMAGE HELPERS (Phase 14 - Unsplash Integration)
    // =========================================================================

    /**
     * Vérifier si l'image vient d'Unsplash
     */
    public function hasUnsplashImage(): bool
    {
        return $this->image_source === 'unsplash';
    }

    /**
     * Obtenir l'attribution formatée
     */
    public function getImageAttributionAttribute(): ?string
    {
        if ($this->image_source === 'unsplash' && $this->attributes['image_attribution']) {
            return $this->attributes['image_attribution'];
        }
        
        return null;
    }

    /**
     * Obtenir URL image optimisée
     */
    public function getOptimizedImageUrl(int $width = 1200, int $quality = 85): string
    {
        if ($this->hasUnsplashImage() && str_contains($this->image_url, 'unsplash.com')) {
            $separator = str_contains($this->image_url, '?') ? '&' : '?';
            return $this->image_url . $separator . http_build_query([
                'w' => $width,
                'q' => $quality,
            ]);
        }
        
        return $this->image_url;
    }
}