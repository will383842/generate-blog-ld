<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Paramètres de génération de contenu
    |--------------------------------------------------------------------------
    */

    // Nombre d'articles à générer par jour
    'daily_articles' => env('CONTENT_DAILY_ARTICLES', 100),

    // Nombre de landings à générer par jour
    'daily_landings' => env('CONTENT_DAILY_LANDINGS', 100),

    // Longueur minimale d'un article (mots)
    'min_word_count' => env('CONTENT_MIN_WORDS', 1500),

    // Longueur maximale d'un article (mots)
    'max_word_count' => env('CONTENT_MAX_WORDS', 2500),

    // Nombre de FAQs par article
    'faqs_count' => env('CONTENT_FAQS_COUNT', 5),

    // Nombre de liens internes par article
    'internal_links_count' => env('CONTENT_INTERNAL_LINKS', 3),

    // Nombre de liens externes par article
    'external_links_count' => env('CONTENT_EXTERNAL_LINKS', 2),

    /*
    |--------------------------------------------------------------------------
    | Automatisation
    |--------------------------------------------------------------------------
    */

    'auto_translate' => env('CONTENT_AUTO_TRANSLATE', true),
    'auto_generate_image' => env('CONTENT_AUTO_IMAGE', true),
    'auto_publish' => env('CONTENT_AUTO_PUBLISH', false), // sécurité

    /*
    |--------------------------------------------------------------------------
    | Modèles GPT
    |--------------------------------------------------------------------------
    */

    'models' => [
        'content' => env('GPT_MODEL_CONTENT', 'gpt-4o'),
        'translation' => env('GPT_MODEL_TRANSLATION', 'gpt-4o-mini'),
        'meta' => env('GPT_MODEL_META', 'gpt-4o-mini'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Paramètres DALL-E
    |--------------------------------------------------------------------------
    */

    'dalle' => [
        'model' => env('DALLE_MODEL', 'dall-e-3'),
        'size' => env('DALLE_SIZE', '1792x1024'),
        'quality' => env('DALLE_QUALITY', 'standard'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Qualité minimale
    |--------------------------------------------------------------------------
    */

    'quality' => [
        'min_score' => env('CONTENT_MIN_QUALITY_SCORE', 70),
        'criteria' => [
            'word_count' => 15,
            'structure' => 15,
            'faqs' => 15,
            'internal_links' => 10,
            'external_links' => 10,
            'meta' => 15,
            'cta' => 10,
            'json_ld' => 10,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Cache
    |--------------------------------------------------------------------------
    */

    'cache' => [
        'sources_ttl' => env('CACHE_SOURCES_TTL', 60 * 60 * 24 * 7), // 7 jours
        'translations_ttl' => env('CACHE_TRANSLATIONS_TTL', 60 * 60 * 24 * 30), // 30 jours
    ],

];