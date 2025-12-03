<?php

namespace App\Services\AI;

use App\Models\ApiCost;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class CostTracker
{
    // =========================================================================
    // CONFIGURATION
    // =========================================================================

    protected float $dailyBudget;
    protected float $monthlyBudget;
    protected array $alertThresholds;
    protected ?string $alertEmail;
    protected bool $blockOnExceeded;

    // Cache keys
    const CACHE_DAILY_PREFIX = 'ai_costs:total:';
    const CACHE_MONTHLY_PREFIX = 'ai_costs:monthly:';
    const CACHE_ALERT_PREFIX = 'ai_alert_sent:';

    // =========================================================================
    // CONSTRUCTEUR
    // =========================================================================

    public function __construct()
    {
        $this->dailyBudget = config('ai.costs.daily_budget', 50.00);
        $this->monthlyBudget = config('ai.costs.monthly_budget', 1000.00);
        $this->alertThresholds = config('ai.costs.alert_thresholds', [
            'warning' => 80,
            'critical' => 95,
            'exceeded' => 100,
        ]);
        $this->alertEmail = config('ai.costs.alert_email');
        $this->blockOnExceeded = config('ai.costs.block_on_exceeded', false);
    }

    // =========================================================================
    // VÉRIFICATIONS BUDGET
    // =========================================================================

    /**
     * Vérifier si une requête peut être effectuée
     */
    public function canMakeRequest(float $estimatedCost = 0, string $service = 'all'): bool
    {
        // Vérifier le budget quotidien
        $dailyCost = $this->getDailyCost();
        if (($dailyCost + $estimatedCost) > $this->dailyBudget) {
            if ($this->blockOnExceeded) {
                Log::warning("AI request blocked: daily budget exceeded", [
                    'current' => $dailyCost,
                    'estimated' => $estimatedCost,
                    'budget' => $this->dailyBudget,
                ]);
                return false;
            }
        }

        // Vérifier le budget mensuel
        $monthlyCost = $this->getMonthlyCost();
        if (($monthlyCost + $estimatedCost) > $this->monthlyBudget) {
            if ($this->blockOnExceeded) {
                Log::warning("AI request blocked: monthly budget exceeded", [
                    'current' => $monthlyCost,
                    'estimated' => $estimatedCost,
                    'budget' => $this->monthlyBudget,
                ]);
                return false;
            }
        }

        return true;
    }

    /**
     * Vérifier le budget et retourner le statut détaillé
     * ✅ DÉJÀ CORRECT : Utilise 'spent' et 'budget' comme demandé
     */
    public function checkBudgetStatus(): array
    {
        $dailyCost = $this->getDailyCost();
        $monthlyCost = $this->getMonthlyCost();

        $dailyPercent = $this->dailyBudget > 0 
            ? round(($dailyCost / $this->dailyBudget) * 100, 2) 
            : 0;
        
        $monthlyPercent = $this->monthlyBudget > 0 
            ? round(($monthlyCost / $this->monthlyBudget) * 100, 2) 
            : 0;

        return [
            'daily' => [
                'spent' => round($dailyCost, 4),
                'budget' => $this->dailyBudget,
                'remaining' => round(max(0, $this->dailyBudget - $dailyCost), 4),
                'percent' => $dailyPercent,
                'status' => $this->getStatus($dailyPercent),
            ],
            'monthly' => [
                'spent' => round($monthlyCost, 4),
                'budget' => $this->monthlyBudget,
                'remaining' => round(max(0, $this->monthlyBudget - $monthlyCost), 4),
                'percent' => $monthlyPercent,
                'status' => $this->getStatus($monthlyPercent),
            ],
            'can_make_requests' => $this->canMakeRequest(),
            'checked_at' => now()->toISOString(),
        ];
    }

    // =========================================================================
    // ENREGISTREMENT DES COÛTS
    // =========================================================================

    /**
     * Enregistrer un coût (appelé par les services)
     */
    public function recordCost(string $service, string $operation, float $cost, array $meta = []): void
    {
        // Mettre à jour les caches
        $this->incrementDailyCost($cost);
        $this->incrementMonthlyCost($cost);
        $this->incrementServiceCost($service, $cost);

        // Vérifier les alertes
        $this->checkAlerts();

        Log::channel('ai')->info("Cost recorded", [
            'service' => $service,
            'operation' => $operation,
            'cost' => $cost,
            'daily_total' => $this->getDailyCost(),
        ]);
    }

    // =========================================================================
    // ALERTES
    // =========================================================================

    /**
     * Vérifier et envoyer les alertes si nécessaire
     */
    public function checkAlerts(): void
    {
        $dailyPercent = $this->getDailyPercent();
        $monthlyPercent = $this->getMonthlyPercent();

        // Vérifier chaque seuil (du plus haut au plus bas, ne prendre que le premier atteint)
        foreach (['exceeded', 'critical', 'warning'] as $level) {
            $threshold = $this->alertThresholds[$level] ?? 100;

            // Alert quotidienne
            if ($dailyPercent >= $threshold) {
                $this->sendAlert('daily', $level, $dailyPercent);
                break; // Une seule alerte par période
            }
        }

        foreach (['exceeded', 'critical', 'warning'] as $level) {
            $threshold = $this->alertThresholds[$level] ?? 100;

            // Alert mensuelle
            if ($monthlyPercent >= $threshold) {
                $this->sendAlert('monthly', $level, $monthlyPercent);
                break;
            }
        }
    }

    /**
     * Envoyer une alerte
     */
    protected function sendAlert(string $period, string $level, float $percent): void
    {
        // Éviter les alertes en double
        $cacheKey = self::CACHE_ALERT_PREFIX . "{$period}:{$level}:" . now()->format('Y-m-d');
        
        if (Cache::has($cacheKey)) {
            return; // Déjà envoyée aujourd'hui
        }

        $budget = $period === 'daily' ? $this->dailyBudget : $this->monthlyBudget;
        $spent = $period === 'daily' ? $this->getDailyCost() : $this->getMonthlyCost();

        $data = [
            'period' => $period,
            'level' => $level,
            'percent' => $percent,
            'spent' => $spent,
            'budget' => $budget,
            'remaining' => max(0, $budget - $spent),
        ];

        // Logger
        $logLevel = $level === 'exceeded' ? 'error' : ($level === 'critical' ? 'warning' : 'info');
        Log::channel('ai')->{$logLevel}("AI Budget Alert: {$level}", $data);

        // Envoyer par email si configuré
        if ($this->alertEmail) {
            $this->sendAlertEmail($data);
        }

        // Marquer comme envoyée
        Cache::put($cacheKey, true, now()->endOfDay());
    }

    /**
     * Envoyer l'email d'alerte
     */
    protected function sendAlertEmail(array $data): void
    {
        try {
            Mail::raw(
                $this->buildAlertMessage($data),
                function ($message) use ($data) {
                    $message->to($this->alertEmail)
                        ->subject("[Content Engine] Alerte Budget IA - " . strtoupper($data['level']));
                }
            );
        } catch (\Exception $e) {
            Log::error("Failed to send AI budget alert email: {$e->getMessage()}");
        }
    }

    /**
     * Construire le message d'alerte
     */
    protected function buildAlertMessage(array $data): string
    {
        $levelLabels = [
            'warning' => '⚠️ ATTENTION (80%)',
            'critical' => '🔴 CRITIQUE (95%)',
            'exceeded' => '🚨 DÉPASSEMENT (100%+)',
        ];

        $periodLabels = [
            'daily' => 'quotidien',
            'monthly' => 'mensuel',
        ];

        $label = $levelLabels[$data['level']] ?? $data['level'];
        $period = $periodLabels[$data['period']] ?? $data['period'];

        return <<<MESSAGE
{$label} - Budget IA {$period}

📊 Statut:
- Consommé: \${$data['spent']} / \${$data['budget']}
- Pourcentage: {$data['percent']}%
- Restant: \${$data['remaining']}

🕐 Date/Heure: {now()->format('d/m/Y H:i')}

---
Content Engine V9.4
MESSAGE;
    }

    // =========================================================================
    // STATISTIQUES
    // =========================================================================

    /**
     * Obtenir les statistiques complètes
     */
    public function getStatistics(): array
    {
        return [
            'budget_status' => $this->checkBudgetStatus(),
            'by_service' => $this->getCostsByService(),
            'by_operation' => $this->getCostsByOperation(),
            'trend' => $this->getDailyTrend(7),
            'top_operations' => ApiCost::getTopOperations(5, 'today'),
        ];
    }

    /**
     * Coûts par service aujourd'hui
     * ✅ CORRIGÉ: Utilise 'cost' au lieu de 'cost_usd'
     */
    public function getCostsByService(): array
    {
        return ApiCost::today()
            ->selectRaw('service, SUM(cost) as total, SUM(requests_count) as requests')
            ->groupBy('service')
            ->get()
            ->keyBy('service')
            ->toArray();
    }

    /**
     * Coûts par opération aujourd'hui
     * ✅ CORRIGÉ: Utilise 'cost' et 'type' au lieu de 'cost_usd' et 'operation'
     */
    public function getCostsByOperation(): array
    {
        return ApiCost::today()
            ->selectRaw('service, type, SUM(cost) as total, SUM(requests_count) as requests')
            ->groupBy('service', 'type')
            ->get()
            ->toArray();
    }

    /**
     * Tendance des N derniers jours
     */
    public function getDailyTrend(int $days = 30): array
    {
        return ApiCost::getDailyTrend($days);
    }

    /**
     * Projection de fin de mois
     */
    public function getMonthlyProjection(): array
    {
        $daysElapsed = now()->day;
        $daysInMonth = now()->daysInMonth;
        $monthlyCost = $this->getMonthlyCost();

        if ($daysElapsed === 0) {
            return [
                'current_cost' => 0,
                'projected_cost' => 0,
                'daily_average_cost' => 0,
            ];
        }

        $dailyAverage = $monthlyCost / $daysElapsed;
        $projected = $dailyAverage * $daysInMonth;

        return [
            'current_cost' => round($monthlyCost, 4),
            'daily_average_cost' => round($dailyAverage, 4),
            'projected_cost' => round($projected, 2),
            'budget' => $this->monthlyBudget,
            'projected_percent' => $this->monthlyBudget > 0 
                ? round(($projected / $this->monthlyBudget) * 100, 2)
                : 0,
            'days_elapsed' => $daysElapsed,
            'days_remaining' => $daysInMonth - $daysElapsed,
        ];
    }

    // =========================================================================
    // MÉTHODES D'ACCÈS AUX COÛTS
    // =========================================================================

    /**
     * Obtenir le coût quotidien (priorité: cache, puis BDD)
     */
    public function getDailyCost(?string $service = null): float
    {
        $cacheKey = self::CACHE_DAILY_PREFIX . now()->format('Y-m-d');
        $cached = Cache::get($cacheKey);
        
        if ($cached !== null && $service === null) {
            return (float) $cached;
        }

        // Lire depuis la BDD
        return ApiCost::getTodayCost($service);
    }

    /**
     * Obtenir le coût mensuel
     */
    public function getMonthlyCost(?string $service = null): float
    {
        return ApiCost::getMonthCost($service);
    }

    /**
     * Obtenir le coût hebdomadaire
     */
    public function getWeekCost(?string $service = null): float
    {
        return ApiCost::getWeekCost($service);
    }

    // =========================================================================
    // MÉTHODES UTILITAIRES PRIVÉES
    // =========================================================================

    private function incrementDailyCost(float $cost): void
    {
        $cacheKey = self::CACHE_DAILY_PREFIX . now()->format('Y-m-d');
        $current = (float) Cache::get($cacheKey, 0);
        Cache::put($cacheKey, $current + $cost, now()->endOfDay());
    }

    private function incrementMonthlyCost(float $cost): void
    {
        $cacheKey = self::CACHE_MONTHLY_PREFIX . now()->format('Y-m');
        $current = (float) Cache::get($cacheKey, 0);
        Cache::put($cacheKey, $current + $cost, now()->endOfMonth());
    }

    private function incrementServiceCost(string $service, float $cost): void
    {
        $cacheKey = "ai_costs:{$service}:" . now()->format('Y-m-d');
        $current = (float) Cache::get($cacheKey, 0);
        Cache::put($cacheKey, $current + $cost, now()->endOfDay());
    }

    private function getDailyPercent(): float
    {
        if ($this->dailyBudget <= 0) return 0;
        return ($this->getDailyCost() / $this->dailyBudget) * 100;
    }

    private function getMonthlyPercent(): float
    {
        if ($this->monthlyBudget <= 0) return 0;
        return ($this->getMonthlyCost() / $this->monthlyBudget) * 100;
    }

    private function getStatus(float $percent): string
    {
        if ($percent >= $this->alertThresholds['exceeded']) return 'exceeded';
        if ($percent >= $this->alertThresholds['critical']) return 'critical';
        if ($percent >= $this->alertThresholds['warning']) return 'warning';
        return 'ok';
    }
}