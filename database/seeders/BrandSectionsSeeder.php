<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\BrandSection;
use App\Models\Platform;

class BrandSectionsSeeder extends Seeder
{
    public function run(): void
    {
        $platforms = Platform::all();

        foreach ($platforms as $platform) {
            $sections = [
                [
                    'platform_id' => $platform->id,
                    'section' => 'about',
                    'content' => [
                        'title' => 'À propos de ' . $platform->name,
                        'text' => 'Description de ' . $platform->name,
                    ],
                    'language' => 'fr',
                    'is_active' => true,
                ],
                [
                    'platform_id' => $platform->id,
                    'section' => 'mission',
                    'content' => [
                        'title' => 'Notre Mission',
                        'text' => 'La mission de ' . $platform->name,
                    ],
                    'language' => 'fr',
                    'is_active' => true,
                ],
            ];

            foreach ($sections as $sectionData) {
                BrandSection::firstOrCreate(
                    [
                        'platform_id' => $sectionData['platform_id'],
                        'section' => $sectionData['section'],
                        'language' => $sectionData['language'],
                    ],
                    $sectionData
                );
            }
        }
    }
}
