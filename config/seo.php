<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Configuration SEO - Content Engine V9.4
    |--------------------------------------------------------------------------
    |
    | Configuration complète pour tous les services SEO
    |
    */

    // =========================================================================
    // GOOGLE INDEXING API
    // =========================================================================
    'google_indexing_credentials' => env('GOOGLE_INDEXING_CREDENTIALS'),
    // JSON des credentials du Service Account Google
    // Obtenir depuis : https://console.cloud.google.com/

    'google_indexing_enabled' => env('GOOGLE_INDEXING_ENABLED', true),

    // =========================================================================
    // BING WEBMASTER API
    // =========================================================================
    'bing_api_key' => env('BING_API_KEY'),
    // Obtenir depuis : https://www.bing.com/webmasters

    'bing_submission_enabled' => env('BING_SUBMISSION_ENABLED', true),

    // =========================================================================
    // INDEXNOW
    // =========================================================================
    'indexnow_key' => env('INDEXNOW_KEY'),
    // Clé pour IndexNow (Bing, Yandex, etc.)
    // Générer : https://www.indexnow.org/

    'indexnow_enabled' => env('INDEXNOW_ENABLED', false),

    // =========================================================================
    // SITEMAP
    // =========================================================================
    'sitemap' => [
        'cache_ttl' => 3600, // 1 heure
        'max_urls_per_sitemap' => 50000, // Limite Google
        'include_images' => true,
        'include_alternates' => true, // Hreflang dans sitemap
        
        // Priorités par défaut
        'default_priorities' => [
            'homepage' => 1.0,
            'landing' => 1.0,
            'article' => 0.8,
            'category' => 0.6,
            'static_page' => 0.5,
        ],

        // Fréquences par défaut
        'default_frequencies' => [
            'homepage' => 'daily',
            'landing' => 'weekly',
            'article' => 'weekly',
            'category' => 'weekly',
            'static_page' => 'monthly',
        ],
    ],

    // =========================================================================
    // ROBOTS.TXT
    // =========================================================================
    'robots' => [
        'block_ai_bots' => env('BLOCK_AI_BOTS', false), // Bloquer GPTBot, Claude-Web, etc.
        'block_gptbot' => env('BLOCK_GPTBOT', false),
        'crawl_delay' => env('ROBOTS_CRAWL_DELAY', false),
        'crawl_delay_seconds' => env('ROBOTS_CRAWL_DELAY_SECONDS', 1),
        
        // Chemins à bloquer par défaut
        'default_disallow' => [
            '/admin',
            '/api',
            '/private',
            '/search',
            '/login',
            '/register',
            '/password',
        ],
    ],

    // =========================================================================
    // SEO SCORING
    // =========================================================================
    'scoring' => [
        'min_score_to_publish' => env('SEO_MIN_SCORE', 60),
        'target_score' => 80,
        'excellent_score' => 90,
        
        // Cache des scores
        'cache_scores' => true,
        'cache_ttl' => 3600, // 1 heure
    ],

    // =========================================================================
    // SCHEMA.ORG
    // =========================================================================
    'schema' => [
        'enable_organization' => true,
        'enable_website' => true,
        'enable_howto_detection' => true,
        'enable_itemlist_detection' => true,
        
        // Organization par défaut
        'default_organization' => [
            'name' => env('APP_NAME', 'SOS-Expat'),
            'url' => env('APP_URL', 'https://sos-expat.com'),
        ],
    ],

    // =========================================================================
    // IMAGES SEO
    // =========================================================================
    'images' => [
        'require_alt_text' => true,
        'min_alt_length' => 20,
        'max_alt_length' => 125,
        'optimize_filenames' => true,
        'generate_captions' => true,
        
        // Formats recommandés
        'preferred_formats' => ['webp', 'jpg', 'png'],
        'suggest_webp_conversion' => true,
    ],

    // =========================================================================
    // META TAGS
    // =========================================================================
    'meta' => [
        // Limites
        'title_max_length' => 60,
        'description_max_length' => 160,
        'og_title_max_length' => 70,
        'og_description_max_length' => 200,
        
        // Génération automatique
        'auto_generate_keywords' => true,
        'keyword_count' => 5, // Nombre de keywords à générer
        
        // OpenGraph
        'opengraph_enabled' => true,
        'twitter_card_enabled' => true,
        'twitter_handle' => env('TWITTER_HANDLE', '@SOSExpat'),
    ],

    // =========================================================================
    // HREFLANG
    // =========================================================================
    'hreflang' => [
        'enabled' => true,
        'include_x_default' => true,
        'default_language' => 'fr',
        
        // Langues supportées (9 langues)
        'supported_languages' => ['fr', 'en', 'de', 'es', 'pt', 'ru', 'zh', 'ar', 'hi'],
    ],

    // =========================================================================
    // CANONICAL URLs
    // =========================================================================
    'canonical' => [
        'enabled' => true,
        'force_https' => true,
        'force_www' => false, // ou true selon préférence
        'trailing_slash' => false,
    ],

    // =========================================================================
    // PERFORMANCE
    // =========================================================================
    'performance' => [
        // Cache des métadonnées
        'cache_meta' => true,
        'cache_schema' => true,
        'cache_sitemap' => true,
        
        // TTL par type
        'cache_ttl' => [
            'meta' => 3600, // 1h
            'schema' => 86400, // 24h
            'sitemap' => 3600, // 1h
            'seo_score' => 3600, // 1h
        ],
    ],

    // =========================================================================
    // SOUMISSION AUTOMATIQUE
    // =========================================================================
    'auto_submission' => [
        'enabled' => env('AUTO_SUBMIT_ENABLED', true),
        'on_publish' => true, // Soumettre dès publication
        'on_update' => false, // Soumettre sur mise à jour
        
        // Services à utiliser
        'use_google' => true,
        'use_bing' => true,
        'use_indexnow' => false,
        
        // Retry
        'retry_on_failure' => true,
        'max_retries' => 3,
    ],

    // =========================================================================
    // MONITORING
    // =========================================================================
    'monitoring' => [
        'log_submissions' => true,
        'log_seo_scores' => true,
        'alert_on_low_score' => true,
        'low_score_threshold' => 50,
        
        // Email alerts
        'alert_email' => env('SEO_ALERT_EMAIL', env('MAIL_FROM_ADDRESS')),
    ],

];