<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Configuration de Publication Automatique
    |--------------------------------------------------------------------------
    |
    | Paramètres pour la publication automatique anti-spam des articles.
    | Ces valeurs peuvent être surchargées par plateforme dans publication_schedules.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Limites de Publication
    |--------------------------------------------------------------------------
    */

    // Nombre d'articles à publier par jour (par plateforme)
    'articles_per_day' => env('PUBLISHING_ARTICLES_PER_DAY', 100),

    // Nombre maximum d'articles par heure (par plateforme)
    'max_per_hour' => env('PUBLISHING_MAX_PER_HOUR', 15),

    // Intervalle minimum entre deux publications (minutes)
    'min_interval_minutes' => env('PUBLISHING_MIN_INTERVAL', 6),

    /*
    |--------------------------------------------------------------------------
    | Heures et Jours Actifs
    |--------------------------------------------------------------------------
    */

    // Heures actives pour la publication (0-23)
    // Par défaut : 9h-12h et 14h-18h (heures ouvrables)
    'active_hours' => [9, 10, 11, 14, 15, 16, 17],

    // Jours actifs de la semaine (1=Lundi, 7=Dimanche)
    // Par défaut : Lundi à Vendredi
    'active_days' => [1, 2, 3, 4, 5],

    // Fuseau horaire par défaut
    'default_timezone' => env('PUBLISHING_TIMEZONE', 'Europe/Paris'),

    /*
    |--------------------------------------------------------------------------
    | Gestion des Erreurs
    |--------------------------------------------------------------------------
    */

    // Nombre de tentatives maximum avant de marquer comme "failed"
    'max_attempts' => env('PUBLISHING_MAX_ATTEMPTS', 3),

    // Délai entre les tentatives (minutes)
    'retry_delay' => env('PUBLISHING_RETRY_DELAY', 15),

    // Mettre en pause si trop d'erreurs
    'pause_on_error' => env('PUBLISHING_PAUSE_ON_ERROR', true),

    // Nombre d'erreurs consécutives avant mise en pause
    'max_errors_before_pause' => env('PUBLISHING_MAX_ERRORS_BEFORE_PAUSE', 5),

    /*
    |--------------------------------------------------------------------------
    | Priorités
    |--------------------------------------------------------------------------
    */

    'priorities' => [
        'high' => [
            'label' => 'Haute priorité',
            'weight' => 1,
        ],
        'default' => [
            'label' => 'Priorité normale',
            'weight' => 2,
        ],
        'low' => [
            'label' => 'Basse priorité',
            'weight' => 3,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Anti-Spam
    |--------------------------------------------------------------------------
    */

    'anti_spam' => [
        // Vérifier que l'heure est active
        'check_active_hours' => true,

        // Vérifier que le jour est actif
        'check_active_days' => true,

        // Vérifier l'intervalle minimum
        'check_min_interval' => true,

        // Vérifier le quota horaire
        'check_hourly_limit' => true,

        // Vérifier le quota journalier
        'check_daily_limit' => true,

        // Randomiser légèrement l'heure (±5 minutes)
        'randomize_time' => true,
        'randomize_range' => 5, // minutes
    ],

    /*
    |--------------------------------------------------------------------------
    | Distribution
    |--------------------------------------------------------------------------
    */

    'distribution' => [
        // Répartir uniformément sur la journée
        'spread_evenly' => true,

        // Éviter les créneaux proches du début/fin d'heure
        'avoid_hour_edges' => true,
        'edge_margin' => 5, // minutes

        // Préférer certaines heures (poids relatifs)
        'preferred_hours' => [
            9 => 1.2,  // 9h : +20% de chance
            11 => 1.1, // 11h : +10% de chance
            15 => 1.1, // 15h : +10% de chance
            17 => 1.2, // 17h : +20% de chance
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Monitoring
    |--------------------------------------------------------------------------
    */

    'monitoring' => [
        // Logger toutes les publications
        'log_publications' => true,

        // Envoyer des alertes si problème
        'send_alerts' => true,

        // Emails pour les alertes
        'alert_emails' => [
            env('PUBLISHING_ALERT_EMAIL', 'admin@sos-expat.com'),
        ],

        // Alertes Slack (optionnel)
        'slack_webhook' => env('PUBLISHING_SLACK_WEBHOOK'),
    ],

    /*
    |--------------------------------------------------------------------------
    | API Platform (pour envoi à WordPress, etc.)
    |--------------------------------------------------------------------------
    */

    'api' => [
        // Timeout pour les requêtes API (secondes)
        'timeout' => 30,

        // Nombre de tentatives
        'retry_attempts' => 3,

        // Délai entre tentatives (secondes)
        'retry_delay' => 5,

        // Vérifier le SSL
        'verify_ssl' => env('PUBLISHING_VERIFY_SSL', true),
    ],

];