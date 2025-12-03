<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class PressReleaseExport extends Model
{
    protected $fillable = [
        'press_release_id', 'export_format', 'language_code',
        'file_path', 'file_name', 'file_size', 'export_options',
        'generated_by', 'download_count', 'last_downloaded_at',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'export_options' => 'array',
        'download_count' => 'integer',
        'last_downloaded_at' => 'datetime',
    ];

    // Relations
    public function pressRelease(): BelongsTo { return $this->belongsTo(PressRelease::class); }

    // Scopes
    public function scopeFormat($query, $format) { return $query->where('export_format', $format); }
    public function scopeLanguage($query, $code) { return $query->where('language_code', $code); }

    // Accessors
    public function getFormattedSizeAttribute(): string
    {
        if ($this->file_size >= 1048576) return number_format($this->file_size / 1048576, 2) . ' MB';
        if ($this->file_size >= 1024) return number_format($this->file_size / 1024, 2) . ' KB';
        return $this->file_size . ' B';
    }

    public function getMimeTypeAttribute(): string
    {
        return match($this->export_format) {
            'pdf' => 'application/pdf',
            'word' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'html' => 'text/html',
            default => 'text/plain'
        };
    }

    // Methods
    public function incrementDownloadCount(): bool
    {
        $this->increment('download_count');
        $this->update(['last_downloaded_at' => now()]);
        return true;
    }

    protected static function boot()
    {
        parent::boot();
        static::deleting(fn($export) => Storage::delete($export->file_path));
    }
}