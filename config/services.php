<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Perplexity AI Configuration - Phase 3
    |--------------------------------------------------------------------------
    |
    | Configuration pour Perplexity AI - Service de recherche et fact-checking
    | utilisé pour la génération de contenu de qualité.
    |
    | Obtenir une clé : https://www.perplexity.ai/settings/api
    |
    */
    'perplexity' => [
        'api_key' => env('PERPLEXITY_API_KEY'),
        'model' => env('PERPLEXITY_MODEL', 'llama-3.1-sonar-large-128k-online'),
        'base_url' => env('PERPLEXITY_BASE_URL', 'https://api.perplexity.ai'),
    ],

    /*
    |--------------------------------------------------------------------------
    | News API Configuration - Phase 19 ✨
    |--------------------------------------------------------------------------
    |
    | Configuration pour News API - Service de recherche d'actualités
    | utilisé pour le data mining et la recherche multi-sources.
    |
    | Fonctionnalités:
    | - Recherche d'articles d'actualité en temps réel
    | - Support de 9 langues (fr, en, es, de, pt, ru, zh, ar, hi)
    | - Filtres par date, pertinence, source
    | - Gratuit : 100 requêtes/jour
    |
    | Plan gratuit:
    | - 100 requêtes par jour
    | - Accès aux articles des 30 derniers jours
    | - Support multilingue
    | - Parfait pour commencer
    |
    | Plan payant (optionnel):
    | - À partir de $449/mois
    | - 250,000 requêtes/mois
    | - Accès historique complet
    |
    | Obtenir une clé API (gratuit):
    | 1. Aller sur https://newsapi.org/register
    | 2. Créer un compte gratuit
    | 3. Obtenir la clé API instantanément
    | 4. Copier la clé dans .env
    |
    | Variables .env requises:
    | NEWS_API_KEY=your_news_api_key_here
    | NEWS_API_TIMEOUT=30
    |
    | Langues supportées:
    | - ar (Arabe)
    | - de (Allemand)
    | - en (Anglais)
    | - es (Espagnol)
    | - fr (Français)
    | - he (Hébreu)
    | - it (Italien)
    | - nl (Néerlandais)
    | - no (Norvégien)
    | - pt (Portugais)
    | - ru (Russe)
    | - sv (Suédois)
    | - zh (Chinois)
    |
    | Utilisation:
    | - Recherche multi-sources (Perplexity + News API)
    | - Cache 24h automatique (économie ~70% coûts)
    | - Fact-checking assisté
    | - Extraction de claims
    |
    | Performance:
    | - Avec cache 24h : hit rate ~70%
    | - 100 requêtes/jour suffisent pour ~300 recherches uniques
    | - Temps réponse : 2-5s sans cache, <100ms avec cache
    |
    | Coûts:
    | - Plan gratuit : $0/mois (100 req/jour)
    | - Avec cache 70% : 100 req/jour = ~330 recherches effectives
    |
    | Rate limits:
    | - Gratuit : 100 requêtes/jour
    | - Payant : 1000 requêtes/heure
    |
    | Documentation:
    | - API Docs : https://newsapi.org/docs
    | - Endpoints : https://newsapi.org/docs/endpoints
    |
    */
    'news_api' => [
        'key' => env('NEWS_API_KEY'),
        'timeout' => env('NEWS_API_TIMEOUT', 30), // Timeout en secondes
    ],

    /*
    |--------------------------------------------------------------------------
    | Unsplash API Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration pour l'API Unsplash utilisée pour les images professionnelles
    | dans les articles, communiqués de presse, et dossiers.
    |
    | IMPORTANT : Respecter les conditions Unsplash :
    | - Hotlinking obligatoire (pas de téléchargement local)
    | - Attribution visible obligatoire
    | - Tracking des downloads obligatoire
    |
    | Rate limit : 50 requêtes/heure
    |
    */

    'unsplash' => [
        'access_key' => env('UNSPLASH_ACCESS_KEY'),
        'secret_key' => env('UNSPLASH_SECRET_KEY'), // Optionnel
        'per_page' => env('UNSPLASH_PER_PAGE', 20),
        'default_orientation' => env('UNSPLASH_ORIENTATION', 'landscape'),
        'default_width' => env('UNSPLASH_WIDTH', 1200),
        'default_quality' => env('UNSPLASH_QUALITY', 85),
        'content_filter' => 'high', // Filtrer contenu sensible
        'utm_source' => 'ulixai',
        'utm_medium' => 'referral',
    ],

];