<?php

namespace Database\Seeders;

use App\Models\ContentTemplate;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Seeder pour les templates de contenu
 * 
 * Crée tous les templates pour :
 * - Articles : 8 variantes × 9 langues = 72 templates
 * - Pillar : 2 variantes × 9 langues = 18 templates
 * - Landing : 3 variantes × 9 langues = 27 templates
 * - Comparative : 2 variantes × 9 langues = 18 templates
 * - Press Release : 5 variantes × 9 langues = 45 templates
 * - Dossier : 2 variantes × 9 langues = 18 templates
 * 
 * TOTAL : 198 templates
 */
class ContentTemplateSeeder extends Seeder
{
    protected array $languages = ['fr', 'en', 'de', 'es', 'pt', 'ru', 'zh', 'ar', 'hi'];

    protected array $languageNames = [
        'fr' => 'Français',
        'en' => 'English', 
        'de' => 'Deutsch',
        'es' => 'Español',
        'pt' => 'Português',
        'ru' => 'Русский',
        'zh' => '中文',
        'ar' => 'العربية',
        'hi' => 'हिन्दी',
    ];

    public function run(): void
    {
        $this->command->info('Création des templates de contenu...');

        // Articles (8 variantes)
        $this->createArticleTemplates();
        
        // Pillar Articles (2 variantes)
        $this->createPillarTemplates();
        
        // Landing Pages (3 variantes)
        $this->createLandingTemplates();
        
        // Comparatives (2 variantes)
        $this->createComparativeTemplates();
        
        // Press Releases (5 variantes)
        $this->createPressReleaseTemplates();
        
        // Dossiers de Presse (2 variantes)
        $this->createDossierTemplates();

        $total = ContentTemplate::count();
        $this->command->info("✓ {$total} templates créés avec succès !");
    }

    // =========================================================================
    // ARTICLES (8 variantes)
    // =========================================================================

    protected function createArticleTemplates(): void
    {
        $variants = [
            'guide_pratique' => [
                'name' => 'Guide Pratique',
                'description' => 'Article tutoriel avec étapes pratiques',
                'word_count' => [800, 1200, 1500],
                'faq_count' => 8,
                'is_default' => true,
                'structure' => ['sections_min' => 5, 'sections_max' => 8, 'with_toc' => false, 'with_faq' => true],
            ],
            'liste_top_n' => [
                'name' => 'Liste Top N',
                'description' => 'Article de type classement ou liste',
                'word_count' => [1000, 1400, 1800],
                'faq_count' => 6,
                'is_default' => false,
                'structure' => ['sections_min' => 5, 'sections_max' => 15, 'with_toc' => true, 'format' => 'ranking'],
            ],
            'analyse_approfondie' => [
                'name' => 'Analyse Approfondie',
                'description' => 'Article d\'analyse détaillée avec recherche',
                'word_count' => [1500, 2000, 2500],
                'faq_count' => 8,
                'is_default' => false,
                'structure' => ['sections_min' => 7, 'sections_max' => 10, 'with_toc' => true, 'with_faq' => true, 'with_research' => true],
            ],
            'faq_complete' => [
                'name' => 'FAQ Complète',
                'description' => 'Article entièrement en format FAQ',
                'word_count' => [800, 1000, 1200],
                'faq_count' => 15,
                'is_default' => false,
                'structure' => ['format' => 'faq', 'with_toc' => false],
            ],
            'storytelling' => [
                'name' => 'Storytelling',
                'description' => 'Article narratif avec témoignage',
                'word_count' => [1000, 1200, 1500],
                'faq_count' => 4,
                'is_default' => false,
                'structure' => ['sections_min' => 5, 'sections_max' => 7, 'format' => 'narrative'],
            ],
            'actualite' => [
                'name' => 'Actualité',
                'description' => 'Article court sur un sujet récent',
                'word_count' => [600, 800, 1000],
                'faq_count' => 3,
                'is_default' => false,
                'structure' => ['sections_min' => 4, 'sections_max' => 6, 'with_research' => true],
            ],
            'comparatif_article' => [
                'name' => 'Article Comparatif',
                'description' => 'Comparaison légère dans un article',
                'word_count' => [1200, 1600, 2000],
                'faq_count' => 6,
                'is_default' => false,
                'structure' => ['sections_min' => 6, 'sections_max' => 10, 'with_toc' => true, 'with_comparison_table' => true],
            ],
            'checklist' => [
                'name' => 'Checklist',
                'description' => 'Article avec liste de vérification',
                'word_count' => [800, 1000, 1200],
                'faq_count' => 5,
                'is_default' => false,
                'structure' => ['format' => 'checklist', 'with_toc' => true],
            ],
        ];

        foreach ($variants as $variantSlug => $config) {
            foreach ($this->languages as $lang) {
                $this->createArticleTemplate($lang, $variantSlug, $config);
            }
        }
        
        $this->command->info('  → Articles : ' . (count($variants) * count($this->languages)) . ' templates');
    }

    protected function createArticleTemplate(string $lang, string $variantSlug, array $config): void
    {
        $prompts = $this->getArticlePrompts($lang, $variantSlug);
        
        ContentTemplate::create([
            'category' => 'content',
            'type' => 'article',
            'slug' => "article-{$variantSlug}-{$lang}",
            'name' => $config['name'] . ' (' . strtoupper($lang) . ')',
            'description' => $config['description'],
            'language_code' => $lang,
            'output_format' => 'html',
            'system_prompt' => $prompts['system'],
            'user_prompt' => $prompts['user'],
            'structure' => $config['structure'],
            'variables' => ['title', 'country_name', 'country_in', 'theme_name', 'platform_name', 'year'],
            'model' => 'gpt-4o',
            'max_tokens' => 4000,
            'temperature' => 0.7,
            'word_count_min' => $config['word_count'][0],
            'word_count_target' => $config['word_count'][1],
            'word_count_max' => $config['word_count'][2],
            'faq_count' => $config['faq_count'],
            'is_default' => $config['is_default'],
            'is_active' => true,
        ]);
    }

    protected function getArticlePrompts(string $lang, string $variant): array
    {
        return [
            'system' => $this->getArticleSystemPrompt($lang, $variant),
            'user' => $this->getArticleUserPrompt($lang, $variant),
        ];
    }

    protected function getArticleSystemPrompt(string $lang, string $variant): string
    {
        $base = $lang === 'en' ? <<<PROMPT
You are an expert content writer for expatriates.
You work for {platform_name}, a platform helping expatriates worldwide.

Your expertise:
- International administrative procedures
- Legal and tax aspects of expatriation
- Practical daily life advice abroad
- SEO optimization for search engines

Writing principles:
✓ Empathy: Understand expatriate challenges
✓ Clarity: Precise, verifiable, current information ({year})
✓ Usefulness: Actionable advice with concrete examples
✓ Accessibility: Avoid jargon or explain it
✓ Structure: Clear headings (H2, H3), short paragraphs, bullet lists
✓ SEO: Natural keywords, HTML5 semantic tags
PROMPT
        : <<<PROMPT
Tu es un expert en rédaction de contenu pour expatriés.
Tu travailles pour {platform_name}, plateforme d'aide aux expatriés dans le monde.

Ton expertise :
- Démarches administratives internationales
- Aspects juridiques et fiscaux de l'expatriation
- Conseils pratiques quotidiens à l'étranger
- Optimisation SEO pour les moteurs de recherche

Principes de rédaction :
✓ Empathie : Comprendre les difficultés des expatriés
✓ Clarté : Informations précises, vérifiables, actuelles ({year})
✓ Utilité : Conseils actionnables avec exemples concrets
✓ Accessibilité : Éviter le jargon ou l'expliquer
✓ Structure : Titres clairs (H2, H3), paragraphes courts, listes
✓ SEO : Mots-clés naturels, balises HTML5 sémantiques
PROMPT;

        $styles = [
            'guide_pratique' => $lang === 'en' 
                ? "\n\nStyle: Step-by-step tutorial, pedagogical and encouraging tone."
                : "\n\nStyle : Tutoriel pas à pas, ton pédagogique et encourageant.",
            'liste_top_n' => $lang === 'en'
                ? "\n\nStyle: Numbered ranking, detailed descriptions, pros/cons."
                : "\n\nStyle : Classement numéroté, descriptions détaillées, avantages/inconvénients.",
            'analyse_approfondie' => $lang === 'en'
                ? "\n\nStyle: Expert analysis with data, official sources, 360° view."
                : "\n\nStyle : Analyse experte avec données, sources officielles, vision 360°.",
            'faq_complete' => $lang === 'en'
                ? "\n\nStyle: Q&A format exclusively, cover all possible questions."
                : "\n\nStyle : Format questions-réponses exclusif, couvrir toutes les questions.",
            'storytelling' => $lang === 'en'
                ? "\n\nStyle: Engaging narrative, real examples, personal inspiring tone."
                : "\n\nStyle : Narration engageante, exemples vécus, ton personnel inspirant.",
            'actualite' => $lang === 'en'
                ? "\n\nStyle: Journalistic, factual, inverted pyramid, essentials first."
                : "\n\nStyle : Journalistique, factuel, pyramide inversée, essentiel en premier.",
            'comparatif_article' => $lang === 'en'
                ? "\n\nStyle: Objective, balanced, comparison table, reasoned verdict."
                : "\n\nStyle : Objectif, équilibré, tableau comparatif, verdict argumenté.",
            'checklist' => $lang === 'en'
                ? "\n\nStyle: Actionable checklist, sequential steps, virtual checkboxes."
                : "\n\nStyle : Checklist actionnable, étapes séquentielles, cases à cocher.",
        ];

        return $base . ($styles[$variant] ?? '');
    }

    protected function getArticleUserPrompt(string $lang, string $variant): string
    {
        if ($lang === 'en') {
            return <<<PROMPT
Write a complete article:

**Title**: {title}
**Country**: {country_name}
**Theme**: {theme_name}
**Language**: English
**Year**: {year}

Required structure:
1. Engaging introduction (AIDA method) - 100-150 words
2. 5-8 H2 sections with actionable content
3. Regular tips boxes (💡 Tip or ⚠️ Warning)
4. FAQ section with {faq_count} Q&As
5. Conclusion with call-to-action

Word count: {word_count_min} - {word_count_max}
Output: Semantic HTML5 (article, section, h2, h3, p, ul, li)
PROMPT;
        }

        return <<<PROMPT
Rédige un article complet :

**Titre** : {title}
**Pays** : {country_name}
**Thématique** : {theme_name}
**Langue** : Français
**Année** : {year}

Structure obligatoire :
1. Introduction engageante (méthode AIDA) - 100-150 mots
2. 5-8 sections H2 avec contenu actionnable
3. Encadrés réguliers (💡 Conseil ou ⚠️ Attention)
4. Section FAQ avec {faq_count} questions/réponses
5. Conclusion avec call-to-action

Nombre de mots : {word_count_min} - {word_count_max}
Format : HTML5 sémantique (article, section, h2, h3, p, ul, li)
PROMPT;
    }

    // =========================================================================
    // PILLAR ARTICLES (2 variantes)
    // =========================================================================

    protected function createPillarTemplates(): void
    {
        $variants = [
            'guide_ultime' => [
                'name' => 'Guide Ultime',
                'description' => 'Article pilier exhaustif de référence',
                'word_count' => [3000, 4000, 5000],
                'faq_count' => 12,
                'is_default' => true,
            ],
            'encyclopedie' => [
                'name' => 'Article Encyclopédique',
                'description' => 'Article très complet style Wikipedia',
                'word_count' => [4000, 5000, 6000],
                'faq_count' => 15,
                'is_default' => false,
            ],
        ];

        foreach ($variants as $variantSlug => $config) {
            foreach ($this->languages as $lang) {
                ContentTemplate::create([
                    'category' => 'content',
                    'type' => 'pillar',
                    'slug' => "pillar-{$variantSlug}-{$lang}",
                    'name' => $config['name'] . ' (' . strtoupper($lang) . ')',
                    'description' => $config['description'],
                    'language_code' => $lang,
                    'output_format' => 'html',
                    'system_prompt' => $this->getPillarSystemPrompt($lang),
                    'user_prompt' => $this->getPillarUserPrompt($lang),
                    'structure' => [
                        'sections_min' => 8,
                        'sections_max' => 12,
                        'with_toc' => true,
                        'with_key_takeaways' => true,
                        'with_summary_table' => true,
                    ],
                    'variables' => ['title', 'country_name', 'country_in', 'theme_name', 'platform_name', 'year'],
                    'model' => 'gpt-4o',
                    'max_tokens' => 8000,
                    'temperature' => 0.7,
                    'word_count_min' => $config['word_count'][0],
                    'word_count_target' => $config['word_count'][1],
                    'word_count_max' => $config['word_count'][2],
                    'faq_count' => $config['faq_count'],
                    'is_default' => $config['is_default'],
                    'is_active' => true,
                ]);
            }
        }

        $this->command->info('  → Pillar : ' . (count($variants) * count($this->languages)) . ' templates');
    }

    protected function getPillarSystemPrompt(string $lang): string
    {
        return $lang === 'en' ? <<<PROMPT
You are a senior expert in expatriation content, creating ultimate reference guides.
You work for {platform_name}.

Standards for pillar content:
✓ Exhaustiveness: Cover ALL aspects of the topic
✓ Authority: Cite official sources, statistics, expert opinions
✓ Structure: Clear hierarchy with table of contents
✓ Actionability: Concrete steps for each section
✓ Evergreen: Long-term valid information
✓ SEO: Comprehensive keyword coverage
✓ Length: 3000-5000 words minimum

You produce reference content that ranks #1 on Google.
PROMPT
        : <<<PROMPT
Tu es un expert senior en contenu expatriation, créant des guides de référence ultimes.
Tu travailles pour {platform_name}.

Standards contenu pilier :
✓ Exhaustivité : Couvrir TOUS les aspects du sujet
✓ Autorité : Citer sources officielles, statistiques, avis experts
✓ Structure : Hiérarchie claire avec table des matières
✓ Actionnabilité : Étapes concrètes par section
✓ Evergreen : Information valide long-terme
✓ SEO : Couverture complète mots-clés
✓ Longueur : 3000-5000 mots minimum

Tu produis du contenu de référence qui se positionne #1 sur Google.
PROMPT;
    }

    protected function getPillarUserPrompt(string $lang): string
    {
        return $lang === 'en' ? <<<PROMPT
Create an ultimate reference guide:

**Title**: {title}
**Country**: {country_name}
**Theme**: {theme_name}
**Year**: {year}

Required structure:
1. Key Takeaways box (5-7 bullets)
2. Complete table of contents
3. Introduction with scope
4. 8-12 detailed H2 sections covering all aspects
5. Summary comparison table
6. FAQ with {faq_count} questions
7. Conclusion with next steps

Word count: {word_count_min} - {word_count_max}
Output: Semantic HTML5 with schema.org Article markup
PROMPT
        : <<<PROMPT
Crée un guide de référence ultime :

**Titre** : {title}
**Pays** : {country_name}
**Thématique** : {theme_name}
**Année** : {year}

Structure obligatoire :
1. Encadré "Points clés" (5-7 puces)
2. Table des matières complète
3. Introduction avec périmètre
4. 8-12 sections H2 détaillées couvrant tous les aspects
5. Tableau récapitulatif
6. FAQ avec {faq_count} questions
7. Conclusion avec prochaines étapes

Nombre de mots : {word_count_min} - {word_count_max}
Format : HTML5 sémantique avec markup schema.org Article
PROMPT;
    }

    // =========================================================================
    // LANDING PAGES (3 variantes)
    // =========================================================================

    protected function createLandingTemplates(): void
    {
        $variants = [
            'service' => [
                'name' => 'Landing Service',
                'description' => 'Page de service avec conversion',
                'word_count' => [600, 800, 1000],
                'faq_count' => 6,
                'is_default' => true,
            ],
            'comparatif' => [
                'name' => 'Landing Comparatif',
                'description' => 'Page comparant plusieurs prestataires',
                'word_count' => [800, 1000, 1200],
                'faq_count' => 6,
                'is_default' => false,
            ],
            'urgence' => [
                'name' => 'Landing Urgence',
                'description' => 'Page pour situations urgentes (SOS)',
                'word_count' => [400, 600, 800],
                'faq_count' => 4,
                'is_default' => false,
            ],
        ];

        foreach ($variants as $variantSlug => $config) {
            foreach ($this->languages as $lang) {
                ContentTemplate::create([
                    'category' => 'content',
                    'type' => 'landing',
                    'slug' => "landing-{$variantSlug}-{$lang}",
                    'name' => $config['name'] . ' (' . strtoupper($lang) . ')',
                    'description' => $config['description'],
                    'language_code' => $lang,
                    'output_format' => 'html',
                    'system_prompt' => $this->getLandingSystemPrompt($lang),
                    'user_prompt' => $this->getLandingUserPrompt($lang),
                    'structure' => [
                        'hero' => true,
                        'problem' => true,
                        'solution' => true,
                        'benefits' => 4,
                        'how_it_works' => 3,
                        'faq' => true,
                        'cta' => true,
                    ],
                    'variables' => ['service_name', 'country_name', 'provider_type', 'platform_name'],
                    'model' => 'gpt-4o',
                    'max_tokens' => 3000,
                    'temperature' => 0.8,
                    'word_count_min' => $config['word_count'][0],
                    'word_count_target' => $config['word_count'][1],
                    'word_count_max' => $config['word_count'][2],
                    'faq_count' => $config['faq_count'],
                    'is_default' => $config['is_default'],
                    'is_active' => true,
                ]);
            }
        }

        $this->command->info('  → Landing : ' . (count($variants) * count($this->languages)) . ' templates');
    }

    protected function getLandingSystemPrompt(string $lang): string
    {
        return $lang === 'en' 
            ? "You are a conversion copywriting expert for expatriate services.\nYou master AIDA and PAS persuasion techniques.\nFocus: Highlight value, build trust, drive action."
            : "Tu es un expert en copywriting de conversion pour services expatriés.\nTu maîtrises les techniques AIDA et PAS.\nFocus : Mettre en valeur, créer confiance, pousser à l'action.";
    }

    protected function getLandingUserPrompt(string $lang): string
    {
        return $lang === 'en' ? <<<PROMPT
Create a high-conversion landing page:

**Service**: {service_name}
**Country**: {country_name}
**Provider**: {provider_type}
**Platform**: {platform_name}

Structure:
1. Hero: Headline + subheadline + CTA
2. Problem: User pain points
3. Solution: How we solve it
4. Benefits: 4-6 key benefits
5. How it works: 3-4 steps
6. FAQ: {faq_count} questions
7. Final CTA

Word count: {word_count_min} - {word_count_max}
Output: HTML5 with clear CTAs
PROMPT
        : <<<PROMPT
Crée une landing page haute conversion :

**Service** : {service_name}
**Pays** : {country_name}
**Prestataire** : {provider_type}
**Plateforme** : {platform_name}

Structure :
1. Hero : Titre + sous-titre + CTA
2. Problème : Points de douleur
3. Solution : Comment on résout
4. Bénéfices : 4-6 avantages clés
5. Comment ça marche : 3-4 étapes
6. FAQ : {faq_count} questions
7. CTA final

Nombre de mots : {word_count_min} - {word_count_max}
Format : HTML5 avec CTAs clairs
PROMPT;
    }

    // =========================================================================
    // COMPARATIVES (2 variantes)
    // =========================================================================

    protected function createComparativeTemplates(): void
    {
        $variants = [
            'standard' => [
                'name' => 'Comparatif Standard',
                'description' => 'Comparaison de 3-5 éléments',
                'word_count' => [1500, 2000, 2500],
                'faq_count' => 6,
                'is_default' => true,
            ],
            'detaille' => [
                'name' => 'Comparatif Détaillé',
                'description' => 'Comparaison approfondie avec scoring',
                'word_count' => [2500, 3500, 4500],
                'faq_count' => 10,
                'is_default' => false,
            ],
        ];

        foreach ($variants as $variantSlug => $config) {
            foreach ($this->languages as $lang) {
                ContentTemplate::create([
                    'category' => 'content',
                    'type' => 'comparative',
                    'slug' => "comparative-{$variantSlug}-{$lang}",
                    'name' => $config['name'] . ' (' . strtoupper($lang) . ')',
                    'description' => $config['description'],
                    'language_code' => $lang,
                    'output_format' => 'html',
                    'system_prompt' => $this->getComparativeSystemPrompt($lang),
                    'user_prompt' => $this->getComparativeUserPrompt($lang),
                    'structure' => [
                        'intro_methodology' => true,
                        'per_element_analysis' => true,
                        'comparison_table' => true,
                        'podium' => true,
                        'recommendations' => true,
                    ],
                    'variables' => ['title', 'country_name', 'theme_name', 'comparison_elements', 'year'],
                    'model' => 'gpt-4o',
                    'max_tokens' => 5000,
                    'temperature' => 0.6,
                    'word_count_min' => $config['word_count'][0],
                    'word_count_target' => $config['word_count'][1],
                    'word_count_max' => $config['word_count'][2],
                    'faq_count' => $config['faq_count'],
                    'is_default' => $config['is_default'],
                    'is_active' => true,
                ]);
            }
        }

        $this->command->info('  → Comparatives : ' . (count($variants) * count($this->languages)) . ' templates');
    }

    protected function getComparativeSystemPrompt(string $lang): string
    {
        return $lang === 'en' ? <<<PROMPT
You are an expert analyst comparing services for expatriates.

Approach:
✓ Objectivity: No favoritism, fact-based
✓ Methodology: Clear, reproducible criteria
✓ Transparency: Explain ratings
✓ Usefulness: Help informed decisions
PROMPT
        : <<<PROMPT
Tu es un analyste expert comparant services pour expatriés.

Approche :
✓ Objectivité : Pas de favoritisme, analyse factuelle
✓ Méthodologie : Critères clairs, reproductibles
✓ Transparence : Expliquer les notes
✓ Utilité : Aider aux décisions éclairées
PROMPT;
    }

    protected function getComparativeUserPrompt(string $lang): string
    {
        return $lang === 'en' ? <<<PROMPT
Create a comparison article:

**Title**: {title}
**Country**: {country_name}
**Elements**: {comparison_elements}
**Year**: {year}

Structure:
1. Introduction + methodology
2. Comparison criteria
3. Per-element analysis (strengths ✓, weaknesses ✗, rating /10)
4. Comparison table
5. Podium (Top 3)
6. Recommendations by profile
7. FAQ ({faq_count} questions)
8. Conclusion

Word count: {word_count_min} - {word_count_max}
PROMPT
        : <<<PROMPT
Crée un article comparatif :

**Titre** : {title}
**Pays** : {country_name}
**Éléments** : {comparison_elements}
**Année** : {year}

Structure :
1. Introduction + méthodologie
2. Critères de comparaison
3. Analyse par élément (forces ✓, faiblesses ✗, note /10)
4. Tableau comparatif
5. Podium (Top 3)
6. Recommandations par profil
7. FAQ ({faq_count} questions)
8. Conclusion

Nombre de mots : {word_count_min} - {word_count_max}
PROMPT;
    }

    // =========================================================================
    // PRESS RELEASES (5 variantes)
    // =========================================================================

    protected function createPressReleaseTemplates(): void
    {
        $variants = [
            'lancement_produit' => [
                'name' => 'Communiqué - Lancement',
                'description' => 'Lancement de produit ou service',
                'word_count' => [400, 600, 800],
                'is_default' => true,
            ],
            'partenariat' => [
                'name' => 'Communiqué - Partenariat',
                'description' => 'Annonce de partenariat stratégique',
                'word_count' => [400, 550, 700],
                'is_default' => false,
            ],
            'resultats_milestone' => [
                'name' => 'Communiqué - Résultats',
                'description' => 'Résultats financiers ou milestones',
                'word_count' => [350, 500, 650],
                'is_default' => false,
            ],
            'evenement' => [
                'name' => 'Communiqué - Événement',
                'description' => 'Annonce d\'événement ou conférence',
                'word_count' => [300, 450, 600],
                'is_default' => false,
            ],
            'nomination' => [
                'name' => 'Communiqué - Nomination',
                'description' => 'Nomination ou changement RH',
                'word_count' => [300, 400, 500],
                'is_default' => false,
            ],
        ];

        foreach ($variants as $variantSlug => $config) {
            foreach ($this->languages as $lang) {
                ContentTemplate::create([
                    'category' => 'press',
                    'type' => 'press_release',
                    'slug' => "press-release-{$variantSlug}-{$lang}",
                    'name' => $config['name'] . ' (' . strtoupper($lang) . ')',
                    'description' => $config['description'],
                    'language_code' => $lang,
                    'output_format' => 'pdf',
                    'system_prompt' => $this->getPressReleaseSystemPrompt($lang),
                    'user_prompt' => $this->getPressReleaseUserPrompt($lang, $variantSlug),
                    'structure' => [
                        'headline' => 80,
                        'subheadline' => 120,
                        'lead' => 50,
                        'body' => 400,
                        'about' => 100,
                        'contact' => true,
                    ],
                    'variables' => ['company_name', 'release_type', 'release_date', 'key_announcement'],
                    'model' => 'gpt-4o',
                    'max_tokens' => 2000,
                    'temperature' => 0.5,
                    'word_count_min' => $config['word_count'][0],
                    'word_count_target' => $config['word_count'][1],
                    'word_count_max' => $config['word_count'][2],
                    'faq_count' => 0,
                    'is_default' => $config['is_default'],
                    'is_active' => true,
                ]);
            }
        }

        $this->command->info('  → Press Releases : ' . (count($variants) * count($this->languages)) . ' templates');
    }

    protected function getPressReleaseSystemPrompt(string $lang): string
    {
        return $lang === 'en' ? <<<PROMPT
You are a press relations expert for international companies.

Standards:
✓ Inverted pyramid: Most important first
✓ Factual tone: No unproven superlatives
✓ Quotable quotes: Include spokesperson citation
✓ 5W rule: Who, What, When, Where, Why
✓ Professional format: Standard structure
PROMPT
        : <<<PROMPT
Tu es un expert en relations presse pour entreprises internationales.

Standards :
✓ Pyramide inversée : Plus important en premier
✓ Ton factuel : Pas de superlatifs sans preuves
✓ Citations : Inclure citation porte-parole
✓ Règle 5W : Qui, Quoi, Quand, Où, Pourquoi
✓ Format pro : Structure standard
PROMPT;
    }

    protected function getPressReleaseUserPrompt(string $lang, string $variant): string
    {
        $focus = [
            'lancement_produit' => $lang === 'en' 
                ? "Focus: Product/service launch - innovation, benefits, availability."
                : "Focus : Lancement produit/service - innovation, bénéfices, disponibilité.",
            'partenariat' => $lang === 'en'
                ? "Focus: Partnership - synergies, shared vision, client benefits."
                : "Focus : Partenariat - synergies, vision commune, bénéfices clients.",
            'resultats_milestone' => $lang === 'en'
                ? "Focus: Results - key figures, growth, market position."
                : "Focus : Résultats - chiffres clés, croissance, position marché.",
            'evenement' => $lang === 'en'
                ? "Focus: Event - date, location, program, registration."
                : "Focus : Événement - date, lieu, programme, inscription.",
            'nomination' => $lang === 'en'
                ? "Focus: Appointment - background, vision, strategic fit."
                : "Focus : Nomination - parcours, vision, adéquation stratégique.",
        ];

        $f = $focus[$variant] ?? $focus['lancement_produit'];

        return $lang === 'en' ? <<<PROMPT
Write a press release:

**Company**: {company_name}
**Date**: {release_date}
**Announcement**: {key_announcement}

{$f}

Structure:
1. Headline (max 80 chars)
2. Subheadline (max 120 chars)
3. Lead (30-50 words)
4. Body (300-500 words)
5. About section (80-100 words)
6. Press contact

Word count: {word_count_min} - {word_count_max}
PROMPT
        : <<<PROMPT
Rédige un communiqué de presse :

**Entreprise** : {company_name}
**Date** : {release_date}
**Annonce** : {key_announcement}

{$f}

Structure :
1. Titre (max 80 caractères)
2. Sous-titre (max 120 caractères)
3. Chapô (30-50 mots)
4. Corps (300-500 mots)
5. À propos (80-100 mots)
6. Contact presse

Nombre de mots : {word_count_min} - {word_count_max}
PROMPT;
    }

    // =========================================================================
    // DOSSIERS DE PRESSE (2 variantes)
    // =========================================================================

    protected function createDossierTemplates(): void
    {
        $variants = [
            'entreprise' => [
                'name' => 'Kit Presse Entreprise',
                'description' => 'Dossier de presse corporate complet',
                'word_count' => [3000, 4500, 6000],
                'faq_count' => 6,
                'is_default' => true,
            ],
            'produit' => [
                'name' => 'Kit Presse Produit',
                'description' => 'Dossier de presse produit/service',
                'word_count' => [2000, 3000, 4000],
                'faq_count' => 8,
                'is_default' => false,
            ],
        ];

        foreach ($variants as $variantSlug => $config) {
            foreach ($this->languages as $lang) {
                ContentTemplate::create([
                    'category' => 'press',
                    'type' => 'dossier',
                    'slug' => "dossier-{$variantSlug}-{$lang}",
                    'name' => $config['name'] . ' (' . strtoupper($lang) . ')',
                    'description' => $config['description'],
                    'language_code' => $lang,
                    'output_format' => 'pdf',
                    'system_prompt' => $this->getDossierSystemPrompt($lang),
                    'user_prompt' => $this->getDossierUserPrompt($lang),
                    'structure' => [
                        'cover' => true,
                        'sommaire' => true,
                        'about' => 400,
                        'team' => 500,
                        'services' => 600,
                        'achievements' => 500,
                        'key_figures' => 300,
                        'faq' => true,
                        'contacts' => 200,
                    ],
                    'variables' => ['company_name', 'industry', 'founded_year', 'headquarters'],
                    'model' => 'gpt-4o',
                    'max_tokens' => 8000,
                    'temperature' => 0.6,
                    'word_count_min' => $config['word_count'][0],
                    'word_count_target' => $config['word_count'][1],
                    'word_count_max' => $config['word_count'][2],
                    'faq_count' => $config['faq_count'],
                    'is_default' => $config['is_default'],
                    'is_active' => true,
                ]);
            }
        }

        $this->command->info('  → Dossiers : ' . (count($variants) * count($this->languages)) . ' templates');
    }

    protected function getDossierSystemPrompt(string $lang): string
    {
        return $lang === 'en' ? <<<PROMPT
You are an expert creating professional press kits for international companies.

Standards:
✓ Professional: Formal but accessible
✓ Complete: All info journalists need
✓ Structured: Easy navigation
✓ Up-to-date: Current figures
✓ Contact-ready: Multiple contact points
PROMPT
        : <<<PROMPT
Tu es un expert en création de dossiers de presse professionnels.

Standards :
✓ Professionnel : Ton formel mais accessible
✓ Complet : Toutes infos pour journalistes
✓ Structuré : Navigation facile
✓ À jour : Chiffres actuels
✓ Contact-ready : Plusieurs contacts
PROMPT;
    }

    protected function getDossierUserPrompt(string $lang): string
    {
        return $lang === 'en' ? <<<PROMPT
Create a complete press kit:

**Company**: {company_name}
**Industry**: {industry}
**Founded**: {founded_year}
**HQ**: {headquarters}

Structure:
1. Cover page
2. Table of contents
3. About Us (400 words)
4. Leadership (500 words)
5. Products/Services (600 words)
6. Achievements (500 words)
7. Key Figures (300 words)
8. FAQ ({faq_count} questions)
9. Press Contacts (200 words)

Placeholders: [LOGO], [TEAM_PHOTO], [PRODUCT_IMAGE]

Word count: {word_count_min} - {word_count_max}
PROMPT
        : <<<PROMPT
Crée un dossier de presse complet :

**Entreprise** : {company_name}
**Secteur** : {industry}
**Fondée** : {founded_year}
**Siège** : {headquarters}

Structure :
1. Couverture
2. Sommaire
3. Qui sommes-nous (400 mots)
4. Équipe dirigeante (500 mots)
5. Produits/Services (600 mots)
6. Réalisations (500 mots)
7. Chiffres clés (300 mots)
8. FAQ ({faq_count} questions)
9. Contacts presse (200 mots)

Placeholders : [LOGO], [PHOTO_EQUIPE], [IMAGE_PRODUIT]

Nombre de mots : {word_count_min} - {word_count_max}
PROMPT;
    }
}
