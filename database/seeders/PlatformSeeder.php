<?php

namespace Database\Seeders;

use App\Models\Platform;
use Illuminate\Database\Seeder;

/**
 * PlatformSeeder - Création des 3 plateformes
 * 
 * CORRIGÉ: Ajout du champ 'domain' en plus de 'url'
 * pour que LocaleSlugService puisse générer les URLs hreflang
 */
class PlatformSeeder extends Seeder
{
    public function run(): void
    {
        $platforms = [
            [
                'name' => 'SOS-Expat',
                'slug' => 'sos-expat',
                'url' => 'https://sos-expat.com',
                'domain' => 'sos-expat.com',           // ✅ AJOUTÉ
                'api_endpoint' => 'https://api.sos-expat.com',
                'description' => 'Assistance téléphonique d\'urgence pour expatriés dans le monde entier',
                'primary_color' => '#0066CC',
                'is_active' => true,
            ],
            [
                'name' => 'Ulixai',
                'slug' => 'ulixai',
                'url' => 'https://ulixai.com',
                'domain' => 'ulixai.com',              // ✅ AJOUTÉ
                'api_endpoint' => 'https://api.ulixai.com',
                'description' => 'Marketplace de services pour expatriés',
                'primary_color' => '#6366F1',
                'is_active' => true,
            ],
            [
                'name' => 'Ulysse.AI',
                'slug' => 'ulysse',
                'url' => 'https://ulysse.ai',
                'domain' => 'ulysse.ai',               // ✅ AJOUTÉ
                'api_endpoint' => 'https://api.ulysse.ai',
                'description' => 'Assistant de voyage intelligent propulsé par l\'IA',
                'primary_color' => '#10B981',
                'is_active' => false,  // Pas encore lancé
            ],
        ];

        foreach ($platforms as $platform) {
            Platform::updateOrCreate(
                ['slug' => $platform['slug']],
                $platform
            );
        }

        $this->command->info('✅ 3 plateformes créées/mises à jour:');
        $this->command->info('   - SOS-Expat (sos-expat.com)');
        $this->command->info('   - Ulixai (ulixai.com)');
        $this->command->info('   - Ulysse.AI (ulysse.ai)');
    }
}
