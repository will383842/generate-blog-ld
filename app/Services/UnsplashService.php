<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

/**
 * UnsplashService - Service conforme API Unsplash
 * 
 * RÈGLES STRICTES :
 * - Hotlinking uniquement (URLs directes, pas de téléchargement)
 * - Attribution visible obligatoire (HTML formaté + UTM)
 * - Tracking automatique (download_location endpoint)
 * - Pas de stockage local des images
 * 
 * @package App\Services
 */
class UnsplashService
{
    protected string $baseUrl = 'https://api.unsplash.com';
    protected string $accessKey;
    protected string $utmSource = 'ulixai';
    protected int $perPage = 20;
    protected int $defaultWidth = 1200;
    protected int $defaultQuality = 85;

    public function __construct()
    {
        $this->accessKey = config('services.unsplash.access_key');
        
        if (empty($this->accessKey)) {
            throw new \Exception('Unsplash Access Key non configurée');
        }
    }

    /**
     * Rechercher des photos par mots-clés
     *
     * @param string|array $query Mots-clés (string ou array)
     * @param array $options Options supplémentaires
     * @return array|null Photo trouvée ou null
     */
    public function searchPhoto($query, array $options = []): ?array
    {
        try {
            // Convertir array en string si nécessaire
            $searchQuery = is_array($query) ? implode(' ', $query) : $query;
            
            // Options par défaut
            $params = array_merge([
                'query' => $searchQuery,
                'per_page' => $options['per_page'] ?? $this->perPage,
                'orientation' => $options['orientation'] ?? 'landscape',
                'content_filter' => 'high', // Filtrer contenu sensible
            ], $options['params'] ?? []);
            
            // Cache pour 1 heure (limite: 50 req/h)
            $cacheKey = 'unsplash_search_' . md5(json_encode($params));
            
            $response = Cache::remember($cacheKey, 3600, function () use ($params) {
                return Http::withHeaders([
                    'Authorization' => 'Client-ID ' . $this->accessKey,
                    'Accept-Version' => 'v1',
                ])->get($this->baseUrl . '/search/photos', $params);
            });
            
            if (!$response->successful()) {
                Log::warning('Unsplash search failed', [
                    'status' => $response->status(),
                    'query' => $searchQuery,
                ]);
                return null;
            }
            
            $data = $response->json();
            
            if (empty($data['results'])) {
                Log::info('No Unsplash results', ['query' => $searchQuery]);
                return null;
            }
            
            // Prendre la première photo (meilleur match)
            $photo = $data['results'][0];
            
            // Tracker le download obligatoire
            $this->trackDownload($photo['links']['download_location']);
            
            // Formater les données
            return $this->formatPhotoData($photo);
            
        } catch (\Exception $e) {
            Log::error('Unsplash search error', [
                'query' => $query,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Obtenir une photo aléatoire
     *
     * @param array $options Filtres (query, orientation, etc.)
     * @return array|null
     */
    public function randomPhoto(array $options = []): ?array
    {
        try {
            $params = array_merge([
                'orientation' => 'landscape',
                'content_filter' => 'high',
            ], $options);
            
            $response = Http::withHeaders([
                'Authorization' => 'Client-ID ' . $this->accessKey,
                'Accept-Version' => 'v1',
            ])->get($this->baseUrl . '/photos/random', $params);
            
            if (!$response->successful()) {
                return null;
            }
            
            $photo = $response->json();
            
            // Tracker
            $this->trackDownload($photo['links']['download_location']);
            
            return $this->formatPhotoData($photo);
            
        } catch (\Exception $e) {
            Log::error('Unsplash random error', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Tracker le téléchargement (OBLIGATOIRE Unsplash)
     *
     * @param string $downloadUrl URL download_location de la photo
     * @return void
     */
    protected function trackDownload(string $downloadUrl): void
    {
        try {
            Http::withHeaders([
                'Authorization' => 'Client-ID ' . $this->accessKey,
                'Accept-Version' => 'v1',
            ])->get($downloadUrl);
            
        } catch (\Exception $e) {
            Log::warning('Unsplash download tracking failed', [
                'url' => $downloadUrl,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Formater les données de la photo
     *
     * @param array $photo Données brutes Unsplash
     * @return array Données formatées
     */
    protected function formatPhotoData(array $photo): array
    {
        $photographer = $photo['user']['name'];
        $photographerUsername = $photo['user']['username'];
        $photographerId = $photo['id'];
        
        // URLs avec UTM parameters
        $photographerUrl = "https://unsplash.com/@{$photographerUsername}?" . http_build_query([
            'utm_source' => $this->utmSource,
            'utm_medium' => 'referral',
        ]);
        
        $unsplashUrl = "https://unsplash.com?" . http_build_query([
            'utm_source' => $this->utmSource,
            'utm_medium' => 'referral',
        ]);
        
        // URL de l'image (hotlinking)
        $imageUrl = $photo['urls']['regular'] . '&w=' . $this->defaultWidth . '&q=' . $this->defaultQuality;
        
        // Attribution HTML conforme
        $attributionHtml = sprintf(
            'Photo by <a href="%s" target="_blank" rel="noopener">%s</a> on <a href="%s" target="_blank" rel="noopener">Unsplash</a>',
            $photographerUrl,
            htmlspecialchars($photographer),
            $unsplashUrl
        );
        
        return [
            'id' => $photographerId,
            'url' => $imageUrl,
            'url_raw' => $photo['urls']['raw'],
            'url_full' => $photo['urls']['full'],
            'url_regular' => $photo['urls']['regular'],
            'url_small' => $photo['urls']['small'],
            'url_thumb' => $photo['urls']['thumb'],
            'width' => $photo['width'],
            'height' => $photo['height'],
            'color' => $photo['color'],
            'alt_description' => $photo['alt_description'] ?? $photo['description'] ?? '',
            'description' => $photo['description'],
            'photographer' => $photographer,
            'photographer_username' => $photographerUsername,
            'photographer_url' => $photographerUrl,
            'unsplash_url' => $unsplashUrl,
            'attribution_html' => $attributionHtml,
            'download_location' => $photo['links']['download_location'],
            'source' => 'unsplash',
        ];
    }

    /**
     * Générer URL optimisée pour une dimension spécifique
     *
     * @param string $baseUrl URL de base Unsplash
     * @param int $width Largeur souhaitée
     * @param int $quality Qualité (1-100)
     * @return string
     */
    public function getOptimizedUrl(string $baseUrl, int $width = null, int $quality = null): string
    {
        $params = [];
        
        if ($width) {
            $params['w'] = $width;
        }
        
        if ($quality) {
            $params['q'] = $quality;
        }
        
        if (empty($params)) {
            return $baseUrl;
        }
        
        $separator = str_contains($baseUrl, '?') ? '&' : '?';
        return $baseUrl . $separator . http_build_query($params);
    }

    /**
     * Rechercher par collection Unsplash
     *
     * @param string $collectionId ID de la collection
     * @param int $perPage Nombre de photos
     * @return array Photos de la collection
     */
    public function getCollectionPhotos(string $collectionId, int $perPage = 20): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Client-ID ' . $this->accessKey,
                'Accept-Version' => 'v1',
            ])->get($this->baseUrl . "/collections/{$collectionId}/photos", [
                'per_page' => $perPage,
            ]);
            
            if (!$response->successful()) {
                return [];
            }
            
            $photos = $response->json();
            
            return array_map(function ($photo) {
                $this->trackDownload($photo['links']['download_location']);
                return $this->formatPhotoData($photo);
            }, $photos);
            
        } catch (\Exception $e) {
            Log::error('Unsplash collection error', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Chercher une image adaptée au contexte
     *
     * @param array $context Contexte (theme, country, category)
     * @return array|null
     */
    public function findContextualImage(array $context): ?array
    {
        // Construire query intelligente
        $keywords = [];
        
        if (!empty($context['theme'])) {
            $keywords[] = $context['theme'];
        }
        
        if (!empty($context['country'])) {
            $keywords[] = $context['country'];
        }
        
        if (!empty($context['category'])) {
            $keywords[] = $context['category'];
        }
        
        if (!empty($context['keywords'])) {
            if (is_array($context['keywords'])) {
                $keywords = array_merge($keywords, $context['keywords']);
            } else {
                $keywords[] = $context['keywords'];
            }
        }
        
        // Fallback si aucun mot-clé
        if (empty($keywords)) {
            $keywords = ['business', 'professional'];
        }
        
        return $this->searchPhoto($keywords, [
            'orientation' => $context['orientation'] ?? 'landscape',
        ]);
    }
}