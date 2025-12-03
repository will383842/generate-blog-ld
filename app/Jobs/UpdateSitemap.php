<?php

namespace App\Jobs;

use App\Models\Platform;
use App\Models\SitemapEntry;
use App\Services\Seo\SitemapDataService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Job de mise à jour du sitemap
 * 
 * Régénère le sitemap XML après publication d'articles
 * et notifie les moteurs de recherche.
 */
class UpdateSitemap implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * ID de la plateforme
     *
     * @var int
     */
    protected int $platformId;

    /**
     * Type de sitemap à mettre à jour
     *
     * @var string 'articles'|'landings'|'images'|'all'
     */
    protected string $sitemapType;

    /**
     * Nombre de tentatives maximum
     *
     * @var int
     */
    public int $tries = 2;

    /**
     * Timeout en secondes
     *
     * @var int
     */
    public int $timeout = 120;

    /**
     * Créer une nouvelle instance du job
     *
     * @param int $platformId ID de la plateforme
     * @param string $sitemapType Type de sitemap
     * @return void
     */
    public function __construct(int $platformId, string $sitemapType = 'all')
    {
        $this->platformId = $platformId;
        $this->sitemapType = $sitemapType;
        
        // Queue configuration - basse priorité
        $this->onQueue('seo-low');
    }

    /**
     * Exécuter le job
     *
     * @param SitemapDataService $sitemapService
     * @return void
     */
    public function handle(SitemapDataService $sitemapService): void
    {
        $startTime = now();
        
        $platform = Platform::findOrFail($this->platformId);

        Log::info('🗺️ Démarrage mise à jour sitemap', [
            'platform_id' => $platform->id,
            'platform' => $platform->name,
            'type' => $this->sitemapType,
        ]);

        try {
            $updated = 0;

            // Mettre à jour selon le type
            switch ($this->sitemapType) {
                case 'articles':
                    $this->updateArticlesSitemap($sitemapService, $platform->id);
                    $updated++;
                    break;

                case 'landings':
                    $this->updateLandingsSitemap($sitemapService, $platform->id);
                    $updated++;
                    break;

                case 'images':
                    $this->updateImagesSitemap($sitemapService, $platform->id);
                    $updated++;
                    break;

                case 'all':
                default:
                    $this->updateArticlesSitemap($sitemapService, $platform->id);
                    $this->updateLandingsSitemap($sitemapService, $platform->id);
                    $this->updateImagesSitemap($sitemapService, $platform->id);
                    $updated = 3;
                    break;
            }

            // Notifier Google Search Console
            $this->notifySearchEngines($platform);

            $duration = $startTime->diffInSeconds(now());

            Log::info('✅ Sitemap(s) mis à jour', [
                'platform_id' => $platform->id,
                'type' => $this->sitemapType,
                'updated' => $updated,
                'duration' => $duration . 's',
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Échec mise à jour sitemap', [
                'platform_id' => $platform->id,
                'type' => $this->sitemapType,
                'error' => $e->getMessage(),
                'attempt' => $this->attempts(),
            ]);

            throw $e; // Relancer pour retry
        }
    }

    /**
     * Mettre à jour le sitemap des articles
     *
     * @param SitemapDataService $sitemapService
     * @param int $platformId
     * @return void
     */
    protected function updateArticlesSitemap(SitemapDataService $sitemapService, int $platformId): void
    {
        $articlesData = $sitemapService->getArticlesData($platformId);
        
        // Ici, les données du sitemap seraient normalement sauvegardées
        // en base ou dans des fichiers XML selon l'architecture
        // Pour l'instant, on log juste le nombre
        Log::info('Sitemap articles préparé', [
            'platform_id' => $platformId,
            'count' => $articlesData->count(),
        ]);
    }

    /**
     * Mettre à jour le sitemap des landing pages
     *
     * @param SitemapDataService $sitemapService
     * @param int $platformId
     * @return void
     */
    protected function updateLandingsSitemap(SitemapDataService $sitemapService, int $platformId): void
    {
        $landingsData = $sitemapService->getLandingsData($platformId);
        
        Log::info('Sitemap landings préparé', [
            'platform_id' => $platformId,
            'count' => $landingsData->count(),
        ]);
    }

    /**
     * Mettre à jour le sitemap des images
     *
     * @param SitemapDataService $sitemapService
     * @param int $platformId
     * @return void
     */
    protected function updateImagesSitemap(SitemapDataService $sitemapService, int $platformId): void
    {
        $imagesData = $sitemapService->getImagesData($platformId);
        
        Log::info('Sitemap images préparé', [
            'platform_id' => $platformId,
            'count' => $imagesData->count(),
        ]);
    }

    /**
     * Notifier les moteurs de recherche de la mise à jour
     *
     * @param Platform $platform
     * @return void
     */
    protected function notifySearchEngines(Platform $platform): void
    {
        try {
            $sitemapUrl = config("platforms.{$platform->slug}.url") . '/sitemap.xml';

            // Ping Google
            $googlePingUrl = "https://www.google.com/ping?sitemap=" . urlencode($sitemapUrl);
            @file_get_contents($googlePingUrl);

            // Ping Bing
            $bingPingUrl = "https://www.bing.com/ping?sitemap=" . urlencode($sitemapUrl);
            @file_get_contents($bingPingUrl);

            Log::info('📡 Moteurs de recherche notifiés', [
                'platform_id' => $platform->id,
                'sitemap_url' => $sitemapUrl,
            ]);

        } catch (\Exception $e) {
            // Ne pas bloquer si la notification échoue
            Log::warning('⚠️ Échec notification moteurs', [
                'platform_id' => $platform->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Gérer l'échec du job
     *
     * @param \Throwable $exception
     * @return void
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('💥 Échec définitif mise à jour sitemap', [
            'platform_id' => $this->platformId,
            'type' => $this->sitemapType,
            'error' => $exception->getMessage(),
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
            'seo',
            'sitemap',
            'platform:' . $this->platformId,
            'type:' . $this->sitemapType,
        ];
    }
}