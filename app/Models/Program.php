<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class Program extends Model
{
    use HasFactory, SoftDeletes;

    // Types de contenu supportés
    public const TYPE_ARTICLE = 'article';
    public const TYPE_PILLAR = 'pillar';
    public const TYPE_COMPARATIVE = 'comparative';
    public const TYPE_LANDING = 'landing';
    public const TYPE_MANUAL = 'manual';
    public const TYPE_PRESS_RELEASE = 'press_release';
    public const TYPE_DOSSIER = 'dossier';

    public const CONTENT_TYPES = [
        self::TYPE_ARTICLE,
        self::TYPE_PILLAR,
        self::TYPE_COMPARATIVE,
        self::TYPE_LANDING,
        self::TYPE_MANUAL,
        self::TYPE_PRESS_RELEASE,
        self::TYPE_DOSSIER,
    ];

    protected $fillable = [
        'name',
        'description',
        'platform_id',
        'created_by',
        'content_types',
        'countries',
        'regions',
        'languages',
        'themes',
        'provider_types',
        'lawyer_specialties',
        'expat_domains',
        'ulixai_services',
        'quantity_mode',
        'quantity_value',
        'recurrence_type',
        'recurrence_config',
        'cron_expression',
        'start_at',
        'end_at',
        'next_run_at',
        'last_run_at',
        'status',
        'error_message',
        'options',
        'total_generated',
        'total_published',
        'total_errors',
        'total_cost',
        'run_count',
        'priority',
        'daily_budget_limit',
        'daily_generation_limit',
        'concurrent_jobs_limit',
    ];

    protected $casts = [
        'content_types' => 'array',
        'countries' => 'array',
        'regions' => 'array',
        'languages' => 'array',
        'themes' => 'array',
        'provider_types' => 'array',
        'lawyer_specialties' => 'array',
        'expat_domains' => 'array',
        'ulixai_services' => 'array',
        'recurrence_config' => 'array',
        'options' => 'array',
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'next_run_at' => 'datetime',
        'last_run_at' => 'datetime',
        'total_cost' => 'decimal:4',
        'daily_budget_limit' => 'decimal:2',
    ];

    // RELATIONS
    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'created_by');
    }

    public function runs(): HasMany
    {
        return $this->hasMany(ProgramRun::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ProgramItem::class);
    }

    // SCOPES
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeReadyToRun($query)
    {
        return $query->whereIn('status', ['active', 'scheduled'])
            ->where(function ($q) {
                $q->whereNull('next_run_at')
                    ->orWhere('next_run_at', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('end_at')
                    ->orWhere('end_at', '>', now());
            });
    }

    // ACCESSORS
    public function getIsRecurringAttribute(): bool
    {
        return $this->recurrence_type !== 'once';
    }

    public function getEstimatedItemsAttribute(): int
    {
        return $this->calculateEstimatedItems();
    }

    public function getDefaultOptionsAttribute(): array
    {
        return [
            'word_count' => ['min' => 1500, 'max' => 2500],
            'tone' => 'professional',
            'include_faq' => true,
            'faq_count' => 5,
            'include_sources' => true,
            'image_mode' => 'unsplash_first',
            'max_images' => 2,
            'auto_translate' => true,
            'auto_publish' => false,
            'seo_optimization' => true,
            'quality_threshold' => 70,
        ];
    }

    public function getMergedOptionsAttribute(): array
    {
        return array_merge($this->default_options, $this->options ?? []);
    }

    // METHODS
    public function calculateEstimatedItems(): int
    {
        $countriesCount = $this->countries ? count($this->countries) : 197;
        $languagesCount = $this->languages ? count($this->languages) : 9;
        $contentTypesCount = count($this->content_types ?? []);
        
        if ($contentTypesCount === 0) return 0;

        return match ($this->quantity_mode) {
            'total' => $this->quantity_value * $contentTypesCount,
            'per_country' => $this->quantity_value * $countriesCount * $contentTypesCount,
            'per_language' => $this->quantity_value * $languagesCount * $contentTypesCount,
            'per_country_language' => $this->quantity_value * $countriesCount * $languagesCount * $contentTypesCount,
            default => $this->quantity_value,
        };
    }

    public function calculateNextRunAt(): ?Carbon
    {
        if ($this->recurrence_type === 'once') {
            return $this->start_at ?? now();
        }

        $config = $this->recurrence_config ?? [];
        $timezone = $config['timezone'] ?? 'UTC';
        $time = $config['time'] ?? '09:00';
        
        $now = now()->setTimezone($timezone);
        $baseTime = Carbon::parse($time, $timezone);

        return match ($this->recurrence_type) {
            'daily' => $now->copy()->setTimeFrom($baseTime)->addDayIf($now->gt($baseTime))->setTimezone('UTC'),
            'weekly' => $this->getNextWeekly($now, $baseTime, $config),
            'monthly' => $this->getNextMonthly($now, $baseTime, $config),
            'cron' => $this->getNextCron(),
            default => null,
        };
    }

    protected function getNextWeekly(Carbon $now, Carbon $baseTime, array $config): ?Carbon
    {
        $days = $config['days'] ?? [1];
        $next = null;
        foreach ($days as $day) {
            $candidate = $now->copy()->next($day)->setTimeFrom($baseTime);
            if (is_null($next) || $candidate->lt($next)) {
                $next = $candidate;
            }
        }
        return $next?->setTimezone('UTC');
    }

    protected function getNextMonthly(Carbon $now, Carbon $baseTime, array $config): Carbon
    {
        $dayOfMonth = $config['day_of_month'] ?? 1;
        $next = $now->copy()->day($dayOfMonth)->setTimeFrom($baseTime);
        if ($next->lte($now)) {
            $next->addMonth();
        }
        return $next->setTimezone('UTC');
    }

    protected function getNextCron(): ?Carbon
    {
        if (!$this->cron_expression) return null;
        try {
            $cron = new \Cron\CronExpression($this->cron_expression);
            return Carbon::instance($cron->getNextRunDate());
        } catch (\Exception $e) {
            return null;
        }
    }

    public function pause(): bool
    {
        if (!in_array($this->status, ['active', 'scheduled'])) return false;
        $this->update(['status' => 'paused']);
        return true;
    }

    public function resume(): bool
    {
        if ($this->status !== 'paused') return false;
        $this->update([
            'status' => 'active',
            'next_run_at' => $this->calculateNextRunAt(),
        ]);
        return true;
    }

    public function activate(): bool
    {
        if (!in_array($this->status, ['draft', 'paused'])) return false;
        $this->update([
            'status' => $this->start_at && $this->start_at->isFuture() ? 'scheduled' : 'active',
            'next_run_at' => $this->calculateNextRunAt(),
        ]);
        return true;
    }

    public function markCompleted(): void
    {
        $this->update(['status' => 'completed', 'next_run_at' => null]);
    }

    public function markError(string $message): void
    {
        $this->update(['status' => 'error', 'error_message' => $message]);
    }

    public function incrementStats(int $generated = 0, int $errors = 0, float $cost = 0): void
    {
        $this->increment('total_generated', $generated);
        $this->increment('total_errors', $errors);
        $this->increment('total_cost', $cost);
    }

    public function canRunToday(): bool
    {
        if ($this->daily_generation_limit) {
            $todayCount = $this->items()->whereDate('created_at', today())->count();
            if ($todayCount >= $this->daily_generation_limit) return false;
        }
        if ($this->daily_budget_limit) {
            $todayCost = $this->items()->whereDate('created_at', today())->sum('cost');
            if ($todayCost >= $this->daily_budget_limit) return false;
        }
        return true;
    }

    public function getCountriesModels()
    {
        if (empty($this->countries)) {
            return Country::where('is_active', true)->get();
        }
        return Country::whereIn('id', $this->countries)->get();
    }

    public function getLanguagesModels()
    {
        if (empty($this->languages)) {
            return Language::where('is_active', true)->get();
        }
        return Language::whereIn('id', $this->languages)
            ->orWhereIn('code', $this->languages)
            ->get();
    }

    public function getThemesModels()
    {
        if (empty($this->themes)) {
            return Theme::where('is_active', true)->get();
        }
        return Theme::whereIn('id', $this->themes)->get();
    }

    public function getProviderTypesModels()
    {
        if (empty($this->provider_types)) {
            return ProviderType::where('is_active', true)->get();
        }
        return ProviderType::whereIn('id', $this->provider_types)->get();
    }

    public function getLawyerSpecialtiesModels()
    {
        if (empty($this->lawyer_specialties)) {
            return LawyerSpecialty::where('is_active', true)->get();
        }
        return LawyerSpecialty::whereIn('id', $this->lawyer_specialties)->get();
    }

    public function getExpatDomainsModels()
    {
        if (empty($this->expat_domains)) {
            return ExpatDomain::where('is_active', true)->get();
        }
        return ExpatDomain::whereIn('id', $this->expat_domains)->get();
    }

    public function getUlixaiServicesModels()
    {
        if (empty($this->ulixai_services)) {
            return UlixaiService::where('is_active', true)->get();
        }
        return UlixaiService::whereIn('id', $this->ulixai_services)->get();
    }
}