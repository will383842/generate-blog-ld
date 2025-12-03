<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class PressReleaseMedia extends Model
{
    protected $table = 'press_release_media';

    protected $fillable = [
        'press_release_id', 'media_type', 'file_path', 'caption',
        'source', 'metadata', 'order_index',
    ];

    protected $casts = [
        'metadata' => 'array',
        'order_index' => 'integer',
    ];

    // Relations
    public function pressRelease(): BelongsTo { return $this->belongsTo(PressRelease::class); }

    // Scopes
    public function scopeType($query, $type) { return $query->where('media_type', $type); }
    public function scopePhotos($query) { return $query->where('media_type', 'photo'); }
    public function scopeCharts($query) { return $query->where('media_type', 'chart'); }

    // Accessors
    public function getFileUrlAttribute(): string
    {
        return filter_var($this->file_path, FILTER_VALIDATE_URL)
            ? $this->file_path
            : Storage::url($this->file_path);
    }

    // Methods
    public function fileExists(): bool
    {
        return filter_var($this->file_path, FILTER_VALIDATE_URL) 
            ? true 
            : Storage::exists($this->file_path);
    }

    protected static function boot()
    {
        parent::boot();
        static::deleting(function ($media) {
            if (!filter_var($media->file_path, FILTER_VALIDATE_URL)) {
                Storage::delete($media->file_path);
            }
        });
    }
}