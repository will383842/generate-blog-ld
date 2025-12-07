<?php

namespace App\Services\Linking;

use App\Models\ExternalLink;
use App\Models\Article;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class LinkVerificationService
{
    protected int $timeout;
    protected array $validStatusCodes;
    protected int $concurrentChecks;

    public function __construct()
    {
        $this->timeout = config('linking.verification.timeout', 10);
        $this->validStatusCodes = config('linking.verification.valid_status_codes', [200, 301, 302, 307, 308]);
        $this->concurrentChecks = config('linking.verification.concurrent_checks', 10);
    }

    /**
     * Vérifie un lien unique
     */
    public function verifyLink(ExternalLink $link): array
    {
        $startTime = microtime(true);
        
        try {
            $response = Http::timeout($this->timeout)
                ->withOptions([
                    'verify' => false,
                    'allow_redirects' => [
                        'max' => 5,
                        'track_redirects' => true
                    ]
                ])
                ->head($link->url);

            $statusCode = $response->status();
            $isValid = in_array($statusCode, $this->validStatusCodes);
            $responseTime = round((microtime(true) - $startTime) * 1000);

            // Mettre à jour le lien
            $link->update([
                'last_verified_at' => now(),
                'is_broken' => !$isValid,
                'last_status_code' => $statusCode,
                'last_response_time' => $responseTime
            ]);

            $result = [
                'url' => $link->url,
                'is_valid' => $isValid,
                'status_code' => $statusCode,
                'response_time_ms' => $responseTime,
                'final_url' => $response->effectiveUri()?->__toString() ?? $link->url,
                'redirected' => $response->effectiveUri()?->__toString() !== $link->url
            ];

            Log::debug("LinkVerificationService: Verified link", $result);

            return $result;

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            return $this->handleVerificationError($link, 'connection_timeout', $e->getMessage());
        } catch (\Exception $e) {
            return $this->handleVerificationError($link, 'error', $e->getMessage());
        }
    }

    /**
     * Gère les erreurs de vérification
     */
    protected function handleVerificationError(ExternalLink $link, string $type, string $message): array
    {
        $link->update([
            'last_verified_at' => now(),
            'is_broken' => true,
            'last_status_code' => 0,
            'verification_error' => $message
        ]);

        Log::warning("LinkVerificationService: Verification failed", [
            'url' => $link->url,
            'type' => $type,
            'error' => $message
        ]);

        return [
            'url' => $link->url,
            'is_valid' => false,
            'status_code' => 0,
            'error_type' => $type,
            'error_message' => $message
        ];
    }

    /**
     * Vérifie tous les liens d'un article
     */
    public function verifyArticleLinks(Article $article): array
    {
        $links = ExternalLink::where('article_id', $article->id)->get();
        
        return $this->verifyLinks($links);
    }

    /**
     * Vérifie une collection de liens
     */
    public function verifyLinks(Collection $links): array
    {
        $results = [
            'total' => $links->count(),
            'valid' => 0,
            'broken' => 0,
            'errors' => [],
            'details' => []
        ];

        foreach ($links as $link) {
            $result = $this->verifyLink($link);
            $results['details'][] = $result;

            if ($result['is_valid']) {
                $results['valid']++;
            } else {
                $results['broken']++;
                $results['errors'][] = [
                    'url' => $link->url,
                    'article_id' => $link->article_id,
                    'status_code' => $result['status_code'] ?? 0,
                    'error' => $result['error_message'] ?? 'Unknown error'
                ];
            }
        }

        return $results;
    }

    /**
     * Vérifie tous les liens d'une plateforme
     */
    public function verifyPlatformLinks(int $platformId, bool $onlyUnverified = false): array
    {
        $query = ExternalLink::whereHas('article', function ($q) use ($platformId) {
            $q->where('platform_id', $platformId);
        });

        if ($onlyUnverified) {
            $query->where(function ($q) {
                $q->whereNull('last_verified_at')
                    ->orWhere('last_verified_at', '<', now()->subDays(
                        config('linking.verification.frequency_days', 30)
                    ));
            });
        }

        $links = $query->get();

        Log::info("LinkVerificationService: Starting platform verification", [
            'platform_id' => $platformId,
            'total_links' => $links->count()
        ]);

        $results = $this->verifyLinks($links);

        // Vérifier le seuil d'alerte
        $brokenPercentage = $results['total'] > 0 
            ? ($results['broken'] / $results['total']) * 100 
            : 0;
        
        $alertThreshold = config('linking.verification.broken_alert_threshold', 10);
        
        if ($brokenPercentage > $alertThreshold && config('linking.verification.notify_admin', true)) {
            $this->notifyAdmin($platformId, $results);
        }

        return $results;
    }

    /**
     * Vérifie les liens qui n'ont jamais été vérifiés
     */
    public function verifyNeverCheckedLinks(int $limit = 100): array
    {
        $links = ExternalLink::whereNull('last_verified_at')
            ->limit($limit)
            ->get();

        return $this->verifyLinks($links);
    }

    /**
     * Vérifie les liens qui n'ont pas été vérifiés depuis X jours
     */
    public function verifyStaleLinks(int $days = 30, int $limit = 100): array
    {
        $links = ExternalLink::where('last_verified_at', '<', now()->subDays($days))
            ->orderBy('last_verified_at', 'asc')
            ->limit($limit)
            ->get();

        return $this->verifyLinks($links);
    }

    /**
     * Récupère les liens cassés
     */
    public function getBrokenLinks(int $platformId = null): Collection
    {
        $query = ExternalLink::where('is_broken', true);

        if ($platformId) {
            $query->whereHas('article', function ($q) use ($platformId) {
                $q->where('platform_id', $platformId);
            });
        }

        return $query->with('article:id,title,slug')->get();
    }

    /**
     * Tente de réparer un lien cassé (trouver alternative)
     */
    public function attemptRepair(ExternalLink $link): ?string
    {
        // Essayer avec www
        $domain = parse_url($link->url, PHP_URL_HOST);
        $path = parse_url($link->url, PHP_URL_PATH) ?? '';
        
        $alternatives = [];
        
        if (!str_starts_with($domain, 'www.')) {
            $alternatives[] = str_replace($domain, 'www.' . $domain, $link->url);
        } else {
            $alternatives[] = str_replace('www.', '', $link->url);
        }

        // Essayer HTTPS si HTTP
        if (str_starts_with($link->url, 'http://')) {
            $alternatives[] = str_replace('http://', 'https://', $link->url);
        }

        // Essayer sans le path
        if ($path) {
            $alternatives[] = parse_url($link->url, PHP_URL_SCHEME) . '://' . $domain;
        }

        foreach ($alternatives as $altUrl) {
            try {
                $response = Http::timeout($this->timeout)
                    ->withOptions(['verify' => false])
                    ->head($altUrl);

                if (in_array($response->status(), $this->validStatusCodes)) {
                    Log::info("LinkVerificationService: Found working alternative", [
                        'original' => $link->url,
                        'alternative' => $altUrl
                    ]);
                    return $altUrl;
                }
            } catch (\Exception $e) {
                continue;
            }
        }

        return null;
    }

    /**
     * Répare automatiquement les liens cassés si possible
     */
    public function autoRepairBrokenLinks(int $platformId = null): array
    {
        $brokenLinks = $this->getBrokenLinks($platformId);
        
        $results = [
            'total' => $brokenLinks->count(),
            'repaired' => 0,
            'not_repairable' => 0,
            'repairs' => []
        ];

        foreach ($brokenLinks as $link) {
            $alternative = $this->attemptRepair($link);
            
            if ($alternative) {
                $link->update([
                    'url' => $alternative,
                    'is_broken' => false,
                    'last_verified_at' => now()
                ]);
                $results['repaired']++;
                $results['repairs'][] = [
                    'original' => $link->getOriginal('url'),
                    'new' => $alternative
                ];
            } else {
                $results['not_repairable']++;
            }
        }

        return $results;
    }

    /**
     * Génère un rapport de vérification
     */
    public function generateReport(int $platformId): array
    {
        $links = ExternalLink::whereHas('article', function ($q) use ($platformId) {
            $q->where('platform_id', $platformId);
        })->get();

        $total = $links->count();
        $verified = $links->whereNotNull('last_verified_at')->count();
        $broken = $links->where('is_broken', true)->count();
        $neverVerified = $links->whereNull('last_verified_at')->count();
        
        $oldVerification = $links->filter(function ($link) {
            return $link->last_verified_at && 
                   $link->last_verified_at->lt(now()->subDays(30));
        })->count();

        return [
            'platform_id' => $platformId,
            'generated_at' => now()->toIso8601String(),
            'summary' => [
                'total_links' => $total,
                'verified' => $verified,
                'never_verified' => $neverVerified,
                'stale_verification' => $oldVerification,
                'broken' => $broken,
                'broken_percentage' => $total > 0 ? round(($broken / $total) * 100, 2) : 0
            ],
            'by_source_type' => $links->groupBy('source_type')->map(function ($group) {
                return [
                    'total' => $group->count(),
                    'broken' => $group->where('is_broken', true)->count()
                ];
            })->toArray(),
            'broken_links' => $links->where('is_broken', true)
                ->take(20)
                ->map(fn($l) => [
                    'url' => $l->url,
                    'article_id' => $l->article_id,
                    'last_status' => $l->last_status_code
                ])->values()->toArray()
        ];
    }

    /**
     * Notifie l'admin des liens cassés
     */
    protected function notifyAdmin(int $platformId, array $results): void
    {
        $adminEmail = config('linking.verification.admin_email');
        
        if (!$adminEmail) {
            return;
        }

        Log::warning("LinkVerificationService: High broken link percentage", [
            'platform_id' => $platformId,
            'broken' => $results['broken'],
            'total' => $results['total']
        ]);

        // Notification à implémenter selon le système de notification
        // Notification::route('mail', $adminEmail)->notify(new BrokenLinksAlert($platformId, $results));
    }

    /**
     * Statistiques de vérification
     */
    public function getVerificationStats(): array
    {
        return [
            'total_links' => ExternalLink::count(),
            'verified_links' => ExternalLink::whereNotNull('last_verified_at')->count(),
            'broken_links' => ExternalLink::where('is_broken', true)->count(),
            'never_verified' => ExternalLink::whereNull('last_verified_at')->count(),
            'verified_last_24h' => ExternalLink::where('last_verified_at', '>', now()->subDay())->count(),
            'verified_last_week' => ExternalLink::where('last_verified_at', '>', now()->subWeek())->count(),
            'average_response_time' => round(ExternalLink::whereNotNull('last_response_time')->avg('last_response_time') ?? 0),
            'by_status_code' => ExternalLink::selectRaw('last_status_code, COUNT(*) as count')
                ->whereNotNull('last_status_code')
                ->groupBy('last_status_code')
                ->pluck('count', 'last_status_code')
                ->toArray()
        ];
    }
}
