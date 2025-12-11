<?php

namespace App\Services\Template;

use App\Models\Platform;
use App\Models\ProviderType;
use App\Models\LawyerSpecialty;
use App\Models\Country;

/**
 * TemplateEngine V10.1 - ULTRA-FLEXIBLE
 * 
 * Génère contenu avec variables dynamiques illimitées
 * Supporte: N métiers × M spécialités × 197 pays × 9 langues × 2 types contenu
 */
class TemplateEngine
{
    protected $templates = [];
    
    /**
     * Générer contenu depuis template avec variables
     * 
     * @param string $templateType - 'landing_hero', 'comparative_intro', etc.
     * @param array $variables - Variables à remplacer
     * @return string
     */
    public function render(string $templateType, array $variables): string
    {
        // Charger template
        $template = $this->loadTemplate($templateType);
        
        // Enrichir variables auto
        $variables = $this->enrichVariables($variables);
        
        // Parser conditionnels {#if}
        $template = $this->parseConditionals($template, $variables);
        
        // Remplacer variables {variable}
        $template = $this->replaceVariables($template, $variables);
        
        return $template;
    }
    
    /**
     * Enrichir variables avec données DB
     */
    protected function enrichVariables(array $variables): array
    {
        // Platform USP auto
        if (!empty($variables['platform'])) {
            $platform = Platform::where('slug', $variables['platform'])->first();
            $variables['platform_name'] = $platform->name ?? '';
            $variables['platform_url'] = $platform->domain ?? '';
            $variables['platform_usp'] = $this->getPlatformUSP($variables['platform']);
        }
        
        // Provider type auto
        if (!empty($variables['provider_type'])) {
            $providerType = ProviderType::where('slug', $variables['provider_type'])->first();
            $variables['provider_type_name'] = $providerType->name_fr ?? $variables['provider_type'];
        }
        
        // Specialty auto
        if (!empty($variables['specialty'])) {
            $specialty = LawyerSpecialty::where('code', $variables['specialty'])->first();
            $translation = $specialty->translations()
                ->where('locale', $variables['language'] ?? 'fr')
                ->first();
            $variables['specialty_name'] = $translation->name ?? $variables['specialty'];
        }
        
        // Country auto
        if (!empty($variables['country'])) {
            $country = Country::where('code', $variables['country'])->first();
            $variables['country_name'] = $country->name_fr ?? $variables['country'];
        }
        
        // Keyword auto si absent
        if (empty($variables['keyword'])) {
            $variables['keyword'] = $this->generateKeyword($variables);
        }
        
        return $variables;
    }
    
    /**
     * USP par plateforme
     */
    protected function getPlatformUSP(string $platform): string
    {
        $usps = [
            'sos-expat' => 'Assistance téléphonique urgence 24/7 • Support juridique inclus • Réseau 197 pays',
            'ulixai' => 'Marketplace 0% commission • Comparaison transparente • Paiement sécurisé escrow',
            'ulysse' => 'Assistant voyage IA • Recommandations personnalisées • Planning automatique',
        ];
        
        return $usps[$platform] ?? '';
    }
    
    /**
     * Générer keyword dynamique
     */
    protected function generateKeyword(array $vars): string
    {
        $parts = [];
        
        if (!empty($vars['provider_type'])) $parts[] = $vars['provider_type'];
        if (!empty($vars['specialty'])) $parts[] = $vars['specialty'];
        if (!empty($vars['country'])) $parts[] = $vars['country'];
        
        // Ajouter qualificatif selon content_type
        if ($vars['content_type'] === 'recrutement') {
            array_unshift($parts, 'devenir');
        } else {
            array_unshift($parts, 'trouver');
        }
        
        return implode(' ', $parts);
    }
    
    /**
     * Parser conditionnels {#if content_type == 'recrutement'}...{#else}...{#endif}
     */
    protected function parseConditionals(string $template, array $variables): string
    {
        // Pattern: {#if variable == 'value'}content{#else}other{#endif}
        $pattern = '/\{#if\s+([a-z_]+)\s*==\s*[\'"]([^\'"]+)[\'"]\}(.*?)(?:\{#else\}(.*?))?\{#endif\}/is';
        
        $template = preg_replace_callback($pattern, function($matches) use ($variables) {
            $var = $matches[1];
            $value = $matches[2];
            $ifContent = $matches[3];
            $elseContent = $matches[4] ?? '';
            
            // Évaluer condition
            if (isset($variables[$var]) && $variables[$var] == $value) {
                return $ifContent;
            } else {
                return $elseContent;
            }
        }, $template);
        
        return $template;
    }
    
    /**
     * Remplacer variables {variable}
     */
    protected function replaceVariables(string $template, array $variables): string
    {
        foreach ($variables as $key => $value) {
            if (is_string($value) || is_numeric($value)) {
                $template = str_replace('{' . $key . '}', $value, $template);
            }
        }
        
        return $template;
    }
    
    /**
     * Charger template depuis fichier
     */
    protected function loadTemplate(string $templateType): string
    {
        $path = database_path("seeders/prompts/" . strtoupper($templateType) . "_MASTER.txt");
        
        if (!file_exists($path)) {
            throw new \Exception("Template not found: {$templateType}");
        }
        
        return file_get_contents($path);
    }
    
    /**
     * Générer campagne complète
     * 
     * @param array $campaign - Config campagne
     * @return array - Landing pages générées
     */
    public function generateCampaign(array $campaign): array
    {
        $results = [];
        
        // Expansion cartésienne
        foreach ($campaign['platforms'] as $platform) {
            foreach ($campaign['provider_types'] as $providerType) {
                foreach ($campaign['countries'] as $country) {
                    foreach ($campaign['languages'] as $language) {
                        $variables = [
                            'platform' => $platform,
                            'content_type' => $campaign['content_type'],
                            'provider_type' => $providerType,
                            'specialty' => $campaign['specialty'] ?? null,
                            'country' => $country,
                            'language' => $language,
                        ];
                        
                        // Générer toutes sections
                        $sections = [];
                        foreach (['hero', 'problem', 'solution', 'advantages', 'how_it_works', 'faq', 'cta'] as $section) {
                            $sections[$section] = $this->render("landing_{$section}", $variables);
                        }
                        
                        $results[] = [
                            'variables' => $variables,
                            'sections' => $sections,
                            'url' => $this->generateURL($variables),
                        ];
                    }
                }
            }
        }
        
        return $results;
    }
    
    /**
     * Générer URL SEO-friendly
     */
    protected function generateURL(array $vars): string
    {
        $parts = [
            $vars['language'],
            $vars['country'],
            $vars['provider_type'],
            $vars['specialty'] ?? null,
        ];
        
        $parts = array_filter($parts);
        
        return implode('/', $parts);
    }
}
