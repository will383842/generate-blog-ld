<?php

return [
    // General
    'title' => 'Intelligent Linking',
    'description' => 'Automatic linking system for SEO',

    // Success messages
    'links_generated' => 'Links generated successfully',
    'internal_links_created' => ':count internal link(s) created',
    'external_links_created' => ':count external link(s) created',
    'affiliate_links_injected' => ':count affiliate link(s) injected',
    'pillar_links_created' => ':count pillar link(s) created',
    'content_updated' => 'Content updated with links',
    'jobs_dispatched' => 'Link generation jobs dispatched',
    'batch_job_dispatched' => 'Batch job dispatched for :count articles',

    // Authority domains
    'domain_created' => 'Authority domain created successfully',
    'domain_updated' => 'Authority domain updated',
    'domain_deleted' => 'Authority domain deleted',
    'domain_exists' => 'This domain already exists',
    'domain_verified' => 'Domain verified successfully',
    'domain_active' => 'Domain active',
    'domain_inactive' => 'Domain inactive',

    // Linking rules
    'rules_updated' => 'Linking rules updated',
    'rules_reset' => 'Rules reset to default values',
    'rules_copied' => 'Rules copied successfully',
    'no_rules_to_copy' => 'No rules to copy for this platform',

    // Errors
    'no_articles_found' => 'No articles found',
    'article_not_found' => 'Article not found',
    'platform_not_found' => 'Platform not found',
    'generation_failed' => 'Link generation failed',
    'verification_failed' => 'Link verification failed',

    // Link types
    'link_types' => [
        'internal' => 'Internal link',
        'external' => 'External link',
        'affiliate' => 'Affiliate link',
        'pillar' => 'Pillar link',
    ],

    // Link contexts
    'link_contexts' => [
        'pillar_to_article' => 'Pillar → Article',
        'article_to_pillar' => 'Article → Pillar',
        'article_to_article' => 'Article → Article',
        'theme_related' => 'Related theme',
        'country_related' => 'Same country',
    ],

    // Anchor types
    'anchor_types' => [
        'exact_match' => 'Exact match',
        'long_tail' => 'Long tail',
        'generic' => 'Generic',
        'cta' => 'Call to action',
        'question' => 'Question',
    ],

    // Source types
    'source_types' => [
        'government' => 'Government',
        'organization' => 'Organization',
        'reference' => 'Reference',
        'news' => 'News',
        'authority' => 'Authority',
    ],

    // Analysis
    'analysis' => [
        'title' => 'Link Analysis',
        'orphan_articles' => 'Orphan articles',
        'dead_ends' => 'Dead ends',
        'weakly_connected' => 'Weakly connected',
        'health_score' => 'Health score',
        'link_balance' => 'Link balance',
    ],

    // Grades
    'grades' => [
        'A' => 'Excellent',
        'B' => 'Good',
        'C' => 'Acceptable',
        'D' => 'Needs improvement',
        'F' => 'Critical',
    ],

    // Recommendations
    'recommendations' => [
        'add_internal_links' => 'Add more internal links',
        'add_external_links' => 'Add reliable external sources',
        'link_to_pillar' => 'Link to a pillar article',
        'fix_broken_links' => 'Fix broken links',
        'improve_anchor_diversity' => 'Diversify anchor texts',
    ],

    // Verification
    'verification' => [
        'title' => 'Link Verification',
        'checking' => 'Checking...',
        'valid' => 'Valid',
        'broken' => 'Broken',
        'redirected' => 'Redirected',
        'timeout' => 'Timeout',
    ],

    // Console
    'console' => [
        'generating_links' => 'Generating links for :title',
        'processing_articles' => 'Processing :count articles',
        'completed' => 'Completed',
        'failed' => 'Failed',
        'skipped' => 'Skipped',
    ],

    // Command descriptions
    'commands' => [
        'generate_internal' => 'Generate internal links for articles',
        'analyze_balance' => 'Analyze platform link balance',
        'discover_domains' => 'Discover and manage authority domains',
        'verify_external' => 'Verify external links and identify broken ones',
    ],

    // Tooltips and help
    'help' => [
        'min_internal' => 'Minimum number of internal links per article',
        'max_internal' => 'Maximum number of internal links per article',
        'min_external' => 'Minimum number of external links per article',
        'max_external' => 'Maximum number of external links per article',
        'min_authority' => 'Minimum authority score for external domains',
        'min_relevance' => 'Minimum relevance score for internal links',
        'anchor_distribution' => 'Distribution of anchor text types',
    ],

    // Anchor text templates
    'anchor_templates' => [
        'long_tail' => [
            'everything about :text',
            'complete guide to :text',
            'learn about :text',
            'understanding :text',
        ],
        'cta' => [
            'check our guide on :text',
            'learn more about :text',
            'discover :text',
        ],
        'generic' => [
            'learn more',
            'click here',
            'read more',
            'find out more',
        ],
        'question' => [
            'how to :text?',
            'what is :text?',
            'why :text?',
        ],
    ],

    // Labels for external links
    'external_labels' => [
        'official_site' => 'Official website',
        'visit' => 'Visit :domain',
        'source' => 'Source: :name',
        'reference' => 'Official reference',
    ],
];
