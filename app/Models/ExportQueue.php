<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ExportQueue extends Model
{
    public $timestamps = false;

    protected $table = 'export_queue';

    protected $fillable = [
        'content_type',
        'content_id',
        'export_format',
        'language_code',
        'status',
        'file_path',
        'error_message',
        'created_at',
        'completed_at'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'completed_at' => 'datetime'
    ];

    public function content(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'content_type', 'content_id');
    }
}