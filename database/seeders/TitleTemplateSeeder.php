<?php

namespace Database\Seeders;

use App\Models\Platform;
use App\Models\TitleTemplate;
use Illuminate\Database\Seeder;

class TitleTemplateSeeder extends Seeder
{
    /**
     * Seeder pour les templates de titres - VERSION CORRIGÉE
     * 
     * Templates pour 3 plateformes :
     * - SOS-EXPAT (article, landing, recruitment)
     * - ULIXAI (article, landing)
     * - ULYSSE.AI (article, landing)
     * 
     * Variables dynamiques : {country}, {theme}, {service}, {provider_type}, etc.
     */
    public function run(): void
    {
        $platforms = Platform::pluck('id', 'slug')->toArray();
        
        $templates = [
            // ═══════════════════════════════════════════════════════════════
            // SOS-EXPAT - Templates Articles
            // ═══════════════════════════════════════════════════════════════
            [
                'platform' => 'sos-expat',
                'content_type' => 'article',
                'templates' => [
                    // Thématiques générales
                    ['template' => '{theme} pour expatriés {country_in} : Guide complet {year}', 'weight' => 10],
                    ['template' => 'Expatriation {country_in} : Tout savoir sur {theme_lower}', 'weight' => 10],
                    ['template' => '{theme} {country_in} : Conseils et démarches pour expatriés', 'weight' => 8],
                    ['template' => 'Guide {theme_lower} pour français {country_in} ({year})', 'weight' => 8],
                    ['template' => 'S\'expatrier {country_in} : {theme} expliqué', 'weight' => 6],
                    ['template' => '{country} : Guide pratique {theme_lower} pour expatriés', 'weight' => 6],
                    
                    // Avec spécialité avocat
                    ['template' => 'Avocat {specialty} {country_in} : Trouver le bon expert', 'weight' => 8],
                    ['template' => '{specialty} {country_in} : Guide juridique expatriés {year}', 'weight' => 8],
                    ['template' => 'Besoin d\'un avocat {specialty_lower} {country_in} ?', 'weight' => 6],
                    
                    // Urgences
                    ['template' => 'Urgence {theme_lower} {country_in} : Que faire ?', 'weight' => 5],
                    ['template' => 'SOS {theme} {country_in} : Aide immédiate expatriés', 'weight' => 5],
                ],
            ],
            
            // ═══════════════════════════════════════════════════════════════
            // SOS-EXPAT - Templates Landings
            // ═══════════════════════════════════════════════════════════════
            [
                'platform' => 'sos-expat',
                'content_type' => 'landing',
                'templates' => [
                    // Landings prestataires
                    ['template' => '{provider_type} francophone {country_in} – Consultation en 5 min', 'weight' => 10],
                    ['template' => 'Parler à un {provider_type_lower} {country_in} maintenant', 'weight' => 10],
                    ['template' => '{provider_type} pour expatriés {country_in} – Réponse immédiate', 'weight' => 8],
                    ['template' => 'Trouvez un {provider_type_lower} francophone {country_in}', 'weight' => 8],
                    ['template' => 'Besoin d\'un {provider_type_lower} {country_in} ? Appelez maintenant', 'weight' => 6],
                    
                    // Landings domaines
                    ['template' => '{domain} pour expatriés {country_in} – Assistance 24/7', 'weight' => 8],
                    ['template' => 'Aide {domain_lower} {country_in} – Experts francophones', 'weight' => 8],
                ],
            ],
            
            // ═══════════════════════════════════════════════════════════════
            // SOS-EXPAT - Templates Recrutement
            // ═══════════════════════════════════════════════════════════════
            [
                'platform' => 'sos-expat',
                'content_type' => 'recruitment',
                'templates' => [
                    ['template' => 'Devenir {provider_type} sur SOS-Expat {country_in}', 'weight' => 10],
                    ['template' => '{provider_type} {country_in} : Rejoignez notre réseau d\'experts', 'weight' => 10],
                    ['template' => 'Recrutement {provider_type_lower} francophones {country_in}', 'weight' => 8],
                    ['template' => '{provider_type} : Aidez les expatriés {country_in}', 'weight' => 6],
                ],
            ],
            
            // ═══════════════════════════════════════════════════════════════
            // ULIXAI - Templates Articles
            // ═══════════════════════════════════════════════════════════════
            [
                'platform' => 'ulixai',
                'content_type' => 'article',
                'templates' => [
                    // Services généraux
                    ['template' => '{service} {country_in} : Guide complet {year}', 'weight' => 10],
                    ['template' => 'Tout savoir sur {service_lower} {country_in}', 'weight' => 10],
                    ['template' => '{service} pour expatriés {country_in} : Comparatif', 'weight' => 8],
                    ['template' => 'Meilleurs prestataires {service_lower} {country_in}', 'weight' => 8],
                    ['template' => '{country} : Comment choisir son {service_lower} ?', 'weight' => 6],
                    
                    // Avec ville/région
                    ['template' => '{service} à {city} : Guide pratique expatriés', 'weight' => 6],
                    ['template' => 'Trouver un {service_lower} à {city} ({country})', 'weight' => 6],
                ],
            ],
            
            // ═══════════════════════════════════════════════════════════════
            // ULIXAI - Templates Landings
            // ═══════════════════════════════════════════════════════════════
            [
                'platform' => 'ulixai',
                'content_type' => 'landing',
                'templates' => [
                    // Landings services
                    ['template' => '{service} {country_in} – Devis gratuit en 24h', 'weight' => 10],
                    ['template' => 'Comparez les {service_lower} {country_in}', 'weight' => 10],
                    ['template' => '{service} pour expatriés {country_in} – Jusqu\'à 5 devis', 'weight' => 8],
                    ['template' => 'Trouvez votre {service_lower} {country_in} en 2 min', 'weight' => 8],
                    ['template' => '{service} {country_in} : Prestataires vérifiés', 'weight' => 6],
                    
                    // Landings catégories
                    ['template' => '{category} {country_in} : Tous les services', 'weight' => 8],
                    ['template' => 'Services {category_lower} pour expatriés {country_in}', 'weight' => 8],
                    
                    // Landings villes
                    ['template' => '{service} à {city} – Devis gratuits', 'weight' => 6],
                    ['template' => 'Les meilleurs {service_lower} à {city}', 'weight' => 6],
                ],
            ],
            
            // ═══════════════════════════════════════════════════════════════
            // ULYSSE.AI - Templates Articles
            // ═══════════════════════════════════════════════════════════════
            [
                'platform' => 'ulysse',
                'content_type' => 'article',
                'templates' => [
                    ['template' => '{theme} {country_in} : L\'IA qui vous guide', 'weight' => 10],
                    ['template' => 'Expatriation {country_in} : Votre assistant IA répond', 'weight' => 10],
                    ['template' => 'Guide IA : {theme_lower} pour expatriés {country_in}', 'weight' => 8],
                    ['template' => '{country} : Questions fréquentes sur {theme_lower}', 'weight' => 8],
                    ['template' => 'Ulysse.AI répond : {theme} {country_in}', 'weight' => 6],
                ],
            ],
            
            // ═══════════════════════════════════════════════════════════════
            // ULYSSE.AI - Templates Landings
            // ═══════════════════════════════════════════════════════════════
            [
                'platform' => 'ulysse',
                'content_type' => 'landing',
                'templates' => [
                    ['template' => 'Assistant IA Expatriation {country} – Réponses instantanées', 'weight' => 10],
                    ['template' => 'Ulysse.AI : Votre guide expatriation {country}', 'weight' => 10],
                    ['template' => 'Questions sur {country} ? L\'IA répond 24/7', 'weight' => 8],
                    ['template' => 'Préparez votre expatriation {country_in} avec l\'IA', 'weight' => 8],
                    ['template' => '{theme} {country_in} : Posez vos questions à l\'IA', 'weight' => 6],
                ],
            ],
        ];

        echo "🌱 Insertion des templates de titres...\n";
        
        $totalInserted = 0;

        foreach ($templates as $group) {
            if (!isset($platforms[$group['platform']])) {
                echo "⚠️  Plateforme '{$group['platform']}' introuvable, passage au suivant...\n";
                continue;
            }
            
            foreach ($group['templates'] as $tpl) {
                TitleTemplate::create([
                    'platform_id' => $platforms[$group['platform']],
                    'content_type' => $group['content_type'],
                    'template' => $tpl['template'],
                    'template_variables' => json_encode($this->extractVariables($tpl['template'])),
                    'weight' => $tpl['weight'],
                    'is_active' => true,
                ]);
                $totalInserted++;
            }
        }

        echo "✅ $totalInserted templates insérés avec succès\n";
    }
    
    /**
     * Extrait les variables d'un template
     */
    private function extractVariables(string $template): array
    {
        preg_match_all('/\{([^}]+)\}/', $template, $matches);
        return array_unique($matches[1] ?? []);
    }
}