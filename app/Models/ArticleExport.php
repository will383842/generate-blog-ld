<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArticleExport extends Model
{
    use HasFactory;

    protected $fillable = [
        'article_id',
        'language_code',
        'format',
        'file_path',
        'file_name',
        'file_size',
        'download_count',
        'generated_at',
        'expires_at',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'download_count' => 'integer',
        'generated_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeNotExpired($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('expires_at')
              ->orWhere('expires_at', '>', now());
        });
    }

    public function scopeOfFormat($query, string $format)
    {
        return $query->where('format', $format);
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    public function incrementDownloads(): void
    {
        $this->increment('download_count');
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function getFileSizeFormatted(): string
    {
        $bytes = $this->file_size;
        if ($bytes >= 1048576) {
            return round($bytes / 1048576, 2) . ' Mo';
        }
        return round($bytes / 1024, 2) . ' Ko';
    }
}
