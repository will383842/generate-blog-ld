<?php

namespace App\Jobs;

use App\Models\Article;
use App\Models\ImageGeneration;
use App\Services\AI\DalleService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

/**
 * Job de génération d'image pour un article
 * 
 * Génère une image via DALL-E 3 ou utilise une image de stock
 * selon la configuration.
 */
class GenerateImage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * ID de l'article
     *
     * @var int
     */
    protected int $articleId;

    /**
     * Forcer DALL-E même si stock disponible
     *
     * @var bool
     */
    protected bool $forceDalle;

    /**
     * Nombre de tentatives maximum
     *
     * @var int
     */
    public int $tries = 3;

    /**
     * Timeout en secondes
     *
     * @var int
     */
    public int $timeout = 120; // 2 minutes

    /**
     * Délais entre tentatives (backoff exponentiel)
     * 30s, 1min, 2min (DALL-E peut être lent)
     *
     * @return array<int>
     */
    public function backoff(): array
    {
        return [30, 60, 120];
    }

    /**
     * Créer une nouvelle instance du job
     *
     * @param int $articleId ID de l'article
     * @param bool $forceDalle Forcer DALL-E
     * @return void
     */
    public function __construct(int $articleId, bool $forceDalle = false)
    {
        $this->articleId = $articleId;
        $this->forceDalle = $forceDalle;
        
        // Queue configuration
        $this->onQueue('image-generation');
    }

    /**
     * Exécuter le job
     *
     * @param DalleService $dalleService
     * @return void
     */
    public function handle(DalleService $dalleService): void
    {
        $startTime = now();
        
        // Récupérer l'article
        $article = Article::findOrFail($this->articleId);

        // Vérifier si l'article a déjà une image
        if ($article->image_url && !$this->forceDalle) {
            Log::info('⏭️ Article possède déjà une image', [
                'article_id' => $article->id,
            ]);
            return;
        }

        Log::info('🎨 Démarrage génération image', [
            'article_id' => $article->id,
            'title' => $article->title,
            'force_dalle' => $this->forceDalle,
        ]);

        DB::beginTransaction();

        try {
            // Construire le prompt basé sur le titre et le contenu
            $prompt = $this->buildImagePrompt($article);

            // Générer l'image via DALL-E
            $result = $dalleService->generateImage([
                'prompt' => $prompt,
                'size' => config('content.dalle.size', '1792x1024'),
                'quality' => config('content.dalle.quality', 'standard'),
            ]);

            // Mettre à jour l'article
            $article->update([
                'image_url' => $result['url'],
                'image_alt' => $this->generateAltText($article),
            ]);

            // Logger la génération d'image
            ImageGeneration::create([
                'article_id' => $article->id,
                'prompt' => $prompt,
                'image_url' => $result['url'],
                'model' => 'dall-e-3',
                'size' => config('content.dalle.size'),
                'quality' => config('content.dalle.quality'),
                'cost' => $result['cost'] ?? 0.08,
                'status' => 'success',
            ]);

            DB::commit();

            $duration = $startTime->diffInSeconds(now());

            Log::info('✅ Image générée avec succès', [
                'article_id' => $article->id,
                'image_url' => $result['url'],
                'cost' => $result['cost'] ?? 0.08,
                'duration' => $duration . 's',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('❌ Échec génération image', [
                'article_id' => $article->id,
                'error' => $e->getMessage(),
                'attempt' => $this->attempts(),
            ]);

            // Logger l'échec
            ImageGeneration::create([
                'article_id' => $article->id,
                'prompt' => $this->buildImagePrompt($article),
                'model' => 'dall-e-3',
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            throw $e; // Relancer pour retry
        }
    }

    /**
     * Construire le prompt pour DALL-E
     *
     * @param Article $article
     * @return string
     */
    protected function buildImagePrompt(Article $article): string
    {
        // Extraire le thème principal
        $theme = $article->theme_type ?? 'expat services';
        
        // Extraire le pays
        $country = $article->country->name ?? 'international';

        // Construire un prompt descriptif
        $prompt = "Professional, modern illustration representing {$theme} in {$country}. ";
        $prompt .= "Clean design, vibrant colors, suitable for a blog article header. ";
        $prompt .= "No text, no people faces. Wide format 1792x1024 pixels.";

        return $prompt;
    }

    /**
     * Générer le texte alt pour l'image
     *
     * @param Article $article
     * @return string
     */
    protected function generateAltText(Article $article): string
    {
        // Alt text basé sur le titre et le pays
        $country = $article->country->name ?? '';
        $theme = $article->theme_type ?? 'services';

        return trim("{$theme} {$country} - {$article->title}");
    }

    /**
     * Gérer l'échec du job
     *
     * @param \Throwable $exception
     * @return void
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('💥 Échec définitif génération image', [
            'article_id' => $this->articleId,
            'error' => $exception->getMessage(),
        ]);

        // Marquer comme échoué définitivement
        ImageGeneration::create([
            'article_id' => $this->articleId,
            'model' => 'dall-e-3',
            'status' => 'failed_permanent',
            'error_message' => $exception->getMessage(),
        ]);
    }

    /**
     * Tags pour identification du job
     *
     * @return array
     */
    public function tags(): array
    {
        return [
            'image-generation',
            'article:' . $this->articleId,
        ];
    }
}