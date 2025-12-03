<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Unsplash Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration pour l'API Unsplash (photos haute résolution)
    | Inscription gratuite : https://unsplash.com/developers
    | Limite : 50 requêtes/heure
    |
    */

    'unsplash' => [
        'access_key' => env('UNSPLASH_ACCESS_KEY'),
        'per_page' => env('UNSPLASH_PER_PAGE', 10),
        'default_orientation' => env('UNSPLASH_ORIENTATION', 'landscape'), // landscape, portrait, squarish
    ],

    /*
    |--------------------------------------------------------------------------
    | QuickChart Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration pour QuickChart.io (génération de graphiques)
    | API gratuite : https://quickchart.io
    | Limite : 60 requêtes/minute
    |
    */

    'quickchart' => [
        'api_url' => env('QUICKCHART_API_URL', 'https://quickchart.io'),
        'default_width' => env('QUICKCHART_WIDTH', 800),
        'default_height' => env('QUICKCHART_HEIGHT', 400),
        'format' => env('QUICKCHART_FORMAT', 'png'), // png, svg, webp
    ],

    /*
    |--------------------------------------------------------------------------
    | Storage Configuration
    |--------------------------------------------------------------------------
    |
    | Chemins de stockage pour les communiqués de presse et leurs médias
    |
    */

    'storage' => [
        'press_releases' => 'press_releases',
        'media' => 'press_releases/media',
        'charts' => 'press_releases/charts',
        'photos' => 'press_releases/photos',
        'exports' => 'press_releases/exports',
    ],

    /*
    |--------------------------------------------------------------------------
    | Export Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration pour les exports PDF et Word
    |
    */

    'export' => [
        'pdf' => [
            'paper' => 'a4',
            'orientation' => 'portrait',
            'default_font' => 'Arial',
            'rtl_font' => 'DejaVu Sans', // Pour l'arabe
        ],
        
        'word' => [
            'margin' => 1440, // 1 inch en twips
            'default_font' => 'Arial',
            'default_size' => 11,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Template Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration des templates de communiqués
    |
    */

    'templates' => [
        'types' => [
            'lancement_produit' => 'Lancement de produit/service',
            'partenariat' => 'Partenariat stratégique',
            'resultats_milestone' => 'Résultats et milestones',
            'evenement' => 'Événement ou conférence',
            'nomination' => 'Nomination RH',
        ],
        
        'languages' => [
            'fr' => 'Français',
            'en' => 'English',
            'de' => 'Deutsch',
            'es' => 'Español',
            'pt' => 'Português',
            'ru' => 'Русский',
            'zh' => '中文',
            'ar' => 'العربية',
            'hi' => 'हिन्दी',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Generation Limits
    |--------------------------------------------------------------------------
    |
    | Limites de génération pour éviter les abus
    |
    */

    'limits' => [
        'max_per_day' => env('PRESS_RELEASE_MAX_PER_DAY', 100),
        'max_per_hour' => env('PRESS_RELEASE_MAX_PER_HOUR', 20),
        'max_media_per_release' => env('PRESS_RELEASE_MAX_MEDIA', 10),
    ],

    /*
    |--------------------------------------------------------------------------
    | Validation Rules
    |--------------------------------------------------------------------------
    |
    | Règles de validation pour les communiqués
    |
    */

    'validation' => [
        'title' => [
            'min_length' => 20,
            'max_length' => 200,
        ],
        'lead' => [
            'min_length' => 50,
            'max_length' => 500,
        ],
        'body' => [
            'min_length' => 300,
            'max_length' => 3000,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Default Boilerplates
    |--------------------------------------------------------------------------
    |
    | Boilerplates par défaut par plateforme
    | Peut être surchargé en base de données
    |
    */

    'boilerplates' => [
        'SOS-Expat.com' => [
            'fr' => "SOS-Expat.com est la première plateforme d'assistance d'urgence pour expatriés, offrant des consultations téléphoniques avec des experts en moins de 5 minutes. Active dans 197 pays et disponible en 9 langues, SOS-Expat connecte 304 millions d'expatriés à un réseau mondial de professionnels qualifiés pour résoudre leurs urgences administratives, juridiques et médicales.",
            'en' => "SOS-Expat.com is the leading emergency assistance platform for expatriates, providing phone consultations with experts in under 5 minutes. Operating in 197 countries and available in 9 languages, SOS-Expat connects 304 million expats with a global network of qualified professionals to resolve their administrative, legal, and medical emergencies.",
        ],
        
        'Ulixai.com' => [
            'fr' => "Ulixai.com est le marketplace international de référence pour les expatriés, connectant plus de 304 millions d'utilisateurs avec des prestataires de services qualifiés dans 197 pays. Disponible en 9 langues, Ulixai facilite l'accès à tous les services essentiels pour une expatriation réussie.",
            'en' => "Ulixai.com is the leading international marketplace for expatriates, connecting over 304 million users with qualified service providers in 197 countries. Available in 9 languages, Ulixai facilitates access to all essential services for successful expatriation.",
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Default Contact
    |--------------------------------------------------------------------------
    |
    | Informations de contact par défaut
    |
    */

    'default_contact' => [
        'name' => env('PRESS_CONTACT_NAME', 'Relations Presse'),
        'email' => env('PRESS_CONTACT_EMAIL', 'press@example.com'),
        'phone' => env('PRESS_CONTACT_PHONE'),
    ],

];