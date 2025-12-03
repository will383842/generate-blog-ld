<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TitleHistory extends Model
{
    protected $fillable = [
        'article_id',      // ✅ AJOUT - CRITIQUE !
        'title',
        'title_hash',
        'country_id',
        'language_id',
    ];

    public function article(): BelongsTo  // ✅ AJOUT - Relation manquante
    {
        return $this->belongsTo(Article::class);
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class);
    }

    public static function exists(string $title, int $countryId, int $languageId): bool
    {
        $hash = hash('sha256', mb_strtolower(trim($title)));

        return static::where('title_hash', $hash)
            ->where('country_id', $countryId)
            ->where('language_id', $languageId)
            ->exists();
    }

    public static function record(string $title, int $countryId, int $languageId): static
    {
        return static::create([
            'title' => $title,
            'title_hash' => hash('sha256', mb_strtolower(trim($title))),
            'country_id' => $countryId,
            'language_id' => $languageId,
        ]);
    }
}