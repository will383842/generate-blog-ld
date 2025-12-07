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
        $this->command->info('║           CONTENT ENGINE V9.5 - DATABASE SEEDER            ║');
        $this->command->info('╚════════════════════════════════════════════════════════════╝');
        $this->command->info('');

        // =====================================================================
        // ÉTAPE 1 : Données de référence (Core Data)
        // =====================================================================
        $this->command->info('📦 Étape 1/12 : Données de référence...');
        
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
        $this->command->info('🏢 Étape 2/12 : Plateformes et configuration...');
        
        $this->call([
            PlatformSeeder::class,
            SettingSeeder::class,
            AdminUserSeeder::class,
        ]);

        // =====================================================================
        // ÉTAPE 3 : Données métier (Business Data)
        // =====================================================================
        $this->command->info('');
        $this->command->info('💼 Étape 3/12 : Données métier...');
        
        $this->call([
            ThemeSeeder::class,
            ProviderTypeSeeder::class,
            LawyerSpecialtySeeder::class,
            ExpatDomainSeeder::class,
            UlixaiServiceSeeder::class,
            PlatformKnowledgeSeeder::class,
        ]);

        // =====================================================================
        // ÉTAPE 4 : Templates et contenu
        // =====================================================================
        $this->command->info('');
        $this->command->info('📝 Étape 4/12 : Templates et contenu...');
        
        $this->call([
            TemplateSeeder::class,
            TitleTemplateSeeder::class,
            PromptTemplateSeeder::class,
            CtaTemplateSeeder::class,
            PressReleaseTemplateSeeder::class,
        ]);

        // =====================================================================
        // ÉTAPE 5 : Monétisation et auteurs
        // =====================================================================
        $this->command->info('');
        $this->command->info('💰 Étape 5/12 : Monétisation et auteurs...');
        
        $this->call([
            AffiliateLinkSeeder::class,
            AuthorSeeder::class,
        ]);

        // =====================================================================
        // ÉTAPE 6 : Configuration publication et images
        // =====================================================================
        $this->command->info('');
        $this->command->info('⚙️ Étape 6/12 : Configuration publication et images...');
        
        $this->call([
            PublicationScheduleSeeder::class,
            ImageConfigSeeder::class,
        ]);

        // =====================================================================
        // ÉTAPE 7 : Style Settings (AJOUTÉ)
        // =====================================================================
        $this->command->info('');
        $this->command->info('🎨 Étape 7/12 : Style Settings...');
        
        $this->call([
            StyleSettingsSeeder::class,
            LandingSectionsSeeder::class,
        ]);

        // =====================================================================
        // ÉTAPE 8 : Content Templates
        // =====================================================================
        $this->command->info('');
        $this->command->info('📋 Étape 8/12 : Content Templates...');
        
        $this->call([
            ContentTemplateSeeder::class,
            PresetSeeder::class,
        ]);

        // =====================================================================
        // ÉTAPE 9 : Domaines autoritaires
        // =====================================================================
        $this->command->info('');
        $this->command->info('🔗 Étape 9/12 : Domaines autoritaires...');
        
        $this->call([
            GovernmentDomainsSeeder::class,
            OrganizationDomainsSeeder::class,
            ReferenceDomainsSeeder::class,
        ]);

        // =====================================================================
        // ÉTAPE 10 : Configuration Export
        // =====================================================================
        $this->command->info('');
        $this->command->info('📤 Étape 10/12 : Configuration Export...');
        
        $this->call([
            ExportConfigSeeder::class,
        ]);

        // =====================================================================
        // ÉTAPE 11 : Sources de recherche (AJOUTÉ)
        // =====================================================================
        $this->command->info('');
        $this->command->info('🔍 Étape 11/12 : Sources de recherche...');
        
        $this->call([
            ResearchSourceSeeder::class,
        ]);

        // =====================================================================
        // ÉTAPE 12 : Données de test (optionnel - uniquement dev/staging)
        // =====================================================================
        if (app()->environment('local', 'development', 'staging')) {
            $this->command->info('');
            $this->command->info('🧪 Étape 12/12 : Données de test (environnement dev)...');
            
            // Décommenter si besoin de données de test
            // $this->call([
            //     DossierSeeder::class,
            //     TestDataSeeder::class,
            // ]);
        }

        // =====================================================================
        // RÉSUMÉ
        // =====================================================================
        $this->command->info('');
        $this->command->info('╔════════════════════════════════════════════════════════════╗');
        $this->command->info('║                    ✅ SEEDING TERMINÉ                      ║');
        $this->command->info('╠════════════════════════════════════════════════════════════╣');
        $this->command->info('║  📊 Langues              : 9                               ║');
        $this->command->info('║  🌍 Pays                 : 200                             ║');
        $this->command->info('║  🏢 Plateformes          : 3                               ║');
        $this->command->info('║  📂 Thèmes               : 15                              ║');
        $this->command->info('║  👤 Types prestataires   : 6                               ║');
        $this->command->info('║  ⚖️  Spécialités avocat   : 50+                            ║');
        $this->command->info('║  🏠 Domaines expat       : 12                              ║');
        $this->command->info('║  🛠️  Services Ulixai      : 50+                            ║');
        $this->command->info('║  🔗 Liens affiliés       : Configurés                      ║');
        $this->command->info('║  ✍️  Auteurs E-E-A-T      : 4                              ║');
        $this->command->info('║  🎨 Style Settings       : 90 (30 par plateforme)          ║');
        $this->command->info('║  📋 Content Templates    : Configurés                      ║');
        $this->command->info('║  🌐 Domaines autoritaires: Configurés                      ║');
        $this->command->info('║  🔍 Sources recherche    : Configurées                     ║');
        $this->command->info('╚════════════════════════════════════════════════════════════╝');
        $this->command->info('');
        $this->command->info('🚀 Base de données prête pour la production !');
        $this->command->info('');
    }
}