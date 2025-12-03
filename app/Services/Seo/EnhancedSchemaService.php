<?php

namespace App\Services\Seo;

use App\Models\Article;
use App\Models\Platform;
use Illuminate\Support\Facades\Log;

/**
 * Service de génération Schema.org enrichi
 * Complète MetaService avec Organization, WebSite, HowTo, etc.
 */
class EnhancedSchemaService
{
    // =========================================================================
    // ORGANIZATION SCHEMA
    // =========================================================================

    /**
     * Génère le Schema.org Organization pour une plateforme
     * À afficher dans TOUTES les pages du site
     * 
     * @param Platform $platform Plateforme
     * @return array JSON-LD Organization
     */
    public function generateOrganizationSchema(Platform $platform): array
    {
        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'Organization',
            'name' => $platform->name,
            'url' => $platform->url,
            'logo' => [
                '@type' => 'ImageObject',
                'url' => $platform->logo_url ?? $platform->url . '/logo.png',
                'width' => 600,
                'height' => 60,
            ],
        ];

        // Description
        if (!empty($platform->description)) {
            $schema['description'] = $platform->description;
        }

        // Social Media Links
        $socialLinks = $this->getPlatformSocialLinks($platform);
        if (!empty($socialLinks)) {
            $schema['sameAs'] = $socialLinks;
        }

        // Contact Point
        $contactPoint = $this->getContactPoint($platform);
        if ($contactPoint) {
            $schema['contactPoint'] = $contactPoint;
        }

        // Founders (si applicable)
        if ($platform->name === 'SOS-Expat') {
            $schema['founder'] = [
                '@type' => 'Person',
                'name' => 'SOS-Expat Team',
            ];
        }

        // Address (si applicable)
        $address = $this->getOrganizationAddress($platform);
        if ($address) {
            $schema['address'] = $address;
        }

        Log::debug("🏢 Schema Organization généré", ['platform' => $platform->name]);

        return $schema;
    }

    /**
     * Récupère les liens sociaux d'une plateforme
     */
    protected function getPlatformSocialLinks(Platform $platform): array
    {
        $links = [];

        // Selon la plateforme
        switch ($platform->name) {
            case 'SOS-Expat':
                $links = [
                    'https://facebook.com/sosexpat',
                    'https://twitter.com/sosexpat',
                    'https://linkedin.com/company/sosexpat',
                    'https://instagram.com/sosexpat',
                ];
                break;
            
            case 'Ulixai':
                $links = [
                    'https://facebook.com/ulixai',
                    'https://twitter.com/ulixai',
                    'https://linkedin.com/company/ulixai',
                ];
                break;

            case 'Ulysse.AI':
                $links = [
                    'https://twitter.com/ulysseai',
                    'https://linkedin.com/company/ulysse-ai',
                ];
                break;
        }

        return array_filter($links);
    }

    /**
     * Génère le contact point
     */
    protected function getContactPoint(Platform $platform): ?array
    {
        return [
            '@type' => 'ContactPoint',
            'contactType' => 'customer service',
            'availableLanguage' => ['French', 'English', 'German', 'Spanish', 'Portuguese', 'Russian', 'Chinese', 'Arabic', 'Hindi'],
            'areaServed' => 'Worldwide',
        ];
    }

    /**
     * Génère l'adresse de l'organisation
     */
    protected function getOrganizationAddress(Platform $platform): ?array
    {
        // Exemple pour SOS-Expat (adapter selon réalité)
        if ($platform->name === 'SOS-Expat') {
            return [
                '@type' => 'PostalAddress',
                'addressCountry' => 'FR',
                'addressLocality' => 'Paris',
            ];
        }

        return null;
    }

    // =========================================================================
    // WEBSITE SCHEMA
    // =========================================================================

    /**
     * Génère le Schema.org WebSite
     * Pour activer la search box Google
     * 
     * @param Platform $platform Plateforme
     * @return array JSON-LD WebSite
     */
    public function generateWebSiteSchema(Platform $platform): array
    {
        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'WebSite',
            'name' => $platform->name,
            'url' => $platform->url,
        ];

        // Potential Action (Search box)
        $schema['potentialAction'] = [
            '@type' => 'SearchAction',
            'target' => [
                '@type' => 'EntryPoint',
                'urlTemplate' => $platform->url . '/search?q={search_term_string}',
            ],
            'query-input' => 'required name=search_term_string',
        ];

        Log::debug("🌐 Schema WebSite généré", ['platform' => $platform->name]);

        return $schema;
    }

    // =========================================================================
    // HOWTO SCHEMA (pour guides étape par étape)
    // =========================================================================

    /**
     * Génère le Schema.org HowTo pour les guides pratiques
     * 
     * @param Article $article Article guide
     * @param array $steps Étapes du guide
     * @return array JSON-LD HowTo
     */
    public function generateHowToSchema(Article $article, array $steps): array
    {
        if (empty($steps)) {
            return [];
        }

        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'HowTo',
            'name' => $article->title,
            'description' => $article->excerpt,
        ];

        // Image si présente
        if ($article->image_url) {
            $schema['image'] = [
                '@type' => 'ImageObject',
                'url' => $article->image_url,
            ];
        }

        // Durée estimée
        if ($article->reading_time) {
            $schema['totalTime'] = "PT{$article->reading_time}M";
        }

        // Étapes
        $schema['step'] = [];
        foreach ($steps as $index => $step) {
            $schema['step'][] = [
                '@type' => 'HowToStep',
                'position' => $index + 1,
                'name' => $step['name'] ?? "Étape " . ($index + 1),
                'text' => $step['text'],
                'url' => ($article->canonical_url ?? $article->getFullUrl()) . "#step-" . ($index + 1),
            ];

            // Image de l'étape (optionnel)
            if (!empty($step['image'])) {
                $schema['step'][$index]['image'] = $step['image'];
            }
        }

        Log::debug("📝 Schema HowTo généré", [
            'article_id' => $article->id,
            'steps_count' => count($steps),
        ]);

        return $schema;
    }

    /**
     * Détecte automatiquement les étapes d'un guide dans le contenu
     * 
     * @param string $content Contenu HTML
     * @return array Étapes détectées
     */
    public function extractHowToSteps(string $content): array
    {
        $steps = [];

        // Méthode 1 : Détection via <h3> numérotés
        preg_match_all('/<h3[^>]*>((?:\d+\.|Étape\s+\d+|Step\s+\d+)[^<]+)<\/h3>(.*?)(?=<h[23]|$)/is', $content, $matches, PREG_SET_ORDER);

        foreach ($matches as $match) {
            $steps[] = [
                'name' => strip_tags($match[1]),
                'text' => strip_tags($match[2]),
            ];
        }

        // Méthode 2 : Détection via liste ordonnée <ol>
        if (empty($steps)) {
            preg_match_all('/<li[^>]*>(.*?)<\/li>/is', $content, $matches);
            
            foreach ($matches[1] as $index => $liContent) {
                if (strlen($liContent) > 50) { // Étapes substantielles uniquement
                    $steps[] = [
                        'name' => "Étape " . ($index + 1),
                        'text' => strip_tags($liContent),
                    ];
                }
            }
        }

        return $steps;
    }

    // =========================================================================
    // ITEMLIST SCHEMA (pour listes/comparatifs)
    // =========================================================================

    /**
     * Génère le Schema.org ItemList
     * Pour les articles de type liste ou comparatif
     * 
     * @param Article $article Article
     * @param array $items Items de la liste
     * @return array JSON-LD ItemList
     */
    public function generateItemListSchema(Article $article, array $items): array
    {
        if (empty($items)) {
            return [];
        }

        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'ItemList',
            'name' => $article->title,
            'description' => $article->excerpt,
            'numberOfItems' => count($items),
        ];

        // Items
        $schema['itemListElement'] = [];
        foreach ($items as $index => $item) {
            $schema['itemListElement'][] = [
                '@type' => 'ListItem',
                'position' => $index + 1,
                'name' => $item['name'],
                'url' => $item['url'] ?? null,
                'description' => $item['description'] ?? null,
            ];
        }

        return $schema;
    }

    // =========================================================================
    // REVIEW SCHEMA (pour avis)
    // =========================================================================

    /**
     * Génère le Schema.org Review
     * 
     * @param array $reviewData Données de l'avis
     * @return array JSON-LD Review
     */
    public function generateReviewSchema(array $reviewData): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'Review',
            'itemReviewed' => [
                '@type' => $reviewData['item_type'] ?? 'Thing',
                'name' => $reviewData['item_name'],
            ],
            'reviewRating' => [
                '@type' => 'Rating',
                'ratingValue' => $reviewData['rating'],
                'bestRating' => $reviewData['best_rating'] ?? 5,
            ],
            'author' => [
                '@type' => 'Person',
                'name' => $reviewData['author_name'],
            ],
            'reviewBody' => $reviewData['review_text'],
        ];
    }

    // =========================================================================
    // SCHEMA COMPLET (tout-en-un pour un article)
    // =========================================================================

    /**
     * Génère TOUS les schemas pertinents pour un article
     * 
     * @param Article $article Article
     * @param Platform $platform Plateforme
     * @return array Tous les schemas JSON-LD
     */
    public function generateCompleteSchema(Article $article, Platform $platform): array
    {
        $schemas = [];

        // Organization (dans toutes les pages)
        $schemas['organization'] = $this->generateOrganizationSchema($platform);

        // WebSite (dans toutes les pages)
        $schemas['website'] = $this->generateWebSiteSchema($platform);

        // Détection automatique du type d'article
        $content = $article->content;

        // Si c'est un guide (présence "étapes", "comment", etc.)
        if ($this->isHowToArticle($article)) {
            $steps = $this->extractHowToSteps($content);
            if (!empty($steps)) {
                $schemas['howto'] = $this->generateHowToSchema($article, $steps);
            }
        }

        return $schemas;
    }

    /**
     * Détecte si un article est un guide pratique
     */
    protected function isHowToArticle(Article $article): bool
    {
        $title = strtolower($article->title);
        $content = strtolower($article->content);

        $howtoKeywords = ['comment', 'guide', 'étapes', 'tutoriel', 'procédure', 'how to', 'steps', 'tutorial'];

        foreach ($howtoKeywords as $keyword) {
            if (str_contains($title, $keyword) || substr_count($content, $keyword) >= 2) {
                return true;
            }
        }

        return false;
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Valide un schema JSON-LD
     * 
     * @param array $schema Schema à valider
     * @return bool True si valide
     */
    public function validateSchema(array $schema): bool
    {
        // Vérifications basiques
        if (empty($schema['@context']) || empty($schema['@type'])) {
            return false;
        }

        // Vérifier que c'est encodable en JSON
        $json = json_encode($schema);
        if ($json === false) {
            return false;
        }

        return true;
    }

    /**
     * Convertit un schema en string JSON-LD
     */
    public function schemaToJsonLd(array $schema): string
    {
        return json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }
}