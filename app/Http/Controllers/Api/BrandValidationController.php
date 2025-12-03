<?php
/**
 * =============================================================================
 * FICHIER 10/10 : BrandValidationController - API REST
 * =============================================================================
 * 
 * EMPLACEMENT : app/Http/Controllers/Api/BrandValidationController.php
 * 
 * ROUTES À AJOUTER : routes/api.php
 * 
 * Route::prefix('brand')->group(function () {
 *     Route::post('/validate', [BrandValidationController::class, 'validate']);
 *     Route::get('/stats/{platformId}', [BrandValidationController::class, 'platformStats']);
 * });
 * 
 * =============================================================================
 */

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Platform;
use App\Models\Article;
use App\Services\Content\BrandValidationService;
use App\Services\Content\PlatformKnowledgeService;
use Illuminate\Support\Facades\Validator;

class BrandValidationController extends Controller
{
    /**
     * Valide un contenu contre les règles brand
     * 
     * POST /api/brand/validate
     * 
     * Body: {
     *   "content": "Texte à valider",
     *   "platform_id": 1,
     *   "language_code": "fr"
     * }
     */
    public function validate(
        Request $request,
        BrandValidationService $brandValidator,
        PlatformKnowledgeService $knowledgeService
    ): JsonResponse {
        // Validation request
        $validator = Validator::make($request->all(), [
            'content' => 'required|string|min:10',
            'platform_id' => 'required|exists:platforms,id',
            'language_code' => 'required|string|size:2|in:fr,en,de,ru,zh,es,pt,ar,hi',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }
        
        $validated = $validator->validated();
        
        try {
            $platform = Platform::findOrFail($validated['platform_id']);
            
            // Validation knowledge
            $knowledgeValidation = $knowledgeService->validateContent(
                $validated['content'],
                $platform,
                $validated['language_code']
            );
            
            // Validation brand
            $brandValidation = $brandValidator->validateCompliance(
                $validated['content'],
                $platform,
                $validated['language_code']
            );
            
            // Score global
            $globalScore = ($knowledgeValidation['score'] + $brandValidation['score']) / 2;
            
            return response()->json([
                'success' => true,
                'compliant' => $globalScore >= 70 && $knowledgeValidation['valid'] && $brandValidation['compliant'],
                'global_score' => round($globalScore, 1),
                'validations' => [
                    'knowledge' => [
                        'score' => $knowledgeValidation['score'],
                        'valid' => $knowledgeValidation['valid'],
                        'errors' => $knowledgeValidation['errors'],
                        'warnings' => $knowledgeValidation['warnings'],
                    ],
                    'brand' => [
                        'score' => $brandValidation['score'],
                        'compliant' => $brandValidation['compliant'],
                        'errors' => $brandValidation['errors'],
                        'warnings' => $brandValidation['warnings'],
                    ],
                ],
                'recommendation' => $this->getRecommendation($globalScore, $knowledgeValidation, $brandValidation),
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la validation',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Statistiques de conformité brand pour une plateforme
     * 
     * GET /api/brand/stats/{platformId}
     * Query params: ?days=30&status=published
     */
    public function platformStats(
        int $platformId,
        Request $request,
        BrandValidationService $brandValidator,
        PlatformKnowledgeService $knowledgeService
    ): JsonResponse {
        try {
            $platform = Platform::findOrFail($platformId);
            
            $days = $request->query('days', 30);
            $status = $request->query('status', 'published');
            
            // Récupérer articles
            $articles = Article::where('platform_id', $platformId)
                ->where('status', $status)
                ->where('created_at', '>=', now()->subDays($days))
                ->limit(100) // Limiter pour performance
                ->get();
            
            if ($articles->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'platform' => $platform->name,
                    'period' => "{$days} derniers jours",
                    'total_articles' => 0,
                    'message' => 'Aucun article trouvé pour cette période',
                ]);
            }
            
            // Calculer stats
            $stats = [
                'total' => $articles->count(),
                'compliant' => 0,
                'review_needed' => 0,
                'avg_global_score' => 0,
                'avg_knowledge_score' => 0,
                'avg_brand_score' => 0,
                'common_errors' => [],
            ];
            
            $allErrors = [];
            
            foreach ($articles as $article) {
                // Validation
                $knowledgeValidation = $knowledgeService->validateContent(
                    $article->content,
                    $platform,
                    $article->language->code
                );
                
                $brandValidation = $brandValidator->validateCompliance(
                    $article->content,
                    $platform,
                    $article->language->code
                );
                
                $globalScore = ($knowledgeValidation['score'] + $brandValidation['score']) / 2;
                
                // Accumuler stats
                $stats['avg_global_score'] += $globalScore;
                $stats['avg_knowledge_score'] += $knowledgeValidation['score'];
                $stats['avg_brand_score'] += $brandValidation['score'];
                
                if ($globalScore >= 70 && $brandValidation['compliant'] && $knowledgeValidation['valid']) {
                    $stats['compliant']++;
                } else {
                    $stats['review_needed']++;
                }
                
                // Collecter erreurs
                $allErrors = array_merge(
                    $allErrors,
                    $knowledgeValidation['errors'],
                    $brandValidation['errors']
                );
            }
            
            // Calculer moyennes
            $stats['avg_global_score'] = round($stats['avg_global_score'] / $stats['total'], 1);
            $stats['avg_knowledge_score'] = round($stats['avg_knowledge_score'] / $stats['total'], 1);
            $stats['avg_brand_score'] = round($stats['avg_brand_score'] / $stats['total'], 1);
            
            // Identifier erreurs les plus fréquentes
            $errorCounts = array_count_values(array_map(function($error) {
                // Extraire type d'erreur (ignorer détails spécifiques)
                if (str_contains($error, 'Tutoiement')) return 'Tutoiement détecté';
                if (str_contains($error, 'Phrase') && str_contains($error, 'longue')) return 'Phrases trop longues';
                if (str_contains($error, 'Émoji')) return 'Émojis interdits';
                if (str_contains($error, 'manquant')) return 'Chiffres clés manquants';
                if (str_contains($error, 'interdit')) return 'Vocabulaire interdit';
                return 'Autre';
            }, $allErrors));
            
            arsort($errorCounts);
            $stats['common_errors'] = array_slice($errorCounts, 0, 5, true);
            
            return response()->json([
                'success' => true,
                'platform' => $platform->name,
                'period' => "{$days} derniers jours",
                'stats' => $stats,
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors du calcul des statistiques',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Génère une recommandation basée sur les résultats de validation
     */
    private function getRecommendation(
        float $globalScore,
        array $knowledgeValidation,
        array $brandValidation
    ): string {
        if ($globalScore >= 90) {
            return '✅ Excellent ! Contenu parfaitement conforme.';
        }
        
        if ($globalScore >= 70) {
            return '✅ Bon. Contenu conforme avec quelques améliorations possibles.';
        }
        
        if ($globalScore >= 50) {
            $issues = [];
            if (!empty($knowledgeValidation['errors'])) {
                $issues[] = 'chiffres clés';
            }
            if (!empty($brandValidation['errors'])) {
                $issues[] = 'ton/style';
            }
            
            return '⚠️ Révision recommandée. Problèmes : ' . implode(', ', $issues) . '.';
        }
        
        return '❌ Révision obligatoire. Score trop faible, nombreuses non-conformités.';
    }
}