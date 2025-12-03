<?php

namespace App\Services\Seo;

use App\Models\Article;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

/**
 * Service d'optimisation SEO des images
 * Génère alt text, title, captions optimisés
 */
class ImageSeoService
{
    // =========================================================================
    // ALT TEXT GÉNÉRATION
    // =========================================================================

    /**
     * Génère un alt text SEO-optimisé pour une image
     * 
     * @param Article $article Article associé
     * @param string|null $context Contexte de l'image
     * @return string Alt text optimisé
     */
    public function generateAltText(Article $article, ?string $context = null): string
    {
        $parts = [];

        // Inclure le mot-clé principal (3 premiers mots du titre)
        $mainKeyword = Str::words($article->title, 3, '');
        $parts[] = $mainKeyword;

        // Ajouter contexte si fourni
        if ($context) {
            $parts[] = $context;
        }

        // Ajouter localisation si pertinent
        if ($article->country) {
            $parts[] = $article->country->name;
        }

        $altText = implode(' - ', array_filter($parts));

        // Nettoyage et optimisation
        $altText = $this->cleanAltText($altText);

        // Limite : 125 caractères recommandé
        if (mb_strlen($altText) > 125) {
            $altText = mb_substr($altText, 0, 122) . '...';
        }

        return $altText;
    }

    /**
     * Améliore un alt text existant
     * 
     * @param string $existingAlt Alt text existant
     * @param Article $article Article associé
     * @return string Alt text amélioré
     */
    public function enhanceAltText(string $existingAlt, Article $article): string
    {
        // Si déjà bon (>20 caractères, pas de caractères spéciaux), garder
        if (mb_strlen($existingAlt) >= 20 && mb_strlen($existingAlt) <= 125) {
            return $existingAlt;
        }

        // Si trop court, enrichir
        if (mb_strlen($existingAlt) < 20) {
            $mainKeyword = Str::words($article->title, 3, '');
            return $existingAlt . ' - ' . $mainKeyword;
        }

        // Si trop long, tronquer
        if (mb_strlen($existingAlt) > 125) {
            return mb_substr($existingAlt, 0, 122) . '...';
        }

        return $existingAlt;
    }

    /**
     * Nettoie un alt text
     */
    protected function cleanAltText(string $altText): string
    {
        // Suppression HTML
        $altText = strip_tags($altText);

        // Suppression caractères spéciaux (garder lettres, chiffres, espaces, tirets)
        $altText = preg_replace('/[^\p{L}\p{N}\s\-]/u', '', $altText);

        // Normalisation espaces
        $altText = preg_replace('/\s+/', ' ', $altText);

        return trim($altText);
    }

    // =========================================================================
    // TITLE ATTRIBUTE
    // =========================================================================

    /**
     * Génère un title attribute pour une image
     * (Affiché au survol)
     * 
     * @param Article $article Article associé
     * @param string|null $specificTitle Titre spécifique
     * @return string Title attribute
     */
    public function generateImageTitle(Article $article, ?string $specificTitle = null): string
    {
        if ($specificTitle) {
            return $this->cleanAltText($specificTitle);
        }

        // Par défaut : titre de l'article
        return $article->title;
    }

    // =========================================================================
    // FILENAME OPTIMISATION
    // =========================================================================

    /**
     * Génère un nom de fichier SEO-friendly
     * 
     * @param Article $article Article associé
     * @param string $extension Extension (.jpg, .png, etc.)
     * @return string Nom de fichier optimisé
     */
    public function generateOptimizedFilename(Article $article, string $extension = 'jpg'): string
    {
        // Utiliser le slug de l'article
        $base = $article->slug;

        // Ajouter timestamp pour unicité
        $timestamp = now()->format('Ymd');

        // Format : article-slug-20241202.jpg
        return "{$base}-{$timestamp}.{$extension}";
    }

    /**
     * Optimise un nom de fichier existant
     * 
     * @param string $currentFilename Nom actuel
     * @param Article $article Article associé
     * @return string Nom optimisé
     */
    public function optimizeFilename(string $currentFilename, Article $article): string
    {
        // Récupérer l'extension
        $extension = pathinfo($currentFilename, PATHINFO_EXTENSION);

        // Si le nom contient déjà des mots-clés, garder
        $slug = Str::slug(pathinfo($currentFilename, PATHINFO_FILENAME));
        
        if (mb_strlen($slug) > 10 && !preg_match('/^image-\d+|img-\d+|photo-\d+/i', $slug)) {
            return $currentFilename; // Déjà optimisé
        }

        // Sinon, générer nouveau nom
        return $this->generateOptimizedFilename($article, $extension);
    }

    // =========================================================================
    // CAPTION GÉNÉRATION
    // =========================================================================

    /**
     * Génère une caption (légende) pour une image
     * 
     * @param Article $article Article associé
     * @param string|null $context Contexte de l'image
     * @return string Caption
     */
    public function generateCaption(Article $article, ?string $context = null): string
    {
        $caption = $context ?? $article->excerpt;

        // Limite : 250 caractères
        if (mb_strlen($caption) > 250) {
            $caption = mb_substr($caption, 0, 247) . '...';
        }

        return $caption;
    }

    // =========================================================================
    // IMAGE SITEMAP DATA
    // =========================================================================

    /**
     * Prépare les données d'une image pour sitemap images
     * 
     * @param string $imageUrl URL de l'image
     * @param Article $article Article associé
     * @return array Data pour sitemap
     */
    public function prepareImageSitemapData(string $imageUrl, Article $article): array
    {
        return [
            'loc' => $imageUrl,
            'title' => $this->generateImageTitle($article),
            'caption' => $this->generateCaption($article),
            'geo_location' => $article->country ? $article->country->name : null,
            'license' => null, // À définir si applicable
        ];
    }

    /**
     * Extrait toutes les images d'un contenu pour sitemap
     * 
     * @param string $content Contenu HTML
     * @param Article $article Article associé
     * @return array Images pour sitemap
     */
    public function extractImagesForSitemap(string $content, Article $article): array
    {
        $images = [];

        // Image principale
        if ($article->image_url) {
            $images[] = $this->prepareImageSitemapData($article->image_url, $article);
        }

        // Images dans le contenu
        preg_match_all('/<img[^>]+src=["\']([^"\']+)["\'][^>]*>/i', $content, $matches);
        
        foreach ($matches[1] as $imageUrl) {
            // Ignorer data: URLs et URLs externes
            if (str_starts_with($imageUrl, 'data:') || str_starts_with($imageUrl, '//') || preg_match('/^https?:\/\/(?!' . preg_quote(parse_url($article->platform->url, PHP_URL_HOST)) . ')/', $imageUrl)) {
                continue;
            }

            $images[] = $this->prepareImageSitemapData($imageUrl, $article);
        }

        return $images;
    }

    // =========================================================================
    // VALIDATION ET ANALYSE
    // =========================================================================

    /**
     * Analyse la qualité SEO des images d'un article
     * 
     * @param Article $article Article à analyser
     * @return array Score et suggestions
     */
    public function analyzeImagesSeo(Article $article): array
    {
        $score = 0;
        $issues = [];

        // Image principale
        $hasMainImage = !empty($article->image_url);
        $hasAltText = !empty($article->image_alt);

        if ($hasMainImage) {
            $score += 40;

            if ($hasAltText) {
                $altLength = mb_strlen($article->image_alt);
                
                if ($altLength >= 20 && $altLength <= 125) {
                    $score += 30;
                } elseif ($altLength < 20) {
                    $score += 15;
                    $issues[] = "Alt text trop court ({$altLength} caractères). Minimum : 20.";
                } else {
                    $score += 20;
                    $issues[] = "Alt text trop long ({$altLength} caractères). Maximum : 125.";
                }
            } else {
                $issues[] = "Image principale sans alt text. Ajouter une description.";
            }

            // Vérifier nom de fichier
            $filename = basename(parse_url($article->image_url, PHP_URL_PATH));
            if (preg_match('/^(image|img|photo)-?\d+/i', $filename)) {
                $issues[] = "Nom de fichier générique ({$filename}). Renommer avec mots-clés.";
            } else {
                $score += 15;
            }
        } else {
            $issues[] = "Aucune image principale. Ajouter une image d'en-tête.";
        }

        // Images dans contenu
        $contentImages = $this->extractImagesForSitemap($article->content, $article);
        $contentImagesCount = count($contentImages) - ($hasMainImage ? 1 : 0);

        if ($contentImagesCount >= 2) {
            $score += 15;
        } elseif ($contentImagesCount === 1) {
            $score += 10;
        } else {
            $issues[] = "Pas d'images dans le contenu. Ajouter 2-3 images illustratives.";
        }

        return [
            'score' => min($score, 100),
            'has_main_image' => $hasMainImage,
            'has_alt_text' => $hasAltText,
            'content_images_count' => $contentImagesCount,
            'total_images' => count($contentImages),
            'issues' => $issues,
        ];
    }

    /**
     * Vérifie si une image est optimisée
     * 
     * @param string $imageUrl URL de l'image
     * @return array Résultat de l'analyse
     */
    public function checkImageOptimization(string $imageUrl): array
    {
        $issues = [];
        $warnings = [];

        // Vérifier l'extension
        $extension = strtolower(pathinfo($imageUrl, PATHINFO_EXTENSION));
        
        if (!in_array($extension, ['jpg', 'jpeg', 'png', 'webp', 'svg'])) {
            $issues[] = "Format non standard : {$extension}";
        }

        // Vérifier si WebP (moderne)
        if ($extension === 'webp') {
            // Excellent
        } elseif (in_array($extension, ['jpg', 'jpeg', 'png'])) {
            $warnings[] = "Format classique. Envisager WebP pour meilleures performances.";
        }

        // Vérifier présence CDN (optionnel)
        if (str_contains($imageUrl, 'cdn') || str_contains($imageUrl, 'cloudflare') || str_contains($imageUrl, 'cloudinary')) {
            // Excellent
        } else {
            $warnings[] = "Image non servie par CDN. Envisager un CDN pour vitesse.";
        }

        return [
            'optimized' => empty($issues),
            'extension' => $extension,
            'issues' => $issues,
            'warnings' => $warnings,
        ];
    }

    // =========================================================================
    // SUGGESTIONS D'AMÉLIORATION
    // =========================================================================

    /**
     * Génère des suggestions d'amélioration pour les images
     * 
     * @param Article $article Article à améliorer
     * @return array Suggestions
     */
    public function getSuggestions(Article $article): array
    {
        $analysis = $this->analyzeImagesSeo($article);
        $suggestions = [];

        // Priorité haute
        if (!$analysis['has_main_image']) {
            $suggestions[] = [
                'priority' => 'high',
                'action' => 'add_main_image',
                'message' => 'Ajouter une image principale en haute résolution (1200×630px minimum).',
            ];
        }

        if ($analysis['has_main_image'] && !$analysis['has_alt_text']) {
            $suggestions[] = [
                'priority' => 'high',
                'action' => 'add_alt_text',
                'message' => 'Ajouter un alt text descriptif à l\'image principale.',
                'suggested_alt' => $this->generateAltText($article),
            ];
        }

        // Priorité moyenne
        if ($analysis['content_images_count'] < 2) {
            $suggestions[] = [
                'priority' => 'medium',
                'action' => 'add_content_images',
                'message' => 'Ajouter 2-3 images illustratives dans le contenu.',
            ];
        }

        // Vérification nom de fichier
        if ($article->image_url) {
            $filename = basename(parse_url($article->image_url, PHP_URL_PATH));
            if (preg_match('/^(image|img|photo)-?\d+/i', $filename)) {
                $suggestions[] = [
                    'priority' => 'low',
                    'action' => 'rename_file',
                    'message' => 'Renommer le fichier image avec des mots-clés pertinents.',
                    'current_name' => $filename,
                    'suggested_name' => $this->generateOptimizedFilename($article),
                ];
            }
        }

        return $suggestions;
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Vérifie si un alt text est de bonne qualité
     */
    public function isGoodAltText(string $altText): bool
    {
        $length = mb_strlen($altText);
        
        // Longueur appropriée
        if ($length < 10 || $length > 125) {
            return false;
        }

        // Pas de "image de", "photo de" au début
        if (preg_match('/^(image|photo|picture)\s+(of|de)\s+/i', $altText)) {
            return false;
        }

        // Contient des mots significatifs
        $words = str_word_count($altText);
        if ($words < 3) {
            return false;
        }

        return true;
    }
}