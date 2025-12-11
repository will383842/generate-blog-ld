<?php

namespace App\Services\Content;

use App\Models\Article;
use App\Models\Country;
use App\Models\Language;
use App\Models\Platform;
use App\Models\ContentCategory;
use App\Models\GenerationRequest;
use App\Models\GeneratedArticlesMapping;
use App\Models\ArticlePublication;
use App\Services\Content\ArticleGenerator;
use App\Services\Template\VariableReplacementService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class BatchGenerationService
{
    protected ArticleGenerator $articleGenerator;
    protected VariableReplacementService $variableReplacer;

    public function __construct(
        ArticleGenerator $articleGenerator,
        VariableReplacementService $variableReplacer
    ) {
        $this->articleGenerator = $articleGenerator;
        $this->variableReplacer = $variableReplacer;
    }

    /**
     * Génère des articles selon la stratégie
     */
    public function generate(GenerationRequest $request): array
    {
        $request->update([
            'status' => 'processing',
            'started_at' => now()
        ]);

        try {
            $results = match($request->strategy) {
                'single' => $this->generateSingle($request),
                'variations' => $this->generateVariations($request),
            };

            $request->update([
                'status' => 'completed',
                'articles_generated' => count($results),
                'completed_at' => now(),
                'total_time_seconds' => now()->diffInSeconds($request->started_at)
            ]);

            Log::info('Génération batch terminée', [
                'request_id' => $request->id,
                'articles' => count($results),
                'strategy' => $request->strategy
            ]);

            return $results;

        } catch (\Exception $e) {
            $request->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'completed_at' => now()
            ]);

            Log::error('Erreur génération batch', [
                'request_id' => $request->id,
                'error' => $e->getMessage()
            ]);

            throw $e;
        }
    }

    /**
     * Stratégie SINGLE: 1 article multi-pays/services
     * Ex: "Guide Visa France, Belgique, Suisse"
     */
    protected function generateSingle(GenerationRequest $request): array
    {
        $platforms = Platform::whereIn('id', $request->platform_ids)->get();
        $countries = Country::whereIn('id', $request->country_ids)->get();
        $languages = Language::whereIn('code', $request->language_codes)->get();

        $articles = [];
        $totalCombinations = count($platforms) * count($languages);
        $request->update(['articles_expected' => $totalCombinations]);

        foreach ($platforms as $platform) {
            foreach ($languages as $language) {
                
                try {
                    // Construire keyword englobant tous les pays/services
                    $keyword = $this->buildMultiCountryKeyword(
                        $countries,
                        $request->service_ids,
                        $language->code,
                        $request->category
                    );

                    $params = [
                        'platform_id' => $platform->id,
                        'country_id' => $countries->first()->id, // Premier pays comme principal
                        'language' => $language->code,
                        'keyword' => $keyword,
                        'category_id' => $request->category_id,
                        'multi_countries' => $request->country_ids,
                        'multi_services' => $request->service_ids
                    ];

                    $article = $this->articleGenerator->generate($params);

                    // Créer publications pour toutes les plateformes
                    $this->createPublications($article, [$platform->id]);

                    // Mapping
                    GeneratedArticlesMapping::create([
                        'request_id' => $request->id,
                        'article_id' => $article->id,
                        'combination' => [
                            'platform' => $platform->id,
                            'countries' => $request->country_ids,
                            'language' => $language->code,
                            'services' => $request->service_ids,
                            'strategy' => 'single'
                        ]
                    ]);

                    $articles[] = $article;

                    // Update progression
                    $request->increment('articles_generated');

                } catch (\Exception $e) {
                    Log::error('Erreur génération single', [
                        'platform' => $platform->id,
                        'language' => $language->code,
                        'error' => $e->getMessage()
                    ]);
                }
            }
        }

        return $articles;
    }

    /**
     * Stratégie VARIATIONS: 1 article par combinaison
     * Ex: Article spécifique France + Article spécifique Belgique + etc
     */
    protected function generateVariations(GenerationRequest $request): array
    {
        $platforms = Platform::whereIn('id', $request->platform_ids)->get();
        $countries = Country::whereIn('id', $request->country_ids)->get();
        $languages = Language::whereIn('code', $request->language_codes)->get();
        $serviceIds = $request->service_ids ?? [null];

        $articles = [];
        $combinations = $this->buildCombinations($platforms, $countries, $languages, $serviceIds);

        // Calculer total attendu
        $request->update(['articles_expected' => count($combinations)]);

        foreach ($combinations as $combo) {
            try {
                $keyword = $this->buildKeyword($combo, $request->category);

                $params = [
                    'platform_id' => $combo['platform'],
                    'country_id' => $combo['country'],
                    'language' => $combo['language'],
                    'keyword' => $keyword,
                    'category_id' => $request->category_id,
                    'service_id' => $combo['service'] ?? null
                ];

                $article = $this->articleGenerator->generate($params);

                // Créer publication
                $this->createPublications($article, [$combo['platform']]);

                GeneratedArticlesMapping::create([
                    'request_id' => $request->id,
                    'article_id' => $article->id,
                    'combination' => $combo
                ]);

                $articles[] = $article;

                // Update progression
                $request->increment('articles_generated');

                // Log progression tous les 10 articles
                if (count($articles) % 10 === 0) {
                    Log::info("Progression génération batch", [
                        'request_id' => $request->id,
                        'progress' => count($articles) . '/' . count($combinations)
                    ]);
                }

            } catch (\Exception $e) {
                Log::error('Erreur génération variation', [
                    'combination' => $combo,
                    'error' => $e->getMessage()
                ]);
            }
        }

        return $articles;
    }

    /**
     * Construit toutes les combinaisons possibles
     */
    protected function buildCombinations(
        $platforms,
        $countries,
        $languages,
        array $serviceIds
    ): array {
        $combinations = [];

        foreach ($platforms as $platform) {
            foreach ($countries as $country) {
                foreach ($languages as $language) {
                    foreach ($serviceIds as $serviceId) {
                        $combinations[] = [
                            'platform' => $platform->id,
                            'country' => $country->id,
                            'language' => $language->code,
                            'service' => $serviceId
                        ];
                    }
                }
            }
        }

        return $combinations;
    }

    /**
     * Construit keyword pour une combinaison spécifique
     */
    protected function buildKeyword(array $combo, ?ContentCategory $category): string
    {
        $country = Country::find($combo['country']);
        $language = $combo['language'];
        
        $baseKeywords = [
            'fr' => [
                'affiliation' => "programme affiliation {$country->name}",
                'recruitment' => "devenir prestataire {$country->name}",
                'awareness' => "services expatriés {$country->name}",
                'partnership' => "partenaires business {$country->name}",
                'influencer' => "collaboration influenceur {$country->name}"
            ],
            'en' => [
                'affiliation' => "affiliate program {$country->name}",
                'recruitment' => "become provider {$country->name}",
                'awareness' => "expat services {$country->name}",
                'partnership' => "business partners {$country->name}",
                'influencer' => "influencer collaboration {$country->name}"
            ],
            'es' => [
                'affiliation' => "programa afiliados {$country->name}",
                'recruitment' => "ser proveedor {$country->name}",
                'awareness' => "servicios expatriados {$country->name}",
                'partnership' => "socios comerciales {$country->name}",
                'influencer' => "colaboración influencer {$country->name}"
            ]
        ];

        $categoryCode = $category?->code ?? 'awareness';
        
        return $baseKeywords[$language][$categoryCode] 
            ?? $baseKeywords['fr'][$categoryCode] 
            ?? "services {$country->name}";
    }

    /**
     * Construit keyword pour multi-pays
     */
    protected function buildMultiCountryKeyword(
        $countries,
        ?array $serviceIds,
        string $language,
        ?ContentCategory $category
    ): string {
        $countryNames = $countries->pluck('name')->join(', ', ' et ');
        $categoryCode = $category?->code ?? 'awareness';
        
        $templates = [
            'fr' => [
                'affiliation' => "Programme Affiliation: {$countryNames}",
                'recruitment' => "Recrutement Prestataires: {$countryNames}",
                'awareness' => "Guide Complet Expatriation: {$countryNames}",
                'partnership' => "Opportunités Partenariats: {$countryNames}",
                'influencer' => "Collaboration Influenceurs: {$countryNames}"
            ],
            'en' => [
                'affiliation' => "Affiliate Program: {$countryNames}",
                'recruitment' => "Provider Recruitment: {$countryNames}",
                'awareness' => "Complete Expat Guide: {$countryNames}",
                'partnership' => "Partnership Opportunities: {$countryNames}",
                'influencer' => "Influencer Collaboration: {$countryNames}"
            ]
        ];

        return $templates[$language][$categoryCode] 
            ?? $templates['fr'][$categoryCode] 
            ?? "Services Expatriés: {$countryNames}";
    }

    /**
     * Crée les publications pour les plateformes
     */
    protected function createPublications(Article $article, array $platformIds): void
    {
        $variablesSnapshot = $this->variableReplacer->getSnapshot();

        foreach ($platformIds as $platformId) {
            ArticlePublication::create([
                'article_id' => $article->id,
                'platform_id' => $platformId,
                'template_variables_snapshot' => $variablesSnapshot,
                'status' => $article->status === 'published' ? 'published' : 'draft',
                'published_at' => $article->status === 'published' ? now() : null
            ]);
        }
    }
}
