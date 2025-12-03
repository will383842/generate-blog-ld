<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Langue par défaut
    |--------------------------------------------------------------------------
    */

    'default' => 'fr',

    /*
    |--------------------------------------------------------------------------
    | Langues supportées (9 langues)
    |--------------------------------------------------------------------------
    */

    'supported' => [

        'fr' => [
            'name' => 'Français',
            'native' => 'Français',
            'locale' => 'fr_FR',
            'direction' => 'ltr',
            'flag' => '🇫🇷',
            'enabled' => true,
        ],

        'en' => [
            'name' => 'English',
            'native' => 'English',
            'locale' => 'en_US',
            'direction' => 'ltr',
            'flag' => '🇬🇧',
            'enabled' => true,
        ],

        'de' => [
            'name' => 'German',
            'native' => 'Deutsch',
            'locale' => 'de_DE',
            'direction' => 'ltr',
            'flag' => '🇩🇪',
            'enabled' => true,
        ],

        'es' => [
            'name' => 'Spanish',
            'native' => 'Español',
            'locale' => 'es_ES',
            'direction' => 'ltr',
            'flag' => '🇪🇸',
            'enabled' => true,
        ],

        'pt' => [
            'name' => 'Portuguese',
            'native' => 'Português',
            'locale' => 'pt_PT',
            'direction' => 'ltr',
            'flag' => '🇵🇹',
            'enabled' => true,
        ],

        'ru' => [
            'name' => 'Russian',
            'native' => 'Русский',
            'locale' => 'ru_RU',
            'direction' => 'ltr',
            'flag' => '🇷🇺',
            'enabled' => true,
        ],

        'zh' => [
            'name' => 'Chinese',
            'native' => '中文',
            'locale' => 'zh_CN',
            'direction' => 'ltr',
            'flag' => '🇨🇳',
            'enabled' => true,
        ],

        'ar' => [
            'name' => 'Arabic',
            'native' => 'العربية',
            'locale' => 'ar_SA',
            'direction' => 'rtl',
            'flag' => '🇸🇦',
            'enabled' => true,
        ],

        'hi' => [
            'name' => 'Hindi',
            'native' => 'हिन्दी',
            'locale' => 'hi_IN',
            'direction' => 'ltr',
            'flag' => '🇮🇳',
            'enabled' => true,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Ordre de priorité pour la traduction
    |--------------------------------------------------------------------------
    */

    'priority' => ['fr', 'en', 'es', 'de', 'pt', 'ru', 'zh', 'ar', 'hi'],

    /*
    |--------------------------------------------------------------------------
    | Translittération des slugs
    |--------------------------------------------------------------------------
    */

    'transliteration' => [
        'ru' => 'cyrillic_to_latin',
        'zh' => 'chinese_to_pinyin',
        'ar' => 'arabic_to_latin',
        'hi' => 'devanagari_to_latin',
    ],

];