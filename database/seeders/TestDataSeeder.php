<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Article;
use App\Models\PressRelease;
use App\Models\PressDossier;
use App\Models\DossierSection;
use App\Models\Platform;
use App\Models\Country;
use App\Models\Language;

class TestDataSeeder extends Seeder
{
    public function run(): void
    {
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        echo "🔍 VÉRIFICATION DONNÉES EXISTANTES\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

        // UTILISER données existantes UNIQUEMENT
        $platform = Platform::first();
        if (!$platform) {
            echo "❌ ERREUR: Aucune Platform trouvée.\n";
            echo "   ACTION REQUISE: Créer une Platform manuellement:\n";
            echo "   php artisan tinker\n";
            echo "   >>> App\\Models\\Platform::create(['name' => 'Test', 'code' => 'TEST', 'slug' => 'test', 'domain' => 'test.local', 'url' => 'https://test.local', 'is_active' => true])\n\n";
            return;
        }
        echo "✅ Platform: {$platform->name} (ID: {$platform->id})\n";

        $country = Country::first();
        if (!$country) {
            echo "❌ ERREUR: Aucun Country trouvé.\n";
            echo "   ACTION REQUISE: Créer un Country manuellement via interface admin.\n\n";
            return;
        }
        echo "✅ Country: {$country->name} (ID: {$country->id})\n";

        $language = Language::where('code', 'fr')->first();
        if (!$language) {
            $language = Language::first();
        }
        if (!$language) {
            echo "❌ ERREUR: Aucune Language trouvée.\n";
            echo "   ACTION REQUISE: Créer une Language manuellement via interface admin.\n\n";
            return;
        }
        echo "✅ Language: {$language->name} (code: {$language->code}, ID: {$language->id})\n\n";

        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        echo "📝 CRÉATION DONNÉES TEST\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

        // Créer Article Pilier
        echo "1️⃣  Article Pilier...\n";
        try {
            $pillar = Article::create([
                'platform_id' => $platform->id,
                'country_id' => $country->id,
                'language_id' => $language->id,
                'type' => 'pillar',
                'title' => 'Guide Complet Test Pilier - ' . now()->format('Y-m-d H:i'),
                'slug' => 'guide-test-pilier-' . time(),
                'content' => '<h1>Guide Complet Pour Tester Export PDF/WORD</h1>
<p>Ce guide pilier sert à tester la fonctionnalité d\'export des articles piliers en PDF et WORD.</p>
<h2>Section 1: Introduction</h2>
<p>Le guide pilier est un format long et détaillé qui nécessite un export professionnel.</p>
<h2>Section 2: Méthodologie</h2>
<p>Nous utilisons une approche structurée pour garantir la qualité du contenu.</p>
<h2>Section 3: Résultats</h2>
<p>Les tests montrent une excellente qualité d\'export avec préservation de la mise en forme.</p>',
                'excerpt' => 'Résumé du guide complet pour tester les exports PDF/WORD des articles piliers.',
                'meta_title' => 'Guide Complet Test Pilier - Export PDF/WORD',
                'meta_description' => 'Description SEO du guide test pour validation des exports multilingues.',
                'status' => 'published',
                'word_count' => 150,
                'reading_time' => 2,
                'quality_score' => 85,
                'published_at' => now(),
            ]);
            echo "   ✅ Article Pilier créé: ID {$pillar->id}\n";
            echo "      Titre: {$pillar->title}\n\n";
        } catch (\Exception $e) {
            echo "   ❌ Erreur Article: " . $e->getMessage() . "\n";
            echo "      Champ manquant probablement. Vérifier structure table articles.\n\n";
        }

        // Créer PressRelease
        echo "2️⃣  PressRelease...\n";
        try {
            $pressRelease = PressRelease::create([
                'platform_id' => $platform->id,
                'template_type' => 'standard',
                'title' => 'Lancement Révolutionnaire - ' . now()->format('Y-m-d H:i'),
                'slug' => 'communique-test-' . time(),
                'lead' => 'Paris, France - Test Company annonce le lancement d\'une technologie révolutionnaire. Cette innovation majeure répond aux besoins croissants du marché en matière de qualité et d\'efficacité.',
                'body1' => '<p>Cette nouvelle technologie représente une avancée significative. Développée par une équipe d\'experts pendant trois années, elle intègre les dernières innovations en IA.</p><p>Les tests ont démontré une amélioration de 40% des performances.</p>',
                'body2' => '<p>Le déploiement commercial débutera au Q1 2025. Les premiers clients pilotes ont déjà exprimé leur satisfaction.</p><p>Cette solution s\'inscrit dans notre stratégie d\'innovation continue.</p>',
                'body3' => '<p>Nous accompagnerons ce lancement par un programme de formation complet. Un support technique dédié sera mis en place.</p>',
                'quote' => '"Cette innovation représente un tournant majeur pour notre secteur. Nous sommes fiers de proposer une solution qui répond aux défis actuels", déclare Jean Dupont, CEO.',
                'boilerplate' => 'À propos de Test Company: Fondée en 2020, Test Company est un leader reconnu dans le développement de solutions technologiques innovantes. Plus de 500 clients dans 30 pays.',
                'contact' => 'Contact Presse: Marie Martin - press@testcompany.com - +33 1 23 45 67 89',
                'language_code' => $language->code,
                'status' => 'published',
                'meta_title' => 'Lancement Nouvelle Technologie',
                'meta_description' => 'Test Company annonce le lancement d\'une technologie révolutionnaire.',
                'keywords' => json_encode(['technologie', 'innovation', 'lancement']),
                'published_at' => now(),
            ]);
            echo "   ✅ PressRelease créé: ID {$pressRelease->id}\n";
            echo "      Titre: {$pressRelease->title}\n\n";
        } catch (\Exception $e) {
            echo "   ❌ Erreur PressRelease: " . $e->getMessage() . "\n";
            echo "      Vérifier champs requis table press_releases.\n\n";
        }

        // Créer PressDossier
        echo "3️⃣  PressDossier...\n";
        try {
            $dossier = PressDossier::create([
                'platform_id' => $platform->id,
                'title' => 'Dossier de Presse Complet 2025 - ' . now()->format('Y-m-d H:i'),
                'slug' => 'dossier-test-' . time(),
                'description' => 'Ce dossier de presse complet présente en détail l\'ensemble des activités, réalisations et perspectives de Test Company pour l\'année 2025.',
                'status' => 'published',
                'meta_title' => 'Dossier de Presse 2025',
                'meta_description' => 'Dossier complet présentant les activités de Test Company.',
                'keywords' => json_encode(['dossier presse', 'entreprise', '2025']),
                'published_at' => now(),
            ]);
            echo "   ✅ PressDossier créé: ID {$dossier->id}\n";
            echo "      Titre: {$dossier->title}\n\n";

            // Créer Sections
            echo "   📝 Création sections...\n";
            
            $sectionsData = [
                [
                    'title' => 'Présentation de l\'Entreprise',
                    'content' => '<h2>Qui Sommes-Nous ?</h2><p>Test Company est une entreprise innovante fondée en 2020.</p><h3>Notre Histoire</h3><p>Croissance exceptionnelle de 5 à 200 collaborateurs.</p>'
                ],
                [
                    'title' => 'Nos Produits et Services',
                    'content' => '<h2>Portfolio Complet</h2><p>Gamme complète de solutions adaptées aux besoins clients.</p><h3>Solution Premium</h3><p>Pour grandes entreprises.</p>'
                ],
                [
                    'title' => 'Chiffres Clés 2024',
                    'content' => '<h2>Nos Résultats</h2><ul><li>CA: +45% vs 2023</li><li>500+ nouveaux clients</li><li>Satisfaction: 96%</li></ul>'
                ],
                [
                    'title' => 'Stratégie 2025',
                    'content' => '<h2>Vision Future</h2><p>Trois axes stratégiques majeurs.</p><h3>Innovation Produit</h3><p>3 nouvelles solutions IA.</p>'
                ],
                [
                    'title' => 'Équipe et Recrutement',
                    'content' => '<h2>Capital Humain</h2><p>200 collaborateurs, 80 embauches prévues en 2025.</p>'
                ],
            ];

            foreach ($sectionsData as $index => $sectionData) {
                $section = DossierSection::create([
                    'press_dossier_id' => $dossier->id,
                    'title' => $sectionData['title'],
                    'content' => $sectionData['content'],
                    'order_index' => $index + 1,
                ]);
                echo "      ✅ Section {$section->order_index}: {$section->title}\n";
            }

        } catch (\Exception $e) {
            echo "   ❌ Erreur Dossier: " . $e->getMessage() . "\n";
            echo "      Vérifier structure tables press_dossiers et dossier_sections.\n\n";
        }

        echo "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        echo "✅ SEEDER TERMINÉ\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

        // Résumé
        echo "📊 RÉSUMÉ:\n";
        echo "   Articles (total): " . Article::count() . "\n";
        echo "   Articles Piliers: " . Article::where('type', 'pillar')->count() . "\n";
        echo "   PressReleases: " . PressRelease::count() . "\n";
        echo "   PressDossiers: " . PressDossier::count() . "\n";
        echo "   DossierSections: " . DossierSection::count() . "\n\n";

        echo "🎯 DONNÉES TEST CRÉÉES AVEC SUCCÈS!\n\n";
        echo "TESTS POSSIBLES:\n";
        echo "1. Quality Check PressRelease\n";
        echo "2. Quality Check Dossier\n";
        echo "3. Export PillarArticle\n\n";
    }
}