<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Coverage\CoverageAnalysisService;
use App\Models\Country;
use App\Models\Language;
use App\Models\LawyerSpecialty;
use App\Models\ExpatDomain;
use App\Models\UlixaiService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * INTELLIGENT COVERAGE API CONTROLLER
 * 
 * Endpoints pour le système de couverture intelligent
 * Supporte SOS-Expat, Ulixai et le thème Williams Jullin
 */
class IntelligentCoverageController extends Controller
{
    protected CoverageAnalysisService $coverageService;

    public function __construct(CoverageAnalysisService $coverageService)
    {
        $this->coverageService = $coverageService;
    }

    /**
     * GET /api/admin/coverage/intelligent/dashboard
     * 
     * Tableau de bord global avec statistiques
     */
    public function dashboard(Request $request): JsonResponse
    {
        $platformId = $request->input('platform_id', 1);
        
        try {
            $data = $this->coverageService->calculateGlobalCoverage($platformId);
            
            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du calcul de la couverture',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/admin/coverage/intelligent/countries
     * 
     * Liste de tous les pays avec leurs scores
     */
    public function countries(Request $request): JsonResponse
    {
        $platformId = $request->input('platform_id', 1);
        
        $filters = [
            'region' => $request->input('region'),
            'status' => $request->input('status'),
            'search' => $request->input('search'),
            'sort_by' => $request->input('sort_by', 'priority_score'),
            'sort_order' => $request->input('sort_order', 'desc'),
        ];
        
        try {
            $countries = $this->coverageService->getAllCountriesWithScores($platformId, $filters);
            
            // Pagination optionnelle
            $perPage = $request->input('per_page', 250);
            $page = $request->input('page', 1);
            
            if ($perPage < 250) {
                $offset = ($page - 1) * $perPage;
                $paginatedData = $countries->slice($offset, $perPage)->values();
                
                return response()->json([
                    'success' => true,
                    'data' => $paginatedData,
                    'meta' => [
                        'current_page' => $page,
                        'per_page' => $perPage,
                        'total' => $countries->count(),
                        'last_page' => ceil($countries->count() / $perPage),
                    ],
                ]);
            }
            
            return response()->json([
                'success' => true,
                'data' => $countries,
                'meta' => [
                    'total' => $countries->count(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des pays',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/admin/coverage/intelligent/countries/{countryId}
     * 
     * Détails complets d'un pays
     */
    public function countryDetails(Request $request, int $countryId): JsonResponse
    {
        $platformId = $request->input('platform_id', 1);
        
        try {
            $data = $this->coverageService->getCountryDetails($platformId, $countryId);
            
            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des détails du pays',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/admin/coverage/intelligent/countries/{countryId}/recruitment
     * 
     * Détails du recrutement pour un pays
     */
    public function countryRecruitment(Request $request, int $countryId): JsonResponse
    {
        $platformId = $request->input('platform_id', 1);
        
        try {
            $score = $this->coverageService->calculateCountryScore($platformId, $countryId);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'country_id' => $countryId,
                    'recruitment_score' => $score['recruitment_score'],
                    'breakdown' => $score['recruitment_breakdown'],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/admin/coverage/intelligent/countries/{countryId}/awareness
     * 
     * Détails de la notoriété pour un pays
     */
    public function countryAwareness(Request $request, int $countryId): JsonResponse
    {
        $platformId = $request->input('platform_id', 1);
        
        try {
            $score = $this->coverageService->calculateCountryScore($platformId, $countryId);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'country_id' => $countryId,
                    'awareness_score' => $score['awareness_score'],
                    'breakdown' => $score['awareness_breakdown'],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/admin/coverage/intelligent/countries/{countryId}/founder
     * 
     * Détails du thème fondateur (Williams Jullin) pour un pays
     */
    public function countryFounder(Request $request, int $countryId): JsonResponse
    {
        try {
            $score = $this->coverageService->calculateCountryScore(1, $countryId);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'country_id' => $countryId,
                    'founder_score' => $score['founder_score'],
                    'breakdown' => $score['founder_breakdown'],
                    'founder_name' => 'Williams Jullin',
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/admin/coverage/intelligent/founder
     * 
     * Couverture globale du thème fondateur (Williams Jullin)
     */
    public function founderGlobal(): JsonResponse
    {
        try {
            $data = $this->coverageService->getFounderCoverageGlobal();
            
            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/admin/coverage/intelligent/languages
     * 
     * Statistiques par langue
     */
    public function languages(Request $request): JsonResponse
    {
        $platformId = $request->input('platform_id', 1);
        
        try {
            $stats = $this->coverageService->getLanguageStats($platformId);
            
            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/admin/coverage/intelligent/specialties
     * 
     * Liste des spécialités/services avec leur couverture
     */
    public function specialties(Request $request): JsonResponse
    {
        $platformId = $request->input('platform_id', 1);
        $type = $request->input('type'); // lawyer_specialty, expat_domain, ulixai_service
        
        try {
            $data = [];
            
            if (!$type || $type === 'lawyer_specialty') {
                $data['lawyer_specialties'] = LawyerSpecialty::where('is_active', true)
                    ->orderBy('order')
                    ->get()
                    ->map(fn($s) => [
                        'id' => $s->id,
                        'code' => $s->code,
                        'name' => $s->name_fr,
                        'category' => $s->category_code,
                        'icon' => $s->icon,
                    ]);
            }
            
            if (!$type || $type === 'expat_domain') {
                $data['expat_domains'] = ExpatDomain::where('is_active', true)
                    ->orderBy('order')
                    ->get()
                    ->map(fn($d) => [
                        'id' => $d->id,
                        'code' => $d->code,
                        'name' => $d->name_fr,
                        'icon' => $d->icon,
                    ]);
            }
            
            if (!$type || $type === 'ulixai_service') {
                $data['ulixai_services'] = UlixaiService::where('is_active', true)
                    ->whereDoesntHave('children')
                    ->orderBy('order')
                    ->get()
                    ->map(fn($s) => [
                        'id' => $s->id,
                        'code' => $s->code,
                        'name' => $s->name_fr,
                        'parent_id' => $s->parent_id,
                        'level' => $s->level,
                    ]);
            }
            
            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/admin/coverage/intelligent/recommendations
     * 
     * Recommandations globales prioritaires
     */
    public function recommendations(Request $request): JsonResponse
    {
        $platformId = $request->input('platform_id', 1);
        $limit = $request->input('limit', 20);
        $priority = $request->input('priority'); // critical, high, medium, low
        
        try {
            $recommendations = $this->coverageService->getGlobalRecommendations($platformId, $limit);
            
            // Filtrer par priorité si demandé
            if ($priority) {
                $recommendations = array_filter($recommendations, fn($r) => $r['type'] === $priority);
                $recommendations = array_values($recommendations);
            }
            
            return response()->json([
                'success' => true,
                'data' => $recommendations,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/admin/coverage/intelligent/matrix
     * 
     * Matrice pays × langues
     */
    public function matrix(Request $request): JsonResponse
    {
        $platformId = $request->input('platform_id', 1);
        $type = $request->input('type', 'language'); // language, specialty
        $region = $request->input('region');
        
        try {
            $countries = $this->coverageService->getAllCountriesWithScores($platformId, [
                'region' => $region,
            ]);
            
            // Limiter à 50 pays pour la matrice
            $countries = $countries->take(50);
            
            $languages = CoverageAnalysisService::LANGUAGES;
            
            $matrix = [];
            foreach ($countries as $country) {
                $row = [
                    'country_id' => $country['id'],
                    'country_name' => $country['name'],
                    'country_code' => $country['code'],
                    'overall_score' => $country['overall_score'],
                    'cells' => [],
                ];
                
                $score = $this->coverageService->calculateCountryScore($platformId, $country['id']);
                
                foreach ($languages as $lang) {
                    $langScore = $score['language_scores'][$lang] ?? null;
                    $row['cells'][$lang] = [
                        'score' => $langScore['score'] ?? 0,
                        'published' => $langScore['published_articles'] ?? 0,
                        'total' => $langScore['total_articles'] ?? 0,
                        'status' => $langScore['status'] ?? 'missing',
                    ];
                }
                
                $matrix[] = $row;
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'type' => $type,
                    'columns' => $languages,
                    'rows' => $matrix,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/admin/coverage/intelligent/generate
     * 
     * Prépare un plan de génération de contenu
     */
    public function generate(Request $request): JsonResponse
    {
        $request->validate([
            'platform_id' => 'required|integer|in:1,2',
            'country_ids' => 'required|array',
            'country_ids.*' => 'integer|exists:countries,id',
            'languages' => 'required|array',
            'languages.*' => 'string|in:fr,en,de,es,pt,ru,zh,ar,hi',
            'content_types' => 'required|array',
            'content_types.*' => 'string|in:recruitment,awareness,founder',
        ]);
        
        try {
            $tasks = [];
            $totalCost = 0;
            
            foreach ($request->country_ids as $countryId) {
                $country = Country::find($countryId);
                if (!$country) continue;
                
                $score = $this->coverageService->calculateCountryScore(
                    $request->platform_id, 
                    $countryId
                );
                
                foreach ($request->languages as $lang) {
                    foreach ($request->content_types as $contentType) {
                        // Vérifier ce qui manque
                        if ($contentType === 'recruitment') {
                            $langScore = $score['language_scores'][$lang] ?? null;
                            if (!$langScore || $langScore['score'] < 80) {
                                $tasks[] = [
                                    'country_id' => $countryId,
                                    'country_name' => $country->name,
                                    'country_code' => $country->code,
                                    'language' => $lang,
                                    'content_type' => $contentType,
                                    'priority' => $score['priority_score'],
                                    'estimated_cost' => 0.15,
                                    'status' => 'pending',
                                ];
                                $totalCost += 0.15;
                            }
                        } else if ($contentType === 'awareness') {
                            $tasks[] = [
                                'country_id' => $countryId,
                                'country_name' => $country->name,
                                'country_code' => $country->code,
                                'language' => $lang,
                                'content_type' => $contentType,
                                'priority' => $score['priority_score'],
                                'estimated_cost' => 0.20,
                                'status' => 'pending',
                            ];
                            $totalCost += 0.20;
                        } else if ($contentType === 'founder') {
                            $founderScore = $score['founder_breakdown'][$lang] ?? null;
                            if (!$founderScore || !$founderScore['sos_expat']['completed'] || !$founderScore['ulixai']['completed']) {
                                $tasks[] = [
                                    'country_id' => $countryId,
                                    'country_name' => $country->name,
                                    'country_code' => $country->code,
                                    'language' => $lang,
                                    'content_type' => $contentType,
                                    'target_name' => 'Williams Jullin',
                                    'priority' => 90,
                                    'estimated_cost' => 0.25,
                                    'status' => 'pending',
                                ];
                                $totalCost += 0.25;
                            }
                        }
                    }
                }
            }
            
            // Trier par priorité
            usort($tasks, fn($a, $b) => $b['priority'] - $a['priority']);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'tasks' => $tasks,
                    'summary' => [
                        'total_tasks' => count($tasks),
                        'total_countries' => count(array_unique(array_column($tasks, 'country_id'))),
                        'total_languages' => count(array_unique(array_column($tasks, 'language'))),
                        'estimated_cost' => round($totalCost, 2),
                        'estimated_duration' => count($tasks) * 2 . ' minutes',
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la préparation de la génération',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/admin/coverage/intelligent/export
     * 
     * Exporte les données de couverture
     */
    public function export(Request $request): JsonResponse
    {
        $platformId = $request->input('platform_id', 1);
        $format = $request->input('format', 'json');
        
        try {
            $data = $this->coverageService->calculateGlobalCoverage($platformId);
            
            if ($format === 'csv') {
                // Retourner URL de téléchargement CSV
                return response()->json([
                    'success' => true,
                    'data' => [
                        'format' => 'csv',
                        'message' => 'Export CSV en cours de préparation',
                        'download_url' => null, // À implémenter
                    ],
                ]);
            }
            
            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/admin/coverage/intelligent/invalidate-cache
     * 
     * Invalide le cache de couverture
     */
    public function invalidateCache(Request $request): JsonResponse
    {
        $platformId = $request->input('platform_id');
        $countryId = $request->input('country_id');
        
        try {
            if ($platformId && $countryId) {
                $this->coverageService->invalidateCache($platformId, $countryId);
                $message = "Cache invalidé pour la plateforme {$platformId} et le pays {$countryId}";
            } else if ($platformId) {
                $this->coverageService->invalidateCache($platformId);
                $message = "Cache invalidé pour la plateforme {$platformId}";
            } else {
                $this->coverageService->invalidateAllCache();
                $message = "Tout le cache de couverture a été invalidé";
            }
            
            return response()->json([
                'success' => true,
                'message' => $message,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'invalidation du cache',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
