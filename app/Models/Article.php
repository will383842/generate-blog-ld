<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Article extends Model
{
    use HasFactory, SoftDeletes;

    protected static array $supportedLanguages = ['fr', 'en', 'de', 'es', 'pt', 'ru', 'zh', 'ar', 'hi'];

    protected $fillable = [
        'uuid',
        'platform_id',
        'country_id',
        'language_id',
        'type',
        'title',
        'title_hash',
        'slug',
        'excerpt',
        'content',
        'word_count',
        'reading_time',
        'meta_title',
        'meta_description',
        'canonical_url',
        'json_ld',
        'image_url',
        'image_alt',
        'image_attribution',
        'image_photographer',
        'image_photographer_url',
        'image_width',
        'image_height',
        'image_color',
        'image_source',
        'theme_type',
        'theme_id',
        'author_id',
        'primary_keyword_id',
        'quality_score',
        'status',
        'published_at',
        'scheduled_at',
        'indexed_at',
        'generation_cost',

        // ✅ AJOUT
        'locale_slugs',
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

        // ✅ AJOUT
        'locale_slugs' => 'array',
        'primary_keyword_id' => 'integer',
    ];

    protected $appends = ['locale'];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($article) {
            if (empty($article->uuid)) {
                $article->uuid = (string) Str::uuid();
            }
        });
    }

    const STATUS_DRAFT = 'draft';
    const STATUS_PENDING = 'pending';
    const STATUS_PUBLISHED = 'published';
    const STATUS_FAILED = 'failed';

    const TYPE_ARTICLE = 'article';
    const TYPE_PILLAR = 'pillar';
    const TYPE_PRESS_RELEASE = 'press_release';
    const TYPE_PRESS_DOSSIER = 'press_dossier';
    const TYPE_LANDING = 'landing';
    const TYPE_COMPARATIVE = 'comparative';
    const TYPE_MANUAL = 'manual';
    const TYPE_KNOWLEDGE = 'knowledge';

    public static function generateUniqueSlug(
        string $title,
        int $platformId,
        int $languageId,
        ?int $excludeId = null
    ): string {
        $baseSlug = Str::slug($title);
        $slug = $baseSlug;
        $counter = 1;

        while (self::slugExists($slug, $platformId, $languageId, $excludeId)) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;

            if ($counter > 1000) {
                $slug = $baseSlug . '-' . Str::random(6);
                break;
            }
        }

        return $slug;
    }

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

    public function generateSlug(string $title): string
    {
        return self::generateUniqueSlug(
            $title,
            $this->platform_id,
            $this->language_id,
            $this->id
        );
    }

    public function getLocaleAttribute(): string
    {
        $langCode = $this->language?->code ?? 'fr';
        $countryCode = $this->country?->code ?? 'FR';

        return strtolower($langCode) . '-' . strtoupper($countryCode);
    }

    public function generateLocalizedSlug(?string $title = null): string
    {
        $title = $title ?? $this->title;
        $slug = Str::slug($title);

        return strtolower($this->locale) . '/' . $slug;
    }

    public function getLocalizedUrl(): string
    {
        $baseUrl = $this->platform?->url ?? config('app.url');
        return rtrim($baseUrl, '/') . '/' . $this->generateLocalizedSlug();
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

    public function primaryKeyword(): BelongsTo
    {
        return $this->belongsTo(Keyword::class, 'primary_keyword_id');
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

    public function qualityChecks(): HasMany
    {
        return $this->hasMany(QualityCheck::class);
    }

    public function goldenExamples(): HasMany
    {
        return $this->hasMany(GoldenExample::class);
    }

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

    public function getTitle(string $lang = 'fr'): string
    {
        if ($this->language && $this->language->code === $lang) {
            return $this->title;
        }

        $translation = $this->translations()
            ->whereHas('language', fn($q) => $q->where('code', $lang))
            ->first();

        return $translation?->title ?? $this->title;
    }

    public function getTranslatedSlug(string $lang = 'fr'): string
    {
        if ($this->language && $this->language->code === $lang) {
            return $this->slug;
        }

        $translation = $this->translations()
            ->whereHas('language', fn($q) => $q->where('code', $lang))
            ->first();

        return $translation?->slug ?? $this->slug;
    }

    public function getFullUrlWithCountry(string $lang = 'fr'): string
    {
        $baseUrl = $this->platform?->url ?? config('app.url');
        $countrySlug = $this->country?->getSlug($lang) ?? '';
        $articleSlug = $this->getTranslatedSlug($lang);

        $defaultLang = config('languages.default', 'fr');

        if ($lang === $defaultLang) {
            return rtrim($baseUrl, '/') . "/{$countrySlug}/{$articleSlug}";
        }

        return rtrim($baseUrl, '/') . "/{$lang}/{$countrySlug}/{$articleSlug}";
    }

    public function hasTranslation(string $lang): bool
    {
        if ($this->language && $this->language->code === $lang) {
            return true;
        }

        return $this->translations()
            ->whereHas('language', fn($q) => $q->where('code', $lang))
            ->where('status', 'completed')
            ->exists();
    }

    public function getAvailableLanguages(): array
    {
        $available = [];

        if ($this->language) {
            $available[] = $this->language->code;
        }

        $translationLangs = $this->translations()
            ->where('status', 'completed')
            ->with('language')
            ->get()
            ->pluck('language.code')
            ->filter()
            ->toArray();

        return array_unique(array_merge($available, $translationLangs));
    }

    public function getAllUrlsWithCountry(): array
    {
        $urls = [];

        foreach ($this->getAvailableLanguages() as $lang) {
            $urls[$lang] = $this->getFullUrlWithCountry($lang);
        }

        return $urls;
    }

    public static function findByCountryAndSlug(
        string $countrySlug,
        string $articleSlug,
        string $lang = 'fr'
    ): ?self {
        $country = Country::findBySlug($countrySlug);
        if (!$country) {
            return null;
        }

        $article = self::where('country_id', $country->id)
            ->whereHas('translations', function ($q) use ($lang, $articleSlug) {
                $q->where('slug', $articleSlug)
                    ->whereHas('language', fn($lq) => $lq->where('code', $lang));
            })
            ->first();

        if ($article) {
            return $article;
        }

        return self::where('country_id', $country->id)
            ->where('slug', $articleSlug)
            ->whereHas('language', fn($q) => $q->where('code', $lang))
            ->first();
    }

    public function getTranslatedMeta(string $lang = 'fr'): array
    {
        if ($this->language && $this->language->code === $lang) {
            return [
                'title' => $this->meta_title ?? $this->title,
                'description' => $this->meta_description ?? $this->excerpt,
                'excerpt' => $this->excerpt,
            ];
        }

        $translation = $this->translations()
            ->whereHas('language', fn($q) => $q->where('code', $lang))
            ->first();

        if ($translation) {
            return [
                'title' => $translation->meta_title ?? $translation->title,
                'description' => $translation->meta_description ?? $translation->excerpt,
                'excerpt' => $translation->excerpt,
            ];
        }

        return [
            'title' => $this->meta_title ?? $this->title,
            'description' => $this->meta_description ?? $this->excerpt,
            'excerpt' => $this->excerpt,
        ];
    }

    public static function getSupportedLanguages(): array
    {
        return self::$supportedLanguages;
    }

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
        return max(1, (int) ceil($this->word_count / 200));
    }

    public function hasUnsplashImage(): bool
    {
        return $this->image_source === 'unsplash';
    }

    public function getImageAttributionAttribute(): ?string
    {
        if ($this->image_source === 'unsplash' && $this->attributes['image_attribution']) {
            return $this->attributes['image_attribution'];
        }
        return null;
    }

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
