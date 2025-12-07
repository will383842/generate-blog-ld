<?php

namespace App\Services\Coverage;

use App\Models\Article;
use App\Models\Country;
use App\Models\Language;
use App\Models\Platform;
use App\Models\LawyerSpecialty;
use App\Models\ExpatDomain;
use App\Models\UlixaiService;
use App\Models\CoverageCountryScore;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

/**
 * INTELLIGENT COVERAGE ANALYSIS SERVICE
 * 
 * Calcule les scores de couverture pour chaque pays/plateforme/langue
 * IMPORTANT: Seuls les articles PUBLIÉS sont comptabilisés
 * 
 * Inclut le thème Williams Jullin (fondateur) cross-platform
 * 
 * OPTIMISATIONS v2:
 * - Cache des langues pré-chargé
 * - Requêtes optimisées avec eager loading
 */
class CoverageAnalysisService
{
    // Langues supportées
    public const LANGUAGES = ['fr', 'en', 'de', 'es', 'pt', 'ru', 'zh', 'ar', 'hi'];
    
    // Catégories de contenu
    public const CATEGORY_RECRUITMENT = 'recruitment';
    public const CATEGORY_AWARENESS = 'awareness';
    public const CATEGORY_FOUNDER = 'founder';
    
    // Types de cibles
    public const TARGET_LAWYER_SPECIALTY = 'lawyer_specialty';
    public const TARGET_EXPAT_DOMAIN = 'expat_domain';
    public const TARGET_ULIXAI_SERVICE = 'ulixai_service';
    public const TARGET_FOUNDER = 'founder';
    
    // Plateformes
    public const PLATFORM_SOS_EXPAT = 1;
    public const PLATFORM_ULIXAI = 2;
    
    // Durée du cache en secondes (5 minutes)
    public const CACHE_TTL = 300;
    
    // Cache des langues (évite les requêtes N+1)
    protected ?Collection $languagesCache = null;
    
    /**
     * Obtient toutes les langues avec cache
     * OPTIMISATION: Évite les requêtes répétées $this->getLanguageByCode($lang)
     */
    protected function getLanguages(): Collection
    {
        if ($this->languagesCache === null) {
            $this->languagesCache = Language::whereIn('code', self::LANGUAGES)
                ->get()
                ->keyBy('code');
        }
        return $this->languagesCache;
    }
    
    /**
     * Obtient une langue par son code (depuis le cache)
     */
    protected function getLanguageByCode(string $code): ?Language
    {
        return $this->getLanguages()->get($code);
    }

    // =========================================================================
    // MÉTHODES PRINCIPALES
    // =========================================================================

    /**
     * Calcule le score de couverture global pour tous les pays
     */
    public function calculateGlobalCoverage(int $platformId): array
    {
        $cacheKey = "coverage.global.{$platformId}";
        
        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($platformId) {
            $countries = Country::all();
            $scores = [];
            
            foreach ($countries as $country) {
                $scores[$country->id] = $this->calculateCountryScore($platformId, $country->id);
            }
            
            // Statistiques globales
            $totalCountries = count($scores);
            $avgRecruitment = collect($scores)->avg('recruitment_score');
            $avgAwareness = collect($scores)->avg('awareness_score');
            $avgFounder = collect($scores)->avg('founder_score');
            $avgOverall = collect($scores)->avg('overall_score');
            
            $totalPublished = collect($scores)->sum('published_articles');
            $totalUnpublished = collect($scores)->sum('unpublished_articles');
            
            // Répartition par niveau
            $distribution = [
                'excellent' => collect($scores)->filter(fn($s) => $s['overall_score'] >= 80)->count(),
                'good' => collect($scores)->filter(fn($s) => $s['overall_score'] >= 60 && $s['overall_score'] < 80)->count(),
                'partial' => collect($scores)->filter(fn($s) => $s['overall_score'] >= 40 && $s['overall_score'] < 60)->count(),
                'minimal' => collect($scores)->filter(fn($s) => $s['overall_score'] >= 20 && $s['overall_score'] < 40)->count(),
                'missing' => collect($scores)->filter(fn($s) => $s['overall_score'] < 20)->count(),
            ];
            
            // Helper pour mapper les scores vers le format liste
            $mapToListFormat = fn($score) => [
                'id' => $score['country_id'],
                'name' => $score['country_name'],
                'code' => $score['country_code'],
                'region' => $score['region'],
                'recruitment_score' => $score['recruitment_score'],
                'awareness_score' => $score['awareness_score'],
                'founder_score' => $score['founder_score'],
                'overall_score' => $score['overall_score'],
                'status' => $score['status'],
                'priority_score' => $score['priority_score'],
                'total_articles' => $score['total_articles'],
                'published_articles' => $score['published_articles'],
                'unpublished_articles' => $score['unpublished_articles'],
                'missing_targets' => $score['missing_targets'],
            ];
            
            // Top et prioritaires (mappés vers le format liste)
            $sortedScores = collect($scores)->sortByDesc('overall_score');
            $topCountries = $sortedScores->take(10)->map($mapToListFormat)->values()->toArray();
            
            $priorityCountries = collect($scores)
                ->sortByDesc('priority_score')
                ->filter(fn($s) => $s['overall_score'] < 60)
                ->take(20)
                ->map($mapToListFormat)
                ->values()
                ->toArray();
            
            return [
                'platform_id' => $platformId,
                'total_countries' => $totalCountries,
                'summary' => [
                    'average_recruitment' => round($avgRecruitment, 2),
                    'average_awareness' => round($avgAwareness, 2),
                    'average_founder' => round($avgFounder, 2),
                    'average_overall' => round($avgOverall, 2),
                    'total_published' => $totalPublished,
                    'total_unpublished' => $totalUnpublished,
                    'total_countries' => $totalCountries,
                ],
                'distribution' => $distribution,
                'top_countries' => $topCountries,
                'priority_countries' => $priorityCountries,
            ];
        });
    }

    /**
     * Calcule le score de couverture pour un pays spécifique
     * IMPORTANT: Seuls les articles PUBLIÉS sont comptés
     */
    public function calculateCountryScore(int $platformId, int $countryId): array
    {
        $cacheKey = "coverage.country.{$platformId}.{$countryId}";
        
        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($platformId, $countryId) {
            $country = Country::find($countryId);
            if (!$country) {
                return $this->getEmptyCountryScore($countryId);
            }
            
            // Calculer les scores de recrutement et notoriété
            $recruitmentData = $this->calculateRecruitmentScore($platformId, $countryId);
            $awarenessData = $this->calculateAwarenessScore($platformId, $countryId);
            $founderData = $this->calculateFounderScore($countryId);
            
            // Score global pondéré (55% recrutement, 35% notoriété, 10% fondateur)
            $overallScore = ($recruitmentData['score'] * 0.55) + 
                           ($awarenessData['score'] * 0.35) + 
                           ($founderData['score'] * 0.10);
            
            // Scores par langue
            $languageScores = $this->calculateLanguageScores($platformId, $countryId);
            
            // Compter les articles publiés et non publiés
            $articleCounts = $this->countArticlesByStatus($platformId, $countryId);
            
            // Générer les recommandations
            $recommendations = $this->generateRecommendations(
                $platformId, $countryId, $recruitmentData, $awarenessData, $founderData
            );
            
            // Calculer la priorité
            $priorityScore = $this->calculatePriorityScore(
                $country, $overallScore, $recruitmentData, $awarenessData, $founderData
            );
            
            return [
                'country_id' => $countryId,
                'country_name' => $country->name ?? 'Unknown',
                'country_code' => $country->code ?? '',
                'region' => $country->region ?? '',
                'recruitment_score' => round($recruitmentData['score'], 2),
                'awareness_score' => round($awarenessData['score'], 2),
                'founder_score' => round($founderData['score'], 2),
                'overall_score' => round($overallScore, 2),
                'recruitment_breakdown' => $recruitmentData['breakdown'],
                'awareness_breakdown' => $awarenessData['breakdown'],
                'founder_breakdown' => $founderData['breakdown'],
                'language_scores' => $languageScores,
                'total_articles' => $articleCounts['total'],
                'published_articles' => $articleCounts['published'],
                'unpublished_articles' => $articleCounts['unpublished'],
                'total_targets' => $recruitmentData['total_targets'] + $awarenessData['total_targets'] + $founderData['total_targets'],
                'completed_targets' => $recruitmentData['completed_targets'] + $awarenessData['completed_targets'] + $founderData['completed_targets'],
                'missing_targets' => $recruitmentData['missing_targets'] + $awarenessData['missing_targets'] + $founderData['missing_targets'],
                'priority_score' => $priorityScore,
                'recommendations' => $recommendations,
                'status' => $this->getStatusFromScore($overallScore),
            ];
        });
    }

    /**
     * Compte les articles par statut (publiés vs non publiés)
     */
    protected function countArticlesByStatus(int $platformId, int $countryId): array
    {
        $total = Article::where('platform_id', $platformId)
            ->where('country_id', $countryId)
            ->count();
            
        $published = Article::where('platform_id', $platformId)
            ->where('country_id', $countryId)
            ->where('status', Article::STATUS_PUBLISHED)
            ->count();
            
        return [
            'total' => $total,
            'published' => $published,
            'unpublished' => $total - $published,
        ];
    }

    // =========================================================================
    // CALCUL RECRUTEMENT
    // =========================================================================

    /**
     * Calcule le score de recrutement pour un pays
     */
    protected function calculateRecruitmentScore(int $platformId, int $countryId): array
    {
        $breakdown = [];
        $totalScore = 0;
        $totalWeight = 0;
        $totalArticles = 0;
        $totalTargets = 0;
        $completedTargets = 0;
        $missingTargets = 0;

        if ($platformId === self::PLATFORM_SOS_EXPAT) {
            // SOS-Expat : Avocats (50%) + Expatriés aidants (50%)
            
            $lawyerScore = $this->calculateLawyerSpecialtiesScore($platformId, $countryId);
            $breakdown['lawyer_specialties'] = $lawyerScore;
            $totalScore += $lawyerScore['score'] * 50;
            $totalWeight += 50;
            $totalArticles += $lawyerScore['articles_count'];
            $totalTargets += $lawyerScore['total_targets'];
            $completedTargets += $lawyerScore['completed_targets'];
            $missingTargets += $lawyerScore['missing_targets'];
            
            $expatScore = $this->calculateExpatDomainsScore($platformId, $countryId);
            $breakdown['expat_domains'] = $expatScore;
            $totalScore += $expatScore['score'] * 50;
            $totalWeight += 50;
            $totalArticles += $expatScore['articles_count'];
            $totalTargets += $expatScore['total_targets'];
            $completedTargets += $expatScore['completed_targets'];
            $missingTargets += $expatScore['missing_targets'];
            
        } else if ($platformId === self::PLATFORM_ULIXAI) {
            // Ulixai : Services (100%)
            
            $servicesScore = $this->calculateUlixaiServicesScore($platformId, $countryId);
            $breakdown['ulixai_services'] = $servicesScore;
            $totalScore += $servicesScore['score'] * 100;
            $totalWeight += 100;
            $totalArticles += $servicesScore['articles_count'];
            $totalTargets += $servicesScore['total_targets'];
            $completedTargets += $servicesScore['completed_targets'];
            $missingTargets += $servicesScore['missing_targets'];
        }

        return [
            'score' => $totalWeight > 0 ? $totalScore / $totalWeight : 0,
            'breakdown' => $breakdown,
            'total_articles' => $totalArticles,
            'total_targets' => $totalTargets,
            'completed_targets' => $completedTargets,
            'missing_targets' => $missingTargets,
        ];
    }

    /**
     * Calcule le score pour les spécialités avocat
     * SEULS LES ARTICLES PUBLIÉS SONT COMPTÉS
     */
    protected function calculateLawyerSpecialtiesScore(int $platformId, int $countryId): array
    {
        $specialties = LawyerSpecialty::where('is_active', true)->get();
        $languages = self::LANGUAGES;
        
        $totalTargets = count($specialties) * count($languages);
        $completedTargets = 0;
        $details = [];

        foreach ($specialties as $specialty) {
            $specialtyDetails = [
                'id' => $specialty->id,
                'code' => $specialty->code,
                'name' => $specialty->name_fr ?? $specialty->getName('fr'),
                'category' => $specialty->category_code ?? null,
                'languages' => [],
                'completed_count' => 0,
            ];
            
            foreach ($languages as $lang) {
                $language = $this->getLanguageByCode($lang);
                if (!$language) continue;
                
                // IMPORTANT: Seulement les articles PUBLIÉS
                $hasPublishedArticle = Article::where('platform_id', $platformId)
                    ->where('country_id', $countryId)
                    ->where('language_id', $language->id)
                    ->where('theme_type', 'lawyer_specialty')
                    ->where('theme_id', $specialty->id)
                    ->where('status', Article::STATUS_PUBLISHED)
                    ->exists();
                
                // Vérifier si article existe mais non publié
                $hasUnpublishedArticle = !$hasPublishedArticle && Article::where('platform_id', $platformId)
                    ->where('country_id', $countryId)
                    ->where('language_id', $language->id)
                    ->where('theme_type', 'lawyer_specialty')
                    ->where('theme_id', $specialty->id)
                    ->where('status', '!=', Article::STATUS_PUBLISHED)
                    ->exists();
                
                $status = $hasPublishedArticle ? 'published' : ($hasUnpublishedArticle ? 'unpublished' : 'missing');
                
                $specialtyDetails['languages'][$lang] = [
                    'completed' => $hasPublishedArticle,
                    'status' => $status,
                ];
                
                if ($hasPublishedArticle) {
                    $completedTargets++;
                    $specialtyDetails['completed_count']++;
                }
            }
            
            $specialtyDetails['progress'] = count($languages) > 0 
                ? round(($specialtyDetails['completed_count'] / count($languages)) * 100, 2) 
                : 0;
                
            $details[] = $specialtyDetails;
        }

        $score = $totalTargets > 0 ? ($completedTargets / $totalTargets) * 100 : 0;
        
        return [
            'score' => $score,
            'articles_count' => $completedTargets,
            'total_targets' => $totalTargets,
            'completed_targets' => $completedTargets,
            'missing_targets' => $totalTargets - $completedTargets,
            'specialties_count' => count($specialties),
            'details' => $details,
        ];
    }

    /**
     * Calcule le score pour les domaines expatriés
     * SEULS LES ARTICLES PUBLIÉS SONT COMPTÉS
     */
    protected function calculateExpatDomainsScore(int $platformId, int $countryId): array
    {
        $domains = ExpatDomain::where('is_active', true)->get();
        $languages = self::LANGUAGES;
        
        $totalTargets = count($domains) * count($languages);
        $completedTargets = 0;
        $details = [];

        foreach ($domains as $domain) {
            $domainDetails = [
                'id' => $domain->id,
                'code' => $domain->code,
                'name' => $domain->name_fr ?? $domain->getName('fr'),
                'languages' => [],
                'completed_count' => 0,
            ];
            
            foreach ($languages as $lang) {
                $language = $this->getLanguageByCode($lang);
                if (!$language) continue;
                
                // IMPORTANT: Seulement les articles PUBLIÉS
                $hasPublishedArticle = Article::where('platform_id', $platformId)
                    ->where('country_id', $countryId)
                    ->where('language_id', $language->id)
                    ->where('theme_type', 'expat_domain')
                    ->where('theme_id', $domain->id)
                    ->where('status', Article::STATUS_PUBLISHED)
                    ->exists();
                
                $hasUnpublishedArticle = !$hasPublishedArticle && Article::where('platform_id', $platformId)
                    ->where('country_id', $countryId)
                    ->where('language_id', $language->id)
                    ->where('theme_type', 'expat_domain')
                    ->where('theme_id', $domain->id)
                    ->where('status', '!=', Article::STATUS_PUBLISHED)
                    ->exists();
                
                $status = $hasPublishedArticle ? 'published' : ($hasUnpublishedArticle ? 'unpublished' : 'missing');
                
                $domainDetails['languages'][$lang] = [
                    'completed' => $hasPublishedArticle,
                    'status' => $status,
                ];
                
                if ($hasPublishedArticle) {
                    $completedTargets++;
                    $domainDetails['completed_count']++;
                }
            }
            
            $domainDetails['progress'] = count($languages) > 0 
                ? round(($domainDetails['completed_count'] / count($languages)) * 100, 2) 
                : 0;
                
            $details[] = $domainDetails;
        }

        $score = $totalTargets > 0 ? ($completedTargets / $totalTargets) * 100 : 0;
        
        return [
            'score' => $score,
            'articles_count' => $completedTargets,
            'total_targets' => $totalTargets,
            'completed_targets' => $completedTargets,
            'missing_targets' => $totalTargets - $completedTargets,
            'domains_count' => count($domains),
            'details' => $details,
        ];
    }

    /**
     * Calcule le score pour les services Ulixai
     * SEULS LES ARTICLES PUBLIÉS SONT COMPTÉS
     */
    protected function calculateUlixaiServicesScore(int $platformId, int $countryId): array
    {
        // Services de niveau leaf (derniers niveaux)
        $services = UlixaiService::where('is_active', true)
            ->whereDoesntHave('children')
            ->get();
        $languages = self::LANGUAGES;
        
        $totalTargets = count($services) * count($languages);
        $completedTargets = 0;
        $details = [];

        foreach ($services as $service) {
            $serviceDetails = [
                'id' => $service->id,
                'code' => $service->code,
                'name' => $service->name_fr ?? $service->getName('fr'),
                'parent_name' => $service->parent ? ($service->parent->name_fr ?? null) : null,
                'languages' => [],
                'completed_count' => 0,
            ];
            
            foreach ($languages as $lang) {
                $language = $this->getLanguageByCode($lang);
                if (!$language) continue;
                
                // IMPORTANT: Seulement les articles PUBLIÉS
                $hasPublishedArticle = Article::where('platform_id', $platformId)
                    ->where('country_id', $countryId)
                    ->where('language_id', $language->id)
                    ->where('theme_type', 'ulixai_service')
                    ->where('theme_id', $service->id)
                    ->where('status', Article::STATUS_PUBLISHED)
                    ->exists();
                
                $hasUnpublishedArticle = !$hasPublishedArticle && Article::where('platform_id', $platformId)
                    ->where('country_id', $countryId)
                    ->where('language_id', $language->id)
                    ->where('theme_type', 'ulixai_service')
                    ->where('theme_id', $service->id)
                    ->where('status', '!=', Article::STATUS_PUBLISHED)
                    ->exists();
                
                $status = $hasPublishedArticle ? 'published' : ($hasUnpublishedArticle ? 'unpublished' : 'missing');
                
                $serviceDetails['languages'][$lang] = [
                    'completed' => $hasPublishedArticle,
                    'status' => $status,
                ];
                
                if ($hasPublishedArticle) {
                    $completedTargets++;
                    $serviceDetails['completed_count']++;
                }
            }
            
            $serviceDetails['progress'] = count($languages) > 0 
                ? round(($serviceDetails['completed_count'] / count($languages)) * 100, 2) 
                : 0;
                
            $details[] = $serviceDetails;
        }

        $score = $totalTargets > 0 ? ($completedTargets / $totalTargets) * 100 : 0;
        
        return [
            'score' => $score,
            'articles_count' => $completedTargets,
            'total_targets' => $totalTargets,
            'completed_targets' => $completedTargets,
            'missing_targets' => $totalTargets - $completedTargets,
            'services_count' => count($services),
            'details' => $details,
        ];
    }

    // =========================================================================
    // CALCUL NOTORIÉTÉ
    // =========================================================================

    /**
     * Calcule le score de notoriété pour un pays
     */
    protected function calculateAwarenessScore(int $platformId, int $countryId): array
    {
        $breakdown = [];
        $totalScore = 0;
        $totalWeight = 0;
        $totalArticles = 0;
        $totalTargets = 0;
        $completedTargets = 0;
        $missingTargets = 0;

        // Thèmes / Pillar articles (40%)
        $themesScore = $this->calculateThemesScore($platformId, $countryId);
        $breakdown['themes'] = $themesScore;
        $totalScore += $themesScore['score'] * 40;
        $totalWeight += 40;
        $totalArticles += $themesScore['articles_count'];
        $totalTargets += $themesScore['total_targets'];
        $completedTargets += $themesScore['completed_targets'];
        
        // Comparatifs (30%)
        $comparativeScore = $this->calculateComparativeScore($platformId, $countryId);
        $breakdown['comparatives'] = $comparativeScore;
        $totalScore += $comparativeScore['score'] * 30;
        $totalWeight += 30;
        $totalArticles += $comparativeScore['articles_count'];
        $totalTargets += $comparativeScore['total_targets'];
        $completedTargets += $comparativeScore['completed_targets'];
        
        // Landing pages (30%)
        $landingScore = $this->calculateLandingScore($platformId, $countryId);
        $breakdown['landings'] = $landingScore;
        $totalScore += $landingScore['score'] * 30;
        $totalWeight += 30;
        $totalArticles += $landingScore['articles_count'];
        $totalTargets += $landingScore['total_targets'];
        $completedTargets += $landingScore['completed_targets'];

        $missingTargets = $totalTargets - $completedTargets;

        return [
            'score' => $totalWeight > 0 ? $totalScore / $totalWeight : 0,
            'breakdown' => $breakdown,
            'total_articles' => $totalArticles,
            'total_targets' => $totalTargets,
            'completed_targets' => $completedTargets,
            'missing_targets' => $missingTargets,
        ];
    }

    /**
     * Calcule le score des thèmes/pillar articles
     */
    protected function calculateThemesScore(int $platformId, int $countryId): array
    {
        $languages = self::LANGUAGES;
        $targetPerLanguage = 3; // 3 pillar articles par langue
        $totalTargets = count($languages) * $targetPerLanguage;
        $completedTargets = 0;
        $details = [];

        foreach ($languages as $lang) {
            $language = $this->getLanguageByCode($lang);
            if (!$language) continue;
            
            // Compter les articles pillar PUBLIÉS
            $count = Article::where('platform_id', $platformId)
                ->where('country_id', $countryId)
                ->where('language_id', $language->id)
                ->where('type', 'pillar')
                ->where('status', Article::STATUS_PUBLISHED)
                ->count();
            
            $completed = min($count, $targetPerLanguage);
            $completedTargets += $completed;
            
            $details[$lang] = [
                'target' => $targetPerLanguage,
                'completed' => $completed,
                'total' => $count,
                'progress' => round(($completed / $targetPerLanguage) * 100, 2),
            ];
        }

        $score = $totalTargets > 0 ? min(100, ($completedTargets / $totalTargets) * 100) : 0;
        
        return [
            'score' => $score,
            'articles_count' => $completedTargets,
            'total_targets' => $totalTargets,
            'completed_targets' => $completedTargets,
            'missing_targets' => $totalTargets - $completedTargets,
            'details' => $details,
        ];
    }

    /**
     * Calcule le score des articles comparatifs
     */
    protected function calculateComparativeScore(int $platformId, int $countryId): array
    {
        $languages = self::LANGUAGES;
        $targetPerLanguage = 2; // 2 comparatifs par langue
        $totalTargets = count($languages) * $targetPerLanguage;
        $completedTargets = 0;
        $details = [];

        foreach ($languages as $lang) {
            $language = $this->getLanguageByCode($lang);
            if (!$language) continue;
            
            $count = Article::where('platform_id', $platformId)
                ->where('country_id', $countryId)
                ->where('language_id', $language->id)
                ->where('type', 'comparative')
                ->where('status', Article::STATUS_PUBLISHED)
                ->count();
            
            $completed = min($count, $targetPerLanguage);
            $completedTargets += $completed;
            
            $details[$lang] = [
                'target' => $targetPerLanguage,
                'completed' => $completed,
                'total' => $count,
                'progress' => round(($completed / $targetPerLanguage) * 100, 2),
            ];
        }

        $score = $totalTargets > 0 ? min(100, ($completedTargets / $totalTargets) * 100) : 0;
        
        return [
            'score' => $score,
            'articles_count' => $completedTargets,
            'total_targets' => $totalTargets,
            'completed_targets' => $completedTargets,
            'missing_targets' => $totalTargets - $completedTargets,
            'details' => $details,
        ];
    }

    /**
     * Calcule le score des landing pages
     */
    protected function calculateLandingScore(int $platformId, int $countryId): array
    {
        $languages = self::LANGUAGES;
        $targetPerLanguage = 1; // 1 landing par langue
        $totalTargets = count($languages) * $targetPerLanguage;
        $completedTargets = 0;
        $details = [];

        foreach ($languages as $lang) {
            $language = $this->getLanguageByCode($lang);
            if (!$language) continue;
            
            $count = Article::where('platform_id', $platformId)
                ->where('country_id', $countryId)
                ->where('language_id', $language->id)
                ->where('type', 'landing')
                ->where('status', Article::STATUS_PUBLISHED)
                ->count();
            
            $completed = min($count, $targetPerLanguage);
            $completedTargets += $completed;
            
            $details[$lang] = [
                'target' => $targetPerLanguage,
                'completed' => $completed,
                'total' => $count,
                'progress' => round(($completed / $targetPerLanguage) * 100, 2),
            ];
        }

        $score = $totalTargets > 0 ? min(100, ($completedTargets / $totalTargets) * 100) : 0;
        
        return [
            'score' => $score,
            'articles_count' => $completedTargets,
            'total_targets' => $totalTargets,
            'completed_targets' => $completedTargets,
            'missing_targets' => $totalTargets - $completedTargets,
            'details' => $details,
        ];
    }

    // =========================================================================
    // CALCUL FONDATEUR (WILLIAMS JULLIN) - CROSS-PLATFORM
    // =========================================================================

    /**
     * Calcule le score pour le thème Williams Jullin (fondateur)
     * CROSS-PLATFORM: Combine SOS-Expat + Ulixai
     */
    protected function calculateFounderScore(int $countryId): array
    {
        $languages = self::LANGUAGES;
        $totalTargets = count($languages) * 2; // 1 article par plateforme par langue
        $completedTargets = 0;
        $details = [];

        foreach ($languages as $lang) {
            $language = $this->getLanguageByCode($lang);
            if (!$language) continue;
            
            // Article SOS-Expat sur Williams Jullin
            $hasSosExpat = Article::where('platform_id', self::PLATFORM_SOS_EXPAT)
                ->where('country_id', $countryId)
                ->where('language_id', $language->id)
                ->where(function($q) {
                    $q->where('theme_type', 'founder')
                      ->orWhere('title', 'like', '%Williams Jullin%')
                      ->orWhere('title', 'like', '%fondateur%')
                      ->orWhere('title', 'like', '%founder%');
                })
                ->where('status', Article::STATUS_PUBLISHED)
                ->exists();
            
            // Article Ulixai sur Williams Jullin
            $hasUlixai = Article::where('platform_id', self::PLATFORM_ULIXAI)
                ->where('country_id', $countryId)
                ->where('language_id', $language->id)
                ->where(function($q) {
                    $q->where('theme_type', 'founder')
                      ->orWhere('title', 'like', '%Williams Jullin%')
                      ->orWhere('title', 'like', '%fondateur%')
                      ->orWhere('title', 'like', '%founder%');
                })
                ->where('status', Article::STATUS_PUBLISHED)
                ->exists();
            
            $langCompleted = ($hasSosExpat ? 1 : 0) + ($hasUlixai ? 1 : 0);
            $completedTargets += $langCompleted;
            
            $details[$lang] = [
                'sos_expat' => [
                    'completed' => $hasSosExpat,
                    'status' => $hasSosExpat ? 'published' : 'missing',
                ],
                'ulixai' => [
                    'completed' => $hasUlixai,
                    'status' => $hasUlixai ? 'published' : 'missing',
                ],
                'combined_progress' => round(($langCompleted / 2) * 100, 2),
            ];
        }

        $score = $totalTargets > 0 ? ($completedTargets / $totalTargets) * 100 : 0;
        
        return [
            'score' => $score,
            'articles_count' => $completedTargets,
            'total_targets' => $totalTargets,
            'completed_targets' => $completedTargets,
            'missing_targets' => $totalTargets - $completedTargets,
            'founder_name' => 'Williams Jullin',
            'description' => 'Articles sur le fondateur - communs à toutes les plateformes',
            'breakdown' => $details,
        ];
    }

    /**
     * Obtient les détails du thème fondateur pour tous les pays
     */
    public function getFounderCoverageGlobal(): array
    {
        $countries = Country::all();
        $results = [];
        
        foreach ($countries as $country) {
            $score = $this->calculateFounderScore($country->id);
            $results[] = [
                'country_id' => $country->id,
                'country_name' => $country->name,
                'country_code' => $country->code,
                'region' => $country->region,
                'score' => $score['score'],
                'completed_targets' => $score['completed_targets'],
                'total_targets' => $score['total_targets'],
                'breakdown' => $score['breakdown'],
            ];
        }
        
        // Trier par score décroissant
        usort($results, fn($a, $b) => $b['score'] <=> $a['score']);
        
        return [
            'founder_name' => 'Williams Jullin',
            'total_countries' => count($countries),
            'total_targets' => count($countries) * count(self::LANGUAGES) * 2,
            'completed_targets' => collect($results)->sum('completed_targets'),
            'average_score' => collect($results)->avg('score'),
            'countries' => $results,
        ];
    }

    // =========================================================================
    // SCORES PAR LANGUE
    // =========================================================================

    /**
     * Calcule les scores par langue pour un pays
     */
    protected function calculateLanguageScores(int $platformId, int $countryId): array
    {
        $scores = [];
        
        foreach (self::LANGUAGES as $langCode) {
            $language = $this->getLanguageByCode($langCode);
            if (!$language) continue;
            
            // Compter les articles PUBLIÉS pour cette langue
            $publishedCount = Article::where('platform_id', $platformId)
                ->where('country_id', $countryId)
                ->where('language_id', $language->id)
                ->where('status', Article::STATUS_PUBLISHED)
                ->count();
            
            // Compter le total d'articles (publiés + non publiés)
            $totalCount = Article::where('platform_id', $platformId)
                ->where('country_id', $countryId)
                ->where('language_id', $language->id)
                ->count();
            
            // Score basé sur un objectif de 50 articles publiés = 100%
            $targetArticles = 50;
            $score = min(100, ($publishedCount / $targetArticles) * 100);
            
            $scores[$langCode] = [
                'language_id' => $language->id,
                'language_code' => $langCode,
                'language_name' => $language->name,
                'total_articles' => $totalCount,
                'published_articles' => $publishedCount,
                'unpublished_articles' => $totalCount - $publishedCount,
                'score' => round($score, 2),
                'status' => $this->getStatusFromScore($score),
            ];
        }
        
        return $scores;
    }

    /**
     * Obtient le score pour une langue spécifique
     */
    protected function getLanguageScore(int $platformId, int $countryId, string $langCode): float
    {
        $language = $this->getLanguageByCode($langCode);
        if (!$language) return 0;
        
        $publishedCount = Article::where('platform_id', $platformId)
            ->where('country_id', $countryId)
            ->where('language_id', $language->id)
            ->where('status', Article::STATUS_PUBLISHED)
            ->count();
        
        return min(100, ($publishedCount / 50) * 100);
    }

    // =========================================================================
    // RECOMMANDATIONS
    // =========================================================================

    /**
     * Génère les recommandations pour un pays
     */
    protected function generateRecommendations(
        int $platformId, 
        int $countryId, 
        array $recruitmentData, 
        array $awarenessData,
        array $founderData
    ): array {
        $recommendations = [];
        $country = Country::find($countryId);
        
        // Priorité 1: Langues principales manquantes (FR, EN)
        foreach (['fr', 'en'] as $mainLang) {
            $langScore = $this->getLanguageScore($platformId, $countryId, $mainLang);
            if ($langScore < 30) {
                $recommendations[] = [
                    'type' => 'critical',
                    'priority' => 100,
                    'action' => 'generate_content',
                    'language' => $mainLang,
                    'message' => "Créer du contenu de base en " . strtoupper($mainLang),
                    'impact' => '+15-20% de score global',
                    'estimated_articles' => 10,
                ];
            }
        }
        
        // Priorité 2: Thème fondateur manquant
        if ($founderData['score'] < 50) {
            $recommendations[] = [
                'type' => 'high',
                'priority' => 90,
                'action' => 'generate_founder',
                'message' => "Créer des articles sur Williams Jullin (fondateur)",
                'impact' => '+5-10% de score global',
                'estimated_articles' => count(self::LANGUAGES) * 2,
            ];
        }
        
        // Priorité 3: Recrutement critique
        if ($recruitmentData['score'] < 20) {
            $recommendations[] = [
                'type' => 'critical',
                'priority' => 95,
                'action' => 'generate_recruitment',
                'message' => "Recrutement critique: compléter les spécialités/services",
                'impact' => '+20-30% de score recrutement',
                'estimated_articles' => 20,
            ];
        }
        
        // Priorité 4: Spécialités/Services manquants
        if ($platformId === self::PLATFORM_SOS_EXPAT) {
            foreach ($recruitmentData['breakdown']['lawyer_specialties']['details'] ?? [] as $specialty) {
                if ($specialty['progress'] < 30) {
                    $recommendations[] = [
                        'type' => 'high',
                        'priority' => 80,
                        'action' => 'generate_specialty',
                        'target_type' => 'lawyer_specialty',
                        'target_id' => $specialty['id'],
                        'target_name' => $specialty['name'],
                        'message' => "Compléter: {$specialty['name']}",
                        'missing_languages' => array_keys(array_filter(
                            $specialty['languages'], 
                            fn($l) => !$l['completed']
                        )),
                        'impact' => '+5-10% de score recrutement',
                    ];
                    
                    if (count($recommendations) > 10) break;
                }
            }
        }
        
        // Priorité 5: Notoriété insuffisante
        if ($awarenessData['score'] < 30) {
            $recommendations[] = [
                'type' => 'medium',
                'priority' => 60,
                'action' => 'generate_awareness',
                'message' => "Améliorer la notoriété avec des pillar articles",
                'impact' => '+10-15% de score notoriété',
                'suggested_types' => ['pillar', 'comparative', 'landing'],
            ];
        }
        
        // Priorité 6: Langues secondaires
        foreach (['de', 'es', 'pt'] as $secondaryLang) {
            $langScore = $this->getLanguageScore($platformId, $countryId, $secondaryLang);
            if ($langScore < 20) {
                $recommendations[] = [
                    'type' => 'low',
                    'priority' => 40,
                    'action' => 'translate_content',
                    'language' => $secondaryLang,
                    'message' => "Traduire le contenu en " . strtoupper($secondaryLang),
                    'impact' => '+5-8% de score global',
                ];
            }
        }
        
        // Trier par priorité et limiter à 10
        usort($recommendations, fn($a, $b) => $b['priority'] - $a['priority']);
        
        return array_slice($recommendations, 0, 10);
    }

    // =========================================================================
    // PRIORITÉ & STATUT
    // =========================================================================

    /**
     * Calcule le score de priorité pour un pays
     */
    protected function calculatePriorityScore(
        Country $country, 
        float $overallScore, 
        array $recruitmentData, 
        array $awarenessData,
        array $founderData
    ): int {
        $priority = 50;
        
        // Facteur 1: Plus le score est bas, plus c'est prioritaire
        $priority += (100 - $overallScore) * 0.3;
        
        // Facteur 2: Pays avec population d'expatriés importante
        $highPriorityCountries = [
            'FR', 'US', 'GB', 'DE', 'ES', 'CA', 'AU', 'CH', 'BE', 'AE', 
            'SG', 'TH', 'PT', 'NL', 'IT', 'JP', 'HK', 'NZ', 'IE', 'LU'
        ];
        if (in_array($country->code, $highPriorityCountries)) {
            $priority += 20;
        }
        
        // Facteur 3: Recrutement critique manquant
        if ($recruitmentData['score'] < 20) {
            $priority += 15;
        }
        
        // Facteur 4: Fondateur manquant
        if ($founderData['score'] < 50) {
            $priority += 10;
        }
        
        // Facteur 5: Langues principales manquantes
        if (($recruitmentData['breakdown']['lawyer_specialties']['details'][0]['languages']['fr']['completed'] ?? false) === false) {
            $priority += 10;
        }
        
        return min(100, max(0, (int) $priority));
    }

    /**
     * Obtient le statut basé sur le score
     */
    protected function getStatusFromScore(float $score): string
    {
        if ($score >= 80) return 'excellent';
        if ($score >= 60) return 'good';
        if ($score >= 40) return 'partial';
        if ($score >= 20) return 'minimal';
        return 'missing';
    }

    /**
     * Retourne un score vide pour un pays inexistant
     */
    protected function getEmptyCountryScore(int $countryId): array
    {
        return [
            'country_id' => $countryId,
            'country_name' => 'Unknown',
            'country_code' => '',
            'region' => '',
            'recruitment_score' => 0,
            'awareness_score' => 0,
            'founder_score' => 0,
            'overall_score' => 0,
            'recruitment_breakdown' => [],
            'awareness_breakdown' => [],
            'founder_breakdown' => [],
            'language_scores' => [],
            'total_articles' => 0,
            'published_articles' => 0,
            'unpublished_articles' => 0,
            'total_targets' => 0,
            'completed_targets' => 0,
            'missing_targets' => 0,
            'priority_score' => 0,
            'recommendations' => [],
            'status' => 'missing',
        ];
    }

    // =========================================================================
    // MÉTHODES PUBLIQUES
    // =========================================================================

    /**
     * Obtient les détails complets pour un pays
     */
    public function getCountryDetails(int $platformId, int $countryId): array
    {
        $baseScore = $this->calculateCountryScore($platformId, $countryId);
        
        // Ajouter les détails des articles récents
        $articles = Article::where('platform_id', $platformId)
            ->where('country_id', $countryId)
            ->with(['language'])
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get()
            ->map(fn($a) => [
                'id' => $a->id,
                'title' => $a->title,
                'type' => $a->type,
                'language' => $a->language?->code,
                'theme_type' => $a->theme_type,
                'status' => $a->status,
                'is_published' => $a->status === Article::STATUS_PUBLISHED,
                'published_at' => $a->published_at?->toISOString(),
                'created_at' => $a->created_at?->toISOString(),
            ]);
        
        return array_merge($baseScore, [
            'recent_articles' => $articles,
        ]);
    }

    /**
     * Obtient la liste de tous les pays avec leurs scores
     */
    public function getAllCountriesWithScores(int $platformId, array $filters = []): Collection
    {
        $countries = Country::orderBy('name')->get();
        
        $results = $countries->map(function ($country) use ($platformId) {
            $score = $this->calculateCountryScore($platformId, $country->id);
            return [
                'id' => $country->id,
                'name' => $country->name,
                'code' => $country->code,
                'region' => $country->region,
                'recruitment_score' => $score['recruitment_score'],
                'awareness_score' => $score['awareness_score'],
                'founder_score' => $score['founder_score'],
                'overall_score' => $score['overall_score'],
                'status' => $score['status'],
                'priority_score' => $score['priority_score'],
                'total_articles' => $score['total_articles'],
                'published_articles' => $score['published_articles'],
                'unpublished_articles' => $score['unpublished_articles'],
                'missing_targets' => $score['missing_targets'],
            ];
        });
        
        // Appliquer les filtres
        if (!empty($filters['region'])) {
            $results = $results->filter(fn($c) => strtolower($c['region']) === strtolower($filters['region']));
        }
        
        if (!empty($filters['status'])) {
            $results = $results->filter(fn($c) => $c['status'] === $filters['status']);
        }
        
        if (!empty($filters['search'])) {
            $search = strtolower($filters['search']);
            $results = $results->filter(fn($c) => 
                str_contains(strtolower($c['name']), $search) || 
                str_contains(strtolower($c['code']), $search)
            );
        }
        
        // Trier
        $sortBy = $filters['sort_by'] ?? 'priority_score';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        
        if ($sortOrder === 'desc') {
            $results = $results->sortByDesc($sortBy);
        } else {
            $results = $results->sortBy($sortBy);
        }
        
        return $results->values();
    }

    /**
     * Obtient les statistiques par langue
     */
    public function getLanguageStats(int $platformId): array
    {
        $stats = [];
        
        foreach (self::LANGUAGES as $langCode) {
            $language = $this->getLanguageByCode($langCode);
            if (!$language) continue;
            
            $publishedCount = Article::where('platform_id', $platformId)
                ->where('language_id', $language->id)
                ->where('status', Article::STATUS_PUBLISHED)
                ->count();
            
            $totalCount = Article::where('platform_id', $platformId)
                ->where('language_id', $language->id)
                ->count();
            
            $countriesCovered = Article::where('platform_id', $platformId)
                ->where('language_id', $language->id)
                ->where('status', Article::STATUS_PUBLISHED)
                ->distinct('country_id')
                ->count('country_id');
            
            $stats[$langCode] = [
                'language_id' => $language->id,
                'language_code' => $langCode,
                'language_name' => $language->name,
                'total_articles' => $totalCount,
                'published_articles' => $publishedCount,
                'unpublished_articles' => $totalCount - $publishedCount,
                'countries_covered' => $countriesCovered,
                'coverage_percent' => round(($countriesCovered / 197) * 100, 2),
            ];
        }
        
        return $stats;
    }

    /**
     * Génère les recommandations globales
     */
    public function getGlobalRecommendations(int $platformId, int $limit = 20): array
    {
        $allRecommendations = [];
        
        // Obtenir les pays prioritaires
        $countries = $this->getAllCountriesWithScores($platformId)
            ->sortByDesc('priority_score')
            ->take(30);
        
        foreach ($countries as $country) {
            $score = $this->calculateCountryScore($platformId, $country['id']);
            foreach ($score['recommendations'] as $rec) {
                $rec['country_id'] = $country['id'];
                $rec['country_name'] = $country['name'];
                $rec['country_code'] = $country['code'];
                $allRecommendations[] = $rec;
            }
        }
        
        // Trier par priorité et dédupliquer
        usort($allRecommendations, fn($a, $b) => $b['priority'] - $a['priority']);
        
        return array_slice($allRecommendations, 0, $limit);
    }

    /**
     * Invalide le cache pour un pays ou globalement
     */
    public function invalidateCache(int $platformId, ?int $countryId = null): void
    {
        if ($countryId) {
            Cache::forget("coverage.country.{$platformId}.{$countryId}");
        }
        Cache::forget("coverage.global.{$platformId}");
    }

    /**
     * Invalide tout le cache de couverture
     */
    public function invalidateAllCache(): void
    {
        foreach ([self::PLATFORM_SOS_EXPAT, self::PLATFORM_ULIXAI] as $platformId) {
            Cache::forget("coverage.global.{$platformId}");
            
            $countries = Country::all();
            foreach ($countries as $country) {
                Cache::forget("coverage.country.{$platformId}.{$country->id}");
            }
        }
    }
}
