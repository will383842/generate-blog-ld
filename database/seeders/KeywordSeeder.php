<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Illuminate\Support\Str;

/**
 * Import unifié : SOS-Expat + Ulixai
 * 
 * Génère :
 * - 20,000+ mots-clés pour les deux plateformes
 * - Phrases naturelles pour intégration fluide
 * - Templates SEO optimisés
 * 
 * ⚠️ PAS de keyword stuffing - Intégration naturelle uniquement
 */
class KeywordSeeder extends Seeder
{
    private array $countries = [];
    private array $languages = ['fr', 'en', 'de', 'es', 'pt', 'ru', 'zh', 'ar', 'hi'];
    
    public function run(): void
    {
        $this->command->info("🚀 IMPORT SYSTÈME MOTS-CLÉS SEO");
        $this->command->info("================================\n");

        DB::beginTransaction();
        try {
            // 1. Importer SOS-Expat
            $this->importPlatform('SOS-Expat', 1);
            
            // 2. Importer Ulixai
            $this->importPlatform('Ulixai', 2);
            
            // 3. Générer phrases naturelles
            $this->generateNaturalPhrases();
            
            DB::commit();
            $this->command->info("\n✅ Import terminé avec succès!");
            $this->printStatistics();
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error("\n❌ Erreur: " . $e->getMessage());
            throw $e;
        }
    }

    private function importPlatform(string $platformName, int $platformId): void
    {
        $this->command->info("📦 Import {$platformName}...");
        
        $filename = $platformName === 'SOS-Expat' 
            ? 'SOS_EXPAT_Keywords_Database.xlsx'
            : 'Ulixai_Keywords_Database.xlsx';
            
        $excelFile = storage_path("app/imports/{$filename}");
        
        if (!file_exists($excelFile)) {
            $this->command->warn("  ⚠️  Fichier non trouvé: {$filename} - Ignoré");
            return;
        }

        $spreadsheet = IOFactory::load($excelFile);
        
        // Charger pays si pas déjà fait
        if (empty($this->countries)) {
            $this->loadCountries($spreadsheet);
        }
        
        $this->importServices($spreadsheet, $platformId);
        $this->importKeywordTemplates($spreadsheet, $platformId);
        $this->importSeoTemplates($spreadsheet, $platformId);
        $this->generateKeywordCombinations($platformId, $platformName);
        
        $this->command->line("  ✓ {$platformName} importé\n");
    }

    private function loadCountries($spreadsheet): void
    {
        $this->command->line("  → Chargement pays...");
        
        try {
            $sheet = $spreadsheet->getSheetByName('COUNTRIES') 
                ?? $spreadsheet->getSheetByName('Countries');
                
            if (!$sheet) {
                $this->command->warn("    Feuille COUNTRIES non trouvée, utilisation liste par défaut");
                $this->countries = $this->getDefaultCountries();
                return;
            }
            
            $rows = $sheet->toArray();
            foreach (array_slice($rows, 1) as $row) {
                if (empty($row[0])) continue;
                
                $this->countries[] = [
                    'id' => (int)$row[0],
                    'name' => $row[1],
                    'translations' => [
                        'fr' => $row[2] ?? $row[1],
                        'en' => $row[3] ?? $row[1],
                        'de' => $row[4] ?? $row[1],
                        'es' => $row[5] ?? $row[1],
                        'pt' => $row[6] ?? $row[1],
                        'ru' => $row[7] ?? $row[1],
                        'zh' => $row[8] ?? $row[1],
                        'ar' => $row[9] ?? $row[1],
                        'hi' => $row[10] ?? $row[1],
                    ]
                ];
            }
        } catch (\Exception $e) {
            $this->command->warn("    Erreur chargement pays: " . $e->getMessage());
            $this->countries = $this->getDefaultCountries();
        }
        
        $this->command->line("    ✓ " . count($this->countries) . " pays");
    }

    private function importServices($spreadsheet, int $platformId): void
    {
        $this->command->line("  → Import services...");
        
        try {
            $sheet = $spreadsheet->getSheetByName('SERVICES') 
                ?? $spreadsheet->getSheetByName('Services');
                
            if (!$sheet) {
                $this->command->warn("    Feuille SERVICES non trouvée");
                return;
            }
            
            $rows = $sheet->toArray();
            $services = [];
            
            foreach (array_slice($rows, 1) as $row) {
                if (empty($row[0]) && empty($row[1])) continue;
                
                $serviceKey = !empty($row[1]) ? Str::slug($row[1], '_') : Str::slug($row[0], '_');
                
                // Éviter doublons
                if (DB::table('keyword_services')->where('service_key', $serviceKey)->exists()) {
                    continue;
                }
                
                $services[] = [
                    'platform_id' => $platformId,
                    'service_key' => $serviceKey,
                    'translations' => json_encode([
                        'fr' => $row[0] ?? $row[1],
                        'en' => $row[1] ?? $row[0],
                        'de' => $row[2] ?? $row[0],
                        'es' => $row[3] ?? $row[0],
                        'pt' => $row[4] ?? $row[0],
                        'ru' => $row[5] ?? $row[0],
                        'zh' => $row[6] ?? $row[0],
                        'ar' => $row[7] ?? $row[0],
                        'hi' => $row[8] ?? $row[0],
                    ]),
                    'category' => $row[9] ?? $row[2] ?? 'general',
                    'priority' => (int)($row[10] ?? 50),
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
            
            if (!empty($services)) {
                DB::table('keyword_services')->insert($services);
            }
            
            $this->command->line("    ✓ " . count($services) . " services");
        } catch (\Exception $e) {
            $this->command->error("    ✗ Erreur: " . $e->getMessage());
        }
    }

    private function importKeywordTemplates($spreadsheet, int $platformId): void
    {
        $this->command->line("  → Import templates keywords...");
        
        try {
            $sheet = $spreadsheet->getSheetByName('KEYWORD_TEMPLATES') 
                ?? $spreadsheet->getSheetByName('Keywords');
                
            if (!$sheet) {
                // Templates par défaut
                $this->createDefaultTemplates($platformId);
                return;
            }
            
            $rows = $sheet->toArray();
            $templates = [];
            
            foreach (array_slice($rows, 1) as $row) {
                if (empty($row[1])) continue;
                
                $pattern = $row[1];
                preg_match_all('/\{([^}]+)\}/', $pattern, $matches);
                $variables = $matches[1];
                
                $templateKey = $platformId . '_' . Str::slug($row[0] ?? uniqid(), '_');
                
                $templates[] = [
                    'platform_id' => $platformId,
                    'template_key' => $templateKey,
                    'pattern' => $pattern,
                    'variables' => json_encode($variables),
                    'intent_type' => $row[3] ?? 'informational',
                    'priority' => (int)($row[4] ?? 50),
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
            
            if (!empty($templates)) {
                DB::table('keyword_templates')->insert($templates);
            }
            
            $this->command->line("    ✓ " . count($templates) . " templates");
        } catch (\Exception $e) {
            $this->command->warn("    ⚠️  " . $e->getMessage());
            $this->createDefaultTemplates($platformId);
        }
    }

    private function createDefaultTemplates(int $platformId): void
    {
        $templates = [
            ['pattern' => '{service} {country}', 'intent' => 'informational'],
            ['pattern' => '{service} {country_lower}', 'intent' => 'transactional'],
            ['pattern' => '{service} urgent {country}', 'intent' => 'transactional'],
        ];
        
        $data = [];
        foreach ($templates as $i => $t) {
            $data[] = [
                'platform_id' => $platformId,
                'template_key' => $platformId . '_default_' . $i,
                'pattern' => $t['pattern'],
                'variables' => json_encode(['service', 'country']),
                'intent_type' => $t['intent'],
                'priority' => 50,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        
        DB::table('keyword_templates')->insert($data);
        $this->command->line("    ✓ " . count($data) . " templates par défaut");
    }

    private function importSeoTemplates($spreadsheet, int $platformId): void
    {
        $this->command->line("  → Import templates SEO...");
        
        try {
            $sheet = $spreadsheet->getSheetByName('SEO_TEMPLATES');
            
            if (!$sheet) {
                $this->createDefaultSeoTemplates($platformId);
                return;
            }
            
            $rows = $sheet->toArray();
            $seoTemplates = [];
            
            foreach (array_slice($rows, 1) as $row) {
                if (empty($row[1])) continue;
                
                $pattern = $row[1];
                preg_match_all('/\{([^}]+)\}/', $pattern, $matches);
                $variables = $matches[1];
                
                $templateKey = $platformId . '_' . Str::slug($row[0] ?? uniqid(), '_');
                
                $seoTemplates[] = [
                    'platform_id' => $platformId,
                    'template_key' => $templateKey,
                    'language_code' => $row[2] ?? 'fr',
                    'template_type' => $row[3] ?? 'title',
                    'template' => $pattern,
                    'variables' => json_encode($variables),
                    'max_length' => (int)($row[4] ?? 60),
                    'priority' => (int)($row[5] ?? 50),
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
            
            if (!empty($seoTemplates)) {
                DB::table('keyword_seo_templates')->insert($seoTemplates);
            }
            
            $this->command->line("    ✓ " . count($seoTemplates) . " templates SEO");
        } catch (\Exception $e) {
            $this->command->warn("    ⚠️  " . $e->getMessage());
            $this->createDefaultSeoTemplates($platformId);
        }
    }

    private function createDefaultSeoTemplates(int $platformId): void
    {
        $templates = [];
        
        foreach ($this->languages as $lang) {
            $templates[] = [
                'platform_id' => $platformId,
                'template_key' => $platformId . '_title_' . $lang,
                'language_code' => $lang,
                'template_type' => 'title',
                'template' => '{keyword} - Guide Complet | {platform}',
                'variables' => json_encode(['keyword', 'platform']),
                'max_length' => 60,
                'priority' => 50,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        
        DB::table('keyword_seo_templates')->insert($templates);
        $this->command->line("    ✓ " . count($templates) . " templates SEO par défaut");
    }

    private function generateKeywordCombinations(int $platformId, string $platformName): void
    {
        $this->command->line("  → Génération combinaisons keywords...");
        $this->command->line("    ⏳ Patientez 2-5 minutes...");
        
        $services = DB::table('keyword_services')->where('platform_id', $platformId)->get();
        $templates = DB::table('keyword_templates')->where('platform_id', $platformId)->where('is_active', true)->get();
        
        $combinations = [];
        $count = 0;
        $batchSize = 500;
        
        foreach ($services as $service) {
            $translations = json_decode($service->translations, true);
            
            foreach ($templates as $template) {
                $pattern = $template->pattern;
                
                foreach ($this->countries as $country) {
                    foreach ($this->languages as $lang) {
                        $serviceText = $translations[$lang] ?? $translations['fr'];
                        $countryText = $country['translations'][$lang] ?? $country['name'];
                        
                        $keyword = $this->replaceVariables($pattern, [
                            'service' => $serviceText,
                            'country' => $countryText,
                            'platform' => $platformName,
                        ], $lang);
                        
                        $combinations[] = [
                            'platform_id' => $platformId,
                            'service_id' => $service->id,
                            'template_id' => $template->id,
                            'country_id' => $country['id'],
                            'language_code' => $lang,
                            'keyword_text' => $keyword,
                            'keyword_normalized' => $this->normalizeKeyword($keyword),
                            'intent_type' => $template->intent_type,
                            'search_volume' => 0,
                            'competition' => 0.50,
                            'priority_score' => $template->priority,
                            'usage_count' => 0,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                        
                        $count++;
                        
                        if (count($combinations) >= $batchSize) {
                            DB::table('keyword_combinations')->insert($combinations);
                            $combinations = [];
                            $this->command->line("    → {$count} combinaisons...");
                        }
                    }
                }
            }
        }
        
        if (!empty($combinations)) {
            DB::table('keyword_combinations')->insert($combinations);
        }
        
        $this->command->line("    ✓ {$count} combinaisons");
    }

    /**
     * ✨ NOUVEAU : Phrases naturelles pour intégration fluide
     */
    private function generateNaturalPhrases(): void
    {
        $this->command->info("\n📝 Génération phrases naturelles...");
        
        $phrases = [
            // Français
            ['fr', 'opening', 'Vous recherchez {keyword} ? Notre guide complet vous accompagne pas à pas.'],
            ['fr', 'opening', 'Besoin d\'aide pour {keyword} ? Découvrez nos conseils d\'experts.'],
            ['fr', 'opening', '{keyword} : voici tout ce que vous devez savoir pour réussir.'],
            ['fr', 'transition', 'Concernant {keyword}, plusieurs options s\'offrent à vous.'],
            ['fr', 'transition', 'Pour ce qui est de {keyword}, il est essentiel de comprendre les étapes clés.'],
            ['fr', 'conclusion', 'En résumé, {keyword} nécessite une préparation minutieuse.'],
            ['fr', 'question', 'Comment réussir {keyword} ? Voici nos recommandations.'],
            
            // Anglais
            ['en', 'opening', 'Looking for {keyword}? Our complete guide will help you every step of the way.'],
            ['en', 'opening', 'Need help with {keyword}? Discover our expert advice.'],
            ['en', 'transition', 'Regarding {keyword}, several options are available to you.'],
            ['en', 'conclusion', 'In summary, {keyword} requires careful preparation.'],
            
            // Espagnol
            ['es', 'opening', '¿Busca {keyword}? Nuestra guía completa le acompañará en cada paso.'],
            ['es', 'transition', 'En cuanto a {keyword}, varias opciones están disponibles.'],
            
            // Allemand
            ['de', 'opening', 'Sie suchen {keyword}? Unser vollständiger Leitfaden begleitet Sie Schritt für Schritt.'],
            ['de', 'transition', 'Was {keyword} betrifft, stehen Ihnen mehrere Optionen zur Verfügung.'],
        ];
        
        $data = [];
        foreach ($phrases as $i => $phrase) {
            $data[] = [
                'language_code' => $phrase[0],
                'phrase_type' => $phrase[1],
                'template' => $phrase[2],
                'variables' => json_encode(['keyword']),
                'priority' => 50,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        
        DB::table('keyword_natural_phrases')->insert($data);
        $this->command->line("  ✓ " . count($data) . " phrases naturelles");
    }

    private function replaceVariables(string $pattern, array $vars, string $lang): string
    {
        $keyword = $pattern;
        
        foreach ($vars as $key => $value) {
            $keyword = str_replace('{' . $key . '}', $value, $keyword);
            $keyword = str_replace('{' . $key . '_lower}', mb_strtolower($value), $keyword);
        }
        
        $keyword = preg_replace('/\{[^}]+\}/', '', $keyword);
        $keyword = preg_replace('/\s+/', ' ', $keyword);
        return trim($keyword);
    }

    private function normalizeKeyword(string $keyword): string
    {
        $normalized = mb_strtolower($keyword);
        $normalized = Str::ascii($normalized);
        $normalized = preg_replace('/[^a-z0-9\s]/', '', $normalized);
        $normalized = preg_replace('/\s+/', ' ', $normalized);
        return trim($normalized);
    }

    private function getDefaultCountries(): array
    {
        // Top 47 pays pour expatriés
        return [
            ['id' => 164, 'name' => 'Thaïlande', 'translations' => ['fr' => 'Thaïlande', 'en' => 'Thailand']],
            ['id' => 74, 'name' => 'France', 'translations' => ['fr' => 'France', 'en' => 'France']],
            ['id' => 212, 'name' => 'États-Unis', 'translations' => ['fr' => 'États-Unis', 'en' => 'United States']],
            // ... (ajouter les 44 autres si nécessaire)
        ];
    }

    private function printStatistics(): void
    {
        $this->command->info("\n📊 STATISTIQUES:");
        $this->command->table(
            ['Type', 'Nombre'],
            [
                ['Services totaux', DB::table('keyword_services')->count()],
                ['Templates keywords', DB::table('keyword_templates')->count()],
                ['Templates SEO', DB::table('keyword_seo_templates')->count()],
                ['Phrases naturelles', DB::table('keyword_natural_phrases')->count()],
                ['Combinaisons', DB::table('keyword_combinations')->count()],
            ]
        );
        
        $this->command->info("\n📋 PAR PLATEFORME:");
        $platforms = DB::table('keyword_combinations')
            ->join('keyword_services', 'keyword_combinations.service_id', '=', 'keyword_services.id')
            ->join('platforms', 'keyword_services.platform_id', '=', 'platforms.id')
            ->select('platforms.name', DB::raw('count(*) as count'))
            ->groupBy('platforms.name')
            ->get();
            
        foreach ($platforms as $p) {
            $this->command->line("  {$p->name}: {$p->count}");
        }
    }
}
