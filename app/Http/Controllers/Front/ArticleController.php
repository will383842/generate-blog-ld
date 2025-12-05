<?php

namespace App\Http\Controllers\Front;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Country;
use App\Services\Seo\MetaService;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Symfony\Component\HttpFoundation\Response;

/**
 * ArticleController - Affichage public des articles
 * 
 * Gère les URLs multilingues avec structure pays:
 * - FR (défaut): /{pays}/{article}
 * - Autres langues: /{lang}/{pays}/{article}
 * 
 * Placement: app/Http/Controllers/Front/ArticleController.php
 */
class ArticleController extends Controller
{
    public function __construct(
        private MetaService $metaService
    ) {}

    /**
     * Affiche un article
     * 
     * Routes:
     * - GET /{countrySlug}/{articleSlug} (FR par défaut)
     * - GET /{lang}/{countrySlug}/{articleSlug} (autres langues)
     */
    public function show(
        Request $request,
        string $countrySlug,
        string $articleSlug,
        string $lang = 'fr'
    ): View|Response {
        // 1. Trouver le pays par son slug (dans n'importe quelle langue)
        $country = Country::findBySlug($countrySlug);
        
        if (!$country) {
            abort(404, 'Country not found');
        }

        // 2. Trouver l'article
        $article = Article::findByCountryAndSlug($countrySlug, $articleSlug, $lang);
        
        if (!$article) {
            abort(404, 'Article not found');
        }

        // 3. Vérifier que l'article est publié
        if ($article->status !== Article::STATUS_PUBLISHED) {
            abort(404, 'Article not published');
        }

        // 4. Vérifier que la traduction existe
        if (!$article->hasTranslation($lang)) {
            // Rediriger vers la version FR si pas de traduction
            return redirect($article->getFullUrlWithCountry('fr'), 302);
        }

        // 5. Vérifier l'URL canonique (redirection 301 si mauvais slug)
        $expectedArticleSlug = $article->getTranslatedSlug($lang);
        $expectedCountrySlug = $country->getSlug($lang);

        if ($articleSlug !== $expectedArticleSlug || $countrySlug !== $expectedCountrySlug) {
            return redirect($article->getFullUrlWithCountry($lang), 301);
        }

        // 6. Générer les métadonnées SEO
        $meta = $this->metaService->generateAllMeta($article, $lang);

        // 7. Retourner la vue
        return view('front.article.show', [
            'article' => $article,
            'country' => $country,
            'lang' => $lang,
            'meta' => $meta,
            'availableLanguages' => $article->getAvailableLanguages(),
            'allUrls' => $article->getAllUrlsWithCountry(),
            'translation' => $this->getTranslationData($article, $lang),
        ]);
    }

    /**
     * Liste des articles par pays
     * 
     * Routes:
     * - GET /{countrySlug} (FR par défaut)
     * - GET /{lang}/{countrySlug} (autres langues)
     */
    public function byCountry(
        Request $request,
        string $countrySlug,
        string $lang = 'fr'
    ): View|Response {
        // 1. Trouver le pays
        $country = Country::findBySlug($countrySlug);
        
        if (!$country) {
            abort(404, 'Country not found');
        }

        // 2. Vérifier le slug canonique
        $expectedSlug = $country->getSlug($lang);
        
        if ($countrySlug !== $expectedSlug) {
            $redirectUrl = ($lang === 'fr')
                ? "/{$expectedSlug}"
                : "/{$lang}/{$expectedSlug}";
            return redirect($redirectUrl, 301);
        }

        // 3. Récupérer les articles publiés pour ce pays
        $articles = Article::where('country_id', $country->id)
            ->where('status', Article::STATUS_PUBLISHED)
            ->with(['language', 'theme', 'author', 'translations.language'])
            ->orderBy('published_at', 'desc')
            ->paginate(20);

        // 4. Retourner la vue
        return view('front.country.index', [
            'country' => $country,
            'articles' => $articles,
            'lang' => $lang,
            'countryName' => $country->getName($lang),
            'countrySlug' => $expectedSlug,
        ]);
    }

    /**
     * Récupère les données de traduction pour la vue
     */
    private function getTranslationData(Article $article, string $lang): array
    {
        // Langue source
        if ($article->language && $article->language->code === $lang) {
            return [
                'title' => $article->title,
                'slug' => $article->slug,
                'excerpt' => $article->excerpt,
                'content' => $article->content,
                'meta_title' => $article->meta_title,
                'meta_description' => $article->meta_description,
                'image_alt' => $article->image_alt,
            ];
        }

        // Traduction
        $translation = $article->translations()
            ->whereHas('language', fn($q) => $q->where('code', $lang))
            ->first();

        if ($translation) {
            return [
                'title' => $translation->title,
                'slug' => $translation->slug,
                'excerpt' => $translation->excerpt,
                'content' => $translation->content,
                'meta_title' => $translation->meta_title,
                'meta_description' => $translation->meta_description,
                'image_alt' => $translation->image_alt,
            ];
        }

        // Fallback vers l'original
        return [
            'title' => $article->title,
            'slug' => $article->slug,
            'excerpt' => $article->excerpt,
            'content' => $article->content,
            'meta_title' => $article->meta_title,
            'meta_description' => $article->meta_description,
            'image_alt' => $article->image_alt,
        ];
    }

    /**
     * Page d'accueil par langue
     * 
     * Routes:
     * - GET / (FR par défaut)
     * - GET /{lang} (autres langues)
     */
    public function home(Request $request, string $lang = 'fr'): View
    {
        // Articles récents
        $recentArticles = Article::where('status', Article::STATUS_PUBLISHED)
            ->with(['country', 'language', 'theme'])
            ->orderBy('published_at', 'desc')
            ->limit(12)
            ->get();

        // Pays populaires
        $popularCountries = Country::active()
            ->ordered()
            ->withCount(['articles' => fn($q) => $q->published()])
            ->orderBy('articles_count', 'desc')
            ->limit(20)
            ->get();

        return view('front.home', [
            'lang' => $lang,
            'recentArticles' => $recentArticles,
            'popularCountries' => $popularCountries,
        ]);
    }
}