<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GenerationRequest extends Model
{
    protected $fillable = [
        'name',
        'platform_ids',
        'country_ids',
        'language_codes',
        'service_ids',
        'category_id',
        'strategy',
        'template_config',
        'status',
        'articles_generated',
        'articles_expected',
        'error_message',
        'total_cost',
        'total_time_seconds',
        'started_at',
        'completed_at'
    ];

    protected $casts = [
        'platform_ids' => 'array',
        'country_ids' => 'array',
        'language_codes' => 'array',
        'service_ids' => 'array',
        'template_config' => 'array',
        'articles_generated' => 'integer',
        'articles_expected' => 'integer',
        'total_cost' => 'decimal:4',
        'total_time_seconds' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime'
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(ContentCategory::class, 'category_id');
    }

    public function generatedArticles(): HasMany
    {
        return $this->hasMany(GeneratedArticlesMapping::class, 'request_id');
    }

    public function getProgressPercentAttribute(): int
    {
        if ($this->articles_expected == 0) return 0;
        return (int) (($this->articles_generated / $this->articles_expected) * 100);
    }

    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }
}

class GeneratedArticlesMapping extends Model
{
    protected $fillable = [
        'request_id',
        'article_id',
        'combination'
    ];

    protected $casts = [
        'combination' => 'array'
    ];

    public function request(): BelongsTo
    {
        return $this->belongsTo(GenerationRequest::class, 'request_id');
    }

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }
}

class ArticlePublication extends Model
{
    protected $fillable = [
        'article_id',
        'platform_id',
        'url',
        'template_variables_snapshot',
        'status',
        'published_at',
        'last_updated_at',
        'metadata'
    ];

    protected $casts = [
        'template_variables_snapshot' => 'array',
        'metadata' => 'array',
        'published_at' => 'datetime',
        'last_updated_at' => 'datetime'
    ];

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function isOutdated(string $variableKey): bool
    {
        if (!$this->template_variables_snapshot) return false;
        
        $currentValue = TemplateVariable::getValue($variableKey);
        $snapshotValue = $this->template_variables_snapshot[$variableKey] ?? null;
        
        return $currentValue !== $snapshotValue;
    }
}

class BulkUpdateLog extends Model
{
    protected $fillable = [
        'variable_key',
        'old_value',
        'new_value',
        'articles_affected',
        'articles_updated',
        'articles_failed',
        'status',
        'error_message',
        'started_at',
        'completed_at'
    ];

    protected $casts = [
        'articles_affected' => 'integer',
        'articles_updated' => 'integer',
        'articles_failed' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime'
    ];

    public function details(): HasMany
    {
        return $this->hasMany(BulkUpdateDetail::class, 'bulk_update_id');
    }

    public function getProgressPercentAttribute(): int
    {
        $total = $this->articles_updated + $this->articles_failed;
        if ($this->articles_affected == 0) return 0;
        return (int) (($total / $this->articles_affected) * 100);
    }
}

class BulkUpdateDetail extends Model
{
    protected $fillable = [
        'bulk_update_id',
        'article_id',
        'platform_id',
        'status',
        'error_message'
    ];

    public function bulkUpdate(): BelongsTo
    {
        return $this->belongsTo(BulkUpdateLog::class, 'bulk_update_id');
    }

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }
}
