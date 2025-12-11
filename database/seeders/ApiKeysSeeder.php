<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ApiKey;

class ApiKeysSeeder extends Seeder
{
    public function run(): void
    {
        $keys = [
            [
                'service' => 'openai',
                'name' => 'OpenAI Production',
                'key' => env('OPENAI_API_KEY', 'sk-...'),
                'status' => 'active',
            ],
            [
                'service' => 'anthropic',
                'name' => 'Claude Production',
                'key' => env('ANTHROPIC_API_KEY', 'sk-ant-...'),
                'status' => 'active',
            ],
            [
                'service' => 'google',
                'name' => 'Google Gemini',
                'key' => env('GOOGLE_API_KEY', 'AIza...'),
                'status' => 'active',
            ],
        ];

        foreach ($keys as $keyData) {
            if ($keyData['key'] === 'sk-...' || $keyData['key'] === 'sk-ant-...' || $keyData['key'] === 'AIza...') {
                continue;
            }
            ApiKey::firstOrCreate(
                ['service' => $keyData['service'], 'name' => $keyData['name']],
                $keyData
            );
        }
    }
}
