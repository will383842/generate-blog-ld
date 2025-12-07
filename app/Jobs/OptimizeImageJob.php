<?php

namespace App\Jobs;

use App\Models\ImageLibrary;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Intervention\Image\Facades\Image;

/**
 * OptimizeImageJob - Conversion WebP asynchrone
 *
 * Optimise les images générées par DALL-E en arrière-plan pour ne pas
 * bloquer le thread principal lors de la génération d'articles.
 */
class OptimizeImageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30;
    public int $timeout = 120;

    public function __construct(
        public int $imageId,
        public int $quality = 85,
        public ?int $maxWidth = null
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $image = ImageLibrary::find($this->imageId);

        if (!$image) {
            Log::warning('OptimizeImageJob: Image introuvable', ['image_id' => $this->imageId]);
            return;
        }

        // Vérifier si déjà optimisée
        if ($image->optimized_at !== null) {
            Log::info('OptimizeImageJob: Image déjà optimisée', ['image_id' => $this->imageId]);
            return;
        }

        try {
            // Lire l'image depuis le stockage
            $content = Storage::disk($image->disk)->get($image->path);

            if (empty($content)) {
                throw new \RuntimeException('Contenu image vide');
            }

            // Créer l'image Intervention
            $img = Image::make($content);

            // Redimensionner si nécessaire
            if ($this->maxWidth && $img->width() > $this->maxWidth) {
                $img->resize($this->maxWidth, null, function ($constraint) {
                    $constraint->aspectRatio();
                    $constraint->upsize();
                });

                Log::info('OptimizeImageJob: Image redimensionnée', [
                    'image_id' => $this->imageId,
                    'new_width' => $img->width(),
                ]);
            }

            // Encoder en WebP
            $optimized = $img->encode('webp', $this->quality)->getEncoded();

            // Nouveau chemin avec extension .webp
            $newPath = preg_replace('/\.(png|jpg|jpeg|gif)$/i', '.webp', $image->path);

            // Si le chemin n'a pas changé (déjà .webp), ajouter un suffixe
            if ($newPath === $image->path) {
                $newPath = preg_replace('/\.webp$/i', '_optimized.webp', $image->path);
            }

            // Sauvegarder l'image optimisée
            Storage::disk($image->disk)->put($newPath, $optimized);

            // Supprimer l'ancien fichier si différent
            if ($newPath !== $image->path && Storage::disk($image->disk)->exists($image->path)) {
                Storage::disk($image->disk)->delete($image->path);
            }

            // Mettre à jour l'enregistrement
            $image->update([
                'path' => $newPath,
                'filename' => basename($newPath),
                'mime_type' => 'image/webp',
                'size' => strlen($optimized),
                'width' => $img->width(),
                'height' => $img->height(),
                'optimized_at' => now(),
            ]);

            Log::info('OptimizeImageJob: Image optimisée avec succès', [
                'image_id' => $this->imageId,
                'original_size' => strlen($content),
                'optimized_size' => strlen($optimized),
                'reduction_percent' => round((1 - strlen($optimized) / strlen($content)) * 100, 1),
            ]);

        } catch (\Exception $e) {
            Log::error('OptimizeImageJob: Erreur optimisation', [
                'image_id' => $this->imageId,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('OptimizeImageJob: Échec définitif', [
            'image_id' => $this->imageId,
            'error' => $exception->getMessage(),
        ]);
    }
}
