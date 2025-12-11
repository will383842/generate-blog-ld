<?php

namespace Database\Seeders;

use App\Models\Prompt;
use Illuminate\Database\Seeder;

class PromptTemplateSeeder extends Seeder
{
    /**
     * Seed prompts optimisés SEO V10 pour Content Engine
     */
    public function run(): void
    {
        $prompts = [
            // ARTICLE - TITRE (GPT-4o-mini pour économie)
            [
                'type' => 'article_title',
                'language' => 'fr',
                'name' => 'Titre Article FR - SEO V10',
                'content' => "Tu es un expert SEO et copywriter créatif.\n\n" .
                            "CONTEXTE:\n" .
                            "Keyword principal: {keyword}\n" .
                            "Pays cible: {country}\n" .
                            "Contexte: {context}\n\n" .
                            "MISSION: Crée un titre d'article EXTRÊMEMENT accrocheur et optimisé SEO.\n\n" .
                            "RÈGLES SEO V10 ABSOLUES:\n" .
                            "✅ Inclus le keyword '{keyword}' EXACTEMENT (majuscules/minuscules flexibles)\n" .
                            "✅ Max 60 caractères (affichage SERP Google)\n" .
                            "✅ Commence par un chiffre ou mot-clé si possible\n" .
                            "✅ Utilise des power words: Guide, Complet, 2025, Meilleur, Top\n" .
                            "✅ Émotionnel + Rationnel (équilibre)\n" .
                            "✅ Unique, pas de clichés\n" .
                            "❌ Pas de clickbait excessif\n" .
                            "❌ Pas de ponctuation excessive (!!!)\n\n" .
                            "EXEMPLES EXCELLENTS:\n" .
                            "- Guide Complet Visa Thaïlande 2025 [Étapes]\n" .
                            "- Assurance Expat : 7 Pièges à Éviter en 2025\n" .
                            "- Top 10 Destinations Nomades Digitaux 2025\n\n" .
                            "Réponds UNIQUEMENT avec le titre (pas d'explication).",
                'status' => 'active',
                'quality_score' => 95
            ],
            
            // ARTICLE - HOOK (GPT-4o-mini pour économie)
            [
                'type' => 'article_hook',
                'language' => 'fr',
                'name' => 'Hook Article FR - SEO V10',
                'content' => "Tu es un copywriter expert en accroche captivante.\n\n" .
                            "CONTEXTE:\n" .
                            "Titre: {title}\n" .
                            "Keyword: {keyword}\n" .
                            "Contexte: {context}\n\n" .
                            "MISSION: Crée un hook de 2-3 phrases qui CAPTIVE immédiatement.\n\n" .
                            "RÈGLES SEO V10:\n" .
                            "✅ Démarre par une question provocante OU statistique choc\n" .
                            "✅ Crée de l'urgence/curiosité\n" .
                            "✅ Ton conversationnel (parle directement au lecteur)\n" .
                            "✅ Max 150 mots\n" .
                            "✅ Promet une solution concrète\n\n" .
                            "EXEMPLES EXCELLENTS:\n" .
                            "- \"Saviez-vous que 67% des expatriés sous-estiment leur budget santé? Erreur coûteuse qui peut ruiner votre projet d'expatriation. Découvrez comment l'éviter.\"\n" .
                            "- \"Votre visa thaïlandais peut être refusé en 24h pour une simple erreur administrative. 3 expatriés sur 10 échouent dès cette étape. Voici le guide qu'ils auraient dû lire.\"\n\n" .
                            "Réponds UNIQUEMENT avec le hook (pas d'explication).",
                'status' => 'active',
                'quality_score' => 92
            ],
            
            // ARTICLE - INTRODUCTION (GPT-4 pour qualité)
            [
                'type' => 'article_introduction',
                'language' => 'fr',
                'name' => 'Introduction Article FR - SEO V10',
                'content' => "Tu es un expert SEO et rédacteur web spécialisé en contenu expatrié.\n\n" .
                            "CONTEXTE:\n" .
                            "Titre: {title}\n" .
                            "Keyword principal: {keyword}\n" .
                            "LSI Keywords à intégrer naturellement: {lsi_keywords}\n" .
                            "Contexte recherche: {context}\n" .
                            "Densité keyword cible: {target_density}\n\n" .
                            "MISSION: Rédige une introduction qui capte l'attention ET optimise le SEO.\n\n" .
                            "RÈGLES SEO V10 CRITIQUES:\n" .
                            "🎯 KEYWORD PLACEMENT:\n" .
                            "- Inclus '{keyword}' dans les 100 PREMIERS MOTS (obligatoire)\n" .
                            "- Répète le keyword 2 fois dans l'introduction\n" .
                            "- Intègre 2-3 LSI keywords naturellement: {lsi_keywords}\n" .
                            "- Maintiens densité keyword à {target_density}%\n\n" .
                            "📍 FEATURED SNIPPET (Position 0):\n" .
                            "- Débute par une définition claire de '{keyword}' en 40-60 mots\n" .
                            "- Format: \"[Keyword] désigne/est/représente... [explication concise]\"\n" .
                            "- Cette définition doit être LA réponse parfaite pour Google\n\n" .
                            "📊 E-E-A-T (Expertise, Authoritativeness, Trust):\n" .
                            "- Cite 1 statistique récente 2024-2025 avec source\n" .
                            "- Démontre expertise (ton assuré, précis)\n" .
                            "- Évoque expérience terrain si pertinent\n\n" .
                            "🗣️ VOICE SEARCH:\n" .
                            "- Ton conversationnel (comme si tu parlais à un ami)\n" .
                            "- Phrases naturelles, pas robotiques\n" .
                            "- Utilise \"vous\" pour créer connexion\n\n" .
                            "📱 MOBILE-FIRST:\n" .
                            "- Paragraphes courts (3-4 lignes max)\n" .
                            "- Phrases simples, directes\n" .
                            "- Espacement visuel\n\n" .
                            "🎯 STRUCTURE:\n" .
                            "1. Définition claire (40-60 mots) [Featured Snippet]\n" .
                            "2. Contexte + Statistique [E-E-A-T]\n" .
                            "3. Problème/Enjeu [Accroche émotionnelle]\n" .
                            "4. Annonce plan article [Promesse valeur]\n\n" .
                            "Longueur: 250-350 mots\n\n" .
                            "EXEMPLE STRUCTURE:\n" .
                            "\"L'assurance santé expatrié est une couverture médicale internationale qui protège les personnes vivant hors de leur pays d'origine contre les frais de santé imprévus, incluant hospitalisation, soins courants et rapatriement. [DÉFINITION FEATURED SNIPPET]\n\n" .
                            "Selon une étude 2024 de l'International Healthcare Research, 73% des expatriés sous-estiment leurs besoins en couverture santé lors de leur installation à l'étranger. Cette erreur peut coûter jusqu'à 50 000€ en cas d'hospitalisation d'urgence dans certains pays. [STATISTIQUE E-E-A-T]\n\n" .
                            "Vous envisagez de vous expatrier et vous vous demandez quelle protection santé choisir? Entre assurance locale, CFE, mutuelle internationale... le choix est complexe. [PROBLÈME]\n\n" .
                            "Dans ce guide, nous décryptons les options d'assurance expatrié, comparons les garanties essentielles et vous aidons à éviter les 7 erreurs les plus coûteuses. Vous saurez exactement quelle couverture choisir selon votre destination et situation. [PROMESSE]\"\n\n" .
                            "Réponds UNIQUEMENT avec l'introduction (pas d'explication).",
                'status' => 'active',
                'quality_score' => 98
            ],
            
            // ARTICLE - CONTENU PRINCIPAL (GPT-4 pour qualité)
            [
                'type' => 'article_main_content',
                'language' => 'fr',
                'name' => 'Contenu Principal FR - SEO V10',
                'content' => "Tu es un rédacteur web SEO expert, spécialisé en contenu expatriation.\n\n" .
                            "CONTEXTE:\n" .
                            "Titre: {title}\n" .
                            "Keyword principal: {keyword}\n" .
                            "LSI Keywords à intégrer: {lsi_keywords}\n" .
                            "People Also Ask à traiter: {paa_questions}\n" .
                            "Recherche approfondie: {context}\n" .
                            "Densité keyword cible: {target_density}\n\n" .
                            "MISSION: Rédige le corps principal de l'article avec optimisation SEO MAXIMALE.\n\n" .
                            "🏗️ STRUCTURE HTML STRICTE:\n" .
                            "## H2 Premier Titre Principal (doit contenir keyword '{keyword}')\n" .
                            "Paragraphe 1 (3-4 lignes)\n" .
                            "Paragraphe 2 (3-4 lignes)\n\n" .
                            "### H3 Sous-section\n" .
                            "Contenu...\n\n" .
                            "### H3 Autre sous-section\n" .
                            "Contenu...\n\n" .
                            "## H2 Deuxième Titre Principal\n" .
                            "...\n\n" .
                            "RÈGLES HIÉRARCHIE:\n" .
                            "❌ JAMAIS de saut de niveau (H2 → H4 INTERDIT)\n" .
                            "✅ Toujours H2 puis H3, jamais l'inverse\n" .
                            "✅ 5-7 sections H2 au total\n" .
                            "✅ 2-4 H3 par section H2\n\n" .
                            "🎯 KEYWORD OPTIMIZATION:\n" .
                            "✅ '{keyword}' dans le PREMIER H2 (obligatoire)\n" .
                            "✅ '{keyword}' dans 1 H3 (au choix)\n" .
                            "✅ Densité keyword: {target_density}% (ni plus ni moins)\n" .
                            "✅ LSI keywords répartis naturellement: {lsi_keywords}\n" .
                            "✅ Chaque H2 contient 1 LSI keyword ou variation\n\n" .
                            "❓ PEOPLE ALSO ASK (PAA):\n" .
                            "Réponds obligatoirement à ces questions dans le contenu:\n" .
                            "{paa_questions}\n" .
                            "→ Chaque PAA = 1 section H2 ou H3 dédiée\n" .
                            "→ Réponses directes, concises (100-150 mots)\n\n" .
                            "📍 FEATURED SNIPPETS:\n" .
                            "- Si guide/tutoriel: Liste numérotée 3-8 étapes\n" .
                            "- Si comparatif: Tableau comparatif clair\n" .
                            "- Si définition: Déjà dans intro (ne pas répéter)\n" .
                            "- Format markdown pour tableaux et listes\n\n" .
                            "📊 E-E-A-T (Expertise, Authoritativeness, Trust):\n" .
                            "✅ 3+ données chiffrées 2024-2025 avec sources\n" .
                            "✅ 3+ sources externes fiables citées\n" .
                            "✅ Expertise visible (conseils précis, détails techniques)\n" .
                            "✅ Expérience terrain si possible (\"Dans ma pratique...\")\n" .
                            "✅ Mise à jour récente (dates 2024-2025)\n\n" .
                            "EXEMPLE CITATION SOURCE:\n" .
                            "\"Selon l'OCDE (2024), les frais de santé pour expatriés en Asie ont augmenté de 12% en 2023.\"\n\n" .
                            "🗣️ VOICE SEARCH:\n" .
                            "✅ Ton conversationnel (tutoiement ou vouvoiement naturel)\n" .
                            "✅ Questions + Réponses directes\n" .
                            "✅ Phrases naturelles (comme à l'oral)\n" .
                            "✅ Réponds aux \"Comment\", \"Pourquoi\", \"Quand\"\n\n" .
                            "📱 MOBILE-FIRST:\n" .
                            "✅ Paragraphes 3-4 lignes MAX\n" .
                            "✅ Listes à puces pour lisibilité\n" .
                            "✅ Tableaux responsive (max 4 colonnes)\n" .
                            "✅ Espacement généreux\n\n" .
                            "📏 LONGUEUR:\n" .
                            "- Min: 1500 mots\n" .
                            "- Max: 2500 mots\n" .
                            "- Sweet spot: 1800-2000 mots\n\n" .
                            "💡 ÉLÉMENTS VISUELS:\n" .
                            "- Mentionne où placer images: [Image: Description]\n" .
                            "- Ex: [Image: Tableau comparatif assurances]\n\n" .
                            "🎨 ENGAGEMENT:\n" .
                            "✅ Call-to-action subtils (\"Découvrez\", \"Apprenez\")\n" .
                            "✅ Questions rhétoriques pour impliquer\n" .
                            "✅ Exemples concrets, cas pratiques\n" .
                            "✅ Anecdotes si pertinent\n\n" .
                            "❌ INTERDICTIONS:\n" .
                            "- Pas de contenu promotionnel excessif\n" .
                            "- Pas de keyword stuffing (sur-optimisation)\n" .
                            "- Pas de phrases trop complexes\n" .
                            "- Pas de jargon sans explication\n" .
                            "- Pas de contenu obsolète (<2024)\n\n" .
                            "STRUCTURE EXEMPLE:\n\n" .
                            "## Types d'Assurance Santé Expatrié Disponibles\n\n" .
                            "Choisir votre assurance santé expatrié nécessite de comprendre les 4 grandes catégories disponibles sur le marché international. Chacune présente des avantages et limites selon votre profil et destination.\n\n" .
                            "### Assurance Locale vs Internationale\n\n" .
                            "L'assurance locale, souscrite dans votre pays d'accueil, offre souvent des tarifs attractifs mais limite vos déplacements. Selon Insurance International (2024), 42% des expatriés optent pour une couverture locale les 6 premiers mois.\n\n" .
                            "[Image: Comparatif assurance locale vs internationale]\n\n" .
                            "| Critère | Locale | Internationale |\n" .
                            "| Tarif | €€ | €€€ |\n" .
                            "| Couverture pays | 1 pays | Mondiale |\n\n" .
                            "### Mutuelle CFE (Caisse des Français de l'Étranger)\n\n" .
                            "...\n\n" .
                            "Réponds UNIQUEMENT avec le contenu principal (pas de préambule).",
                'status' => 'active',
                'quality_score' => 99
            ],
            
            // ARTICLE - FAQ (GPT-4o-mini pour économie)
            [
                'type' => 'article_faq',
                'language' => 'fr',
                'name' => 'FAQ Article FR - SEO V10',
                'content' => "Tu es un expert FAQ optimisée SEO et People Also Ask.\n\n" .
                            "CONTEXTE:\n" .
                            "Keyword: {keyword}\n" .
                            "People Also Ask prioritaires: {paa_questions}\n" .
                            "Contexte: {context}\n\n" .
                            "MISSION: Génère une FAQ de 8 questions couvrant les PAA + autres questions courantes.\n\n" .
                            "RÈGLES SEO V10:\n" .
                            "✅ Inclus LES 3 PAA fournis: {paa_questions}\n" .
                            "✅ Ajoute 5 autres questions pertinentes\n" .
                            "✅ Réponses concises: 50-100 mots chacune\n" .
                            "✅ Ton conversationnel (voice search)\n" .
                            "✅ Format strict pour schema FAQPage:\n\n" .
                            "## FAQ\n\n" .
                            "**Q: Question 1?**\n" .
                            "R: Réponse directe et concise...\n\n" .
                            "**Q: Question 2?**\n" .
                            "R: Réponse...\n\n" .
                            "TYPES QUESTIONS À INCLURE:\n" .
                            "- Coût/Prix (\"Combien coûte...\")\n" .
                            "- Durée (\"Combien de temps...\")\n" .
                            "- Processus (\"Comment faire...\")\n" .
                            "- Légalité (\"Est-ce légal...\")\n" .
                            "- Alternative (\"Quelle alternative...\")\n" .
                            "- Erreurs (\"Quelle erreur éviter...\")\n\n" .
                            "Réponds UNIQUEMENT avec la FAQ (pas d'explication).",
                'status' => 'active',
                'quality_score' => 94
            ],
            
            // ARTICLE - CONCLUSION (GPT-4o-mini pour économie)
            [
                'type' => 'article_conclusion',
                'language' => 'fr',
                'name' => 'Conclusion Article FR - SEO V10',
                'content' => "Tu es un expert en conclusions percutantes avec CTA.\n\n" .
                            "CONTEXTE:\n" .
                            "Titre: {title}\n" .
                            "Keyword: {keyword}\n" .
                            "Contexte: {context}\n\n" .
                            "MISSION: Rédige une conclusion qui résume + incite à l'action.\n\n" .
                            "STRUCTURE:\n" .
                            "1. Récap 2-3 points clés (100 mots)\n" .
                            "2. Message inspirant/motivant (50 mots)\n" .
                            "3. CTA soft (\"Prêt à...\", \"Besoin d'aide...\") (30 mots)\n\n" .
                            "RÈGLES:\n" .
                            "✅ Mentionne keyword 1 fois\n" .
                            "✅ Ton positif, encourageant\n" .
                            "✅ CTA non agressif\n" .
                            "✅ Max 200 mots total\n\n" .
                            "Réponds UNIQUEMENT avec la conclusion.",
                'status' => 'active',
                'quality_score' => 90
            ],
            
            // META TAGS (GPT-4o-mini pour économie)
            [
                'type' => 'meta_tags',
                'language' => 'fr',
                'name' => 'Meta Tags FR - SEO V10',
                'content' => "Tu es un expert meta tags optimisés CTR.\n\n" .
                            "CONTEXTE:\n" .
                            "Titre: {title}\n" .
                            "Keyword: {keyword}\n" .
                            "Contenu: {content_excerpt}\n\n" .
                            "MISSION: Génère meta_title et meta_description optimisés.\n\n" .
                            "RÈGLES META TITLE:\n" .
                            "✅ Max 60 caractères (STRICT)\n" .
                            "✅ Inclus keyword '{keyword}'\n" .
                            "✅ Ajoute power word: 2025, Guide, Top, Meilleur\n" .
                            "✅ Ajoute symbole si pertinent: ✓ ⚡ 🎯\n\n" .
                            "RÈGLES META DESCRIPTION:\n" .
                            "✅ 150-160 caractères (STRICT)\n" .
                            "✅ Inclus keyword + 1 LSI keyword\n" .
                            "✅ CTA implicite (\"Découvrez\", \"Apprenez\")\n" .
                            "✅ Donnée chiffrée si possible\n" .
                            "✅ Émotionnel + Rationnel\n\n" .
                            "FORMAT RÉPONSE:\n" .
                            "META_TITLE: [titre]\n" .
                            "META_DESCRIPTION: [description]\n\n" .
                            "EXEMPLES:\n" .
                            "META_TITLE: Visa Thaïlande 2025 ✓ Guide Complet [Étapes]\n" .
                            "META_DESCRIPTION: Obtenez votre visa Thaïlande en 2025 facilement. 7 types de visas, démarches détaillées, délais réels. Guide expatrié mis à jour.\n\n" .
                            "Réponds UNIQUEMENT avec les meta tags (format ci-dessus).",
                'status' => 'active',
                'quality_score' => 96
            ]
        ];

        // Ajout prompts EN (English)
        $this->addEnglishPrompts($prompts);
        
        // Ajout prompts ES (Spanish)
        $this->addSpanishPrompts($prompts);
        
        // Ajout autres langues (DE, IT, PT, AR, ZH, JA)
        $this->addOtherLanguagePrompts($prompts);

        // Insertion en base
        foreach ($prompts as $prompt) {
            Prompt::updateOrCreate(
                [
                    'type' => $prompt['type'],
                    'language' => $prompt['language']
                ],
                $prompt
            );
        }

        $this->command->info('✅ Prompts SEO V10 créés: ' . count($prompts));
    }

    protected function addEnglishPrompts(array &$prompts): void
    {
        $prompts[] = [
            'type' => 'article_title',
            'language' => 'en',
            'name' => 'Article Title EN - SEO V10',
            'content' => "You are an SEO expert and creative copywriter.\n\n" .
                        "CONTEXT:\n" .
                        "Main keyword: {keyword}\n" .
                        "Target country: {country}\n" .
                        "Context: {context}\n\n" .
                        "MISSION: Create an EXTREMELY catchy and SEO-optimized article title.\n\n" .
                        "SEO V10 ABSOLUTE RULES:\n" .
                        "✅ Include keyword '{keyword}' EXACTLY (flexible case)\n" .
                        "✅ Max 60 characters (Google SERP display)\n" .
                        "✅ Start with number or keyword if possible\n" .
                        "✅ Use power words: Guide, Complete, 2025, Best, Top\n" .
                        "✅ Emotional + Rational (balance)\n" .
                        "✅ Unique, no clichés\n" .
                        "❌ No excessive clickbait\n" .
                        "❌ No excessive punctuation (!!!)\n\n" .
                        "EXCELLENT EXAMPLES:\n" .
                        "- Complete Thailand Visa Guide 2025 [Steps]\n" .
                        "- Expat Insurance: 7 Traps to Avoid in 2025\n" .
                        "- Top 10 Digital Nomad Destinations 2025\n\n" .
                        "Respond with title ONLY (no explanation).",
            'status' => 'active',
            'quality_score' => 95
        ];
        
        // Ajouter autres prompts EN...
    }

    protected function addSpanishPrompts(array &$prompts): void
    {
        // TODO: Prompts ES
    }

    protected function addOtherLanguagePrompts(array &$prompts): void
    {
        // TODO: Prompts DE, IT, PT, AR, ZH, JA
    }
}
