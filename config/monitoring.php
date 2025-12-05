<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Monitoring Mode
    |--------------------------------------------------------------------------
    |
    | Définit le mode de monitoring du système.
    |
    | Modes disponibles:
    | - "alert_only": Envoie des alertes mais ne bloque jamais (RECOMMANDÉ)
    | - "soft_limit": Ralentit la génération si budget atteint, mais ne bloque pas
    | - "hard_limit": Bloque complètement si budget dépassé (NON RECOMMANDÉ)
    |
    */

    'mode' => env('MONITORING_MODE', 'alert_only'),

    /*
    |--------------------------------------------------------------------------
    | Budget Configuration
    |--------------------------------------------------------------------------
    |
    | Configure les seuils budgétaires et les actions associées.
    |
    */

    'monthly_budget' => env('MONITORING_MONTHLY_BUDGET', 500),

    'budgets' => [
        // Budget mensuel visé (en dollars)
        'monthly_target' => env('MONITORING_MONTHLY_BUDGET', 500),
        
        // Seuil d'alerte (80% du budget)
        'soft_warning_percent' => 80,
        
        // Seuil d'alerte urgente (90% du budget)
        'hard_warning_percent' => 90,
        
        // NE JAMAIS bloquer la génération (sécurité)
        'never_block' => env('MONITORING_NEVER_BLOCK', true),
        
        // Budget quotidien estimé (calculé automatiquement si null)
        'daily_budget' => null,
    ],

    /*
    |--------------------------------------------------------------------------
    | Alertes Configuration
    |--------------------------------------------------------------------------
    |
    | Configure comment et quand envoyer les alertes.
    |
    */

    'alerts' => [
        // Email pour les alertes
        'email' => env('MONITORING_ALERT_EMAIL', env('MAIL_FROM_ADDRESS')),
        
        // Webhook Slack (optionnel)
        'slack_webhook' => env('MONITORING_SLACK_WEBHOOK'),
        
        // Fréquence des rapports automatiques
        'report_frequency' => 'daily', // daily, weekly, monthly
        
        // Niveau minimum pour envoyer une alerte
        'min_level' => 'warning', // info, warning, critical
        
        // Activer les alertes
        'enabled' => env('MONITORING_ALERTS_ENABLED', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Actions automatiques par seuil
    |--------------------------------------------------------------------------
    |
    | Définit les actions à effectuer quand certains seuils sont atteints.
    |
    */

    'smart_actions' => [
        // À 80% du budget
        'at_80_percent' => [
            'send_alert' => true,
            'suggest_optimizations' => true,
            'increase_monitoring_frequency' => false,
        ],
        
        // À 90% du budget
        'at_90_percent' => [
            'send_urgent_alert' => true,
            'increase_monitoring_frequency' => true, // Rapports 2×/jour
            'notify_admin' => true,
        ],
        
        // À 100% du budget (dépassé)
        'at_100_percent' => [
            'send_critical_alert' => true,
            'daily_reports' => true,
            'block_generation' => false, // TOUJOURS false pour ne jamais bloquer
        ],
        
        // À 150% du budget
        'at_150_percent' => [
            'send_critical_alert' => true,
            'require_manual_review' => true,
            'block_generation' => false, // TOUJOURS false sauf si mode hard_limit
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Queue Monitoring
    |--------------------------------------------------------------------------
    |
    | Configuration du monitoring de la queue.
    |
    */

    'queue' => [
        // Seuil d'alerte pour le backlog
        'backlog_warning_threshold' => 500,
        'backlog_critical_threshold' => 1000,
        
        // Temps d'attente maximum acceptable (minutes)
        'max_wait_time_minutes' => 60,
        
        // Activer les alertes queue
        'alerts_enabled' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Performance Monitoring
    |--------------------------------------------------------------------------
    |
    | Configuration du monitoring de performance.
    |
    */

    'performance' => [
        // Temps de génération maximum acceptable (secondes)
        'max_generation_time' => 300, // 5 minutes
        
        // Taux d'erreur maximum acceptable (pourcentage)
        'max_error_rate_percent' => 10,
        
        // Taux de succès minimum acceptable (pourcentage)
        'min_success_rate_percent' => 90,
        
        // Activer les alertes performance
        'alerts_enabled' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | API Health Monitoring
    |--------------------------------------------------------------------------
    |
    | Configuration du monitoring de la santé des APIs externes.
    |
    */

    'api_health' => [
        // Fréquence de vérification (minutes)
        'check_interval_minutes' => 5,
        
        // Timeout pour les health checks (secondes)
        'timeout_seconds' => 5,
        
        // Activer les health checks
        'enabled' => true,
        
        // APIs à monitorer
        'monitored_apis' => [
            'openai',
            'perplexity',
            'unsplash',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Anomaly Detection
    |--------------------------------------------------------------------------
    |
    | Configuration de la détection d'anomalies.
    |
    */

    'anomaly_detection' => [
        // Activer la détection d'anomalies
        'enabled' => true,
        
        // Seuil de détection (nombre d'écarts-types)
        'threshold_std_deviations' => 2,
        
        // Période d'analyse (heures)
        'analysis_period_hours' => 24,
    ],

    /*
    |--------------------------------------------------------------------------
    | Logging
    |--------------------------------------------------------------------------
    |
    | Configuration du logging spécifique au monitoring.
    |
    */

    'logging' => [
        // Canal de log dédié
        'channel' => 'monitoring',
        
        // Niveau de log minimum
        'level' => 'info',
        
        // Logs détaillés (inclut toutes les métriques)
        'detailed' => env('MONITORING_DETAILED_LOGS', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Cache Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration du cache pour le monitoring.
    |
    */

    'cache' => [
        // Durée de cache pour les stats (secondes)
        'stats_ttl' => 300, // 5 minutes
        
        // Durée de cache pour les health checks (secondes)
        'health_check_ttl' => 300, // 5 minutes
        
        // Préfixe des clés de cache
        'prefix' => 'monitoring',
    ],

    /*
    |--------------------------------------------------------------------------
    | Dashboard Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration du dashboard de monitoring.
    |
    */

    'dashboard' => [
        // Activer le dashboard API
        'enabled' => true,
        
        // Middleware pour protéger le dashboard
        'middleware' => ['auth:sanctum'],
        
        // Rafraîchissement automatique (secondes)
        'auto_refresh_seconds' => 30,
    ],

    /*
    |--------------------------------------------------------------------------
    | Cost Optimization
    |--------------------------------------------------------------------------
    |
    | Configuration de l'optimisation des coûts.
    |
    */

    'cost_optimization' => [
        // Activer l'optimisation automatique des modèles
        'auto_model_selection' => env('MONITORING_AUTO_MODEL_SELECTION', true),
        
        // Activer l'optimisation des prompts
        'auto_prompt_optimization' => env('MONITORING_AUTO_PROMPT_OPTIMIZATION', true),
        
        // Activer le tracking du cache de prompts
        'track_prompt_cache' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Reporting
    |--------------------------------------------------------------------------
    |
    | Configuration des rapports automatiques.
    |
    */

    'reporting' => [
        // Rapport quotidien automatique
        'daily_report' => [
            'enabled' => true,
            'time' => '08:00',
            'recipients' => [env('MONITORING_ALERT_EMAIL')],
        ],
        
        // Rapport hebdomadaire
        'weekly_report' => [
            'enabled' => true,
            'day' => 'monday', // monday, tuesday, etc.
            'time' => '09:00',
            'recipients' => [env('MONITORING_ALERT_EMAIL')],
        ],
        
        // Rapport mensuel
        'monthly_report' => [
            'enabled' => true,
            'day_of_month' => 1, // 1st of the month
            'time' => '10:00',
            'recipients' => [env('MONITORING_ALERT_EMAIL')],
        ],
    ],

];
