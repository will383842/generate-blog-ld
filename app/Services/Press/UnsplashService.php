<?php

namespace App\Services\Press;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * UnsplashService - Recherche et téléchargement de photos Unsplash
 * 
 * API gratuite : 50 requêtes/heure
 * Photos haute résolution avec attribution
 * 
 * @package App\Services\Press
 */
class UnsplashService
{
    protected string $accessKey;
    protected string $apiUrl = 'https://api.unsplash.com';
    
    public function __construct()
    {
        $this->accessKey = config('press.unsplash.access_key');
        
        if (empty($this->accessKey)) {
            throw new \Exception('UNSPLASH_ACCESS_KEY non configuré dans .env');
        }
    }

    /**
     * Rechercher des photos
     *
     * @param string $query Terme de recherche
     * @param int $perPage Nombre de résultats (max 30)
     * @param string $orientation portrait, landscape, squarish
     * @return array
     */
    public function searchPhotos(string $query, int $perPage = 10, string $orientation = 'landscape'): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => "Client-ID {$this->accessKey}",
            ])->get("{$this->apiUrl}/search/photos", [
                'query' => $query,
                'per_page' => min($perPage, 30),
                'orientation' => $orientation,
            ]);

            if (!$response->successful()) {
                throw new \Exception("Erreur API Unsplash : " . $response->status());
            }

            $data = $response->json();
            
            return array_map(function($photo) {
                return [
                    'id' => $photo['id'],
                    'url' => $photo['urls']['regular'] ?? $photo['urls']['full'],
                    'thumb' => $photo['urls']['thumb'],
                    'width' => $photo['width'],
                    'height' => $photo['height'],
                    'description' => $photo['description'] ?? $photo['alt_description'] ?? '',
                    'photographer' => [
                        'name' => $photo['user']['name'],
                        'username' => $photo['user']['username'],
                        'profile' => $photo['user']['links']['html'],
                    ],
                    'download_location' => $photo['links']['download_location'],
                ];
            }, $data['results'] ?? []);
            
        } catch (\Exception $e) {
            \Log::error('UnsplashService: Erreur recherche', [
                'query' => $query,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Télécharger une photo et la sauvegarder localement
     *
     * @param string $photoUrl URL de la photo
     * @param string|null $photoId ID de la photo (pour tracking)
     * @return array [path, metadata]
     */
    public function downloadPhoto(string $photoUrl, ?string $photoId = null): array
    {
        try {
            // Trigger download tracking si ID fourni
            if ($photoId) {
                $this->triggerDownload($photoId);
            }
            
            // Télécharger la photo
            $response = Http::timeout(30)->get($photoUrl);
            
            if (!$response->successful()) {
                throw new \Exception("Erreur téléchargement photo : " . $response->status());
            }
            
            // Générer un nom de fichier unique
            $extension = $this->getExtensionFromUrl($photoUrl);
            $filename = 'unsplash_' . Str::random(16) . '.' . $extension;
            $path = config('press.storage.media', 'press_releases/media') . '/' . $filename;
            
            // Sauvegarder
            Storage::put($path, $response->body());
            
            // Obtenir les métadonnées du fichier
            $fileSize = Storage::size($path);
            
            return [
                'path' => $path,
                'url' => Storage::url($path),
                'size' => $fileSize,
                'source' => 'unsplash',
            ];
            
        } catch (\Exception $e) {
            \Log::error('UnsplashService: Erreur téléchargement', [
                'url' => $photoUrl,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Télécharger une photo depuis les résultats de recherche
     *
     * @param array $photoData Données de searchPhotos()
     * @return array
     */
    public function downloadFromSearch(array $photoData): array
    {
        $result = $this->downloadPhoto($photoData['url'], $photoData['id']);
        
        // Ajouter les métadonnées Unsplash
        $result['metadata'] = [
            'unsplash_id' => $photoData['id'],
            'photographer' => $photoData['photographer']['name'],
            'photographer_username' => $photoData['photographer']['username'],
            'photographer_url' => $photoData['photographer']['profile'],
            'description' => $photoData['description'],
            'width' => $photoData['width'],
            'height' => $photoData['height'],
        ];
        
        // Générer le caption avec attribution
        $result['caption'] = $this->generateCaption($photoData);
        
        return $result;
    }

    /**
     * Générer un caption avec attribution
     *
     * @param array $photoData
     * @return string
     */
    protected function generateCaption(array $photoData): string
    {
        $photographer = $photoData['photographer']['name'];
        $username = $photoData['photographer']['username'];
        
        $caption = '';
        
        if (!empty($photoData['description'])) {
            $caption = $photoData['description'] . ' - ';
        }
        
        $caption .= "Photo par {$photographer} (@{$username}) sur Unsplash";
        
        return $caption;
    }

    /**
     * Trigger le téléchargement pour le tracking Unsplash (requis par l'API)
     *
     * @param string $photoId
     * @return void
     */
    protected function triggerDownload(string $photoId): void
    {
        try {
            // Récupérer l'URL de téléchargement
            $response = Http::withHeaders([
                'Authorization' => "Client-ID {$this->accessKey}",
            ])->get("{$this->apiUrl}/photos/{$photoId}");
            
            if ($response->successful()) {
                $downloadLocation = $response->json()['links']['download_location'] ?? null;
                
                if ($downloadLocation) {
                    // Trigger le téléchargement (requis par les conditions d'utilisation)
                    Http::withHeaders([
                        'Authorization' => "Client-ID {$this->accessKey}",
                    ])->get($downloadLocation);
                }
            }
        } catch (\Exception $e) {
            // Non bloquant
            \Log::warning('UnsplashService: Erreur trigger download', [
                'photo_id' => $photoId,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Obtenir l'extension depuis une URL
     *
     * @param string $url
     * @return string
     */
    protected function getExtensionFromUrl(string $url): string
    {
        $path = parse_url($url, PHP_URL_PATH);
        $extension = pathinfo($path, PATHINFO_EXTENSION);
        
        // Nettoyer les paramètres de query
        $extension = explode('?', $extension)[0];
        
        return $extension ?: 'jpg';
    }

    /**
     * Rechercher et télécharger la première photo correspondante
     *
     * @param string $query
     * @param string $orientation
     * @return array|null
     */
    public function searchAndDownload(string $query, string $orientation = 'landscape'): ?array
    {
        $photos = $this->searchPhotos($query, 1, $orientation);
        
        if (empty($photos)) {
            return null;
        }
        
        return $this->downloadFromSearch($photos[0]);
    }

    /**
     * Vérifier la disponibilité de l'API
     *
     * @return bool
     */
    public function checkApiAvailability(): bool
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => "Client-ID {$this->accessKey}",
            ])->timeout(5)->get("{$this->apiUrl}/");
            
            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }
}