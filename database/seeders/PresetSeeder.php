<?php

namespace Database\Seeders;

use App\Models\Preset;
use Illuminate\Database\Seeder;

class PresetSeeder extends Seeder
{
    public function run(): void
    {
        $presets = [
            // CONTENT TYPE PRESETS
            [
                'name' => 'Articles SEO Standard',
                'description' => 'Configuration optimale pour articles SEO (1500-2500 mots)',
                'type' => Preset::TYPE_CONTENT,
                'config' => [
                    'content_types' => ['article'],
                    'word_count' => ['min' => 1500, 'max' => 2500],
                ],
                'is_default' => true,
                'is_system' => true,
            ],
            [
                'name' => 'Articles Piliers',
                'description' => 'Articles piliers longs (3000-5000 mots)',
                'type' => Preset::TYPE_CONTENT,
                'config' => [
                    'content_types' => ['pillar'],
                    'word_count' => ['min' => 3000, 'max' => 5000],
                ],
                'is_system' => true,
            ],
            [
                'name' => 'Mix Complet',
                'description' => 'Tous les types de contenu',
                'type' => Preset::TYPE_CONTENT,
                'config' => [
                    'content_types' => ['article', 'pillar', 'comparative', 'landing'],
                    'word_count' => ['min' => 1500, 'max' => 3000],
                ],
                'is_system' => true,
            ],

            // GEOGRAPHIC PRESETS
            [
                'name' => 'Europe Francophone',
                'description' => 'France, Belgique, Suisse, Luxembourg',
                'type' => Preset::TYPE_GEOGRAPHIC,
                'config' => [
                    'regions' => ['europe'],
                    'countries' => null, // Filtré par région
                    'languages' => ['fr'],
                ],
                'is_system' => true,
            ],
            [
                'name' => 'Global Multilingue',
                'description' => 'Tous les pays, toutes les langues',
                'type' => Preset::TYPE_GEOGRAPHIC,
                'config' => [
                    'countries' => null,
                    'languages' => null,
                ],
                'is_default' => true,
                'is_system' => true,
            ],
            [
                'name' => 'Asie-Pacifique',
                'description' => 'Région Asie-Pacifique en anglais',
                'type' => Preset::TYPE_GEOGRAPHIC,
                'config' => [
                    'regions' => ['asia', 'oceania'],
                    'languages' => ['en', 'zh', 'ja'],
                ],
                'is_system' => true,
            ],

            // GENERATION PRESETS
            [
                'name' => 'Standard Quality',
                'description' => 'Configuration équilibrée coût/qualité',
                'type' => Preset::TYPE_GENERATION,
                'config' => [
                    'tone' => 'professional',
                    'include_faq' => true,
                    'faq_count' => 5,
                    'include_sources' => true,
                    'source_count' => 3,
                    'image_mode' => 'unsplash_first',
                    'max_images' => 2,
                    'research_enabled' => true,
                    'quality_threshold' => 70,
                ],
                'is_default' => true,
                'is_system' => true,
            ],
            [
                'name' => 'High Quality',
                'description' => 'Qualité maximale, recherche approfondie',
                'type' => Preset::TYPE_GENERATION,
                'config' => [
                    'tone' => 'professional',
                    'include_faq' => true,
                    'faq_count' => 8,
                    'include_sources' => true,
                    'source_count' => 5,
                    'image_mode' => 'unsplash_first',
                    'max_images' => 3,
                    'research_enabled' => true,
                    'quality_threshold' => 85,
                ],
                'is_system' => true,
            ],
            [
                'name' => 'Budget Optimized',
                'description' => 'Optimisé pour réduire les coûts',
                'type' => Preset::TYPE_GENERATION,
                'config' => [
                    'tone' => 'professional',
                    'include_faq' => true,
                    'faq_count' => 3,
                    'include_sources' => false,
                    'source_count' => 0,
                    'image_mode' => 'unsplash_only',
                    'max_images' => 1,
                    'research_enabled' => false,
                    'quality_threshold' => 60,
                ],
                'is_system' => true,
            ],

            // PUBLICATION PRESETS
            [
                'name' => 'Auto-Publish FR',
                'description' => 'Publication auto avec traduction FR prioritaire',
                'type' => Preset::TYPE_PUBLICATION,
                'config' => [
                    'auto_translate' => true,
                    'auto_publish' => true,
                    'seo_optimization' => true,
                    'internal_links' => true,
                    'external_links' => true,
                    'cta_enabled' => true,
                ],
                'is_system' => true,
            ],
            [
                'name' => 'Draft Only',
                'description' => 'Brouillons uniquement, validation manuelle',
                'type' => Preset::TYPE_PUBLICATION,
                'config' => [
                    'auto_translate' => true,
                    'auto_publish' => false,
                    'seo_optimization' => true,
                    'internal_links' => true,
                    'external_links' => true,
                    'cta_enabled' => true,
                ],
                'is_default' => true,
                'is_system' => true,
            ],

            // FULL PROGRAM PRESETS
            [
                'name' => 'Programme Standard SOS-Expat',
                'description' => 'Configuration complète pour SOS-Expat',
                'type' => Preset::TYPE_FULL_PROGRAM,
                'config' => [
                    'content_types' => ['article', 'pillar'],
                    'countries' => null,
                    'languages' => ['fr', 'en', 'es'],
                    'quantity_mode' => 'per_country',
                    'quantity_value' => 1,
                    'recurrence_type' => 'daily',
                    'recurrence_config' => [
                        'time' => '06:00',
                        'timezone' => 'Europe/Paris',
                    ],
                    'tone' => 'professional',
                    'include_faq' => true,
                    'faq_count' => 5,
                    'image_mode' => 'unsplash_first',
                    'max_images' => 2,
                    'auto_translate' => true,
                    'auto_publish' => false,
                    'research_enabled' => true,
                    'quality_threshold' => 75,
                ],
                'is_system' => true,
            ],
            [
                'name' => 'Programme Intensif',
                'description' => 'Génération massive pour couverture rapide',
                'type' => Preset::TYPE_FULL_PROGRAM,
                'config' => [
                    'content_types' => ['article'],
                    'countries' => null,
                    'languages' => null,
                    'quantity_mode' => 'per_country_language',
                    'quantity_value' => 1,
                    'recurrence_type' => 'daily',
                    'recurrence_config' => [
                        'time' => '02:00',
                        'timezone' => 'UTC',
                    ],
                    'tone' => 'professional',
                    'include_faq' => true,
                    'faq_count' => 3,
                    'image_mode' => 'unsplash_only',
                    'max_images' => 1,
                    'auto_translate' => false,
                    'auto_publish' => false,
                    'research_enabled' => false,
                    'quality_threshold' => 65,
                ],
                'is_system' => true,
            ],
        ];

        foreach ($presets as $preset) {
            Preset::updateOrCreate(
                ['name' => $preset['name'], 'type' => $preset['type']],
                $preset
            );
        }
    }
}