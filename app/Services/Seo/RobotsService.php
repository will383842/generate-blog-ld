<?php

namespace App\Services\Seo;

use App\Models\Platform;
use Illuminate\Support\Facades\Log;

/**
 * Service de génération de directives robots.txt
 * Prépare les règles pour contrôler le crawl des moteurs
 */
class RobotsService
{
    // =========================================================================
    // GÉNÉRATION ROBOTS.TXT
    // =========================================================================

    /**
     * Génère le contenu complet du robots.txt pour une plateforme
     * 
     * @param Platform $platform Plateforme
     * @param array $options Options personnalisées
     * @return string Contenu robots.txt
     */
    public function generateRobotsTxt(Platform $platform, array $options = []): string
    {
        $lines = [];

        // En-tête
        $lines[] = "# Robots.txt pour {$platform->name}";
        $lines[] = "# Généré automatiquement le " . now()->format('Y-m-d H:i:s');
        $lines[] = "";

        // User-agent par défaut (tous les robots)
        $lines[] = "User-agent: *";

        // Autoriser tout par défaut
        $lines[] = "Allow: /";
        $lines[] = "";

        // Désactiver crawl de certains chemins
        $disallowPaths = $this->getDisallowPaths($options);
        if (!empty($disallowPaths)) {
            $lines[] = "# Chemins interdits";
            foreach ($disallowPaths as $path) {
                $lines[] = "Disallow: {$path}";
            }
            $lines[] = "";
        }

        // Sitemaps
        $sitemaps = $this->getSitemapUrls($platform);
        if (!empty($sitemaps)) {
            $lines[] = "# Sitemaps";
            foreach ($sitemaps as $sitemap) {
                $lines[] = "Sitemap: {$sitemap}";
            }
            $lines[] = "";
        }

        // Règles spécifiques par robot
        $specificRules = $this->getSpecificBotRules($options);
        if (!empty($specificRules)) {
            foreach ($specificRules as $botName => $rules) {
                $lines[] = "# Règles pour {$botName}";
                $lines[] = "User-agent: {$botName}";
                foreach ($rules as $rule) {
                    $lines[] = $rule;
                }
                $lines[] = "";
            }
        }

        // Crawl-delay (si nécessaire)
        if ($options['crawl_delay'] ?? false) {
            $lines[] = "# Délai de crawl";
            $lines[] = "Crawl-delay: " . ($options['crawl_delay_seconds'] ?? 1);
            $lines[] = "";
        }

        $content = implode("\n", $lines);

        Log::debug("🤖 Robots.txt généré", [
            'platform' => $platform->name,
            'lines' => count($lines),
        ]);

        return $content;
    }

    /**
     * Récupère les chemins à interdire au crawl
     */
    protected function getDisallowPaths(array $options): array
    {
        $defaultPaths = [
            '/admin',
            '/api',
            '/private',
            '/*.json$',
            '/search',
            '/login',
            '/register',
            '/password',
            '/profile',
            '/dashboard',
            '/cart',
            '/checkout',
        ];

        // Ajouter chemins personnalisés
        $customPaths = $options['additional_disallow'] ?? [];

        return array_merge($defaultPaths, $customPaths);
    }

    /**
     * Récupère les URLs des sitemaps
     */
    protected function getSitemapUrls(Platform $platform): array
    {
        $baseUrl = $platform->url;

        return [
            "{$baseUrl}/sitemap.xml",
            // Ou sitemap index si plusieurs sitemaps
            // "{$baseUrl}/sitemap-index.xml",
        ];
    }

    /**
     * Récupère les règles spécifiques par bot
     */
    protected function getSpecificBotRules(array $options): array
    {
        $rules = [];

        // GPTBot (ChatGPT)
        if ($options['block_gptbot'] ?? true) {
            $rules['GPTBot'] = [
                'Disallow: /',
            ];
        }

        // CCBot (Common Crawl)
        if ($options['block_ccbot'] ?? false) {
            $rules['CCBot'] = [
                'Disallow: /',
            ];
        }

        // Autres bots à bloquer si souhaité
        if ($options['block_ai_bots'] ?? false) {
            $rules['GPTBot'] = ['Disallow: /'];
            $rules['ChatGPT-User'] = ['Disallow: /'];
            $rules['CCBot'] = ['Disallow: /'];
            $rules['anthropic-ai'] = ['Disallow: /'];
            $rules['Claude-Web'] = ['Disallow: /'];
        }

        return $rules;
    }

    // =========================================================================
    // MÉTA ROBOTS (pour pages individuelles)
    // =========================================================================

    /**
     * Génère la meta robots pour une page
     * 
     * @param string $indexing 'index' ou 'noindex'
     * @param string $following 'follow' ou 'nofollow'
     * @param array $additional Directives supplémentaires
     * @return string Valeur de la meta robots
     */
    public function generateMetaRobots(
        string $indexing = 'index',
        string $following = 'follow',
        array $additional = []
    ): string {
        $directives = [$indexing, $following];

        // Directives additionnelles possibles :
        // - noarchive : pas de copie en cache
        // - nosnippet : pas d'extrait dans résultats
        // - noimageindex : pas d'indexation des images
        // - max-snippet:N : limite longueur extrait
        // - max-image-preview:standard : taille aperçu image

        $directives = array_merge($directives, $additional);

        return implode(', ', $directives);
    }

    /**
     * Détermine les directives robots pour un article
     */
    public function getArticleRobotsDirectives(\App\Models\Article $article): string
    {
        // Articles publiés : index, follow
        if ($article->status === 'published') {
            return $this->generateMetaRobots('index', 'follow');
        }

        // Brouillons : noindex, nofollow
        if ($article->status === 'draft') {
            return $this->generateMetaRobots('noindex', 'nofollow');
        }

        // Archivés : noindex mais follow (pour jus SEO)
        if ($article->status === 'archived') {
            return $this->generateMetaRobots('noindex', 'follow');
        }

        // Par défaut
        return $this->generateMetaRobots('index', 'follow');
    }

    // =========================================================================
    // X-ROBOTS-TAG (headers HTTP)
    // =========================================================================

    /**
     * Génère le header X-Robots-Tag
     * Alternative à la meta robots
     * 
     * @param string $indexing index/noindex
     * @param string $following follow/nofollow
     * @return string Header X-Robots-Tag
     */
    public function generateXRobotsTag(string $indexing = 'index', string $following = 'follow'): string
    {
        return "X-Robots-Tag: {$indexing}, {$following}";
    }

    // =========================================================================
    // VALIDATION
    // =========================================================================

    /**
     * Valide un fichier robots.txt
     * 
     * @param string $content Contenu robots.txt
     * @return array Résultat validation
     */
    public function validateRobotsTxt(string $content): array
    {
        $issues = [];
        $warnings = [];

        // Vérifier présence User-agent
        if (!str_contains($content, 'User-agent:')) {
            $issues[] = "Aucun User-agent défini";
        }

        // Vérifier présence Sitemap
        if (!str_contains($content, 'Sitemap:')) {
            $warnings[] = "Aucun sitemap référencé";
        }

        // Vérifier syntaxe Allow/Disallow
        $lines = explode("\n", $content);
        foreach ($lines as $lineNum => $line) {
            $line = trim($line);
            
            if (empty($line) || str_starts_with($line, '#')) {
                continue;
            }

            // Vérifier format
            if (!preg_match('/^(User-agent|Allow|Disallow|Sitemap|Crawl-delay):/i', $line)) {
                $warnings[] = "Ligne " . ($lineNum + 1) . " : format suspect '{$line}'";
            }
        }

        return [
            'valid' => empty($issues),
            'issues' => $issues,
            'warnings' => $warnings,
        ];
    }

    // =========================================================================
    // GÉNÉRATION PAR ENVIRONNEMENT
    // =========================================================================

    /**
     * Génère robots.txt adapté à l'environnement
     * 
     * @param Platform $platform Plateforme
     * @param string $environment production/staging/development
     * @return string Contenu robots.txt
     */
    public function generateForEnvironment(Platform $platform, string $environment): string
    {
        $options = [];

        switch ($environment) {
            case 'production':
                // Production : tout autoriser
                $options['crawl_delay'] = false;
                $options['block_ai_bots'] = false; // Selon préférence
                break;

            case 'staging':
                // Staging : bloquer tout
                return $this->generateBlockAllRobotsTxt($platform);

            case 'development':
                // Dev : bloquer tout
                return $this->generateBlockAllRobotsTxt($platform);
        }

        return $this->generateRobotsTxt($platform, $options);
    }

    /**
     * Génère un robots.txt qui bloque tous les robots
     * Pour staging/dev
     */
    protected function generateBlockAllRobotsTxt(Platform $platform): string
    {
        $lines = [
            "# Robots.txt pour {$platform->name} (NON-PRODUCTION)",
            "# Environnement de test - Crawl interdit",
            "",
            "User-agent: *",
            "Disallow: /",
        ];

        return implode("\n", $lines);
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Récupère le contenu robots.txt actuel d'une URL
     */
    public function fetchCurrentRobotsTxt(string $url): ?string
    {
        $robotsUrl = rtrim($url, '/') . '/robots.txt';

        try {
            $content = @file_get_contents($robotsUrl);
            return $content ?: null;
        } catch (\Exception $e) {
            Log::warning("Impossible de récupérer robots.txt", [
                'url' => $robotsUrl,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Compare deux fichiers robots.txt
     */
    public function compareRobotsTxt(string $current, string $new): array
    {
        $currentLines = explode("\n", trim($current));
        $newLines = explode("\n", trim($new));

        return [
            'additions' => array_diff($newLines, $currentLines),
            'removals' => array_diff($currentLines, $newLines),
            'unchanged' => array_intersect($currentLines, $newLines),
        ];
    }
}