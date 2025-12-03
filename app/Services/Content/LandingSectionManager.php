<?php

namespace App\Services\Content;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Service de gestion des sections de landing pages
 * 
 * Gère la configuration des sections activables/désactivables par plateforme
 * 
 * Configuration par défaut :
 * - Hero (obligatoire, activé)
 * - Problème (optionnel, activé)
 * - Solution (optionnel, activé)
 * - Avantages (optionnel, activé)
 * - Comment ça marche (optionnel, activé)
 * - Preuves sociales (optionnel, DÉSACTIVÉ) ⚠️
 * - Tarifs (optionnel, DÉSACTIVÉ) ⚠️
 * - FAQ (optionnel, activé)
 * - CTA Final (obligatoire, activé)
 */
class LandingSectionManager
{
    /**
     * Configuration par défaut des sections disponibles
     */
    const AVAILABLE_SECTIONS = [
        'hero' => [
            'name' => 'Hero',
            'description' => 'Section d\'en-tête avec titre, sous-titre et CTA principal',
            'required' => true,
            'enabled' => true,
            'order' => 1,
        ],
        'problem' => [
            'name' => 'Problème',
            'description' => 'Identification des pain points de l\'audience',
            'required' => false,
            'enabled' => true,
            'order' => 2,
        ],
        'solution' => [
            'name' => 'Solution',
            'description' => 'Présentation de la solution apportée',
            'required' => false,
            'enabled' => true,
            'order' => 3,
        ],
        'advantages' => [
            'name' => 'Avantages',
            'description' => 'Liste des avantages et bénéfices clés',
            'required' => false,
            'enabled' => true,
            'order' => 4,
        ],
        'how_it_works' => [
            'name' => 'Comment ça marche',
            'description' => 'Étapes d\'utilisation du service',
            'required' => false,
            'enabled' => true,
            'order' => 5,
        ],
        'testimonials' => [
            'name' => 'Preuves sociales',
            'description' => 'Témoignages clients (désactivé par défaut)',
            'required' => false,
            'enabled' => false, // ⚠️ DÉSACTIVÉ PAR DÉFAUT
            'order' => 6,
        ],
        'pricing' => [
            'name' => 'Tarifs',
            'description' => 'Plans tarifaires (désactivé par défaut)',
            'required' => false,
            'enabled' => false, // ⚠️ DÉSACTIVÉ PAR DÉFAUT
            'order' => 7,
        ],
        'faq' => [
            'name' => 'FAQ',
            'description' => 'Questions-réponses fréquentes',
            'required' => false,
            'enabled' => true,
            'order' => 8,
        ],
        'final_cta' => [
            'name' => 'CTA Final',
            'description' => 'Appel à l\'action final',
            'required' => true,
            'enabled' => true,
            'order' => 9,
        ],
    ];

    const CACHE_TTL = 3600; // 1 heure

    /**
     * Récupère les sections activées pour une plateforme
     */
    public function getEnabledSections(int $platformId): array
    {
        $cacheKey = $this->getCacheKey($platformId);

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($platformId) {
            $config = $this->getConfig($platformId);
            
            $enabled = array_filter($config, fn($section) => $section['enabled'] === true);
            
            uasort($enabled, fn($a, $b) => $a['order'] <=> $b['order']);

            return $enabled;
        });
    }

    /**
     * Récupère toutes les sections
     */
    public function getAllSections(int $platformId): array
    {
        $config = $this->getConfig($platformId);
        uasort($config, fn($a, $b) => $a['order'] <=> $b['order']);
        return $config;
    }

    /**
     * Vérifie si une section est activée
     */
    public function isSectionEnabled(int $platformId, string $section): bool
    {
        $config = $this->getConfig($platformId);
        return $config[$section]['enabled'] ?? false;
    }

    /**
     * Active/désactive une section
     */
    public function updateSectionStatus(int $platformId, string $section, bool $enabled): void
    {
        if (!isset(self::AVAILABLE_SECTIONS[$section])) {
            throw new \InvalidArgumentException("Section inconnue : {$section}");
        }

        if (self::AVAILABLE_SECTIONS[$section]['required'] && !$enabled) {
            throw new \InvalidArgumentException("La section '{$section}' est obligatoire");
        }

        $config = $this->getConfig($platformId);
        $config[$section]['enabled'] = $enabled;

        $this->saveConfig($platformId, $config);
        $this->invalidateCache($platformId);

        Log::info('Statut section modifié', [
            'platform_id' => $platformId,
            'section' => $section,
            'enabled' => $enabled,
        ]);
    }

    /**
     * Réorganise l'ordre des sections
     */
    public function reorderSections(int $platformId, array $order): void
    {
        $config = $this->getConfig($platformId);

        foreach ($order as $section => $orderNumber) {
            if (isset($config[$section])) {
                $config[$section]['order'] = (int) $orderNumber;
            }
        }

        $this->saveConfig($platformId, $config);
        $this->invalidateCache($platformId);

        Log::info('Ordre sections modifié', [
            'platform_id' => $platformId,
        ]);
    }

    /**
     * Active plusieurs sections
     */
    public function enableSections(int $platformId, array $sections): void
    {
        $config = $this->getConfig($platformId);

        foreach ($sections as $section) {
            if (isset($config[$section])) {
                $config[$section]['enabled'] = true;
            }
        }

        $this->saveConfig($platformId, $config);
        $this->invalidateCache($platformId);
    }

    /**
     * Désactive plusieurs sections
     */
    public function disableSections(int $platformId, array $sections): void
    {
        foreach ($sections as $section) {
            if (self::AVAILABLE_SECTIONS[$section]['required'] ?? false) {
                throw new \InvalidArgumentException("La section '{$section}' est obligatoire");
            }
        }

        $config = $this->getConfig($platformId);

        foreach ($sections as $section) {
            if (isset($config[$section])) {
                $config[$section]['enabled'] = false;
            }
        }

        $this->saveConfig($platformId, $config);
        $this->invalidateCache($platformId);
    }

    /**
     * Réinitialise aux valeurs par défaut
     */
    public function resetToDefault(int $platformId): void
    {
        $this->saveConfig($platformId, self::AVAILABLE_SECTIONS);
        $this->invalidateCache($platformId);

        Log::info('Configuration sections réinitialisée', [
            'platform_id' => $platformId,
        ]);
    }

    /**
     * Applique un template prédéfini
     */
    public function applyTemplate(int $platformId, string $template): void
    {
        $config = $this->getConfig($platformId);

        switch ($template) {
            case 'minimal':
                foreach ($config as $section => $data) {
                    $config[$section]['enabled'] = in_array($section, ['hero', 'solution', 'faq', 'final_cta']);
                }
                break;

            case 'complete':
                foreach ($config as $section => $data) {
                    $config[$section]['enabled'] = true;
                }
                break;

            case 'conversion':
                $conversionSections = ['hero', 'problem', 'solution', 'advantages', 'testimonials', 'faq', 'final_cta'];
                foreach ($config as $section => $data) {
                    $config[$section]['enabled'] = in_array($section, $conversionSections);
                }
                break;

            default:
                throw new \InvalidArgumentException("Template inconnu : {$template}");
        }

        $this->saveConfig($platformId, $config);
        $this->invalidateCache($platformId);

        Log::info('Template appliqué', [
            'platform_id' => $platformId,
            'template' => $template,
        ]);
    }

    /**
     * Statistiques sections
     */
    public function getSectionStats(int $platformId): array
    {
        $config = $this->getConfig($platformId);
        
        $enabled = array_filter($config, fn($section) => $section['enabled']);
        $disabled = array_filter($config, fn($section) => !$section['enabled']);

        return [
            'total' => count($config),
            'enabled' => count($enabled),
            'disabled' => count($disabled),
            'required' => count(array_filter($config, fn($section) => $section['required'])),
            'sections' => $config,
        ];
    }

    // =========================================================================
    // MÉTHODES PRIVÉES
    // =========================================================================

    /**
     * Récupère la configuration depuis la base de données
     * ✅ CORRIGÉ : Gestion correcte du JSON dans Setting
     */
    protected function getConfig(int $platformId): array
    {
        $setting = Setting::where('key', "landing_sections.platform_{$platformId}")
            ->where('group', 'landing_pages')
            ->first();

        if ($setting) {
            // Setting::value est du text JSON, pas un array
            // On doit le décoder manuellement
            $value = $setting->value;
            
            // Si c'est déjà un string JSON, le décoder
            if (is_string($value)) {
                $decoded = json_decode($value, true);
                if ($decoded !== null) {
                    return $decoded;
                }
            }
            
            // Si c'est déjà un array (ne devrait pas arriver mais au cas où)
            if (is_array($value)) {
                return $value;
            }
        }

        // Si pas de configuration, retourner la config par défaut
        return self::AVAILABLE_SECTIONS;
    }

    /**
     * Sauvegarde la configuration en base de données
     * ✅ CORRIGÉ : Encodage correct du JSON
     */
    protected function saveConfig(int $platformId, array $config): void
    {
        Setting::updateOrCreate(
            [
                'key' => "landing_sections.platform_{$platformId}",
                'group' => 'landing_pages',
            ],
            [
                'value' => json_encode($config), // ✅ Encodage JSON explicite
                'type' => 'json',
                'description' => "Configuration des sections de landing pages pour la plateforme {$platformId}",
            ]
        );
    }

    protected function getCacheKey(int $platformId): string
    {
        return "landing_sections.platform_{$platformId}";
    }

    protected function invalidateCache(int $platformId): void
    {
        Cache::forget($this->getCacheKey($platformId));
    }
}