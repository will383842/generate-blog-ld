<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationSetting extends Model
{
    protected $fillable = ['admin_user_id', 'channel', 'event_type', 'is_enabled', 'settings'];
    protected $casts = ['is_enabled' => 'boolean', 'settings' => 'array'];

    public const CHANNEL_EMAIL = 'email';
    public const CHANNEL_SLACK = 'slack';
    public const CHANNEL_WEBHOOK = 'webhook';
    public const CHANNEL_IN_APP = 'in_app';

    public const EVENT_GENERATION_COMPLETE = 'generation.complete';
    public const EVENT_GENERATION_FAILED = 'generation.failed';
    public const EVENT_PUBLISHING_SUCCESS = 'publishing.success';
    public const EVENT_PUBLISHING_FAILED = 'publishing.failed';
    public const EVENT_INDEXING_COMPLETE = 'indexing.complete';
    public const EVENT_INDEXING_FAILED = 'indexing.failed';

    public function adminUser(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class);
    }

    public function scopeEnabled($query)
    {
        return $query->where('is_enabled', true);
    }

    public function scopeByChannel($query, string $channel)
    {
        return $query->where('channel', $channel);
    }

    public function scopeByEvent($query, string $eventType)
    {
        return $query->where('event_type', $eventType);
    }
}
