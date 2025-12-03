<?php

namespace Database\Seeders;

use App\Models\Platform;
use App\Models\Setting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeder pour initialiser la configuration des sections de landing pages
 * 
 * Crée la configuration par défaut des sections pour chaque plateforme :
 * - Hero (obligatoire, activé)
 * - Problème (activé)
 * - Solution (activé)
 * - Avantages (activé)
 * - Comment ça marche (activé)
 * - Preuves sociales (DÉSACTIVÉ) ⚠️
 * - Tarifs (DÉSACTIVÉ) ⚠️
 * - FAQ (activé)
 * - CTA Final (obligatoire, activé)
 */
class LandingSectionsSeeder extends Seeder
{
    /**
     * Configuration par défaut des sections
     */
    const DEFAULT_SECTIONS = [
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
            'description' => 'Témoignages clients',
            'required' => false,
            'enabled' => false, // ⚠️ DÉSACTIVÉ PAR DÉFAUT
            'order' => 6,
        ],
        'pricing' => [
            'name' => 'Tarifs',
            'description' => 'Plans tarifaires',
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

    /**
     * Exécute le seeder
     */
    public function run(): void
    {
        $this->command->info('🚀 Initialisation des sections de landing pages...');
        $this->command->newLine();

        $platforms = Platform::all();

        if ($platforms->isEmpty()) {
            $this->command->error('❌ Aucune plateforme trouvée. Exécutez d\'abord PlatformSeeder.');
            return;
        }

        $created = 0;
        $skipped = 0;

        foreach ($platforms as $platform) {
            $key = "landing_sections.platform_{$platform->id}";
            
            // Vérifier si la configuration existe déjà
            $exists = Setting::where('key', $key)
                ->where('group', 'landing_pages')
                ->exists();

            if ($exists) {
                $this->command->warn("  ⏭️  Configuration déjà existante pour {$platform->name}");
                $skipped++;
                continue;
            }

            // Créer la configuration
            // ✅ CORRECTION : json_encode() pour sauver l'array en JSON
            Setting::create([
                'key' => $key,
                'group' => 'landing_pages',
                'value' => json_encode(self::DEFAULT_SECTIONS), // ✅ CORRECTION ICI
                'type' => 'json',
                'description' => "Configuration des sections de landing pages pour {$platform->name}",
            ]);

            $created++;
            
            // Afficher le résumé pour cette plateforme
            $this->displayPlatformSummary($platform);
        }

        $this->command->newLine();
        $this->command->info("✅ Terminé !");
        $this->command->info("   Créées : {$created}");
        if ($skipped > 0) {
            $this->command->info("   Ignorées : {$skipped}");
        }
        $this->command->newLine();

        // Afficher les points importants
        $this->displayImportantNotes();
    }

    /**
     * Affiche le résumé pour une plateforme
     */
    protected function displayPlatformSummary(Platform $platform): void
    {
        $this->command->info("  ✓ Configuration créée pour : {$platform->name}");
        
        // Compter les sections activées/désactivées
        $enabled = array_filter(self::DEFAULT_SECTIONS, fn($s) => $s['enabled']);
        $disabled = array_filter(self::DEFAULT_SECTIONS, fn($s) => !$s['enabled']);
        
        $this->command->line("    • Sections activées : " . count($enabled) . "/9");
        $this->command->line("    • Sections désactivées : " . count($disabled) . "/9");
        
        $this->command->newLine();
    }

    /**
     * Affiche les notes importantes
     */
    protected function displayImportantNotes(): void
    {
        $this->command->warn('⚠️  CONFIGURATION PAR DÉFAUT :');
        $this->command->line('   • Hero : OBLIGATOIRE, activé');
        $this->command->line('   • Problème : activé');
        $this->command->line('   • Solution : activé');
        $this->command->line('   • Avantages : activé');
        $this->command->line('   • Comment ça marche : activé');
        $this->command->error('   • Preuves sociales : DÉSACTIVÉ ⚠️');
        $this->command->error('   • Tarifs : DÉSACTIVÉ ⚠️');
        $this->command->line('   • FAQ : activé');
        $this->command->line('   • CTA Final : OBLIGATOIRE, activé');
        $this->command->newLine();
        
        $this->command->info('💡 Pour modifier la configuration :');
        $this->command->line('   php artisan tinker');
        $this->command->line('   $manager = app(App\Services\Content\LandingSectionManager::class);');
        $this->command->line('   $manager->updateSectionStatus(platformId, \'testimonials\', true);');
        $this->command->newLine();
    }

    /**
     * Méthode pour réinitialiser toutes les configurations
     */
    public function reset(): void
    {
        $this->command->warn('🔄 Réinitialisation de toutes les configurations...');
        
        Setting::where('group', 'landing_pages')
            ->where('key', 'LIKE', 'landing_sections.platform_%')
            ->delete();
        
        $this->command->info('✅ Toutes les configurations ont été supprimées.');
        $this->command->info('   Exécutez à nouveau le seeder pour recréer les configurations par défaut.');
    }
}