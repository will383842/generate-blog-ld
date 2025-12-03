<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Plateformes de publication
    |--------------------------------------------------------------------------
    */

    'sos-expat' => [
        'name' => 'SOS-Expat',
        'url' => env('PLATFORM_SOS_EXPAT_URL', 'https://sos-expat.com'),
        'api_url' => env('PLATFORM_SOS_EXPAT_API_URL', 'https://api.sos-expat.com'),
        'api_key' => env('PLATFORM_SOS_EXPAT_API_KEY'),
        'webhook_secret' => env('PLATFORM_SOS_EXPAT_WEBHOOK_SECRET'),
        'enabled' => env('PLATFORM_SOS_EXPAT_ENABLED', true),
        'content_types' => ['article', 'landing'],
        'themes' => ['lawyer', 'expat_domain'],
    ],

    'ulixai' => [
        'name' => 'Ulixai',
        'url' => env('PLATFORM_ULIXAI_URL', 'https://ulixai.com'),
        'api_url' => env('PLATFORM_ULIXAI_API_URL', 'https://api.ulixai.com'),
        'api_key' => env('PLATFORM_ULIXAI_API_KEY'),
        'webhook_secret' => env('PLATFORM_ULIXAI_WEBHOOK_SECRET'),
        'enabled' => env('PLATFORM_ULIXAI_ENABLED', true),
        'content_types' => ['article', 'landing'],
        'themes' => ['provider_type', 'ulixai_service'],
    ],

    'ulysse' => [
        'name' => 'Ulysse.AI',
        'url' => env('PLATFORM_ULYSSE_URL', 'https://ulysse.ai'),
        'api_url' => env('PLATFORM_ULYSSE_API_URL', 'https://api.ulysse.ai'),
        'api_key' => env('PLATFORM_ULYSSE_API_KEY'),
        'webhook_secret' => env('PLATFORM_ULYSSE_WEBHOOK_SECRET'),
        'enabled' => env('PLATFORM_ULYSSE_ENABLED', false),
        'content_types' => ['article'],
        'themes' => ['ai', 'technology'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Paramètres de publication
    |--------------------------------------------------------------------------
    */

    'publish' => [
        'retry_attempts' => 3,
        'retry_delay' => 60, // secondes
        'timeout' => 30, // secondes
    ],

];