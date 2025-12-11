<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PlatformSetting;
use App\Models\Platform;

class PlatformSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $platforms = Platform::all();

        foreach ($platforms as $platform) {
            $settings = [
                [
                    'platform_id' => $platform->id,
                    'key' => 'seo.meta_title_template',
                    'value' => ['value' => '{title} - ' . $platform->name],
                    'type' => 'string',
                    'description' => 'Template pour meta title',
                    'is_public' => true,
                ],
                [
                    'platform_id' => $platform->id,
                    'key' => 'content.articles_per_page',
                    'value' => ['value' => 20],
                    'type' => 'number',
                    'description' => 'Nombre articles par page',
                    'is_public' => true,
                ],
                [
                    'platform_id' => $platform->id,
                    'key' => 'publishing.auto_publish',
                    'value' => ['value' => false],
                    'type' => 'boolean',
                    'description' => 'Publication automatique',
                    'is_public' => false,
                ],
            ];

            foreach ($settings as $settingData) {
                PlatformSetting::firstOrCreate(
                    [
                        'platform_id' => $settingData['platform_id'],
                        'key' => $settingData['key'],
                    ],
                    $settingData
                );
            }
        }
    }
}
