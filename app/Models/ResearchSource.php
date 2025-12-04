<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ResearchSource extends Model
{
    use HasFactory;

    protected $fillable = [
        'source_code',
        'name',
        'api_endpoint',
        'rate_limit',
        'cost_per_request',
        'is_active',
    ];

    protected $casts = [
        'rate_limit' => 'integer',
        'cost_per_request' => 'decimal:6',
        'is_active' => 'boolean',
    ];

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByCode($query, string $code)
    {
        return $query->where('source_code', $code);
    }

    public function scopeFree($query)
    {
        return $query->where('cost_per_request', 0);
    }

    public function scopePaid($query)
    {
        return $query->where('cost_per_request', '>', 0);
    }

    public function scopeOrderByCost($query, string $direction = 'asc')
    {
        return $query->orderBy('cost_per_request', $direction);
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Vérifier si la source est gratuite
     */
    public function isFree(): bool
    {
        return $this->cost_per_request == 0;
    }

    /**
     * Obtenir le coût mensuel estimé
     */
    public function getEstimatedMonthlyCost(int $requestsPerDay = 10): float
    {
        $monthlyRequests = $requestsPerDay * 30;
        return round($this->cost_per_request * $monthlyRequests, 2);
    }

    /**
     * Obtenir le taux horaire
     */
    public function getRatePerMinute(): float
    {
        return round($this->rate_limit / 60, 2);
    }

    /**
     * Vérifier si c'est Perplexity
     */
    public function isPerplexity(): bool
    {
        return $this->source_code === 'perplexity_ai';
    }

    /**
     * Vérifier si c'est News API
     */
    public function isNewsApi(): bool
    {
        return $this->source_code === 'news_api';
    }

    /**
     * Obtenir toutes les sources actives comme array
     */
    public static function getActiveSources(): array
    {
        return self::active()->pluck('source_code')->toArray();
    }

    /**
     * Obtenir les statistiques des sources
     */
    public static function getSourcesStats(): array
    {
        return self::active()->get()->map(function ($source) {
            return [
                'code' => $source->source_code,
                'name' => $source->name,
                'rate_limit' => $source->rate_limit,
                'rate_per_minute' => $source->getRatePerMinute(),
                'cost_per_request' => $source->cost_per_request,
                'estimated_monthly_cost_10_per_day' => $source->getEstimatedMonthlyCost(10),
                'is_free' => $source->isFree(),
            ];
        })->toArray();
    }
}