<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Internal Linking Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration pour les liens internes automatiques entre articles.
    |
    */

    'internal' => [
        // Nombre de liens internes par article
        'min_links' => env('LINKING_INTERNAL_MIN', 5),
        'max_links' => env('LINKING_INTERNAL_MAX', 12),

        // Limite par paragraphe
        'max_per_paragraph' => env('LINKING_MAX_PER_PARAGRAPH', 1),

        // Zones exclues pour l'insertion de liens
        'exclude_zones' => [
            'intro' => true,      // Premier paragraphe
            'conclusion' => true, // Dernier paragraphe
        ],

        // Distribution des types d'ancres (doit totaliser 100)
        'anchor_distribution' => [
            'exact_match' => 30,  // Mot-clé principal du titre
            'long_tail' => 25,    // Phrase complète avec template
            'generic' => 20,      // "en savoir plus", "learn more"
            'cta' => 15,          // "consultez notre guide"
            'question' => 10,     // "comment ... ?"
        ],

        // Lien vers pilier parent obligatoire
        'pillar_link_required' => env('LINKING_PILLAR_REQUIRED', true),

        // Score de pertinence minimum pour créer un lien
        'min_relevance_score' => env('LINKING_MIN_RELEVANCE', 40),

        // Distance minimum entre deux liens (en paragraphes)
        'min_paragraph_gap' => env('LINKING_MIN_GAP', 2),

        // Nombre d'articles candidats à analyser pour TF-IDF
        'candidate_pool_size' => env('LINKING_CANDIDATE_POOL', 50),

        // Boost de score pour liens vers même pays
        'same_country_boost' => 20,

        // Boost de score pour liens vers même thème
        'same_theme_boost' => 20,

        // Bonus pour liens vers/depuis piliers
        'pillar_bonus' => 10,
    ],

    /*
    |--------------------------------------------------------------------------
    | External Linking Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration pour les liens externes vers sources autorité.
    |
    */

    'external' => [
        // Nombre de liens externes par article
        'min_links' => env('LINKING_EXTERNAL_MIN', 2),
        'max_links' => env('LINKING_EXTERNAL_MAX', 5),

        // Priorité des types de sources (ordre de préférence)
        'source_priority' => [
            'government' => 1,    // Sites gouvernementaux (.gov, .gouv)
            'organization' => 2,  // Organisations officielles (ONU, OMS)
            'reference' => 3,     // Sites référence (Wikipedia)
            'news' => 4,          // Sites actualité reconnus
            'authority' => 5,     // Autres sites autorité
        ],

        // Score autorité minimum pour accepter un domaine
        'min_authority_score' => env('LINKING_MIN_AUTHORITY', 60),

        // Ajouter nofollow par défaut
        'default_nofollow' => false,

        // Toujours ajouter target="_blank"
        'target_blank' => true,

        // Toujours ajouter rel="noopener"
        'noopener' => true,

        // Attribut title sur les liens
        'add_title_attribute' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Link Discovery Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration pour la découverte automatique de liens via Perplexity.
    |
    */

    'discovery' => [
        // Activer la découverte automatique
        'enabled' => env('LINKING_DISCOVERY_ENABLED', true),

        // Durée du cache en secondes (7 jours)
        'cache_ttl' => env('LINKING_CACHE_TTL', 604800),

        // Nombre max de liens à découvrir par requête
        'max_results_per_query' => 10,

        // Timeout pour les requêtes Perplexity (secondes)
        'perplexity_timeout' => 30,

        // Retry en cas d'échec
        'retry_attempts' => 3,
        'retry_delay' => 2, // secondes

        // Patterns de requêtes par thème
        'query_patterns' => [
            'visa' => '{country} official visa requirements {year}',
            'immigration' => '{country} immigration department official website',
            'tax' => '{country} tax authority expatriates',
            'health' => '{country} health ministry official website',
            'embassy' => 'embassy {country} in {target_country}',
            'legal' => '{country} legal requirements foreign residents',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Affiliate Linking Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration pour les liens affiliés.
    |
    */

    'affiliate' => [
        // Activer l'injection automatique
        'auto_injection' => env('LINKING_AFFILIATE_AUTO', true),

        // Nombre max de liens affiliés par article
        'max_per_article' => env('LINKING_AFFILIATE_MAX', 3),

        // Toujours ajouter rel="sponsored"
        'sponsored_attribute' => true,

        // Zones préférées pour insertion
        'preferred_zones' => [
            'middle',  // Milieu de l'article
            'cta',     // Sections Call-to-Action
        ],

        // Templates d'ancres par défaut (par langue)
        'default_anchors' => [
            'fr' => [
                'Découvrir {service}',
                'Essayer {service} gratuitement',
                'Comparer avec {service}',
            ],
            'en' => [
                'Discover {service}',
                'Try {service} for free',
                'Compare with {service}',
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Link Verification Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration pour la vérification des liens cassés.
    |
    */

    'verification' => [
        // Activer la vérification automatique
        'enabled' => env('LINKING_VERIFY_ENABLED', true),

        // Fréquence de vérification (jours)
        'frequency_days' => env('LINKING_VERIFY_FREQUENCY', 30),

        // Timeout pour les requêtes HEAD (secondes)
        'timeout' => 10,

        // Codes HTTP considérés comme valides
        'valid_status_codes' => [200, 301, 302, 307, 308],

        // Seuil d'alerte pour liens cassés (pourcentage)
        'broken_alert_threshold' => 10,

        // Nombre de vérifications en parallèle
        'concurrent_checks' => 10,

        // Notification admin si trop de liens cassés
        'notify_admin' => true,
        'admin_email' => env('ADMIN_EMAIL'),
    ],

    /*
    |--------------------------------------------------------------------------
    | TF-IDF Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration pour l'algorithme TF-IDF de similarité.
    |
    */

    'tfidf' => [
        // Nombre max de keywords à extraire par article
        'max_keywords' => 50,

        // Longueur minimale d'un mot pour être considéré
        'min_word_length' => 3,

        // Poids du titre vs contenu
        'title_weight' => 3.0,
        'content_weight' => 1.0,

        // Activer le cache TF-IDF
        'cache_enabled' => true,

        // Durée cache TF-IDF (invalidé si article modifié)
        'cache_prefix' => 'tfidf_keywords_',
    ],

    /*
    |--------------------------------------------------------------------------
    | PageRank Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration pour le calcul du PageRank interne.
    |
    */

    'pagerank' => [
        // Damping factor (standard Google = 0.85)
        'damping_factor' => 0.85,

        // Nombre max d'itérations
        'max_iterations' => 100,

        // Seuil de convergence
        'convergence_threshold' => 0.0001,

        // Durée du cache PageRank (secondes)
        'cache_ttl' => 3600,

        // Recalculer automatiquement après ajout de liens
        'auto_recalculate' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Platform-Specific Rules
    |--------------------------------------------------------------------------
    |
    | Règles spécifiques par plateforme (override des valeurs par défaut).
    |
    */

    'platform_rules' => [
        // SOS-Expat.com - Focus liens gouvernementaux
        'sos-expat' => [
            'external' => [
                'source_priority' => [
                    'government' => 1,
                    'organization' => 2,
                    'reference' => 4, // Moins prioritaire que news
                    'news' => 3,
                ],
                'min_authority_score' => 70, // Plus strict
            ],
        ],

        // Ulixai.com - Focus liens affiliés services
        'ulixai' => [
            'affiliate' => [
                'max_per_article' => 5, // Plus de liens affiliés
                'auto_injection' => true,
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Logging Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration pour les logs du système de maillage.
    |
    */

    'logging' => [
        // Activer le logging détaillé
        'enabled' => env('LINKING_LOG_ENABLED', true),

        // Channel de log
        'channel' => env('LINKING_LOG_CHANNEL', 'daily'),

        // Niveau de log minimum
        'level' => env('LINKING_LOG_LEVEL', 'info'),

        // Logger les liens créés
        'log_created_links' => true,

        // Logger les découvertes Perplexity
        'log_discovery' => true,

        // Logger les vérifications de liens
        'log_verification' => true,
    ],

];
