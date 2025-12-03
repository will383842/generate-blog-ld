<?php

namespace Database\Seeders;

use App\Models\Platform;
use App\Models\Template;
use Illuminate\Database\Seeder;

class TemplateSeeder extends Seeder
{
    /**
     * Seeder pour les templates de génération de contenu - VERSION CORRIGÉE
     * 
     * Templates de prompts pour :
     * - Articles (SOS-EXPAT, ULIXAI)
     * - Landings (SOS-EXPAT, ULIXAI)
     * - FAQ, Meta, CTA, Traduction
     * 
     * Note: Les colonnes platform_id et prompt ont été ajoutées via migrations
     */
    public function run(): void
    {
        $platforms = Platform::pluck('id', 'slug')->toArray();
        
        $templates = [
            // ═══════════════════════════════════════════════════════════════
            // TEMPLATES ARTICLES - SOS-EXPAT
            // ═══════════════════════════════════════════════════════════════
            [
                'platform' => 'sos-expat',
                'type' => 'article',
                'name' => 'Article SOS-Expat Standard',
                'prompt' => <<<'PROMPT'
Tu es un expert en expatriation et rédacteur SEO professionnel.

Rédige un article complet et informatif sur le sujet suivant :
**{title}**

CONTEXTE :
- Pays : {country}
- Thème : {theme}
- Plateforme : SOS-Expat (assistance urgente aux expatriés francophones)
- Public cible : Expatriés français et francophones vivant {country_in}

STRUCTURE OBLIGATOIRE :
1. Introduction (150-200 mots) - Accrocheuse, présente le problème et la solution
2. Section 1 : Contexte et enjeux (300-400 mots)
3. Section 2 : Démarches et procédures (400-500 mots)
4. Section 3 : Conseils pratiques (300-400 mots)
5. Section 4 : Erreurs à éviter (200-300 mots)
6. Conclusion avec call-to-action vers SOS-Expat (100-150 mots)

CONSIGNES :
- Longueur totale : {word_count} mots minimum
- Ton : Professionnel mais accessible, rassurant
- Inclure des données chiffrées quand pertinent
- Mentionner les spécificités locales de {country}
- Utiliser des sous-titres H2 et H3
- Format HTML (sans balises html, head, body)

IMPORTANT : L'article doit inciter le lecteur à contacter un expert SOS-Expat en cas de besoin urgent.
PROMPT,
                'template_variables' => ['title', 'country', 'country_in', 'theme', 'word_count'],
            ],
            
            // ═══════════════════════════════════════════════════════════════
            // TEMPLATES ARTICLES - ULIXAI
            // ═══════════════════════════════════════════════════════════════
            [
                'platform' => 'ulixai',
                'type' => 'article',
                'name' => 'Article Ulixai Standard',
                'prompt' => <<<'PROMPT'
Tu es un expert en services aux expatriés et rédacteur SEO.

Rédige un article comparatif et informatif sur :
**{title}**

CONTEXTE :
- Pays : {country}
- Service : {service}
- Plateforme : Ulixai (marketplace de services pour expatriés)
- Public cible : Expatriés recherchant des prestataires de qualité {country_in}

STRUCTURE OBLIGATOIRE :
1. Introduction (150-200 mots) - Pourquoi ce service est important pour les expatriés
2. Comment choisir le bon prestataire (300-400 mots)
3. Les critères essentiels à vérifier (300-400 mots)
4. Comparatif des options disponibles {country_in} (400-500 mots)
5. Budget et tarifs moyens (200-300 mots)
6. Conclusion avec incitation à comparer sur Ulixai (100-150 mots)

CONSIGNES :
- Longueur totale : {word_count} mots minimum
- Ton : Informatif, pratique, orienté décision
- Inclure des fourchettes de prix réalistes pour {country}
- Mentionner les pièges à éviter
- Format HTML avec H2 et H3

IMPORTANT : Encourager le lecteur à demander des devis gratuits sur Ulixai.
PROMPT,
                'template_variables' => ['title', 'country', 'country_in', 'service', 'word_count'],
            ],
            
            // ═══════════════════════════════════════════════════════════════
            // TEMPLATES LANDINGS - SOS-EXPAT
            // ═══════════════════════════════════════════════════════════════
            [
                'platform' => 'sos-expat',
                'type' => 'landing',
                'name' => 'Landing SOS-Expat Prestataire',
                'prompt' => <<<'PROMPT'
Tu es un copywriter expert en pages de conversion.

Crée une landing page pour :
**{title}**

CONTEXTE :
- Pays : {country}
- Type de prestataire : {provider_type}
- Plateforme : SOS-Expat
- Objectif : Inciter à prendre contact immédiatement

STRUCTURE :
1. HERO SECTION
   - Titre principal accrocheur
   - Sous-titre avec bénéfice clé
   - CTA primaire : "Parler à un expert maintenant"

2. PROBLÈMES RÉSOLUS (3-4 points)
   - Situations d'urgence typiques
   - Frustrations des expatriés

3. SOLUTION SOS-EXPAT (3-4 points)
   - Réponse en moins de 5 minutes
   - Experts francophones vérifiés
   - Disponibilité 24/7

4. COMMENT ÇA MARCHE (3 étapes)

5. TÉMOIGNAGE TYPE

6. CTA FINAL URGENT

CONSIGNES :
- Longueur : {word_count} mots maximum
- Ton : Urgent mais rassurant
- Phrases courtes et percutantes
- Format HTML optimisé conversion

IMPORTANT : Créer un sentiment d'urgence sans être anxiogène.
PROMPT,
                'template_variables' => ['title', 'country', 'provider_type', 'word_count'],
            ],
            
            // ═══════════════════════════════════════════════════════════════
            // TEMPLATES LANDINGS - ULIXAI
            // ═══════════════════════════════════════════════════════════════
            [
                'platform' => 'ulixai',
                'type' => 'landing',
                'name' => 'Landing Ulixai Service',
                'prompt' => <<<'PROMPT'
Tu es un copywriter expert en pages de conversion B2C.

Crée une landing page pour :
**{title}**

CONTEXTE :
- Pays : {country}
- Service : {service}
- Plateforme : Ulixai (marketplace)
- Objectif : Générer des demandes de devis

STRUCTURE :
1. HERO SECTION
   - Titre orienté bénéfice
   - Sous-titre avec promesse (ex: "Jusqu'à 5 devis gratuits")
   - CTA : "Comparer les offres"

2. AVANTAGES ULIXAI (4 points)
   - Prestataires vérifiés
   - Devis gratuits et sans engagement
   - Avis clients authentiques
   - Accompagnement personnalisé

3. SERVICES INCLUS (liste)

4. COMMENT ÇA MARCHE (3-4 étapes simples)

5. POURQUOI CHOISIR ULIXAI

6. FAQ (3-4 questions)

7. CTA FINAL

CONSIGNES :
- Longueur : {word_count} mots maximum
- Ton : Professionnel, rassurant, orienté valeur
- Mettre en avant la gratuité et la simplicité
- Format HTML

IMPORTANT : Focus sur la comparaison et les économies potentielles.
PROMPT,
                'template_variables' => ['title', 'country', 'service', 'word_count'],
            ],
            
            // ═══════════════════════════════════════════════════════════════
            // TEMPLATES FAQ
            // ═══════════════════════════════════════════════════════════════
            [
                'platform' => 'sos-expat',
                'type' => 'faq',
                'name' => 'FAQ SOS-Expat',
                'prompt' => <<<'PROMPT'
Génère {faq_count} questions-réponses FAQ pour l'article suivant :

TITRE : {title}
PAYS : {country}
THÈME : {theme}

CONSIGNES :
- Questions que se posent réellement les expatriés
- Réponses concises (50-100 mots chacune)
- Inclure des questions sur les démarches pratiques
- Inclure une question sur l'urgence/le délai
- Format JSON :
[
  {"question": "...", "answer": "..."},
  ...
]
PROMPT,
                'template_variables' => ['title', 'country', 'theme', 'faq_count'],
            ],
            
            [
                'platform' => 'ulixai',
                'type' => 'faq',
                'name' => 'FAQ Ulixai',
                'prompt' => <<<'PROMPT'
Génère {faq_count} questions-réponses FAQ pour l'article suivant :

TITRE : {title}
PAYS : {country}
SERVICE : {service}

CONSIGNES :
- Questions pratiques sur le service
- Réponses concises (50-100 mots chacune)
- Inclure une question sur les tarifs
- Inclure une question sur les délais
- Format JSON :
[
  {"question": "...", "answer": "..."},
  ...
]
PROMPT,
                'template_variables' => ['title', 'country', 'service', 'faq_count'],
            ],
            
            // ═══════════════════════════════════════════════════════════════
            // TEMPLATES META
            // ═══════════════════════════════════════════════════════════════
            [
                'platform' => 'sos-expat',
                'type' => 'meta',
                'name' => 'Meta SOS-Expat',
                'prompt' => <<<'PROMPT'
Génère les métadonnées SEO pour cet article :

TITRE : {title}
PAYS : {country}
EXTRAIT : {excerpt}

Retourne en JSON :
{
  "meta_title": "... (max 60 caractères, inclure le pays)",
  "meta_description": "... (max 155 caractères, inclure call-to-action)"
}

Le meta_title doit être accrocheur et inclure "{country}".
La meta_description doit inciter au clic et mentionner SOS-Expat.
PROMPT,
                'template_variables' => ['title', 'country', 'excerpt'],
            ],
            
            [
                'platform' => 'ulixai',
                'type' => 'meta',
                'name' => 'Meta Ulixai',
                'prompt' => <<<'PROMPT'
Génère les métadonnées SEO pour cet article :

TITRE : {title}
PAYS : {country}
EXTRAIT : {excerpt}

Retourne en JSON :
{
  "meta_title": "... (max 60 caractères, inclure le pays)",
  "meta_description": "... (max 155 caractères, inclure 'devis gratuit')"
}

Le meta_title doit être orienté comparaison/choix.
La meta_description doit mentionner les devis gratuits.
PROMPT,
                'template_variables' => ['title', 'country', 'excerpt'],
            ],
            
            // ═══════════════════════════════════════════════════════════════
            // TEMPLATES CTA
            // ═══════════════════════════════════════════════════════════════
            [
                'platform' => 'sos-expat',
                'type' => 'cta',
                'name' => 'CTA SOS-Expat',
                'prompt' => <<<'PROMPT'
Génère 3 variations de CTA (Call-to-Action) pour :

CONTEXTE : {context}
TYPE DE PRESTATAIRE : {provider_type}
PAYS : {country}

Retourne en JSON :
[
  {
    "text": "Texte du bouton (max 30 caractères)",
    "style": "primary|secondary|urgent",
    "position": "after_intro|mid_content|conclusion"
  },
  ...
]

Le CTA principal doit créer un sentiment d'urgence.
Les CTA secondaires peuvent être plus informatifs.
PROMPT,
                'template_variables' => ['context', 'provider_type', 'country'],
            ],
            
            [
                'platform' => 'ulixai',
                'type' => 'cta',
                'name' => 'CTA Ulixai',
                'prompt' => <<<'PROMPT'
Génère 3 variations de CTA (Call-to-Action) pour :

CONTEXTE : {context}
SERVICE : {service}
PAYS : {country}

Retourne en JSON :
[
  {
    "text": "Texte du bouton (max 30 caractères)",
    "style": "primary|secondary|compare",
    "position": "after_intro|mid_content|conclusion"
  },
  ...
]

Le CTA principal doit mettre en avant la gratuité/comparaison.
Utiliser des verbes d'action : Comparer, Obtenir, Découvrir.
PROMPT,
                'template_variables' => ['context', 'service', 'country'],
            ],
            
            // ═══════════════════════════════════════════════════════════════
            // TEMPLATES TRADUCTION
            // ═══════════════════════════════════════════════════════════════
            [
                'platform' => 'sos-expat',
                'type' => 'translation',
                'name' => 'Traduction Article',
                'prompt' => <<<'PROMPT'
Traduis le contenu suivant de {source_language} vers {target_language}.

CONTENU À TRADUIRE :
{content}

CONSIGNES :
- Conserver la structure HTML exacte
- Adapter les expressions idiomatiques à la culture cible
- Conserver le ton professionnel et rassurant
- NE PAS traduire les noms propres de pays/villes
- Traduire les noms de services/thèmes de manière naturelle

Retourne UNIQUEMENT le contenu traduit, sans commentaire.
PROMPT,
                'template_variables' => ['source_language', 'target_language', 'content'],
            ],
            
            [
                'platform' => 'ulixai',
                'type' => 'translation',
                'name' => 'Traduction Article',
                'prompt' => <<<'PROMPT'
Traduis le contenu suivant de {source_language} vers {target_language}.

CONTENU À TRADUIRE :
{content}

CONSIGNES :
- Conserver la structure HTML exacte
- Adapter les expressions idiomatiques à la culture cible
- Conserver le ton informatif et orienté conversion
- NE PAS traduire les noms propres de pays/villes
- Adapter les devises si mentionnées (ex: € vers $ si pertinent)

Retourne UNIQUEMENT le contenu traduit, sans commentaire.
PROMPT,
                'template_variables' => ['source_language', 'target_language', 'content'],
            ],
        ];

        echo "🌱 Insertion des templates de génération de contenu...\n";
        
        $totalInserted = 0;

        foreach ($templates as $tpl) {
            if (!isset($platforms[$tpl['platform']])) {
                echo "⚠️  Plateforme '{$tpl['platform']}' introuvable, passage au suivant...\n";
                continue;
            }
            
            Template::create([
                'platform_id' => $platforms[$tpl['platform']],
                'type' => $tpl['type'],
                'name' => $tpl['name'],
                'prompt' => $tpl['prompt'],
                'template_variables' => json_encode($tpl['template_variables']),
                'is_active' => true,
            ]);
            $totalInserted++;
        }

        echo "✅ $totalInserted templates insérés avec succès\n";
    }
}