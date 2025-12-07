<?php

return [
    // Général
    'title' => 'Maillage Intelligent',
    'description' => 'Système de maillage automatique pour le SEO',

    // Messages de succès
    'links_generated' => 'Liens générés avec succès',
    'internal_links_created' => ':count lien(s) interne(s) créé(s)',
    'external_links_created' => ':count lien(s) externe(s) créé(s)',
    'affiliate_links_injected' => ':count lien(s) affilié(s) injecté(s)',
    'pillar_links_created' => ':count lien(s) pilier créé(s)',
    'content_updated' => 'Contenu mis à jour avec les liens',
    'jobs_dispatched' => 'Jobs de génération de liens dispatchés',
    'batch_job_dispatched' => 'Job batch dispatché pour :count articles',

    // Domaines autorité
    'domain_created' => 'Domaine autorité créé avec succès',
    'domain_updated' => 'Domaine autorité mis à jour',
    'domain_deleted' => 'Domaine autorité supprimé',
    'domain_exists' => 'Ce domaine existe déjà',
    'domain_verified' => 'Domaine vérifié avec succès',
    'domain_active' => 'Domaine actif',
    'domain_inactive' => 'Domaine inactif',

    // Règles de maillage
    'rules_updated' => 'Règles de maillage mises à jour',
    'rules_reset' => 'Règles réinitialisées aux valeurs par défaut',
    'rules_copied' => 'Règles copiées avec succès',
    'no_rules_to_copy' => 'Aucune règle à copier pour cette plateforme',

    // Erreurs
    'no_articles_found' => 'Aucun article trouvé',
    'article_not_found' => 'Article introuvable',
    'platform_not_found' => 'Plateforme introuvable',
    'generation_failed' => 'Échec de la génération des liens',
    'verification_failed' => 'Échec de la vérification des liens',

    // Types de liens
    'link_types' => [
        'internal' => 'Lien interne',
        'external' => 'Lien externe',
        'affiliate' => 'Lien affilié',
        'pillar' => 'Lien pilier',
    ],

    // Contextes de liens
    'link_contexts' => [
        'pillar_to_article' => 'Pilier → Article',
        'article_to_pillar' => 'Article → Pilier',
        'article_to_article' => 'Article → Article',
        'theme_related' => 'Thème connexe',
        'country_related' => 'Même pays',
    ],

    // Types d'anchor
    'anchor_types' => [
        'exact_match' => 'Correspondance exacte',
        'long_tail' => 'Longue traîne',
        'generic' => 'Générique',
        'cta' => 'Appel à l\'action',
        'question' => 'Question',
    ],

    // Types de sources
    'source_types' => [
        'government' => 'Gouvernement',
        'organization' => 'Organisation',
        'reference' => 'Référence',
        'news' => 'Actualités',
        'authority' => 'Autorité',
    ],

    // Analyse
    'analysis' => [
        'title' => 'Analyse du maillage',
        'orphan_articles' => 'Articles orphelins',
        'dead_ends' => 'Culs-de-sac',
        'weakly_connected' => 'Faiblement connectés',
        'health_score' => 'Score de santé',
        'link_balance' => 'Équilibre des liens',
    ],

    // Grades
    'grades' => [
        'A' => 'Excellent',
        'B' => 'Bon',
        'C' => 'Acceptable',
        'D' => 'À améliorer',
        'F' => 'Critique',
    ],

    // Recommandations
    'recommendations' => [
        'add_internal_links' => 'Ajouter plus de liens internes',
        'add_external_links' => 'Ajouter des sources externes fiables',
        'link_to_pillar' => 'Lier à un article pilier',
        'fix_broken_links' => 'Réparer les liens cassés',
        'improve_anchor_diversity' => 'Diversifier les textes d\'ancre',
    ],

    // Vérification
    'verification' => [
        'title' => 'Vérification des liens',
        'checking' => 'Vérification en cours...',
        'valid' => 'Valide',
        'broken' => 'Cassé',
        'redirected' => 'Redirigé',
        'timeout' => 'Délai dépassé',
    ],

    // Console
    'console' => [
        'generating_links' => 'Génération des liens pour :title',
        'processing_articles' => 'Traitement de :count articles',
        'completed' => 'Terminé',
        'failed' => 'Échec',
        'skipped' => 'Ignoré',
    ],

    // Descriptions de commandes
    'commands' => [
        'generate_internal' => 'Génère les liens internes pour les articles',
        'analyze_balance' => 'Analyse l\'équilibre du maillage d\'une plateforme',
        'discover_domains' => 'Découvre et gère les domaines autorité',
        'verify_external' => 'Vérifie les liens externes et identifie les liens cassés',
    ],

    // Tooltips et aide
    'help' => [
        'min_internal' => 'Nombre minimum de liens internes par article',
        'max_internal' => 'Nombre maximum de liens internes par article',
        'min_external' => 'Nombre minimum de liens externes par article',
        'max_external' => 'Nombre maximum de liens externes par article',
        'min_authority' => 'Score d\'autorité minimum pour les domaines externes',
        'min_relevance' => 'Score de pertinence minimum pour les liens internes',
        'anchor_distribution' => 'Répartition des types de textes d\'ancre',
    ],

    // Anchor text templates
    'anchor_templates' => [
        'long_tail' => [
            'tout savoir sur :text',
            'guide complet sur :text',
            'découvrir :text',
            'comprendre :text',
        ],
        'cta' => [
            'consultez notre guide sur :text',
            'en savoir plus sur :text',
            'découvrez :text',
        ],
        'generic' => [
            'en savoir plus',
            'cliquez ici',
            'voir plus',
            'lire la suite',
        ],
        'question' => [
            'comment :text ?',
            'qu\'est-ce que :text ?',
            'pourquoi :text ?',
        ],
    ],

    // Labels pour liens externes
    'external_labels' => [
        'official_site' => 'Site officiel',
        'visit' => 'Visiter :domain',
        'source' => 'Source : :name',
        'reference' => 'Référence officielle',
    ],
];
