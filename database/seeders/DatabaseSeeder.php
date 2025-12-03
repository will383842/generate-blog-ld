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
        $this->command->info('📦 Étape 1/8 : Données de référence...');
        
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
        $this->command->info('🏢 Étape 2/8 : Plateformes et configuration...');
        
        $this->call([
            PlatformSeeder::class,
            SettingSeeder::class,
            AdminUserSeeder::class,
        ]);

        // =====================================================================
        // ÉTAPE 3 : Données métier (Business Data)
        // =====================================================================
        $this->command->info('');
        $this->command->info('💼 Étape 3/8 : Données métier...');
        
        $this->call([
            ThemeSeeder::class,
            ProviderTypeSeeder::class,
            LawyerSpecialtySeeder::class,
            ExpatDomainSeeder::class,
            UlixaiServiceSeeder::class,
            PlatformKnowledgeSeeder::class, // ← Phase 11-12
        ]);

        // =====================================================================
        // ÉTAPE 4 : Templates et contenu
        // =====================================================================
        $this->command->info('');
        $this->command->info('📝 Étape 4/8 : Templates et contenu...');
        
        $this->call([
            TemplateSeeder::class,
            TitleTemplateSeeder::class,
            PromptTemplateSeeder::class,
            CtaTemplateSeeder::class,
            PressReleaseTemplateSeeder::class, // ← AJOUTÉ Phase 15 ✨
        ]);

        // =====================================================================
        // ÉTAPE 5 : Monétisation et auteurs
        // =====================================================================
        $this->command->info('');
        $this->command->info('💰 Étape 5/8 : Monétisation et auteurs...');
        
        $this->call([
            AffiliateLinkSeeder::class,
            AuthorSeeder::class,
        ]);

        // =====================================================================
        // ÉTAPE 6 : Configuration publication et images
        // =====================================================================
        $this->command->info('');
        $this->command->info('⚙️ Étape 6/8 : Configuration publication et images...');
        
        $this->call([
            PublicationScheduleSeeder::class,
            ImageConfigSeeder::class,
        ]);

        // =====================================================================
        // ÉTAPE 7 : Configuration SEO et landing sections (Phase 9+)
        // =====================================================================
        $this->command->info('');
        $this->command->info('🎨 Étape 7/8 : SEO et landing sections...');
        
        $this->call([
            LandingSectionsSeeder::class,
        ]);

        // =====================================================================
        // ÉTAPE 8 : Articles piliers (Phase 14) ✨
        // =====================================================================
        $this->command->info('');
        $this->command->info('📚 Étape 8/8 : Planification articles piliers...');
        
        // Note: Les schedules piliers sont créés automatiquement par le système
        // Ce seeder est optionnel si vous voulez pré-générer des schedules
        // $this->call([
        //     PillarScheduleSeeder::class,
        // ]);

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
        $this->command->info('║  🏠 Domaines expat       : 12 (6 SOS + 6 Ulixai)           ║');
        $this->command->info('║  🛠️  Services Ulixai      : 50+                            ║');
        $this->command->info('║  🔗 Liens affiliés       : Configurés                      ║');
        $this->command->info('║  ✍️  Auteurs E-E-A-T      : 4                              ║');
        $this->command->info('║  📋 Prompts IA           : 7                               ║');
        $this->command->info('║  🧠 Platform Knowledge   : 405 entrées (30×9×3)            ║');
        $this->command->info('║  🎨 Landing Sections     : Configurées                     ║');
        $this->command->info('║  📰 Press Templates      : 45 (5 types × 9 langues) ✨     ║');
        $this->command->info('╚════════════════════════════════════════════════════════════╝');
        $this->command->info('');
        $this->command->info('🚀 Base de données prête pour génération de contenu Phase 1-15');
        $this->command->info('');
        $this->command->info('💡 Prochaines étapes:');
        $this->command->info('   1. Configurer .env (UNSPLASH_ACCESS_KEY)');
        $this->command->info('   2. Tester génération: POST /api/press-releases/generate');
        $this->command->info('   3. Vérifier templates: SELECT * FROM press_release_templates');
        $this->command->info('');
    }
}