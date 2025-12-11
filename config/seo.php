<?php

return [
    /*
    |--------------------------------------------------------------------------
    | SEO Configuration - Content Engine V10
    |--------------------------------------------------------------------------
    |
    | Configuration centralisée pour tous les paramètres SEO critiques.
    | Objectif: 95/100 SEO score dans 197 pays × 9 langues
    |
    */

    // =========================================================================
    // KEYWORD DENSITY
    // =========================================================================
    'keyword_density' => [
        'min' => 1.0,                    // Minimum 1.0%
        'max' => 2.5,                    // Maximum 2.5%
        'optimal' => 1.5,                // Cible optimale 1.5%
        'tolerance' => 0.3,              // Tolérance ±0.3%
        'check_first_100_words' => true, // Vérifier keyword dans 100 premiers mots
    ],

    // =========================================================================
    // LSI KEYWORDS
    // =========================================================================
    'lsi_keywords' => [
        'count' => 8,                           // Nombre LSI keywords par article
        'min_occurrences_per_keyword' => 3,     // Minimum 3 occurrences par LSI
        'cache_ttl' => 604800,                  // Cache 7 jours (en secondes)
        'languages' => ['fr', 'en', 'es', 'de', 'it', 'pt', 'ar', 'zh', 'ja'],
    ],

    // =========================================================================
    // FEATURED SNIPPETS (Position 0)
    // =========================================================================
    'featured_snippets' => [
        'definition_min_words' => 40,     // Minimum 40 mots pour définition
        'definition_max_words' => 60,     // Maximum 60 mots pour définition
        'list_min_items' => 3,            // Minimum 3 items dans listes
        'list_max_items' => 8,            // Maximum 8 items dans listes
        'list_item_max_words' => 20,      // Maximum 20 mots par item
        'table_min_rows' => 3,            // Minimum 3 lignes dans tableaux
        'table_max_rows' => 10,           // Maximum 10 lignes dans tableaux
    ],

    // =========================================================================
    // PEOPLE ALSO ASK (PAA)
    // =========================================================================
    'people_also_ask' => [
        'questions_per_article' => 3,             // 3 questions PAA par article
        'answer_min_words' => 40,                 // Minimum 40 mots par réponse
        'answer_max_words' => 150,                // Maximum 150 mots par réponse
        'answer_snippet_words' => 60,             // 60 mots pour snippet featured
        'cache_ttl' => 604800,                    // Cache 7 jours
    ],

    // =========================================================================
    // E-E-A-T (Experience, Expertise, Authoritativeness, Trust)
    // =========================================================================
    'eeat' => [
        'min_statistics' => 3,                    // Minimum 3 statistiques par article
        'min_sources' => 3,                       // Minimum 3 sources externes
        'require_author' => true,                 // Auteur obligatoire
        'max_content_age_months' => 12,           // Contenu max 12 mois
        'require_update_date' => true,            // Date mise à jour obligatoire
        'min_score' => 80,                        // Score E-E-A-T minimum 80/100
    ],

    // =========================================================================
    // META TAGS
    // =========================================================================
    'meta_tags' => [
        'title' => [
            'min_chars' => 30,
            'max_chars' => 60,
            'optimal_chars' => 55,
        ],
        'description' => [
            'min_chars' => 120,
            'max_chars' => 160,
            'optimal_chars' => 155,
        ],
        'keywords' => [
            'max_count' => 10,                    // Maximum 10 keywords
        ],
    ],

    // =========================================================================
    // HEADERS (H1-H6)
    // =========================================================================
    'headers' => [
        'h1_count' => 1,                          // STRICTEMENT 1 H1
        'h2_min' => 3,                            // Minimum 3 H2
        'h2_max' => 10,                           // Maximum 10 H2
        'keyword_in_h1' => true,                  // Keyword OBLIGATOIRE dans H1
        'keyword_in_first_h2' => true,            // Keyword dans premier H2
        'check_hierarchy' => true,                // Vérifier hiérarchie (pas de sauts)
    ],

    // =========================================================================
    // MOBILE-FIRST
    // =========================================================================
    'mobile' => [
        'max_paragraph_lines' => 4,               // Maximum 4 lignes par paragraphe
        'paragraph_words_range' => [40, 80],      // 40-80 mots par paragraphe
        'sentence_words_range' => [15, 25],       // 15-25 mots par phrase
        'max_section_words' => 300,               // Maximum 300 mots par section H2
    ],

    // =========================================================================
    // VOICE SEARCH
    // =========================================================================
    'voice_search' => [
        'conversational_tone' => true,            // Ton conversationnel obligatoire
        'question_format' => true,                // Format question/réponse
        'direct_answer_words' => 60,              // 60 mots pour réponse directe
        'use_you_pronoun' => true,                // Utiliser "vous"/"you"
    ],

    // =========================================================================
    // ANCHOR TEXT DIVERSITY
    // =========================================================================
    'anchor_text' => [
        'distribution' => [
            'exact_match' => 10,                  // 10% ancre exacte
            'partial_match' => 30,                // 30% ancre partielle
            'branded' => 20,                      // 20% ancre marque
            'generic' => 25,                      // 25% ancre générique
            'naked_url' => 10,                    // 10% URL nue
            'image' => 5,                         // 5% images
        ],
        'tolerance' => 10,                        // Tolérance ±10%
        'over_optimization_threshold' => 20,      // Alerte si >20% exact match
    ],

    // =========================================================================
    // AFFILIATE LINKS
    // =========================================================================
    'affiliate_links' => [
        'require_sponsored_tag' => true,          // rel="sponsored" obligatoire
        'require_nofollow_tag' => true,           // rel="nofollow" obligatoire
        'require_noopener_tag' => true,           // rel="noopener" obligatoire
        'require_disclosure' => true,             // Mention "lien affilié" obligatoire
        'max_per_article' => 5,                   // Maximum 5 liens affiliés par article
        'min_words_between_links' => 150,         // Minimum 150 mots entre 2 liens affiliés
    ],

    // =========================================================================
    // STRUCTURED DATA (Schema.org)
    // =========================================================================
    'structured_data' => [
        'always_include' => [
            'Article',                            // Schema Article toujours
            'BreadcrumbList',                     // Schema Breadcrumb toujours
            'WebPage',                            // Schema WebPage toujours
        ],
        'conditional' => [
            'FAQPage' => 'has_faq',              // Si FAQ présente
            'HowTo' => 'is_guide',               // Si guide/tutoriel
            'Review' => 'has_reviews',           // Si avis/notes
            'Product' => 'has_products',         // Si produits mentionnés
            'Speakable' => 'voice_optimized',    // Si optimisé voice search
        ],
    ],

    // =========================================================================
    // CANONICAL URLS & HREFLANG
    // =========================================================================
    'canonical' => [
        'always_include' => true,                 // Canonical toujours présent
        'hreflang_enabled' => true,               // Hreflang pour multilingue
        'x_default' => 'fr',                      // Langue par défaut: français
        'languages' => ['fr', 'en', 'es', 'de', 'it', 'pt', 'ar', 'zh', 'ja'],
    ],

    // =========================================================================
    // IMAGES SEO
    // =========================================================================
    'images' => [
        'alt_text' => [
            'min_chars' => 20,
            'max_chars' => 125,
            'include_keyword' => true,            // Keyword dans 1er alt text
        ],
        'formats' => ['webp', 'avif', 'jpg'],     // Formats modernes prioritaires
        'lazy_loading' => true,                   // Lazy loading obligatoire
        'responsive' => true,                     // Srcset obligatoire
        'max_width' => 1200,                      // Largeur max 1200px
        'compression_quality' => 85,              // Qualité 85%
    ],

    // =========================================================================
    // CORE WEB VITALS
    // =========================================================================
    'core_web_vitals' => [
        'lcp_target' => 2.5,                      // LCP < 2.5s
        'fid_target' => 0.1,                      // FID < 100ms
        'cls_target' => 0.1,                      // CLS < 0.1
        'check_enabled' => true,                  // Vérification activée
    ],

    // =========================================================================
    // CONTENT QUALITY
    // =========================================================================
    'content_quality' => [
        'min_words' => 800,                       // Minimum 800 mots
        'optimal_words' => 1500,                  // Optimal 1500 mots
        'max_words' => 3000,                      // Maximum 3000 mots
        'min_sections' => 4,                      // Minimum 4 sections H2
        'readability_score_min' => 60,            // Score lisibilité min 60/100
    ],

    // =========================================================================
    // AI MODELS & COSTS
    // =========================================================================
    'ai_models' => [
        'title' => 'gpt-4o-mini',                 // Titres: GPT-4o-mini
        'hook' => 'gpt-4o-mini',                  // Hooks: GPT-4o-mini
        'introduction' => 'gpt-4',                // Intro: GPT-4 (qualité critique)
        'main_content' => 'gpt-4',                // Contenu: GPT-4 (qualité critique)
        'faq' => 'gpt-4o-mini',                   // FAQ: GPT-4o-mini
        'conclusion' => 'gpt-4o-mini',            // Conclusion: GPT-4o-mini
        'meta_tags' => 'gpt-4o-mini',             // Meta: GPT-4o-mini
        'lsi_keywords' => 'gpt-4o-mini',          // LSI: GPT-4o-mini
        'paa_questions' => 'gpt-4o-mini',         // PAA: GPT-4o-mini
    ],

    // =========================================================================
    // CACHE SETTINGS
    // =========================================================================
    'cache' => [
        'lsi_keywords_ttl' => 604800,             // 7 jours
        'paa_questions_ttl' => 604800,            // 7 jours
        'perplexity_research_ttl' => 604800,      // 7 jours
        'similar_content_enabled' => true,        // Cache contenus similaires activé
        'similar_content_threshold' => 0.95,      // Seuil similarité 95%
        'similar_content_ttl' => 2592000,         // 30 jours
        'max_cached_contents' => 10000,           // Max 10000 contenus en cache
    ],

    // =========================================================================
    // BRANDS (pour ancres branded)
    // =========================================================================
    'brands' => [
        'SOS-Expat.com',
        'Ulixai.com',
        'Ulysse.AI',
    ],

    // =========================================================================
    // LANGUAGES & LOCALIZATION
    // =========================================================================
    'languages' => [
        'fr' => ['name' => 'Français', 'rtl' => false],
        'en' => ['name' => 'English', 'rtl' => false],
        'es' => ['name' => 'Español', 'rtl' => false],
        'de' => ['name' => 'Deutsch', 'rtl' => false],
        'it' => ['name' => 'Italiano', 'rtl' => false],
        'pt' => ['name' => 'Português', 'rtl' => false],
        'ar' => ['name' => 'العربية', 'rtl' => true],
        'zh' => ['name' => '中文', 'rtl' => false],
        'ja' => ['name' => '日本語', 'rtl' => false],
    ],

    // =========================================================================
    // TARGET SCORE
    // =========================================================================
    'target_score' => [
        'seo_score' => 95,                        // Objectif 95/100
        'quality_score' => 92,                    // Objectif 92/100
        'eeat_score' => 85,                       // Objectif 85/100
        'min_acceptable_seo' => 90,               // Minimum acceptable 90/100
        'min_acceptable_quality' => 85,           // Minimum acceptable 85/100
    ],

    // =========================================================================
    // MONITORING & ALERTS
    // =========================================================================
    'monitoring' => [
        'alert_on_low_score' => true,             // Alerte si score < min
        'alert_on_over_optimization' => true,     // Alerte sur-optimisation
        'alert_on_high_cost' => true,             // Alerte coût élevé
        'daily_report' => true,                   // Rapport journalier
        'weekly_report' => true,                  // Rapport hebdomadaire
    ],
];
