<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Platform;
use App\Models\PdfConfig;
use App\Models\WordConfig;

class ExportConfigSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $platforms = Platform::all();

        $contentTypes = ['Article', 'PillarArticle', 'PressRelease', 'PressDossier'];

        // Couleurs brand par plateforme
        $platformColors = [
            'SOS-Expat' => [
                'primary' => '#e74c3c',
                'secondary' => '#c0392b',
                'text' => '#2c3e50',
                'background' => '#ffffff'
            ],
            'Ulixai' => [
                'primary' => '#3498db',
                'secondary' => '#2980b9',
                'text' => '#2c3e50',
                'background' => '#ffffff'
            ],
            'Ulysse.AI' => [
                'primary' => '#9b59b6',
                'secondary' => '#8e44ad',
                'text' => '#2c3e50',
                'background' => '#ffffff'
            ]
        ];

        foreach ($platforms as $platform) {
            $colors = $platformColors[$platform->name] ?? $platformColors['SOS-Expat'];

            foreach ($contentTypes as $contentType) {
                // Configuration PDF
                PdfConfig::create([
                    'platform_id' => $platform->id,
                    'content_type' => $contentType,
                    'logo_path' => "logos/{$platform->code}_logo.png",
                    'header_template' => $this->getHeaderTemplate($platform->name),
                    'footer_template' => $this->getFooterTemplate($platform->name),
                    'fonts' => [
                        'default' => 'Noto Sans',
                        'heading' => 'Noto Sans',
                        'body' => 'Noto Sans'
                    ],
                    'colors' => $colors
                ]);

                // Configuration WORD
                WordConfig::create([
                    'platform_id' => $platform->id,
                    'content_type' => $contentType,
                    'template_path' => null, // Templates optionnels
                    'styles' => [
                        'Title' => [
                            'name' => 'Noto Sans',
                            'size' => 18,
                            'bold' => true,
                            'color' => str_replace('#', '', $colors['primary'])
                        ],
                        'Heading1' => [
                            'name' => 'Noto Sans',
                            'size' => 16,
                            'bold' => true,
                            'color' => str_replace('#', '', $colors['secondary'])
                        ],
                        'Heading2' => [
                            'name' => 'Noto Sans',
                            'size' => 14,
                            'bold' => true
                        ],
                        'Normal' => [
                            'name' => 'Noto Sans',
                            'size' => 11
                        ]
                    ],
                    'fonts' => [
                        'default' => 'Noto Sans',
                        'arabic' => 'Noto Sans Arabic',
                        'chinese' => 'Noto Sans CJK SC',
                        'hindi' => 'Noto Sans Devanagari'
                    ]
                ]);
            }
        }

        $this->command->info('Export configurations seeded successfully!');
        $this->command->info('Created ' . (count($contentTypes) * $platforms->count() * 2) . ' configurations');
    }

    /**
     * Get header template HTML
     */
    private function getHeaderTemplate(string $platformName): string
    {
        return <<<HTML
<div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #ecf0f1;">
    <h3 style="margin: 0; font-size: 14pt; color: #2c3e50;">{$platformName}</h3>
</div>
HTML;
    }

    /**
     * Get footer template HTML
     */
    private function getFooterTemplate(string $platformName): string
    {
        $year = date('Y');
        return <<<HTML
<div style="text-align: center; padding: 10px 0; border-top: 1px solid #ecf0f1; font-size: 9pt; color: #7f8c8d;">
    <p>© {$year} {$platformName} - Tous droits réservés</p>
</div>
HTML;
    }
}