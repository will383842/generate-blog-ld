<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ProgramItem extends Model
{
    use HasFactory;

    public const TYPE_ARTICLE = 'article';
    public const TYPE_PILLAR = 'pillar';
    public const TYPE_COMPARATIVE = 'comparative';
    public const TYPE_LANDING = 'landing';
    public const TYPE_MANUAL = 'manual';
    public const TYPE_PRESS_RELEASE = 'press_release';
    public const TYPE_DOSSIER = 'dossier';

    public const TYPE_TO_MODEL = [
        self::TYPE_ARTICLE => Article::class,
        self::TYPE_PILLAR => Article::class,
        self::TYPE_COMPARATIVE => Article::class,
        self::TYPE_LANDING => Article::class,
        self::TYPE_MANUAL => Article::class,
        self::TYPE_PRESS_RELEASE => PressRelease::class,
        self::TYPE_DOSSIER => PressDossier::class,
    ];

    protected $fillable = [
        'program_id',
        'program_run_id',
        'content_type',
        'content_id',
        'country_id',
        'language_id',
        'theme_id',
        'thematic_id',
        'thematic_type',
        'generation_type',
        'status',
        'error_message',
        'cost',
        'generation_params',
        'result_data',
    ];

    protected $casts = [
        'cost' => 'decimal:4',
        'generation_params' => 'array',
        'result_data' => 'array',
    ];

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function run(): BelongsTo
    {
        return $this->belongsTo(ProgramRun::class, 'program_run_id');
    }

    public function content(): MorphTo
    {
        return $this->morphTo();
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class);
    }

    public function theme(): BelongsTo
    {
        return $this->belongsTo(Theme::class);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeGenerating($query)
    {
        return $query->where('status', 'generating');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('generation_type', $type);
    }

    public function markGenerating(): void
    {
        $this->update(['status' => 'generating']);
    }

    public function markCompleted(Model $content, float $cost = 0, array $resultData = []): void
    {
        $this->update([
            'status' => 'completed',
            'content_type' => get_class($content),
            'content_id' => $content->id,
            'cost' => $cost,
            'result_data' => array_merge($this->result_data ?? [], $resultData),
        ]);
    }

    public function markFailed(string $message): void
    {
        $this->update([
            'status' => 'failed',
            'error_message' => $message,
        ]);
    }

    public function getExpectedModelClass(): string
    {
        return self::TYPE_TO_MODEL[$this->generation_type] ?? Article::class;
    }
}