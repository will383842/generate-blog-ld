<?php

namespace App\Services\Content;

use App\Models\Article;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * KeywordIntegrationService - Intégration NATURELLE des mots-clés
 * 
 * ⚠️ PHILOSOPHIE : PAS DE KEYWORD STUFFING
 * 
 * Les mots-clés doivent être intégrés dans des PHRASES COMPLÈTES et NATURELLES :
 * ❌ MAUVAIS : "déménagement international thailande déménageur"
 * ✅ BON : "Vous prévoyez un déménagement international vers la Thaïlande ? 
 *           Notre équipe de déménageurs spécialisés vous accompagne..."
 * 
 * Méthodes principales :
 * - selectPrimaryKeyword() : Choix intelligent du keyword principal
 * - generateSeoTitle() : Title avec keyword intégré naturellement
 * - generateNaturalH1() : H1 sous forme de question ou affirmation naturelle
 * - generateNaturalIntro() : Paragraphe d'intro fluide avec keyword
 * - buildNaturalSentence() : Construction de phrases contextuelles
 */
class KeywordIntegrationService
{
    /**
     * Sélectionner le mot-clé principal optimal
     */
    public function selectPrimaryKeyword(array $context): ?array
    {
        $platformId = $context['platform']->id ?? null;
        $countryId = $context['country_id'] ?? $context['country']->id ?? null;
        $languageCode = $context['language']->code ?? $context['language_code'] ?? 'fr';

        if (!$platformId || !$countryId) {
            return null;
        }

        // Sélectionner le meilleur keyword selon :
        // 1. Platform match
        // 2. Priorité haute
        // 3. Peu utilisé récemment
        // 4. Volume de recherche élevé
        $keyword = DB::table('keyword_combinations')
            ->where('platform_id', $platformId)
            ->where('country_id', $countryId)
            ->where('language_code', $languageCode)
            ->where(function($q) {
                $q->where('usage_count', '<', 100)
                  ->orWhere('last_used_at', '<', now()->subDays(30))
                  ->orWhereNull('last_used_at');
            })
            ->orderByRaw('(priority_score * 0.6 + search_volume * 0.4) DESC')
            ->orderBy('usage_count', 'asc')
            ->first();

        if (!$keyword) {
            Log::warning('KeywordIntegrationService: Aucun keyword trouvé', $context);
            return null;
        }

        return [
            'id' => $keyword->id,
            'keyword' => $keyword->keyword_text,
            'normalized' => $keyword->keyword_normalized,
            'intent' => $keyword->intent_type,
            'priority' => $keyword->priority_score,
        ];
    }

    /**
     * ✅ Générer un titre SEO NATUREL avec le keyword
     * 
     * Exemples naturels :
     * - "Déménagement International en Thaïlande : Guide Complet 2025"
     * - "Comment Réussir Votre Déménagement International vers la Thaïlande"
     * - "Traduction Certifiée en Espagne : Tout ce qu'il Faut Savoir"
     */
    public function generateSeoTitle(array $context): string
    {
        $primaryKeyword = $context['primary_keyword'] ?? null;
        $languageCode = $context['language']->code ?? 'fr';
        $platformName = $context['platform']->name ?? 'Guide';

        if (!$primaryKeyword) {
            return $this->generateFallbackTitle($context);
        }

        // Chercher un template SEO
        $template = DB::table('keyword_seo_templates')
            ->where('language_code', $languageCode)
            ->where('template_type', 'title')
            ->where(function($q) use ($context) {
                $q->where('platform_id', $context['platform']->id ?? null)
                  ->orWhereNull('platform_id');
            })
            ->where('is_active', true)
            ->orderBy('priority', 'desc')
            ->first();

        if ($template) {
            $title = $this->fillTemplate($template->template, $context);
        } else {
            // Construction naturelle du titre
            $keyword = ucfirst($primaryKeyword['keyword']);
            $year = date('Y');
            
            // Patterns naturels selon la langue
            $patterns = [
                'fr' => [
                    "{$keyword} : Guide Complet {$year}",
                    "{$keyword} - Tout Savoir | {$platformName}",
                    "Guide Pratique : {$keyword}",
                ],
                'en' => [
                    "{$keyword}: Complete Guide {$year}",
                    "{$keyword} - Everything You Need to Know",
                    "Practical Guide: {$keyword}",
                ],
            ];
            
            $langPatterns = $patterns[$languageCode] ?? $patterns['en'];
            $title = $langPatterns[array_rand($langPatterns)];
        }

        // Vérifier présence keyword (sécurité)
        if (stripos($title, $primaryKeyword['keyword']) === false) {
            $title = ucfirst($primaryKeyword['keyword']) . " - " . $title;
        }

        // Limiter à 60 caractères
        if (mb_strlen($title) > 60) {
            $title = mb_substr($title, 0, 57) . '...';
        }

        return $title;
    }

    /**
     * ✅ Générer un H1 NATUREL sous forme de question ou affirmation
     * 
     * Exemples :
     * - "Comment Réussir Votre Déménagement International en Thaïlande ?"
     * - "Déménagement International en Thaïlande : Le Guide Complet"
     * - "Tout Savoir sur la Traduction Certifiée en Espagne"
     */
    public function generateNaturalH1(array $context): string
    {
        $primaryKeyword = $context['primary_keyword'] ?? null;
        $languageCode = $context['language']->code ?? 'fr';

        if (!$primaryKeyword) {
            return ucfirst($context['theme']->name ?? 'Guide Complet');
        }

        $keyword = $primaryKeyword['keyword'];
        
        // Patterns naturels de H1 par langue
        $patterns = [
            'fr' => [
                "Comment Réussir Votre " . ucfirst($keyword) . " ?",
                ucfirst($keyword) . " : Le Guide Complet",
                "Tout Savoir sur " . ucfirst($keyword),
                ucfirst($keyword) . " : Conseils d'Experts",
            ],
            'en' => [
                "How to Succeed with " . ucfirst($keyword),
                ucfirst($keyword) . ": The Complete Guide",
                "Everything About " . ucfirst($keyword),
                ucfirst($keyword) . ": Expert Advice",
            ],
            'de' => [
                ucfirst($keyword) . ": Der vollständige Leitfaden",
                "Alles über " . ucfirst($keyword),
            ],
            'es' => [
                ucfirst($keyword) . ": La Guía Completa",
                "Todo sobre " . ucfirst($keyword),
            ],
        ];

        $langPatterns = $patterns[$languageCode] ?? [$keyword];
        return $langPatterns[array_rand($langPatterns)];
    }

    /**
     * ✅ Générer une meta description NATURELLE avec keyword
     * 
     * Exemple naturel :
     * "Vous envisagez un déménagement international en Thaïlande ? 
     *  Découvrez notre guide complet avec conseils pratiques, démarches 
     *  administratives et recommandations d'experts."
     */
    public function generateMetaDescription(array $context): string
    {
        $primaryKeyword = $context['primary_keyword'] ?? null;
        $languageCode = $context['language']->code ?? 'fr';

        if (!$primaryKeyword) {
            return $this->generateFallbackMetaDescription($context);
        }

        // Chercher template
        $template = DB::table('keyword_seo_templates')
            ->where('language_code', $languageCode)
            ->where('template_type', 'meta_description')
            ->where(function($q) use ($context) {
                $q->where('platform_id', $context['platform']->id ?? null)
                  ->orWhereNull('platform_id');
            })
            ->where('is_active', true)
            ->first();

        if ($template) {
            $description = $this->fillTemplate($template->template, $context);
        } else {
            // Construction naturelle
            $keyword = $primaryKeyword['keyword'];
            $platform = $context['platform']->name ?? 'Notre plateforme';
            
            $descriptions = [
                'fr' => "Vous envisagez {$keyword} ? Découvrez notre guide complet avec conseils pratiques, démarches administratives et recommandations d'experts. {$platform} vous accompagne.",
                'en' => "Planning {$keyword}? Discover our complete guide with practical advice, administrative procedures and expert recommendations. {$platform} supports you.",
            ];
            
            $description = $descriptions[$languageCode] ?? $descriptions['fr'];
        }

        // Vérifier présence keyword
        if (stripos($description, $primaryKeyword['keyword']) === false) {
            $description = ucfirst($primaryKeyword['keyword']) . " - " . $description;
        }

        // Limiter à 160 caractères
        if (mb_strlen($description) > 160) {
            $description = mb_substr($description, 0, 157) . '...';
        }

        return $description;
    }

    /**
     * ✨ COEUR DU SYSTÈME : Générer un paragraphe d'introduction NATUREL
     * 
     * Le keyword DOIT apparaître dans une phrase fluide et contextuelle.
     * 
     * Exemple de sortie :
     * "Vous prévoyez un déménagement international en Thaïlande ? Cette décision 
     *  importante nécessite une préparation minutieuse. Notre équipe d'experts 
     *  vous accompagne à chaque étape pour garantir un déménagement serein et 
     *  réussi. Découvrez nos conseils pratiques et nos recommandations pour 
     *  organiser au mieux votre projet."
     */
    public function generateNaturalIntro(array $context): string
    {
        $primaryKeyword = $context['primary_keyword'] ?? null;
        $languageCode = $context['language']->code ?? 'fr';

        if (!$primaryKeyword) {
            return '';
        }

        // Récupérer une phrase naturelle d'ouverture
        $openingPhrase = DB::table('keyword_natural_phrases')
            ->where('language_code', $languageCode)
            ->where('phrase_type', 'opening')
            ->where('is_active', true)
            ->inRandomOrder()
            ->first();

        if ($openingPhrase) {
            $intro = str_replace('{keyword}', $primaryKeyword['keyword'], $openingPhrase->template);
        } else {
            // Fallback : construction manuelle
            $keyword = $primaryKeyword['keyword'];
            $platform = $context['platform']->name ?? 'Notre plateforme';
            
            $intros = [
                'fr' => "Vous envisagez {$keyword} ? Cette démarche importante nécessite une préparation minutieuse. {$platform} vous accompagne avec des conseils d'experts et un accompagnement personnalisé. Découvrez tout ce qu'il faut savoir pour réussir votre projet.",
                'en' => "Planning {$keyword}? This important step requires careful preparation. {$platform} supports you with expert advice and personalized guidance. Discover everything you need to know to succeed.",
            ];
            
            $intro = $intros[$languageCode] ?? $intros['fr'];
        }

        return $intro;
    }

    /**
     * Construire une phrase naturelle avec le keyword
     * 
     * Utilisé pour insérer le keyword dans le contenu de manière fluide
     */
    public function buildNaturalSentence(string $keyword, string $context, string $languageCode = 'fr'): string
    {
        // Récupérer des phrases de transition
        $phrase = DB::table('keyword_natural_phrases')
            ->where('language_code', $languageCode)
            ->where('phrase_type', 'transition')
            ->where('is_active', true)
            ->inRandomOrder()
            ->first();

        if ($phrase) {
            return str_replace('{keyword}', $keyword, $phrase->template);
        }

        // Fallback
        $templates = [
            'fr' => "Concernant {$keyword}, il est important de noter plusieurs points essentiels.",
            'en' => "Regarding {$keyword}, it's important to note several key points.",
        ];

        $template = $templates[$languageCode] ?? $templates['fr'];
        return str_replace('{keyword}', $keyword, $template);
    }

    /**
     * Générer un slug SEO avec le keyword
     */
    public function generateSeoSlug(array $context): string
    {
        $primaryKeyword = $context['primary_keyword'] ?? null;

        if (!$primaryKeyword) {
            return Str::slug($context['title'] ?? uniqid());
        }

        $slug = Str::slug($primaryKeyword['keyword']);

        // Vérifier unicité
        $platformId = $context['platform']->id ?? 1;
        $languageId = $context['language']->id ?? 1;

        return Article::generateUniqueSlug($slug, $platformId, $languageId);
    }

    /**
     * Marquer un keyword comme utilisé
     */
    public function markKeywordAsUsed(int $keywordId): void
    {
        DB::table('keyword_combinations')
            ->where('id', $keywordId)
            ->increment('usage_count', 1, [
                'last_used_at' => now()
            ]);
    }

    /**
     * Lier l'article au keyword principal
     */
    public function linkArticleKeyword(Article $article, array $primaryKeyword): void
    {
        // Mettre à jour l'article
        $article->primary_keyword_id = $primaryKeyword['id'];
        $article->save();

        // Calculer la densité
        $density = $this->calculateKeywordDensity($article->content, $primaryKeyword['keyword']);

        // Vérifier les positions
        $positions = [
            'title' => stripos($article->title, $primaryKeyword['keyword']) !== false,
            'slug' => stripos($article->slug, $primaryKeyword['normalized']) !== false,
            'meta_title' => stripos($article->meta_title, $primaryKeyword['keyword']) !== false,
            'meta_description' => stripos($article->meta_description, $primaryKeyword['keyword']) !== false,
            'h1' => $this->checkH1Contains($article->content, $primaryKeyword['keyword']),
            'intro' => $this->checkIntroContains($article->content, $primaryKeyword['keyword']),
        ];

        // Créer la liaison
        DB::table('article_keywords')->insert([
            'article_id' => $article->id,
            'keyword_id' => $primaryKeyword['id'],
            'is_primary' => true,
            'density' => $density,
            'positions' => json_encode($positions),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Marquer comme utilisé
        $this->markKeywordAsUsed($primaryKeyword['id']);

        // Log pour validation SEO
        $allPositions = array_filter($positions);
        Log::info('KeywordIntegrationService: Article lié', [
            'article_id' => $article->id,
            'keyword' => $primaryKeyword['keyword'],
            'density' => $density . '%',
            'positions_ok' => count($allPositions) . '/6',
        ]);
    }

    /**
     * Calculer la densité du keyword (%) 
     */
    private function calculateKeywordDensity(string $content, string $keyword): float
    {
        $text = strip_tags($content);
        $wordCount = str_word_count($text);

        if ($wordCount === 0) {
            return 0;
        }

        $keywordCount = substr_count(mb_strtolower($text), mb_strtolower($keyword));
        return round(($keywordCount / $wordCount) * 100, 2);
    }

    /**
     * Vérifier si le H1 contient le keyword
     */
    private function checkH1Contains(string $content, string $keyword): bool
    {
        preg_match('/<h1[^>]*>(.*?)<\/h1>/is', $content, $matches);
        if (empty($matches[1])) {
            return false;
        }
        return stripos($matches[1], $keyword) !== false;
    }

    /**
     * Vérifier si l'intro (300 premiers caractères) contient le keyword
     */
    private function checkIntroContains(string $content, string $keyword): bool
    {
        $intro = substr(strip_tags($content), 0, 300);
        return stripos($intro, $keyword) !== false;
    }

    /**
     * Remplir un template
     */
    private function fillTemplate(string $template, array $context): string
    {
        $keyword = $context['primary_keyword']['keyword'] ?? '';
        $country = $context['country']->name ?? '';
        $platform = $context['platform']->name ?? '';
        $year = date('Y');

        $variables = compact('keyword', 'country', 'platform', 'year');

        $result = $template;
        foreach ($variables as $key => $value) {
            $result = str_replace('{' . $key . '}', $value, $result);
            $result = str_replace('{' . $key . '_lower}', mb_strtolower($value), $result);
        }

        $result = preg_replace('/\{[^}]+\}/', '', $result);
        $result = preg_replace('/\s+/', ' ', $result);

        return trim($result);
    }

    private function generateFallbackTitle(array $context): string
    {
        return ($context['theme']->name ?? 'Guide') . " - " . ($context['country']->name ?? '');
    }

    private function generateFallbackMetaDescription(array $context): string
    {
        return "Découvrez notre guide complet.";
    }

    /**
     * Obtenir les statistiques
     */
    public function getGlobalStatistics(): array
    {
        return [
            'total_keywords' => DB::table('keyword_combinations')->count(),
            'by_platform' => DB::table('keyword_combinations')
                ->join('keyword_services', 'keyword_combinations.service_id', '=', 'keyword_services.id')
                ->join('platforms', 'keyword_services.platform_id', '=', 'platforms.id')
                ->select('platforms.name', DB::raw('count(*) as count'))
                ->groupBy('platforms.name')
                ->pluck('count', 'name')
                ->toArray(),
            'usage_stats' => [
                'never_used' => DB::table('keyword_combinations')->where('usage_count', 0)->count(),
                'frequently_used' => DB::table('keyword_combinations')->where('usage_count', '>', 10)->count(),
            ],
        ];
    }
}
