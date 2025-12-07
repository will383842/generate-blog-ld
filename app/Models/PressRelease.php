<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class PressRelease extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'platform_id',
        'template_type',
        'title',
        'slug',
        'lead',
        'body1',
        'body2',
        'body3',
        'quote',
        'boilerplate',
        'contact',
        'language_code',
        'status',
        'published_at',
        'generation_cost',
        'meta_title',
        'meta_description',
        'keywords',
    ];

    protected $casts = [
        'contact' => 'array',
        'keywords' => 'array',
        'published_at' => 'datetime',
        'generation_cost' => 'decimal:4',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    // Relations
    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    public function media(): HasMany
    {
        return $this->hasMany(PressReleaseMedia::class)->orderBy('order_index');
    }

    public function exports(): HasMany
    {
        return $this->hasMany(PressReleaseExport::class);
    }

    /**
     * ✅ CORRECTION: Relation traductions
     */
    public function translations(): HasMany
    {
        return $this->hasMany(PressReleaseTranslation::class);
    }

    public function getTranslation(string $languageCode)
    {
        return $this->translations()
                    ->where('language_code', $languageCode)
                    ->first();
    }

    public function hasTranslation(string $languageCode): bool
    {
        return $this->translations()
                    ->where('language_code', $languageCode)
                    ->exists();
    }

    // Scopes
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeLanguage($query, $code)
    {
        return $query->where('language_code', $code);
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published')
                     ->whereNotNull('published_at');
    }

    // Methods
    public function publish(): bool
    {
        $this->update([
            'status' => 'published',
            'published_at' => now()
        ]);
        return true;
    }

    public function getWordCountAttribute(): int
    {
        return str_word_count(strip_tags(
            $this->lead . $this->body1 . $this->body2 . $this->body3
        ));
    }
}