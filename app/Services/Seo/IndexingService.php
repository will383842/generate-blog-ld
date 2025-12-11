<?php

namespace App\Services\Seo;

use App\Models\Article;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

/**
 * Service d'indexation automatique multi-moteurs
 * Google Indexing API + Bing Webmaster + IndexNow
 */
class IndexingService
{
    /**
     * Soumet URL à tous les moteurs de recherche
     */
    public function submitUrl(string $url, string $type = 'URL_UPDATED'): array
    {
        $results = [
            'google' => $this->submitToGoogle($url, $type),
            'bing' => $this->submitToBing($url),
            'indexnow' => $this->submitToIndexNow($url)
        ];

        Log::info('📡 URL soumise aux moteurs', [
            'url' => $url,
            'results' => $results
        ]);

        return $results;
    }

    /**
     * Google Indexing API
     * Rate limit: 200 requests/day
     */
    protected function submitToGoogle(string $url, string $type): array
    {
        try {
            // Vérification rate limit
            if (!$this->checkGoogleRateLimit()) {
                return ['success' => false, 'error' => 'Rate limit dépassé (200/day)'];
            }

            $endpoint = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
            $accessToken = $this->getGoogleAccessToken();

            if (!$accessToken) {
                return ['success' => false, 'error' => 'Token Google non disponible'];
            }

            $response = Http::withToken($accessToken)
                ->post($endpoint, [
                    'url' => $url,
                    'type' => $type // URL_UPDATED ou URL_DELETED
                ]);

            if ($response->successful()) {
                $this->incrementGoogleRateLimit();
                
                return [
                    'success' => true,
                    'response' => $response->json()
                ];
            }

            return [
                'success' => false,
                'error' => $response->body(),
                'status' => $response->status()
            ];

        } catch (\Exception $e) {
            Log::error('Erreur Google Indexing API', [
                'error' => $e->getMessage(),
                'url' => $url
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Bing Webmaster API
     * Rate limit: 10,000 requests/day
     */
    protected function submitToBing(string $url): array
    {
        try {
            $apiKey = config('seo.bing_webmaster_key');
            
            if (!$apiKey) {
                return ['success' => false, 'error' => 'Clé Bing non configurée'];
            }

            $endpoint = 'https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch';
            $siteUrl = parse_url($url, PHP_URL_SCHEME) . '://' . parse_url($url, PHP_URL_HOST);

            $response = Http::withHeaders([
                'Content-Type' => 'application/json; charset=utf-8'
            ])->post($endpoint . "?apikey={$apiKey}", [
                'siteUrl' => $siteUrl,
                'urlList' => [$url]
            ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'response' => $response->json()
                ];
            }

            return [
                'success' => false,
                'error' => $response->body(),
                'status' => $response->status()
            ];

        } catch (\Exception $e) {
            Log::error('Erreur Bing Webmaster API', [
                'error' => $e->getMessage(),
                'url' => $url
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * IndexNow (Bing, Yandex, Seznam, Naver)
     * Pas de rate limit
     */
    protected function submitToIndexNow(string $url): array
    {
        try {
            $apiKey = config('seo.indexnow_key');
            
            if (!$apiKey) {
                return ['success' => false, 'error' => 'Clé IndexNow non configurée'];
            }

            $host = parse_url($url, PHP_URL_HOST);
            $endpoint = "https://api.indexnow.org/indexnow";

            $response = Http::get($endpoint, [
                'url' => $url,
                'key' => $apiKey,
                'keyLocation' => "https://{$host}/{$apiKey}.txt"
            ]);

            // IndexNow retourne 200 même pour erreurs
            if ($response->successful()) {
                return [
                    'success' => true,
                    'response' => $response->body()
                ];
            }

            return [
                'success' => false,
                'error' => $response->body(),
                'status' => $response->status()
            ];

        } catch (\Exception $e) {
            Log::error('Erreur IndexNow', [
                'error' => $e->getMessage(),
                'url' => $url
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Batch submission (plusieurs URLs)
     */
    public function submitBatch(array $urls, int $delayMs = 1000): array
    {
        $results = [];

        foreach ($urls as $url) {
            $results[$url] = $this->submitUrl($url);
            
            // Délai entre requêtes pour éviter rate limiting
            usleep($delayMs * 1000);
        }

        return $results;
    }

    /**
     * Supprime URL de l'index
     */
    public function removeUrl(string $url): array
    {
        return [
            'google' => $this->submitToGoogle($url, 'URL_DELETED'),
            // Bing et IndexNow ne supportent pas la suppression directe
            'bing' => ['success' => false, 'error' => 'Suppression non supportée'],
            'indexnow' => ['success' => false, 'error' => 'Suppression non supportée']
        ];
    }

    /**
     * Vérifie statut indexation Google
     */
    public function checkGoogleIndexStatus(string $url): array
    {
        try {
            $endpoint = "https://indexing.googleapis.com/v3/urlNotifications/metadata";
            $accessToken = $this->getGoogleAccessToken();

            if (!$accessToken) {
                return ['error' => 'Token non disponible'];
            }

            $response = Http::withToken($accessToken)
                ->get($endpoint, ['url' => $url]);

            if ($response->successful()) {
                return $response->json();
            }

            return ['error' => $response->body()];

        } catch (\Exception $e) {
            Log::error('Erreur vérification statut Google', [
                'error' => $e->getMessage()
            ]);

            return ['error' => $e->getMessage()];
        }
    }

    /**
     * Génère sitemap.xml automatique
     */
    public function generateSitemap(): string
    {
        $articles = Article::where('status', 'published')
                          ->orderBy('updated_at', 'desc')
                          ->get();

        $xml = '<?xml version="1.0" encoding="UTF-8"?>';
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

        foreach ($articles as $article) {
            $xml .= '<url>';
            $xml .= "<loc>{$article->url}</loc>";
            $xml .= "<lastmod>{$article->updated_at->format('Y-m-d')}</lastmod>";
            $xml .= '<changefreq>weekly</changefreq>';
            $xml .= '<priority>0.8</priority>';
            $xml .= '</url>';
        }

        $xml .= '</urlset>';

        // Sauvegarde
        file_put_contents(public_path('sitemap.xml'), $xml);

        Log::info('✅ Sitemap généré', ['articles' => count($articles)]);

        return $xml;
    }

    /**
     * Soumet sitemap à Google/Bing
     */
    public function submitSitemap(string $sitemapUrl): array
    {
        return [
            'google' => $this->submitSitemapToGoogle($sitemapUrl),
            'bing' => $this->submitSitemapToBing($sitemapUrl)
        ];
    }

    protected function submitSitemapToGoogle(string $sitemapUrl): array
    {
        try {
            $endpoint = 'https://www.google.com/ping';
            
            $response = Http::get($endpoint, [
                'sitemap' => $sitemapUrl
            ]);

            return [
                'success' => $response->successful(),
                'status' => $response->status()
            ];

        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    protected function submitSitemapToBing(string $sitemapUrl): array
    {
        try {
            $apiKey = config('seo.bing_webmaster_key');
            $endpoint = "https://ssl.bing.com/webmaster/api.svc/json/SubmitSitemap";

            $response = Http::post($endpoint . "?apikey={$apiKey}", [
                'siteUrl' => parse_url($sitemapUrl, PHP_URL_SCHEME) . '://' . parse_url($sitemapUrl, PHP_URL_HOST),
                'feedUrl' => $sitemapUrl
            ]);

            return [
                'success' => $response->successful(),
                'status' => $response->status()
            ];

        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Rate limiting Google (200/day)
     */
    protected function checkGoogleRateLimit(): bool
    {
        $key = 'google_indexing_requests_' . date('Y-m-d');
        $count = Cache::get($key, 0);

        return $count < 200;
    }

    protected function incrementGoogleRateLimit(): void
    {
        $key = 'google_indexing_requests_' . date('Y-m-d');
        $count = Cache::get($key, 0);
        
        Cache::put($key, $count + 1, now()->endOfDay());
    }

    /**
     * Récupère access token Google
     */
    protected function getGoogleAccessToken(): ?string
    {
        // TODO: Implémentation OAuth2 Google
        // Pour l'instant: utiliser service account JSON key
        return config('seo.google_indexing_token');
    }
}
