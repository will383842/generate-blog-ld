<?php

/**
 * Configuration centralisée des clés de cache
 *
 * Utilisation:
 *   config('cache-keys.stats.dashboard')
 *   config('cache-keys.article.invalidates')
 */

return [
    /*
    |--------------------------------------------------------------------------
    | Clés de cache pour les statistiques
    |--------------------------------------------------------------------------
    */
    'stats' => [
        'dashboard' => 'stats.dashboard',
        'production' => 'stats.production',
        'costs' => 'stats.costs',
        'quality' => 'stats.quality',
    ],

    /*
    |--------------------------------------------------------------------------
    | Clés de cache pour la couverture
    |--------------------------------------------------------------------------
    */
    'coverage' => [
        'by_platform' => 'coverage.by_platform',
        'by_country' => 'coverage.by_country',
        'by_theme' => 'coverage.by_theme',
        'gaps' => 'coverage.gaps',
        'heatmap' => 'coverage.heatmap',
    ],

    /*
    |--------------------------------------------------------------------------
    | Clés de cache pour les articles
    |--------------------------------------------------------------------------
    */
    'articles' => [
        'list' => 'articles.list',
        'count' => 'articles.count',
        'recent' => 'articles.recent',
    ],

    /*
    |--------------------------------------------------------------------------
    | Clés de cache pour les programmes
    |--------------------------------------------------------------------------
    */
    'programs' => [
        'list' => 'programs.list',
        'calendar' => 'programs.calendar',
        'analytics' => 'programs.analytics',
    ],

    /*
    |--------------------------------------------------------------------------
    | Clés de cache pour la qualité
    |--------------------------------------------------------------------------
    */
    'quality' => [
        'dashboard' => 'quality.dashboard',
        'trends' => 'quality.trends',
        'criteria_stats' => 'quality.criteria_stats',
    ],

    /*
    |--------------------------------------------------------------------------
    | Clés de cache pour le monitoring
    |--------------------------------------------------------------------------
    */
    'monitoring' => [
        'daily_costs' => 'monitoring.daily_costs',
        'monthly_costs' => 'monitoring.monthly_costs',
        'system_health' => 'monitoring.system_health',
    ],

    /*
    |--------------------------------------------------------------------------
    | Groupes de clés à invalider par événement
    |--------------------------------------------------------------------------
    |
    | Définit quelles clés doivent être invalidées lors d'un événement spécifique.
    | Utilisé par les Observers pour savoir quoi nettoyer.
    */
    'invalidation_groups' => [
        // Quand un article est créé/modifié/supprimé
        'article' => [
            'stats.dashboard',
            'stats.production',
            'coverage.by_platform',
            'coverage.by_country',
            'coverage.by_theme',
            'coverage.gaps',
            'articles.list',
            'articles.count',
            'articles.recent',
        ],

        // Quand un programme est modifié
        'program' => [
            'programs.list',
            'programs.calendar',
            'programs.analytics',
            'stats.dashboard',
        ],

        // Quand une vérification de qualité est faite
        'quality_check' => [
            'quality.dashboard',
            'quality.trends',
            'quality.criteria_stats',
            'stats.quality',
        ],

        // Quand les coûts changent
        'costs' => [
            'stats.costs',
            'monitoring.daily_costs',
            'monitoring.monthly_costs',
        ],

        // Quand un communiqué de presse est modifié
        'press_release' => [
            'stats.dashboard',
            'stats.production',
        ],

        // Quand un dossier de presse est modifié
        'press_dossier' => [
            'stats.dashboard',
            'stats.production',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | TTL par défaut (en secondes)
    |--------------------------------------------------------------------------
    */
    'ttl' => [
        'stats' => 300,         // 5 minutes
        'coverage' => 600,      // 10 minutes
        'articles' => 300,      // 5 minutes
        'programs' => 600,      // 10 minutes
        'quality' => 300,       // 5 minutes
        'monitoring' => 60,     // 1 minute
    ],
];
