<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\ArticleTranslation;
use App\Services\Translation\TranslationService;
use App\Jobs\TranslateArticle;
use App\Jobs\TranslateAllLanguages;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

/**
 * TranslationController - Gestion des traductions
 */
class TranslationController extends Controller
{
    protected TranslationService $translationService;

    public function __construct(TranslationService $translationService)
    {
        $this->translationService = $translationService;
    }

    /**
     * Traduire un article dans une langue
     * 
     * POST /api/articles/{id}/translate
     */
    public function translate(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'target_lang' => 'required|string|size:2|exists:languages,code',
            'async' => 'nullable|boolean',
        ]);

        try {
            $article = Article::findOrFail($id);
            $targetLang = $request->target_lang;
            $async = $request->get('async', true);

            // Vérifier si traduction existe déjà
            $existing = ArticleTranslation::where('article_id', $id)
                ->whereHas('language', fn($q) => $q->where('code', $targetLang))
                ->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'Traduction déjà existante',
                    'data' => [
                        'translation_id' => $existing->id,
                        'language' => $targetLang,
                    ],
                ], 409);
            }

            if ($async) {
                // Traduction asynchrone via job
                TranslateArticle::dispatch($id, $targetLang);

                return response()->json([
                    'success' => true,
                    'message' => 'Traduction en cours de traitement',
                    'data' => [
                        'article_id' => $id,
                        'target_lang' => $targetLang,
                        'status' => 'queued',
                    ],
                ], 202);
            } else {
                // Traduction synchrone
                $translation = $this->translationService->translateArticle($article, $targetLang);

                return response()->json([
                    'success' => true,
                    'message' => 'Article traduit avec succès',
                    'data' => [
                        'translation_id' => $translation->id,
                        'language' => $targetLang,
                        'title' => $translation->title,
                        'slug' => $translation->slug,
                    ],
                ], 201);
            }

        } catch (\Exception $e) {
            Log::error('Erreur traduction article', [
                'article_id' => $id,
                'target_lang' => $request->target_lang,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la traduction',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Traduire un article dans toutes les langues
     * 
     * POST /api/articles/{id}/translate-all
     */
    public function translateAll(int $id): JsonResponse
    {
        try {
            $article = Article::findOrFail($id);

            TranslateAllLanguages::dispatch($id);

            return response()->json([
                'success' => true,
                'message' => 'Traductions en cours de traitement',
                'data' => [
                    'article_id' => $id,
                    'languages_to_translate' => 8,
                    'status' => 'queued',
                ],
            ], 202);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du lancement des traductions',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Retraduire (mise à jour d'une traduction)
     * 
     * POST /api/translations/{id}/retranslate
     */
    public function retranslate(int $id): JsonResponse
    {
        try {
            $translation = ArticleTranslation::with(['article', 'language'])->findOrFail($id);
            
            $article = $translation->article;
            $targetLang = $translation->language->code;

            $translation->delete();

            TranslateArticle::dispatch($article->id, $targetLang);

            return response()->json([
                'success' => true,
                'message' => 'Retraduction en cours',
                'data' => [
                    'article_id' => $article->id,
                    'language' => $targetLang,
                    'status' => 'queued',
                ],
            ], 202);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la retraduction',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtenir les traductions manquantes
     * 
     * GET /api/articles/{id}/missing-translations
     */
    public function missing(int $id): JsonResponse
    {
        try {
            $article = Article::with('translations.language')->findOrFail($id);
            
            $allLanguages = \App\Models\Language::pluck('code')->toArray();
            $existingLangs = $article->translations->pluck('language.code')->toArray();
            
            $sourceLanguage = $article->language->code;
            $allLanguages = array_diff($allLanguages, [$sourceLanguage]);
            
            $missingLangs = array_diff($allLanguages, $existingLangs);

            return response()->json([
                'success' => true,
                'data' => [
                    'article_id' => $id,
                    'source_language' => $sourceLanguage,
                    'missing_languages' => array_values($missingLangs),
                    'missing_count' => count($missingLangs),
                    'existing_count' => count($existingLangs),
                    'total_languages' => count($allLanguages),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
