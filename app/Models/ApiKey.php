<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class ApiKey extends Model
{
    protected $fillable = ['service', 'name', 'key', 'status', 'last_tested_at', 'test_result'];
    protected $casts = ['last_tested_at' => 'datetime', 'test_result' => 'array'];
    protected $hidden = ['key'];

    public const SERVICES = [
        'openai' => 'OpenAI',
        'anthropic' => 'Anthropic',
        'google' => 'Google',
        'perplexity' => 'Perplexity',
        'dalle' => 'DALL-E',
        'unsplash' => 'Unsplash',
        'firebase' => 'Firebase',
        'stripe' => 'Stripe',
        'sendgrid' => 'SendGrid',
    ];

    public const STATUS_ACTIVE = 'active';
    public const STATUS_DISABLED = 'disabled';
    public const STATUS_INVALID = 'invalid';

    public function setKeyAttribute($value): void
    {
        if ($value) $this->attributes['key'] = Crypt::encryptString($value);
    }

    public function getKeyAttribute($value): ?string
    {
        try {
            return $value ? Crypt::decryptString($value) : null;
        } catch (\Exception $e) {
            return null;
        }
    }

    public function getMaskedKeyAttribute(): string
    {
        try {
            $decrypted = $this->key;
            if (!$decrypted) return '****';
            $length = strlen($decrypted);
            if ($length <= 8) return str_repeat('*', $length);
            return substr($decrypted, 0, 4) . str_repeat('*', $length - 8) . substr($decrypted, -4);
        } catch (\Exception $e) {
            return '****';
        }
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function markAsTested(bool $success, ?array $result = null): void
    {
        $this->last_tested_at = now();
        $this->test_result = $result;
        $this->status = $success ? self::STATUS_ACTIVE : self::STATUS_INVALID;
        $this->save();
    }
}
