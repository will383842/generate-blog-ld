<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArticleIndex extends Model
{
    use HasFactory;

    protected $table = 'article_index';

    protected $fillable = [
        'article_id',
        'platform_id',
        'language_code',
        'country_code',
        'title',
        'slug',
        'keywords',
        'category',
        'provider_type_id',
        'specialty_id',
        'service_id',
        'incoming_links_count',
        'outgoing_links_count',
        'published_at',
    ];

    protected $casts = [
        'keywords' => 'array',
        'incoming_links_count' => 'integer',
        'outgoing_links_count' => 'integer',
        'published_at' => 'datetime',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    public function providerType(): BelongsTo
    {
        return $this->belongsTo(ProviderType::class);
    }

    public function specialty(): BelongsTo
    {
        return $this->belongsTo(LawyerSpecialty::class, 'specialty_id');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(UlixaiService::class, 'service_id');
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeForPlatform($query, int $platformId)
    {
        return $query->where('platform_id', $platformId);
    }

    public function scopeForLanguage($query, string $languageCode)
    {
        return $query->where('language_code', $languageCode);
    }

    public function scopeForCountry($query, string $countryCode)
    {
        return $query->where('country_code', $countryCode);
    }

    public function scopePublished($query)
    {
        return $query->whereNotNull('published_at');
    }

    public function scopeRelatedTo($query, ArticleIndex $article, int $limit = 10)
    {
        return $query->where('id', '!=', $article->id)
                     ->where('platform_id', $article->platform_id)
                     ->where('language_code', $article->language_code)
                     ->where(function ($q) use ($article) {
                         $q->where('country_code', $article->country_code)
                           ->orWhere('category', $article->category)
                           ->orWhere('provider_type_id', $article->provider_type_id);
                     })
                     ->orderByDesc('incoming_links_count')
                     ->limit($limit);
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    public function incrementIncomingLinks(): void
    {
        $this->increment('incoming_links_count');
    }

    public function incrementOutgoingLinks(): void
    {
        $this->increment('outgoing_links_count');
    }
}
