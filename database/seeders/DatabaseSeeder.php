<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->command->info('');
        $this->command->info('╔════════════════════════════════════════════════════════════╗');
        $this->command->info('║           CONTENT ENGINE V9.4 - DATABASE SEEDER            ║');
        $this->command->info('╚════════════════════════════════════════════════════════════╝');
        $this->command->info('');

        // =====================================================================
        // ÉTAPE 1 : Données de référence (Core Data)
        // =====================================================================
        $this->command->info('📦 Étape 1/6 : Données de référence...');
        
        $this->call([
            LanguageSeeder::class,
            TimezoneSeeder::class,
            RegionSeeder::class,
            CurrencySeeder::class,
            CountrySeeder::class,
            CountryLanguageSeeder::class,
        ]);

        // =====================================================================
        // ÉTAPE 2 : Plateformes et configuration
        // =====================================================================
        $this->command->info('');
        $this->command->info('🏢 Étape 2/6 : Plateformes et configuration...');
        
        $this->call([
            PlatformSeeder::class,
            SettingSeeder::class,
            AdminUserSeeder::class,
        ]);

        // =====================================================================
        // ÉTAPE 3 : Données métier (Business Data)
        // =====================================================================
        $this->command->info('');
        $this->command->info('💼 Étape 3/6 : Données métier...');
        
        $this->call([
            ThemeSeeder::class,
            ProviderTypeSeeder::class,
            LawyerSpecialtySeeder::class,
            ExpatDomainSeeder::class,
            UlixaiServiceSeeder::class,
        ]);

        // =====================================================================
        // ÉTAPE 4 : Templates et contenu
        // =====================================================================
        $this->command->info('');
        $this->command->info('📝 Étape 4/6 : Templates et contenu...');
        
        $this->call([
            TemplateSeeder::class,
            TitleTemplateSeeder::class,
            PromptTemplateSeeder::class,
            CtaTemplateSeeder::class,
        ]);

        // =====================================================================
        // ÉTAPE 5 : Monétisation et auteurs
        // =====================================================================
        $this->command->info('');
        $this->command->info('💰 Étape 5/6 : Monétisation et auteurs...');
        
        $this->call([
            AffiliateLinkSeeder::class,
            AuthorSeeder::class,
        ]);

        // =====================================================================
        // ÉTAPE 6 : Configuration publication et images
        // =====================================================================
        $this->command->info('');
        $this->command->info('⚙️ Étape 6/6 : Configuration publication et images...');
        
        $this->call([
            PublicationScheduleSeeder::class,
            ImageConfigSeeder::class,
        ]);

        // =====================================================================
        // RÉSUMÉ
        // =====================================================================
        $this->command->info('');
        $this->command->info('╔════════════════════════════════════════════════════════════╗');
        $this->command->info('║                    ✅ SEEDING TERMINÉ                      ║');
        $this->command->info('╠════════════════════════════════════════════════════════════╣');
        $this->command->info('║  📊 Langues           : 9                                  ║');
        $this->command->info('║  🌍 Pays              : 200                                ║');
        $this->command->info('║  🏢 Plateformes       : 3                                  ║');
        $this->command->info('║  📂 Thèmes            : 3                                  ║');
        $this->command->info('║  👤 Types prestataires: 6                                  ║');
        $this->command->info('║  ⚖️ Spécialités       : 8                                  ║');
        $this->command->info('║  🏠 Domaines expat    : 12 (6 SOS + 6 Ulixai)              ║');
        $this->command->info('║  🛠️ Services Ulixai   : 50+                                ║');
        $this->command->info('║  🔗 Liens affiliés    : Configurés                         ║');
        $this->command->info('║  ✍️ Auteurs E-E-A-T   : 4                                  ║');
        $this->command->info('║  📋 Prompts IA        : 7                                  ║');
        $this->command->info('╚════════════════════════════════════════════════════════════╝');
        $this->command->info('');
    }
}
