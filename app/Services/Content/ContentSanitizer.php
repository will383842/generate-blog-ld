<?php

namespace App\Services\Content;

use HTMLPurifier;
use HTMLPurifier_Config;

/**
 * ContentSanitizer - Service de sanitization HTML pour contenu IA
 *
 * Utilise HTMLPurifier pour nettoyer le contenu généré par GPT et
 * prévenir les attaques XSS tout en conservant le formatage HTML valide.
 */
class ContentSanitizer
{
    protected HTMLPurifier $purifier;
    protected HTMLPurifier_Config $config;

    public function __construct()
    {
        $this->config = HTMLPurifier_Config::createDefault();

        // Balises HTML autorisées pour le contenu d'articles
        $this->config->set('HTML.Allowed', implode(',', [
            // Structure
            'h2', 'h3', 'h4', 'h5', 'h6',
            'p', 'br', 'hr',
            'div[class]', 'span[class]',

            // Listes
            'ul', 'ol', 'li',

            // Liens
            'a[href|title|rel|target]',

            // Mise en forme
            'strong', 'em', 'b', 'i', 'u',
            'blockquote', 'cite',
            'code', 'pre',
            'sup', 'sub',

            // Tableaux
            'table[class]', 'thead', 'tbody', 'tfoot',
            'tr', 'th[scope|colspan|rowspan]', 'td[colspan|rowspan]',

            // Images (avec restrictions)
            'img[src|alt|title|width|height|class]',

            // Autres
            'figure[class]', 'figcaption',
            'dl', 'dt', 'dd',
            'abbr[title]',
            'mark',
        ]));

        // Autoriser target="_blank" sur les liens
        $this->config->set('Attr.AllowedFrameTargets', ['_blank']);

        // Schémas d'URL autorisés
        $this->config->set('URI.AllowedSchemes', [
            'http' => true,
            'https' => true,
            'mailto' => true,
        ]);

        // Ajouter automatiquement target="_blank" aux liens externes
        $this->config->set('HTML.TargetBlank', true);

        // Ajouter rel="noopener noreferrer" aux liens avec target="_blank"
        $this->config->set('HTML.Nofollow', false);

        // Cache pour les performances
        $cachePath = storage_path('framework/cache/htmlpurifier');
        if (!is_dir($cachePath)) {
            mkdir($cachePath, 0755, true);
        }
        $this->config->set('Cache.SerializerPath', $cachePath);

        // Créer l'instance du purifier
        $this->purifier = new HTMLPurifier($this->config);
    }

    /**
     * Sanitizer du contenu HTML
     */
    public function sanitize(string $html): string
    {
        if (empty($html)) {
            return '';
        }

        return $this->purifier->purify($html);
    }

    /**
     * Sanitizer un tableau de contenus HTML
     */
    public function sanitizeArray(array $contents): array
    {
        return array_map(fn($content) => $this->sanitize($content), $contents);
    }

    /**
     * Sanitizer du contenu et supprimer toutes les balises HTML
     * Utile pour les extraits, meta descriptions, etc.
     */
    public function sanitizeToText(string $html): string
    {
        // D'abord sanitizer le HTML
        $clean = $this->sanitize($html);

        // Puis supprimer toutes les balises
        return strip_tags($clean);
    }

    /**
     * Sanitizer avec une configuration plus restrictive (pour commentaires, etc.)
     */
    public function sanitizeStrict(string $html): string
    {
        $strictConfig = HTMLPurifier_Config::createDefault();
        $strictConfig->set('HTML.Allowed', 'p,br,strong,em,a[href|title]');
        $strictConfig->set('URI.AllowedSchemes', ['http' => true, 'https' => true]);

        $strictPurifier = new HTMLPurifier($strictConfig);
        return $strictPurifier->purify($html);
    }

    /**
     * Vérifier si le contenu est potentiellement dangereux
     */
    public function containsDangerousContent(string $html): bool
    {
        $dangerousPatterns = [
            '/<script/i',
            '/javascript:/i',
            '/on\w+\s*=/i',  // onclick, onerror, etc.
            '/<iframe/i',
            '/<object/i',
            '/<embed/i',
            '/data:/i',
            '/vbscript:/i',
        ];

        foreach ($dangerousPatterns as $pattern) {
            if (preg_match($pattern, $html)) {
                return true;
            }
        }

        return false;
    }
}
