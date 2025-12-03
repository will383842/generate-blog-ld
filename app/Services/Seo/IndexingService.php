<?php

namespace App\Services\Seo;

use App\Models\Article;
use App\Models\ArticleTranslation;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

/**
 * Service de soumission automatique aux moteurs de recherche
 * Google Indexing API + Bing URL Submission API
 */
class IndexingService
{
    // APIs endpoints
    const GOOGLE_INDEXING_API = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
    const BING_SUBMISSION_API = 'https://ssl.bing.com/webmaster/api.svc/json/SubmitUrl';
    const INDEXNOW_API = 'https://api.indexnow.org/indexnow';

    // Configuration
    protected array $config;
    protected ?string $googleCredentials;
    protected ?string $bingApiKey;
    protected ?string $indexNowKey;

    public function __construct()
    {
        $this->googleCredentials = config('seo.google_indexing_credentials');
        $this->bingApiKey = config('seo.bing_api_key');
        $this->indexNowKey = config('seo.indexnow_key');
    }

    // =========================================================================
    // SOUMISSION GOOGLE INDEXING API
    // =========================================================================

    /**
     * Notifie Google qu'une URL a été publiée/mise à jour
     * 
     * @param string $url URL complète de l'article
     * @param string $type 'URL_UPDATED' ou 'URL_DELETED'
     * @return array Résultat de la soumission
     */
    public function notifyGoogle(string $url, string $type = 'URL_UPDATED'): array
    {
        if (!$this->isGoogleConfigured()) {
            Log::warning("Google Indexing API non configurée");
            return ['success' => false, 'error' => 'Not configured'];
        }

        // Vérifier rate limit (200/jour par défaut)
        if (!$this->checkRateLimit('google', 200)) {
            Log::warning("Rate limit Google atteint");
            return ['success' => false, 'error' => 'Rate limit exceeded'];
        }

        try {
            $accessToken = $this->getGoogleAccessToken();

            $response = Http::withToken($accessToken)
                ->post(self::GOOGLE_INDEXING_API, [
                    'url' => $url,
                    'type' => $type,
                ]);

            if ($response->successful()) {
                $this->incrementRateLimit('google');
                
                Log::info("✅ Google notifié", [
                    'url' => $url,
                    'type' => $type,
                ]);

                return [
                    'success' => true,
                    'service' => 'google',
                    'url' => $url,
                    'response' => $response->json(),
                ];
            }

            Log::error("❌ Erreur Google Indexing API", [
                'url' => $url,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [
                'success' => false,
                'service' => 'google',
                'error' => $response->body(),
            ];

        } catch (\Exception $e) {
            Log::error("❌ Exception Google Indexing", [
                'url' => $url,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'service' => 'google',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Obtient un access token Google via Service Account
     * 
     * @return string Access token
     */
    protected function getGoogleAccessToken(): string
    {
        // Cache le token pendant 55 minutes (expire à 60)
        return Cache::remember('google_indexing_token', 55 * 60, function () {
            $credentials = json_decode($this->googleCredentials, true);

            // Création du JWT
            $jwt = $this->createGoogleJWT($credentials);

            // Échange JWT contre access token
            $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $jwt,
            ]);

            if (!$response->successful()) {
                throw new \RuntimeException('Failed to get Google access token: ' . $response->body());
            }

            return $response->json()['access_token'];
        });
    }

    /**
     * Crée un JWT pour l'authentification Google
     */
    protected function createGoogleJWT(array $credentials): string
    {
        $now = time();
        $header = base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
        
        $claimSet = [
            'iss' => $credentials['client_email'],
            'scope' => 'https://www.googleapis.com/auth/indexing',
            'aud' => 'https://oauth2.googleapis.com/token',
            'iat' => $now,
            'exp' => $now + 3600,
        ];
        
        $payload = base64_encode(json_encode($claimSet));
        
        // Signature avec clé privée
        $signature = '';
        openssl_sign(
            $header . '.' . $payload,
            $signature,
            $credentials['private_key'],
            OPENSSL_ALGO_SHA256
        );
        
        return $header . '.' . $payload . '.' . base64_encode($signature);
    }

    // =========================================================================
    // SOUMISSION BING URL SUBMISSION API
    // =========================================================================

    /**
     * Soumet une URL à Bing Webmaster Tools
     * 
     * @param string $url URL complète
     * @param string $siteUrl URL du site (ex: https://sos-expat.com)
     * @return array Résultat
     */
    public function notifyBing(string $url, string $siteUrl): array
    {
        if (!$this->isBingConfigured()) {
            Log::warning("Bing API non configurée");
            return ['success' => false, 'error' => 'Not configured'];
        }

        // Rate limit : 10 URLs par jour pour compte gratuit
        if (!$this->checkRateLimit('bing', 10)) {
            Log::warning("Rate limit Bing atteint");
            return ['success' => false, 'error' => 'Rate limit exceeded'];
        }

        try {
            $response = Http::post(self::BING_SUBMISSION_API, [
                'siteUrl' => $siteUrl,
                'url' => $url,
            ])->withHeaders([
                'Content-Type' => 'application/json',
                'apikey' => $this->bingApiKey,
            ]);

            if ($response->successful()) {
                $this->incrementRateLimit('bing');

                Log::info("✅ Bing notifié", ['url' => $url]);

                return [
                    'success' => true,
                    'service' => 'bing',
                    'url' => $url,
                ];
            }

            Log::error("❌ Erreur Bing API", [
                'url' => $url,
                'status' => $response->status(),
            ]);

            return [
                'success' => false,
                'service' => 'bing',
                'error' => $response->body(),
            ];

        } catch (\Exception $e) {
            Log::error("❌ Exception Bing", [
                'url' => $url,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'service' => 'bing',
                'error' => $e->getMessage(),
            ];
        }
    }

    // =========================================================================
    // INDEXNOW (Bing, Yandex, etc.)
    // =========================================================================

    /**
     * Soumet via IndexNow (Bing, Yandex, etc.)
     * 
     * @param string|array $urls URL(s) à soumettre
     * @param string $host Nom de domaine
     * @return array Résultat
     */
    public function notifyIndexNow($urls, string $host): array
    {
        if (!$this->isIndexNowConfigured()) {
            Log::warning("IndexNow non configuré");
            return ['success' => false, 'error' => 'Not configured'];
        }

        $urls = is_array($urls) ? $urls : [$urls];

        try {
            $response = Http::post(self::INDEXNOW_API, [
                'host' => $host,
                'key' => $this->indexNowKey,
                'keyLocation' => "https://{$host}/{$this->indexNowKey}.txt",
                'urlList' => $urls,
            ]);

            if ($response->successful() || $response->status() === 202) {
                Log::info("✅ IndexNow notifié", [
                    'host' => $host,
                    'urls_count' => count($urls),
                ]);

                return [
                    'success' => true,
                    'service' => 'indexnow',
                    'urls' => $urls,
                ];
            }

            Log::error("❌ Erreur IndexNow", [
                'status' => $response->status(),
            ]);

            return [
                'success' => false,
                'service' => 'indexnow',
                'error' => $response->body(),
            ];

        } catch (\Exception $e) {
            Log::error("❌ Exception IndexNow", [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'service' => 'indexnow',
                'error' => $e->getMessage(),
            ];
        }
    }

    // =========================================================================
    // SOUMISSION ARTICLE COMPLET (TOUTES LANGUES)
    // =========================================================================

    /**
     * Soumet un article à tous les moteurs de recherche
     * Inclut toutes les traductions
     * 
     * @param Article $article Article à soumettre
     * @return array Résultats globaux
     */
    public function submitArticle(Article $article): array
    {
        $results = [
            'article_id' => $article->id,
            'urls_submitted' => [],
            'google' => [],
            'bing' => [],
            'indexnow' => null,
        ];

        // URL principale
        $mainUrl = $article->canonical_url ?? $article->getFullUrl();
        $siteUrl = $article->platform->url ?? config('app.url');

        // Soumission Google
        if ($this->isGoogleConfigured()) {
            $results['google'][] = $this->notifyGoogle($mainUrl);
            $results['urls_submitted'][] = $mainUrl;
        }

        // Soumission Bing
        if ($this->isBingConfigured()) {
            $results['bing'][] = $this->notifyBing($mainUrl, $siteUrl);
        }

        // Collecte URLs traductions
        $allUrls = [$mainUrl];

        foreach ($article->translations as $translation) {
            $translationUrl = $translation->canonical_url;
            
            // Soumission Google pour chaque langue
            if ($this->isGoogleConfigured()) {
                $results['google'][] = $this->notifyGoogle($translationUrl);
                $results['urls_submitted'][] = $translationUrl;
            }

            // Soumission Bing pour chaque langue
            if ($this->isBingConfigured()) {
                $results['bing'][] = $this->notifyBing($translationUrl, $siteUrl);
            }

            $allUrls[] = $translationUrl;
        }

        // IndexNow batch (toutes URLs d'un coup)
        if ($this->isIndexNowConfigured()) {
            $host = parse_url($siteUrl, PHP_URL_HOST);
            $results['indexnow'] = $this->notifyIndexNow($allUrls, $host);
        }

        // Statistiques
        $results['total_urls'] = count($allUrls);
        $results['google_success'] = count(array_filter($results['google'], fn($r) => $r['success'] ?? false));
        $results['bing_success'] = count(array_filter($results['bing'], fn($r) => $r['success'] ?? false));

        Log::info("📊 Soumission article terminée", [
            'article_id' => $article->id,
            'total_urls' => $results['total_urls'],
            'google_success' => $results['google_success'],
            'bing_success' => $results['bing_success'],
        ]);

        return $results;
    }

    /**
     * Supprime un article de l'index (URL_DELETED)
     * 
     * @param Article $article Article supprimé
     * @return array Résultats
     */
    public function deleteArticle(Article $article): array
    {
        $results = [];

        $mainUrl = $article->canonical_url ?? $article->getFullUrl();

        // Notification Google URL_DELETED
        if ($this->isGoogleConfigured()) {
            $results['google'][] = $this->notifyGoogle($mainUrl, 'URL_DELETED');
        }

        // Traductions
        foreach ($article->translations as $translation) {
            if ($this->isGoogleConfigured()) {
                $results['google'][] = $this->notifyGoogle($translation->canonical_url, 'URL_DELETED');
            }
        }

        return $results;
    }

    // =========================================================================
    // RATE LIMITING
    // =========================================================================

    /**
     * Vérifie si le rate limit est respecté
     */
    protected function checkRateLimit(string $service, int $dailyLimit): bool
    {
        $key = "indexing_rate_limit:{$service}:" . now()->format('Y-m-d');
        $current = Cache::get($key, 0);

        return $current < $dailyLimit;
    }

    /**
     * Incrémente le compteur de rate limit
     */
    protected function incrementRateLimit(string $service): void
    {
        $key = "indexing_rate_limit:{$service}:" . now()->format('Y-m-d');
        $current = Cache::get($key, 0);
        Cache::put($key, $current + 1, now()->endOfDay());
    }

    /**
     * Obtient les stats de rate limit
     */
    public function getRateLimitStats(): array
    {
        $today = now()->format('Y-m-d');

        return [
            'google' => [
                'used' => Cache::get("indexing_rate_limit:google:{$today}", 0),
                'limit' => 200,
            ],
            'bing' => [
                'used' => Cache::get("indexing_rate_limit:bing:{$today}", 0),
                'limit' => 10,
            ],
        ];
    }

    // =========================================================================
    // CONFIGURATION
    // =========================================================================

    /**
     * Vérifie si Google est configuré
     */
    public function isGoogleConfigured(): bool
    {
        return !empty($this->googleCredentials);
    }

    /**
     * Vérifie si Bing est configuré
     */
    public function isBingConfigured(): bool
    {
        return !empty($this->bingApiKey);
    }

    /**
     * Vérifie si IndexNow est configuré
     */
    public function isIndexNowConfigured(): bool
    {
        return !empty($this->indexNowKey);
    }

    /**
     * Statut de configuration
     */
    public function getConfigStatus(): array
    {
        return [
            'google' => $this->isGoogleConfigured(),
            'bing' => $this->isBingConfigured(),
            'indexnow' => $this->isIndexNowConfigured(),
        ];
    }
}