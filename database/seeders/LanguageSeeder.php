<?php

namespace Database\Seeders;

use App\Models\Language;
use Illuminate\Database\Seeder;

class LanguageSeeder extends Seeder
{
    public function run(): void
    {
        $languages = [
            [
                'code' => 'fr',
                'name' => 'Français',
                'native_name' => 'Français',
                'direction' => 'ltr',
                'script' => 'Latin',
                'flag' => '🇫🇷',
                'is_active' => true,
            ],
            [
                'code' => 'en',
                'name' => 'English',
                'native_name' => 'English',
                'direction' => 'ltr',
                'script' => 'Latin',
                'flag' => '🇬🇧',
                'is_active' => true,
            ],
            [
                'code' => 'de',
                'name' => 'German',
                'native_name' => 'Deutsch',
                'direction' => 'ltr',
                'script' => 'Latin',
                'flag' => '🇩🇪',
                'is_active' => true,
            ],
            [
                'code' => 'es',
                'name' => 'Spanish',
                'native_name' => 'Español',
                'direction' => 'ltr',
                'script' => 'Latin',
                'flag' => '🇪🇸',
                'is_active' => true,
            ],
            [
                'code' => 'pt',
                'name' => 'Portuguese',
                'native_name' => 'Português',
                'direction' => 'ltr',
                'script' => 'Latin',
                'flag' => '🇵🇹',
                'is_active' => true,
            ],
            [
                'code' => 'ru',
                'name' => 'Russian',
                'native_name' => 'Русский',
                'direction' => 'ltr',
                'script' => 'Cyrillic',
                'flag' => '🇷🇺',
                'is_active' => true,
            ],
            [
                'code' => 'zh',
                'name' => 'Chinese',
                'native_name' => '中文',
                'direction' => 'ltr',
                'script' => 'Han',
                'flag' => '🇨🇳',
                'is_active' => true,
            ],
            [
                'code' => 'ar',
                'name' => 'Arabic',
                'native_name' => 'العربية',
                'direction' => 'rtl',
                'script' => 'Arabic',
                'flag' => '🇸🇦',
                'is_active' => true,
            ],
            [
                'code' => 'hi',
                'name' => 'Hindi',
                'native_name' => 'हिन्दी',
                'direction' => 'ltr',
                'script' => 'Devanagari',
                'flag' => '🇮🇳',
                'is_active' => true,
            ],
        ];

        foreach ($languages as $language) {
            Language::updateOrCreate(
                ['code' => $language['code']],
                $language
            );
        }
    }
}