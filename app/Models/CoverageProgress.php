<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CoverageProgress extends Model
{
    protected $table = 'coverage_progress';

    protected $fillable = [
        'platform_id',
        'country_id',
        'theme_type',
        'theme_id',
        'articles_count',
        'landings_count',
        'translations_count',
        'coverage_percent',
        'last_generated_at',
    ];

    protected $casts = [
        'articles_count' => 'integer',
        'landings_count' => 'integer',
        'translations_count' => 'integer',
        'coverage_percent' => 'decimal:2',
        'last_generated_at' => 'datetime',
    ];

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public static function updateProgress(
        int $platformId,
        int $countryId,
        string $themeType,
        int $themeId
    ): void {
        $progress = static::firstOrCreate([
            'platform_id' => $platformId,
            'country_id' => $countryId,
            'theme_type' => $themeType,
            'theme_id' => $themeId,
        ]);

        $articlesCount = Article::where('platform_id', $platformId)
            ->where('country_id', $countryId)
            ->where('theme_type', $themeType)
            ->where('theme_id', $themeId)
            ->where('type', 'article')
            ->count();

        $landingsCount = Article::where('platform_id', $platformId)
            ->where('country_id', $countryId)
            ->where('theme_type', $themeType)
            ->where('theme_id', $themeId)
            ->where('type', 'landing')
            ->count();

        $progress->update([
            'articles_count' => $articlesCount,
            'landings_count' => $landingsCount,
            'last_generated_at' => now(),
        ]);
    }
}