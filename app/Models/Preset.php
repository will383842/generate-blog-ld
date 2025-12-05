<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Preset extends Model
{
    use HasFactory, SoftDeletes;

    public const TYPE_CONTENT = 'content_type';
    public const TYPE_GEOGRAPHIC = 'geographic';
    public const TYPE_GENERATION = 'generation';
    public const TYPE_PUBLICATION = 'publication';
    public const TYPE_FULL_PROGRAM = 'full_program';

    protected $fillable = [
        'name',
        'description',
        'platform_id',
        'created_by',
        'type',
        'config',
        'is_default',
        'is_system',
        'is_active',
        'usage_count',
    ];

    protected $casts = [
        'config' => 'array',
        'is_default' => 'boolean',
        'is_system' => 'boolean',
        'is_active' => 'boolean',
    ];

    // -------------------------------------------------------------------------
    // RELATIONS
    // -------------------------------------------------------------------------

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'created_by');
    }

    // -------------------------------------------------------------------------
    // SCOPES
    // -------------------------------------------------------------------------

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeForPlatform($query, ?int $platformId)
    {
        return $query->where(function ($q) use ($platformId) {
            $q->whereNull('platform_id');
            if ($platformId) {
                $q->orWhere('platform_id', $platformId);
            }
        });
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    public function scopeUserPresets($query)
    {
        return $query->where('is_system', false);
    }

    public function scopeSystemPresets($query)
    {
        return $query->where('is_system', true);
    }

    // -------------------------------------------------------------------------
    // METHODS
    // -------------------------------------------------------------------------

    public function incrementUsage(): void
    {
        $this->increment('usage_count');
    }

    public function setAsDefault(): void
    {
        // Retirer le default des autres presets du même type et plateforme
        static::where('type', $this->type)
            ->where('platform_id', $this->platform_id)
            ->where('id', '!=', $this->id)
            ->update(['is_default' => false]);

        $this->update(['is_default' => true]);
    }

    public function applyToProgram(Program $program): Program
    {
        switch ($this->type) {
            case self::TYPE_CONTENT:
                $program->fill([
                    'content_types' => $this->config['content_types'] ?? [],
                    'themes' => $this->config['themes'] ?? null,
                    'provider_types' => $this->config['provider_types'] ?? null,
                ]);
                if (isset($this->config['word_count'])) {
                    $options = $program->options ?? [];
                    $options['word_count'] = $this->config['word_count'];
                    $program->options = $options;
                }
                break;

            case self::TYPE_GEOGRAPHIC:
                $program->fill([
                    'countries' => $this->config['countries'] ?? null,
                    'regions' => $this->config['regions'] ?? null,
                    'languages' => $this->config['languages'] ?? null,
                ]);
                break;

            case self::TYPE_GENERATION:
                $options = $program->options ?? [];
                $program->options = array_merge($options, $this->config);
                break;

            case self::TYPE_PUBLICATION:
                $options = $program->options ?? [];
                $program->options = array_merge($options, $this->config);
                break;

            case self::TYPE_FULL_PROGRAM:
                $program->fill($this->config);
                break;
        }

        $this->incrementUsage();
        return $program;
    }

    public static function getDefaultConfig(string $type): array
    {
        return match ($type) {
            self::TYPE_CONTENT => [
                'content_types' => ['article'],
                'themes' => null,
                'provider_types' => null,
                'word_count' => ['min' => 1500, 'max' => 2500],
            ],
            self::TYPE_GEOGRAPHIC => [
                'countries' => null,
                'regions' => null,
                'languages' => null,
            ],
            self::TYPE_GENERATION => [
                'tone' => 'professional',
                'include_faq' => true,
                'faq_count' => 5,
                'include_sources' => true,
                'source_count' => 3,
                'image_mode' => 'unsplash_first',
                'max_images' => 2,
                'research_enabled' => true,
                'quality_threshold' => 70,
            ],
            self::TYPE_PUBLICATION => [
                'auto_translate' => true,
                'auto_publish' => false,
                'seo_optimization' => true,
                'internal_links' => true,
                'external_links' => true,
                'cta_enabled' => true,
            ],
            self::TYPE_FULL_PROGRAM => array_merge(
                self::getDefaultConfig(self::TYPE_CONTENT),
                self::getDefaultConfig(self::TYPE_GEOGRAPHIC),
                self::getDefaultConfig(self::TYPE_GENERATION),
                self::getDefaultConfig(self::TYPE_PUBLICATION),
            ),
            default => [],
        };
    }
}