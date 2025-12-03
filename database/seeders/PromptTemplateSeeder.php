<?php

namespace Database\Seeders;

use App\Models\PromptTemplate;
use App\Models\Theme;
use Illuminate\Database\Seeder;

class PromptTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            // ARTICLE STANDARD
            [
                'slug' => 'article-expatriation-fr',
                'name' => 'Article Expatriation FR',
                'type' => 'article',
                'theme_slug' => 'expatriation',
                'language_code' => 'fr',
                'system_prompt' => "Tu es un expert en expatriation et rédacteur web SEO. Tu rédiges des articles informatifs, précis et optimisés pour le référencement. Ton style est professionnel mais accessible. Tu inclus toujours des données chiffrées et des conseils pratiques.",
                'user_prompt' => "Rédige un article complet sur le sujet suivant : {title}

Contexte :
- Pays : {country_name}
- Type de prestataire : {provider_type}
- Spécialité : {specialty}
- Plateforme : {platform_name}

Structure attendue :
1. Accroche percutante (20-40 mots avec un chiffre clé)
2. Introduction AIDA (100-150 mots)
3. 6-8 sections H2 avec contenu détaillé (200-400 mots chacune)
4. Conclusion avec appel à l'action (100-150 mots)

Règles :
- Commence chaque section par une réponse directe à la question implicite
- Inclus des données chiffrées avec sources
- Ajoute 2-4 encadrés (💡 CONSEIL, ⚠️ ATTENTION, ℹ️ À SAVOIR)
- Longueur totale : {min_words}-{max_words} mots
- Optimise pour le mot-clé : {main_keyword}",
                'variables' => ['title', 'country_name', 'provider_type', 'specialty', 'platform_name', 'min_words', 'max_words', 'main_keyword'],
                'model' => 'gpt-4',
                'max_tokens' => 4000,
                'temperature' => 0.7,
            ],
            
            // LANDING PAGE
            [
                'slug' => 'landing-service-fr',
                'name' => 'Landing Page Service FR',
                'type' => 'landing',
                'theme_slug' => 'expatriation',
                'language_code' => 'fr',
                'system_prompt' => "Tu es un expert en copywriting et conversion. Tu rédiges des landing pages persuasives qui convertissent les visiteurs en clients. Tu utilises les techniques AIDA et PAS (Problem-Agitate-Solution).",
                'user_prompt' => "Crée une landing page pour le service suivant :

Service : {service_name}
Pays : {country_name}
Plateforme : {platform_name}
Public cible : Expatriés en {country_name}

Sections à générer :
1. HERO
   - Titre H1 (8-12 mots, accrocheur)
   - Sous-titre (15-25 mots, bénéfice principal)
   - Texte CTA principal

2. PROBLÈME (3-4 points)
   - Liste des frustrations du public cible
   - Format : icône + titre court + description 1-2 phrases

3. SOLUTION
   - Comment le service résout ces problèmes
   - Proposition de valeur unique

4. AVANTAGES (4-6 cartes)
   - Bénéfices concrets et mesurables
   - Format : icône + titre + description

5. COMMENT ÇA MARCHE (3-4 étapes)
   - Parcours utilisateur simplifié
   - Format numéroté avec descriptions

6. FAQ (4-6 questions)
   - Questions orientées conversion
   - Réponses rassurantes

7. CTA FINAL
   - Titre d'appel à l'action
   - Sous-titre rassurant
   - Texte du bouton",
                'variables' => ['service_name', 'country_name', 'platform_name'],
                'model' => 'gpt-4',
                'max_tokens' => 3000,
                'temperature' => 0.8,
            ],
            
            // ARTICLE COMPARATIF
            [
                'slug' => 'comparative-fr',
                'name' => 'Article Comparatif FR',
                'type' => 'comparative',
                'theme_slug' => 'affiliation',
                'language_code' => 'fr',
                'system_prompt' => "Tu es un expert en comparaison de services et produits. Tu rédiges des articles comparatifs objectifs, basés sur des données vérifiables. Tu présentes les avantages ET inconvénients de chaque option.",
                'user_prompt' => "Rédige un article comparatif sur : {comparison_subject}

Éléments à comparer : {elements}
Critères de comparaison : {criteria}
Pays/Contexte : {country_name}

Structure :
1. Accroche avec le nombre d'éléments testés (30-50 mots)
2. Introduction + méthodologie (100-150 mots)
3. Pour chaque élément :
   - Présentation (50 mots)
   - Avantages (3-5 points)
   - Inconvénients (2-3 points)
   - Note sur chaque critère (/10)
   - Verdict pour cet élément (30 mots)
4. Tableau comparatif (données structurées)
5. Verdict final avec podium 🥇🥈🥉
6. FAQ (6 questions de type \"X vs Y\")

Règles :
- Sois objectif et factuel
- Base-toi sur les données de {data_sources}
- Mentionne les sources
- Longueur : 2000-4000 mots",
                'variables' => ['comparison_subject', 'elements', 'criteria', 'country_name', 'data_sources'],
                'model' => 'gpt-4',
                'max_tokens' => 5000,
                'temperature' => 0.6,
            ],
            
            // TRADUCTION
            [
                'slug' => 'translation-content',
                'name' => 'Traduction Contenu',
                'type' => 'translation',
                'theme_slug' => null,
                'language_code' => 'fr',
                'system_prompt' => "Tu es un traducteur professionnel spécialisé dans le contenu web et l'expatriation. Tu traduis de manière naturelle en adaptant les expressions culturelles. Tu préserves le sens, le ton et les balises HTML.",
                'user_prompt' => "Traduis le texte suivant du {source_language} vers le {target_language}.

Texte à traduire :
{content}

Règles :
- Adapte les expressions idiomatiques à la culture cible
- Préserve toutes les balises HTML
- Garde le même ton (professionnel mais accessible)
- Adapte les formats de date/monnaie si mentionnés
- Ne traduis PAS les noms propres, marques, URLs",
                'variables' => ['source_language', 'target_language', 'content'],
                'model' => 'gpt-4o-mini',
                'max_tokens' => 4000,
                'temperature' => 0.3,
            ],
            
            // FAQ
            [
                'slug' => 'faq-generation',
                'name' => 'Génération FAQ',
                'type' => 'faq',
                'theme_slug' => null,
                'language_code' => 'fr',
                'system_prompt' => "Tu génères des FAQ pertinentes et complètes basées sur un sujet donné. Chaque réponse doit être informative et directe.",
                'user_prompt' => "Génère {count} questions-réponses FAQ pour le sujet : {subject}

Contexte :
- Pays : {country_name}
- Public : Expatriés
- Langue : {language}

Types de questions à inclure :
- 2x \"Comment...\" (procédures)
- 2x \"Combien...\" (coûts/délais)
- 2x \"Quels/Quelles...\" (listes/options)
- 1x \"Pourquoi...\" (justification)
- 1x \"Où...\" (localisation)

Format de réponse :
- 50-100 mots par réponse
- Réponse directe dès la première phrase
- Données chiffrées quand pertinent",
                'variables' => ['count', 'subject', 'country_name', 'language'],
                'model' => 'gpt-4',
                'max_tokens' => 2000,
                'temperature' => 0.7,
            ],
            
            // META DESCRIPTIONS
            [
                'slug' => 'meta-generation',
                'name' => 'Génération Meta',
                'type' => 'meta',
                'theme_slug' => null,
                'language_code' => 'fr',
                'system_prompt' => "Tu génères des meta titles et meta descriptions optimisées pour le SEO et le CTR.",
                'user_prompt' => "Génère les meta tags pour cet article :

Titre : {title}
Sujet : {subject}
Mot-clé principal : {keyword}
Langue : {language}

Génère :
1. Meta Title (max 60 caractères, inclure le mot-clé)
2. Meta Description (max 155 caractères, inciter au clic, inclure le mot-clé)

Format de réponse JSON :
{\"meta_title\": \"...\", \"meta_description\": \"...\"}",
                'variables' => ['title', 'subject', 'keyword', 'language'],
                'model' => 'gpt-4o-mini',
                'max_tokens' => 200,
                'temperature' => 0.5,
            ],
            
            // IMAGE DALL-E
            [
                'slug' => 'image-article',
                'name' => 'Image Article',
                'type' => 'image',
                'theme_slug' => null,
                'language_code' => 'en',
                'system_prompt' => "Generate prompts for DALL-E 3 that create professional, corporate-style images suitable for blog articles about expatriation.",
                'user_prompt' => "Create a professional photograph for an article about: {subject}

Context:
- Country: {country_name}
- Service type: {service_type}
- Theme: {theme}

Requirements:
- Professional, modern, high-quality corporate photography style
- Warm, welcoming atmosphere
- Show diversity and international context
- No text overlay
- 16:9 aspect ratio
- Clean, uncluttered composition
- Natural lighting

Do NOT include: faces of real people, text, logos, brand names",
                'variables' => ['subject', 'country_name', 'service_type', 'theme'],
                'model' => 'dall-e-3',
                'max_tokens' => 500,
                'temperature' => 0.8,
            ],
        ];

        foreach ($templates as $templateData) {
            $themeSlug = $templateData['theme_slug'] ?? null;
            unset($templateData['theme_slug']);
            
            if ($themeSlug) {
                $theme = Theme::where('slug', $themeSlug)->first();
                $templateData['theme_id'] = $theme?->id;
            }
            
            PromptTemplate::updateOrCreate(
                ['slug' => $templateData['slug']],
                $templateData
            );
        }

        $this->command->info('✓ ' . count($templates) . ' prompt templates créés');
    }
}
