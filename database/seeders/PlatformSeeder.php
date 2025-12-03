<?php

namespace Database\Seeders;

use App\Models\Platform;
use Illuminate\Database\Seeder;

class PlatformSeeder extends Seeder
{
    public function run(): void
    {
        $platforms = [
            [
                'name' => 'SOS-Expat',
                'slug' => 'sos-expat',
                'url' => 'https://sos-expat.com',
                'api_endpoint' => 'https://api.sos-expat.com',
                'is_active' => true,
            ],
            [
                'name' => 'Ulixai',
                'slug' => 'ulixai',
                'url' => 'https://ulixai.com',
                'api_endpoint' => 'https://api.ulixai.com',
                'is_active' => true,
            ],
            [
                'name' => 'Ulysse.AI',
                'slug' => 'ulysse',
                'url' => 'https://ulysse.ai',
                'api_endpoint' => 'https://api.ulysse.ai',
                'is_active' => false,
            ],
        ];

        foreach ($platforms as $platform) {
            Platform::updateOrCreate(
                ['slug' => $platform['slug']],
                $platform
            );
        }
    }
}