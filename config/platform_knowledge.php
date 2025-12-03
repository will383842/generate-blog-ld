<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Platform Knowledge Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration pour le systeme Platform Knowledge Base qui permet a l'IA
    | de connaitre parfaitement les plateformes pour generer du contenu
    | sans erreur.
    |
    */

    /**
     * Langues supportees
     */
    'languages' => [
        'fr' => 'Français',
        'en' => 'English',
        'es' => 'Español',
        'de' => 'Deutsch',
        'it' => 'Italiano',
        'pt' => 'Português',
        'ar' => 'العربية',
        'zh' => '中文',
        'hi' => 'हिन्दी',
    ],

    /**
     * Types de connaissance et leur priorite par defaut
     */
    'knowledge_types' => [
        'facts' => [
            'name' => 'Faits et chiffres',
            'priority' => 100,
            'required' => true,
            'description' => 'Chiffres cles obligatoires (304 millions, 197 pays, etc.)',
        ],
        'about' => [
            'name' => 'A propos',
            'priority' => 100,
            'required' => true,
            'description' => 'Description de la plateforme',
        ],
        'services' => [
            'name' => 'Services',
            'priority' => 90,
            'required' => true,
            'description' => 'Services offerts par la plateforme',
        ],
        'differentiators' => [
            'name' => 'Differenciateurs',
            'priority' => 95,
            'required' => true,
            'description' => 'Ce qui differencie la plateforme de la concurrence',
        ],
        'tone' => [
            'name' => 'Ton',
            'priority' => 85,
            'required' => true,
            'description' => 'Ton de communication a adopter',
        ],
        'style' => [
            'name' => 'Style',
            'priority' => 80,
            'required' => true,
            'description' => 'Style redactionnel (longueur phrases, paragraphes, etc.)',
        ],
        'vocabulary' => [
            'name' => 'Vocabulaire',
            'priority' => 70,
            'required' => true,
            'description' => 'Vocabulaire a utiliser et a eviter',
        ],
        'examples' => [
            'name' => 'Exemples',
            'priority' => 60,
            'required' => false,
            'description' => 'Exemples de contenu reussi',
        ],
        'donts' => [
            'name' => 'Interdictions',
            'priority' => 100,
            'required' => true,
            'description' => 'Ce qu\'il ne faut JAMAIS faire',
        ],
        'values' => [
            'name' => 'Valeurs',
            'priority' => 50,
            'required' => false,
            'description' => 'Valeurs de la plateforme',
        ],
    ],

    /**
     * Seuil minimum de score de validation
     */
    'validation' => [
        'min_score' => 70,
        'strict_mode' => env('PLATFORM_KNOWLEDGE_STRICT', false),
    ],

    /**
     * Types de contenu
     */
    'content_types' => [
        'articles' => 'Articles blog',
        'landings' => 'Pages landing',
        'comparatives' => 'Articles comparatifs',
        'pillars' => 'Articles piliers',
        'press' => 'Communiques de presse',
    ],

    /**
     * Activation du cache
     */
    'cache' => [
        'enabled' => env('PLATFORM_KNOWLEDGE_CACHE', true),
        'ttl' => env('PLATFORM_KNOWLEDGE_CACHE_TTL', 3600),
    ],

    /**
     * Logging
     */
    'logging' => [
        'validation_failures' => env('LOG_KNOWLEDGE_VALIDATION', true),
        'prompt_generation' => env('LOG_KNOWLEDGE_PROMPTS', false),
    ],
];