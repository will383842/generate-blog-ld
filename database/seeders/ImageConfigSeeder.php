<?php

namespace Database\Seeders;

use App\Models\ImageConfig;
use App\Models\Platform;
use Illuminate\Database\Seeder;

class ImageConfigSeeder extends Seeder
{
    public function run(): void
    {
        $configs = [
            // Configuration globale Article
            [
                'content_type' => 'article',
                'platform_id' => null,
                'source_priority' => 'mixed',
                'width' => 1200,
                'height' => 675,
                'format' => 'webp',
                'quality' => 85,
                'generate_alt_text' => true,
                'dalle_prompt_template' => 'Professional photograph of {theme} in {country}. Modern, clean, high quality corporate setting. No text overlay. 16:9 ratio. Warm lighting, diverse people.',
            ],
            // Configuration globale Landing
            [
                'content_type' => 'landing',
                'platform_id' => null,
                'source_priority' => 'dalle',
                'width' => 1920,
                'height' => 1080,
                'format' => 'webp',
                'quality' => 80,
                'generate_alt_text' => true,
                'dalle_prompt_template' => 'Hero image for {service} service landing page. Modern, professional, inspiring. Shows success and trust. No text. Wide format.',
            ],
            // Configuration globale Comparatif
            [
                'content_type' => 'comparative',
                'platform_id' => null,
                'source_priority' => 'library',
                'width' => 1200,
                'height' => 675,
                'format' => 'webp',
                'quality' => 85,
                'generate_alt_text' => true,
                'dalle_prompt_template' => 'Infographic style image comparing {elements}. Clean design, professional, easy to understand. No text. Modern flat design.',
            ],
        ];

        // Ajouter configs spécifiques par plateforme
        $platforms = Platform::all();
        
        foreach ($platforms as $platform) {
            $configs[] = [
                'content_type' => 'article',
                'platform_id' => $platform->id,
                'source_priority' => 'mixed',
                'width' => 1200,
                'height' => 675,
                'format' => 'webp',
                'quality' => 85,
                'generate_alt_text' => true,
                'dalle_prompt_template' => null, // Utilise le template global
            ];
        }

        foreach ($configs as $config) {
            ImageConfig::updateOrCreate(
                [
                    'content_type' => $config['content_type'],
                    'platform_id' => $config['platform_id'],
                ],
                $config
            );
        }

        $this->command->info('✓ ' . count($configs) . ' configurations images créées');
    }
}
