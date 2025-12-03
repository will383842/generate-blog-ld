<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Configuration des Services IA - Content Engine V9.4
    |--------------------------------------------------------------------------
    |
    | Configuration centralisée pour tous les services d'intelligence artificielle
    | utilisés par le Content Engine.
    |
    */

    // =========================================================================
    // OpenAI (GPT, DALL-E)
    // =========================================================================
    'openai' => [
        'api_key' => env('OPENAI_API_KEY'),
        'organization' => env('OPENAI_ORGANIZATION'),
        
        // Modèles par défaut
        'default_model' => env('OPENAI_DEFAULT_MODEL', 'gpt-4o'),
        'translation_model' => env('OPENAI_TRANSLATION_MODEL', 'gpt-4o-mini'),
        
        // Limites
        'max_retries' => 3,
        'timeout' => 180, // 🔧 CORRECTION : 180s au lieu de 120s pour génération complète
        
        // Tarifs (USD par 1000 tokens) - Mise à jour Mai 2024
        'pricing' => [
            'gpt-4-turbo-preview' => ['input' => 0.01, 'output' => 0.03],
            'gpt-4o' => ['input' => 0.005, 'output' => 0.015],
            'gpt-4o-mini' => ['input' => 0.00015, 'output' => 0.0006],
            'gpt-3.5-turbo' => ['input' => 0.0005, 'output' => 0.0015],
        ],
    ],

    // =========================================================================
    // Perplexity AI (Recherche de sources)
    // =========================================================================
    'perplexity' => [
        'api_key' => env('PERPLEXITY_API_KEY'),
        
        // Modèle
        'default_model' => env('PERPLEXITY_MODEL', 'sonar'),
        
        // Cache
        'cache_ttl' => 60 * 60 * 24 * 7, // 7 jours
        'cache_prefix' => 'perplexity:',
        
        // Limites
        'max_retries' => 3,
        'timeout' => 60,
        
        // Tarifs
        'pricing' => [
            'sonar-small-online' => ['input' => 0.0002, 'output' => 0.0002],
            'sonar' => ['input' => 0.001, 'output' => 0.001],
            'sonar-pro' => ['input' => 0.005, 'output' => 0.005],
        ],
    ],

    // =========================================================================
    // DALL-E (Génération d'images)
    // =========================================================================
    'dalle' => [
        'api_key' => env('OPENAI_API_KEY'), // Même clé que OpenAI
        
        // Modèle par défaut
        'default_model' => env('DALLE_MODEL', 'dall-e-3'),
        
        // Qualité et taille par défaut
        'default_quality' => 'standard', // standard ou hd
        'default_size' => '1792x1024', // Format paysage pour articles
        
        // Stockage
        'storage_disk' => env('DALLE_STORAGE_DISK', 'public'),
        'storage_path' => 'images/generated',
        
        // Optimisation
        'convert_to_webp' => true,
        'webp_quality' => 85,
        
        // Limites
        'max_retries' => 3,
        'timeout' => 180, // 🔧 CORRECTION : 180s pour génération + téléchargement
        
        // Tarifs (par image)
        'pricing' => [
            'dall-e-3' => [
                'standard' => ['1024x1024' => 0.04, '1024x1792' => 0.08, '1792x1024' => 0.08],
                'hd' => ['1024x1024' => 0.08, '1024x1792' => 0.12, '1792x1024' => 0.12],
            ],
            'dall-e-2' => [
                'standard' => ['256x256' => 0.016, '512x512' => 0.018, '1024x1024' => 0.02],
            ],
        ],
    ],

    // =========================================================================
    // Gestion des Coûts
    // =========================================================================
    'costs' => [
        // Budgets
        'daily_budget' => env('AI_DAILY_BUDGET', 50.00), // USD
        'monthly_budget' => env('AI_MONTHLY_BUDGET', 1000.00), // USD
        
        // Alertes (pourcentage du budget)
        'alert_thresholds' => [
            'warning' => 80,  // 80% du budget
            'critical' => 95, // 95% du budget
            'exceeded' => 100, // Dépassement
        ],
        
        // Notifications
        'alert_email' => env('AI_ALERT_EMAIL', env('MAIL_FROM_ADDRESS')),
        'alert_slack_webhook' => env('AI_ALERT_SLACK_WEBHOOK'),
        
        // Blocage automatique
        'block_on_exceeded' => env('AI_BLOCK_ON_EXCEEDED', false),
    ],

    // =========================================================================
    // Logging
    // =========================================================================
    'logging' => [
        'channel' => 'ai',
        'log_requests' => env('AI_LOG_REQUESTS', true),
        'log_responses' => env('AI_LOG_RESPONSES', false), // Attention: volumétrie
        'log_costs' => env('AI_LOG_COSTS', true),
    ],

    // =========================================================================
    // Cache
    // =========================================================================
    'cache' => [
        'driver' => env('AI_CACHE_DRIVER', 'redis'),
        
        // TTL par type de contenu
        'ttl' => [
            'translation' => 60 * 60 * 24 * 30, // 30 jours
            'sources' => 60 * 60 * 24 * 7, // 7 jours
            'meta' => 60 * 60 * 24 * 7, // 7 jours
            'faqs' => 60 * 60 * 24 * 14, // 14 jours
        ],
    ],

    // =========================================================================
    // Rate Limiting
    // =========================================================================
    'rate_limits' => [
        'openai' => [
            'requests_per_minute' => 60,
            'tokens_per_minute' => 90000,
        ],
        'perplexity' => [
            'requests_per_minute' => 20,
        ],
        'dalle' => [
            'requests_per_minute' => 7,
        ],
    ],
];