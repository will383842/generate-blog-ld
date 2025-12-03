<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Limites de budget
    |--------------------------------------------------------------------------
    */

    'daily_limit' => env('COSTS_DAILY_LIMIT', 100), // $ par jour
    'monthly_limit' => env('COSTS_MONTHLY_LIMIT', 2500), // $ par mois

    'alerts' => [
        'warning_percent' => 80, // Alerte à 80% du budget
        'critical_percent' => 95, // Alerte critique à 95%
    ],

    /*
    |--------------------------------------------------------------------------
    | Tarifs OpenAI ($ par 1M tokens)
    |--------------------------------------------------------------------------
    */

    'openai' => [
        'gpt-4o' => [
            'input' => 2.50,
            'output' => 10.00,
        ],
        'gpt-4o-mini' => [
            'input' => 0.15,
            'output' => 0.60,
        ],
        'dall-e-3' => [
            'standard' => [
                '1024x1024' => 0.04,
                '1792x1024' => 0.08,
                '1024x1792' => 0.08,
            ],
            'hd' => [
                '1024x1024' => 0.08,
                '1792x1024' => 0.12,
                '1024x1792' => 0.12,
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Tarifs Perplexity ($ par requête)
    |--------------------------------------------------------------------------
    */

    'perplexity' => [
        'sonar' => 0.005,
        'sonar-pro' => 0.015,
    ],

    /*
    |--------------------------------------------------------------------------
    | Estimations moyennes par contenu
    |--------------------------------------------------------------------------
    */

    'estimates' => [
        'article' => [
            'generation' => 0.15, // GPT-4o
            'translation' => 0.02, // GPT-4o-mini par langue
            'meta' => 0.01, // Meta descriptions
            'sources' => 0.005, // Perplexity
            'image' => 0.08, // DALL-E 3
        ],
        'landing' => [
            'generation' => 0.10,
            'translation' => 0.015,
            'meta' => 0.01,
            'image' => 0.08,
        ],
    ],

];