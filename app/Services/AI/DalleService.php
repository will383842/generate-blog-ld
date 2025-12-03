<?php

namespace App\Services\AI;

use App\Services\AI\Contracts\AIServiceInterface;
use App\Services\AI\Traits\HandlesAIRequests;
use App\Services\AI\Exceptions\RateLimitException;
use App\Services\AI\Exceptions\InsufficientQuotaException;
use App\Services\AI\Exceptions\ServerException;
use App\Services\AI\Exceptions\InvalidRequestException;
use App\Services\AI\Exceptions\ApiException;
use App\Models\ImageLibrary;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Intervention\Image\Facades\Image;

class DalleService implements AIServiceInterface
{
    use HandlesAIRequests;

    // =========================================================================
    // CONFIGURATION
    // =========================================================================

    protected string $apiKey;
    protected string $baseUrl = 'https://api.openai.com/v1';
    protected string $storageDisk;
    protected string $storagePath;

    // Modèles
    const MODEL_DALLE3 = 'dall-e-3';
    const MODEL_DALLE2 = 'dall-e-2';

    // Tailles disponibles
    const SIZE_SQUARE = '1024x1024';
    const SIZE_LANDSCAPE = '1792x1024';
    const SIZE_PORTRAIT = '1024x1792';

    // Qualités
    const QUALITY_STANDARD = 'standard';
    const QUALITY_HD = 'hd';

    // Tarifs par image (USD)
    protected array $pricing = [
        'dall-e-3' => [
            'standard' => ['1024x1024' => 0.04, '1024x1792' => 0.08, '1792x1024' => 0.08],
            'hd' => ['1024x1024' => 0.08, '1024x1792' => 0.12, '1792x1024' => 0.12],
        ],
        'dall-e-2' => [
            'standard' => ['256x256' => 0.016, '512x512' => 0.018, '1024x1024' => 0.02],
        ],
    ];

    // =========================================================================
    // CONSTRUCTEUR
    // =========================================================================

    public function __construct()
    {
        $this->apiKey = config('ai.dalle.api_key') ?? config('ai.openai.api_key');
        $this->storageDisk = config('ai.dalle.storage_disk', 'public');
        $this->storagePath = config('ai.dalle.storage_path', 'images/generated');
        
        // 🔧 AMÉLIORATION : Log warning au lieu d'exception (DALL-E est optionnel)
        if (empty($this->apiKey)) {
            Log::warning('DALL-E API key not configured - image generation will be disabled');
        }
    }

    // =========================================================================
    // INTERFACE IMPLEMENTATION
    // =========================================================================

    public function isAvailable(): bool
    {
        return !empty($this->apiKey);
    }

    public function getServiceName(): string
    {
        return 'dalle';
    }

    public function estimateCost(string $operation, array $params = []): float
    {
        $model = $params['model'] ?? self::MODEL_DALLE3;
        $quality = $params['quality'] ?? self::QUALITY_STANDARD;
        $size = $params['size'] ?? self::SIZE_LANDSCAPE;
        $count = $params['count'] ?? 1;

        return $this->getImagePrice($model, $quality, $size) * $count;
    }

    public function getUsageStats(): array
    {
        $today = now()->format('Y-m-d');

        return [
            'daily_cost' => Cache::get("ai_costs:dalle:{$today}", 0),
            'images_today' => Cache::get("ai_images:dalle:{$today}", 0),
        ];
    }

    // =========================================================================
    // MÉTHODES PRINCIPALES
    // =========================================================================

    /**
     * Générer une image
     */
    public function generateImage(array $params): array
    {
        $prompt = $params['prompt'];
        $model = $params['model'] ?? self::MODEL_DALLE3;
        $size = $params['size'] ?? self::SIZE_LANDSCAPE;
        $quality = $params['quality'] ?? self::QUALITY_STANDARD;
        $style = $params['style'] ?? 'natural'; // natural ou vivid

        if (!$this->isAvailable()) {
            throw new \RuntimeException(
                'DALL-E API key not configured. ' .
                'Please set OPENAI_API_KEY in your .env file'
            );
        }

        return $this->executeWithRetry(function () use ($prompt, $model, $size, $quality, $style) {
            
            $payload = [
                'model' => $model,
                'prompt' => $this->sanitizePrompt($prompt),
                'n' => 1,
                'size' => $size,
                'response_format' => 'url', // url ou b64_json
            ];

            // Options spécifiques DALL-E 3
            if ($model === self::MODEL_DALLE3) {
                $payload['quality'] = $quality;
                $payload['style'] = $style;
            }

            // Construire le client HTTP
            $httpClient = Http::withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
                'Content-Type' => 'application/json',
            ])->timeout(config('ai.dalle.timeout', 180)); // 🔧 CORRECTION : Timeout depuis config

            // 🔧 CORRECTION SSL : Désactiver vérification SSL en développement
            if (config('app.env') === 'local' || env('CURL_VERIFY_SSL') === 'false') {
                $httpClient = $httpClient->withOptions(['verify' => false]);
            }

            // Effectuer la requête
            $response = $httpClient->post("{$this->baseUrl}/images/generations", $payload);

            // 🔧 AMÉLIORATION : Gestion détaillée des erreurs
            if (!$response->successful()) {
                $this->handleApiError($response);
            }

            $data = $response->json();
            $imageData = $data['data'][0] ?? null;

            if (!$imageData) {
                throw new \RuntimeException('No image data in response');
            }

            // Calculer et enregistrer le coût
            $cost = $this->getImagePrice($model, $quality, $size);
            
            $this->recordCost('generate', $cost, [
                'model' => $model,
                'size' => $size,
                'quality' => $quality,
                'style' => $style,
            ]);

            // Incrémenter le compteur
            Cache::increment("ai_images:dalle:" . now()->format('Y-m-d'));

            return [
                'url' => $imageData['url'],
                'revised_prompt' => $imageData['revised_prompt'] ?? $prompt,
                'model' => $model,
                'size' => $size,
                'quality' => $quality,
                'cost' => $cost,
            ];

        }, 'generateImage');
    }

    /**
     * Générer et stocker une image
     */
    public function generateAndStore(array $params): ImageLibrary
    {
        // Générer l'image
        $result = $this->generateImage($params);

        // Télécharger et stocker
        $storedPath = $this->downloadAndStore($result['url'], $params);

        // Créer l'entrée en base
        $imageLibrary = ImageLibrary::create([
            'filename' => basename($storedPath),
            'original_filename' => basename($storedPath),
            'path' => $storedPath,
            'disk' => $this->storageDisk,
            'mime_type' => 'image/webp',
            'size' => Storage::disk($this->storageDisk)->size($storedPath),
            'width' => $this->extractWidth($params['size'] ?? self::SIZE_LANDSCAPE),
            'height' => $this->extractHeight($params['size'] ?? self::SIZE_LANDSCAPE),
            'alt_text' => $params['alt_text'] ?? $result['revised_prompt'],
            'source' => 'dalle',
            'generation_prompt' => $params['prompt'],
            'generation_model' => $result['model'],
            'generation_cost' => $result['cost'],
            'metadata' => [
                'revised_prompt' => $result['revised_prompt'],
                'quality' => $result['quality'],
                'original_url' => $result['url'],
            ],
        ]);

        return $imageLibrary;
    }

    /**
     * Télécharger et stocker une image depuis une URL
     */
    public function downloadAndStore(string $url, array $options = []): string
    {
        // Télécharger l'image
        $response = Http::timeout(60)->get($url);
        
        if (!$response->successful()) {
            throw new \RuntimeException("Failed to download image from URL");
        }

        $imageContent = $response->body();

        // Générer un nom de fichier unique
        $filename = $options['filename'] ?? Str::uuid();
        $extension = $options['convert_to_webp'] ?? config('ai.dalle.convert_to_webp', true) 
            ? 'webp' 
            : 'png';
        
        $fullFilename = "{$filename}.{$extension}";
        $path = "{$this->storagePath}/{$fullFilename}";

        // Optimiser l'image si demandé
        if ($extension === 'webp') {
            $imageContent = $this->optimizeImage($imageContent, $options);
        }

        // Stocker
        Storage::disk($this->storageDisk)->put($path, $imageContent);

        return $path;
    }

    /**
     * Optimiser une image (conversion WebP)
     */
    public function optimizeImage(string $imageContent, array $options = []): string
    {
        $quality = $options['webp_quality'] ?? config('ai.dalle.webp_quality', 85);

        try {
            $image = Image::make($imageContent);
            
            // Redimensionner si nécessaire
            if (isset($options['max_width']) && $image->width() > $options['max_width']) {
                $image->resize($options['max_width'], null, function ($constraint) {
                    $constraint->aspectRatio();
                    $constraint->upsize();
                });
            }

            return $image->encode('webp', $quality)->getEncoded();
            
        } catch (\Exception $e) {
            Log::warning("Image optimization failed: {$e->getMessage()}");
            return $imageContent; // Retourner l'original en cas d'erreur
        }
    }

    /**
     * Générer une image pour un article
     */
    public function generateForArticle(array $params): ImageLibrary
    {
        $title = $params['title'] ?? '';
        $theme = $params['theme'] ?? '';
        $country = $params['country'] ?? '';
        $style = $params['style'] ?? 'professional photography';

        // Construire un prompt optimisé pour les articles
        $prompt = $this->buildArticleImagePrompt($title, $theme, $country, $style);

        return $this->generateAndStore([
            'prompt' => $prompt,
            'size' => self::SIZE_LANDSCAPE, // Format blog/article
            'quality' => self::QUALITY_STANDARD,
            'style' => 'natural',
            'alt_text' => $this->generateAltText($title, $theme, $country),
        ]);
    }

    /**
     * Créer des variations d'une image existante (DALL-E 2 seulement)
     */
    public function createVariation(string $imagePath, int $count = 1): array
    {
        if (!$this->isAvailable()) {
            throw new \RuntimeException('DALL-E API key not configured');
        }

        $imageContent = Storage::disk($this->storageDisk)->get($imagePath);

        return $this->executeWithRetry(function () use ($imageContent, $count) {
            
            // Construire le client HTTP
            $httpClient = Http::withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
            ])->timeout(config('ai.dalle.timeout', 180));

            // 🔧 CORRECTION SSL : Désactiver vérification SSL en développement
            if (config('app.env') === 'local' || env('CURL_VERIFY_SSL') === 'false') {
                $httpClient = $httpClient->withOptions(['verify' => false]);
            }

            // Effectuer la requête
            $response = $httpClient->attach('image', $imageContent, 'image.png')
                ->post("{$this->baseUrl}/images/variations", [
                    'n' => min($count, 4),
                    'size' => self::SIZE_SQUARE,
                ]);

            if (!$response->successful()) {
                $this->handleApiError($response);
            }

            $data = $response->json();
            $cost = 0.02 * $count; // DALL-E 2 variation cost

            $this->recordCost('variation', $cost, [
                'model' => self::MODEL_DALLE2,
                'count' => $count,
            ]);

            return array_map(fn($item) => [
                'url' => $item['url'],
            ], $data['data'] ?? []);

        }, 'createVariation');
    }

    // =========================================================================
    // GESTION DES ERREURS
    // =========================================================================

    /**
     * 🔧 AMÉLIORATION : Gestion détaillée des erreurs API
     */
    protected function handleApiError($response): void
    {
        $status = $response->status();
        $error = $response->json()['error'] ?? [];
        $message = $error['message'] ?? $response->body();

        switch ($status) {
            case 429:
                throw new RateLimitException(
                    'DALL-E rate limit exceeded. ' . $message
                );

            case 402:
                throw new InsufficientQuotaException(
                    'DALL-E quota exceeded. Please check your billing. ' . $message
                );

            case 400:
                throw new InvalidRequestException('Invalid DALL-E request: ' . $message);

            case 401:
                throw new ApiException('Invalid API key: ' . $message);

            case 500:
            case 502:
            case 503:
                throw new ServerException(
                    'DALL-E server error (will retry automatically): ' . $message
                );

            default:
                throw new ApiException("DALL-E API error {$status}: " . $message);
        }
    }

    // =========================================================================
    // MÉTHODES PRIVÉES
    // =========================================================================

    /**
     * Obtenir le prix d'une image
     */
    private function getImagePrice(string $model, string $quality, string $size): float
    {
        return $this->pricing[$model][$quality][$size] ?? 0.08;
    }

    /**
     * Nettoyer un prompt
     */
    private function sanitizePrompt(string $prompt): string
    {
        // Supprimer les caractères problématiques
        $prompt = preg_replace('/[^\p{L}\p{N}\s\-\.,!?\'\"()]/u', '', $prompt);
        
        // Limiter la longueur (DALL-E 3 max 4000 chars)
        return mb_substr(trim($prompt), 0, 4000);
    }

    /**
     * Construire un prompt pour image d'article
     */
    private function buildArticleImagePrompt(string $title, string $theme, string $country, string $style): string
    {
        $prompts = [
            'professional photography' => "Professional editorial photograph representing {$theme} for expatriates in {$country}. " .
                "Clean, modern composition. Natural lighting. Suitable for a professional blog header. " .
                "No text or logos. High quality, 4K resolution.",
            
            'illustration' => "Modern flat illustration representing {$theme} for expats in {$country}. " .
                "Clean lines, vibrant colors, minimalist style. Professional and welcoming. " .
                "Suitable for a blog article. No text.",
            
            'abstract' => "Abstract professional background representing {$theme} and {$country}. " .
                "Subtle, elegant gradients and shapes. Modern corporate style. " .
                "Suitable as a blog header background.",
        ];

        $basePrompt = $prompts[$style] ?? $prompts['professional photography'];
        
        // Ajouter le contexte du titre
        if (!empty($title)) {
            $basePrompt .= " Context: {$title}";
        }

        return $basePrompt;
    }

    /**
     * Générer un texte alt automatique
     */
    private function generateAltText(string $title, string $theme, string $country): string
    {
        if (!empty($title)) {
            return "Image illustrant: {$title}";
        }
        
        return "Image sur le thème {$theme} pour expatriés en {$country}";
    }

    /**
     * Extraire la largeur d'une taille
     */
    private function extractWidth(string $size): int
    {
        return (int) explode('x', $size)[0];
    }

    /**
     * Extraire la hauteur d'une taille
     */
    private function extractHeight(string $size): int
    {
        return (int) explode('x', $size)[1];
    }
}