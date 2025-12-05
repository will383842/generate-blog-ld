<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\ArticleTranslation;
use App\Models\PressRelease;
use App\Models\PressReleaseTranslation;
use App\Models\PressDossier;
use App\Models\PressDossierTranslation;
use App\Models\DossierSectionTranslation;
use App\Models\Language;
use App\Services\Translation\TranslationService;
use App\Services\AI\GptService;
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
    protected GptService $gpt;

    public function __construct(TranslationService $translationService, GptService $gpt)
    {
        $this->translationService = $translationService;
        $this->gpt = $gpt;
    }

    /**
     * Translate content
     * ✅ CORRECTION: Support polymorphique
     */
    public function translate(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'content_type' => 'required|in:Article,PillarArticle,PressRelease,PressDossier',
                'content_id' => 'required|integer|min:1',
                'target_languages' => 'array',
                'target_languages.*' => 'string|size:2|exists:languages,code',
            ]);

            // Charger le contenu
            $content = $this->loadContent($request->content_type, $request->content_id);

            if (!$content) {
                return response()->json([
                    'error' => 'Content not found'
                ], 404);
            }

            // Langues cibles
            $targetLanguages = $request->target_languages ?? 
                Language::where('active', true)
                        ->where('code', '!=', 'fr')
                        ->pluck('code')
                        ->toArray();

            // Traduire selon le type
            $translations = match ($request->content_type) {
                'Article', 'PillarArticle' => $this->translateArticle($content, $targetLanguages),
                'PressRelease' => $this->translatePressRelease($content, $targetLanguages),
                'PressDossier' => $this->translateDossier($content, $targetLanguages),
                default => throw new \Exception('Unsupported content type')
            };

            return response()->json([
                'message' => 'Translation completed',
                'content_type' => $request->content_type,
                'content_id' => $request->content_id,
                'translations_count' => count($translations),
                'languages' => array_column($translations, 'language_code'),
            ]);

        } catch (\Exception $e) {
            Log::error('Translation failed', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'error' => 'Translation failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Translate Article
     */
    protected function translateArticle(Article $article, array $targetLanguages): array
    {
        $translations = [];

        foreach ($targetLanguages as $langCode) {
            // Skip si déjà traduit
            $existing = ArticleTranslation::where('article_id', $article->id)
                ->whereHas('language', fn($q) => $q->where('code', $langCode))
                ->first();

            if ($existing) {
                continue;
            }

            try {
                $translation = $this->translationService->translateArticle($article, $langCode);
                $translations[] = $translation;
            } catch (\Exception $e) {
                Log::error("Translation failed for Article {$article->id} to {$langCode}", [
                    'error' => $e->getMessage()
                ]);
            }
        }

        return $translations;
    }

    /**
     * Translate Press Release
     */
    protected function translatePressRelease(PressRelease $pressRelease, array $targetLanguages): array
    {
        $translations = [];

        foreach ($targetLanguages as $langCode) {
            // Skip si déjà traduit
            if ($pressRelease->hasTranslation($langCode)) {
                continue;
            }

            try {
                // Traduire avec GPT-4
                $translatedTitle = $this->gpt->translate($pressRelease->title, 'fr', $langCode);
                $translatedLead = $this->gpt->translate($pressRelease->lead, 'fr', $langCode);
                $translatedBody1 = $pressRelease->body1 ? 
                    $this->gpt->translate($pressRelease->body1, 'fr', $langCode) : null;
                $translatedBody2 = $pressRelease->body2 ? 
                    $this->gpt->translate($pressRelease->body2, 'fr', $langCode) : null;
                $translatedBody3 = $pressRelease->body3 ? 
                    $this->gpt->translate($pressRelease->body3, 'fr', $langCode) : null;
                $translatedBoilerplate = $pressRelease->boilerplate ? 
                    $this->gpt->translate($pressRelease->boilerplate, 'fr', $langCode) : null;

                // Créer traduction
                $translation = PressReleaseTranslation::create([
                    'press_release_id' => $pressRelease->id,
                    'language_code' => $langCode,
                    'title' => $translatedTitle,
                    'lead' => $translatedLead,
                    'body1' => $translatedBody1,
                    'body2' => $translatedBody2,
                    'body3' => $translatedBody3,
                    'boilerplate' => $translatedBoilerplate,
                    'meta_title' => substr($translatedTitle, 0, 60),
                    'meta_description' => substr($translatedLead, 0, 160),
                    'translation_status' => 'completed',
                ]);

                $translations[] = $translation;

                sleep(1); // Rate limiting

            } catch (\Exception $e) {
                Log::error("Translation failed for PressRelease {$pressRelease->id} to {$langCode}", [
                    'error' => $e->getMessage()
                ]);
            }
        }

        return $translations;
    }

    /**
     * Translate Dossier
     */
    protected function translateDossier(PressDossier $dossier, array $targetLanguages): array
    {
        $translations = [];

        foreach ($targetLanguages as $langCode) {
            // Skip si déjà traduit
            if ($dossier->hasTranslation($langCode)) {
                continue;
            }

            try {
                // Traduire dossier principal
                $translatedTitle = $this->gpt->translate($dossier->title, 'fr', $langCode);
                $translatedDescription = $dossier->description ? 
                    $this->gpt->translate($dossier->description, 'fr', $langCode) : null;

                $translation = PressDossierTranslation::create([
                    'press_dossier_id' => $dossier->id,
                    'language_code' => $langCode,
                    'title' => $translatedTitle,
                    'description' => $translatedDescription,
                    'meta_title' => substr($translatedTitle, 0, 60),
                    'meta_description' => substr($translatedDescription ?? $translatedTitle, 0, 160),
                    'translation_status' => 'completed',
                ]);

                $translations[] = $translation;

                // Traduire sections
                foreach ($dossier->sections as $section) {
                    $translatedSectionTitle = $this->gpt->translate($section->title, 'fr', $langCode);
                    $translatedSectionContent = $this->gpt->translate($section->content, 'fr', $langCode);

                    DossierSectionTranslation::create([
                        'dossier_section_id' => $section->id,
                        'language_code' => $langCode,
                        'title' => $translatedSectionTitle,
                        'content' => $translatedSectionContent,
                        'translation_status' => 'completed',
                    ]);

                    sleep(1); // Rate limiting
                }

            } catch (\Exception $e) {
                Log::error("Translation failed for Dossier {$dossier->id} to {$langCode}", [
                    'error' => $e->getMessage()
                ]);
            }
        }

        return $translations;
    }

    /**
     * Charger contenu par type
     */
    protected function loadContent(string $contentType, int $contentId)
    {
        return match ($contentType) {
            'Article' => Article::where('type', 'article')->find($contentId),
            'PillarArticle' => Article::where('type', 'pillar')->find($contentId),
            'PressRelease' => PressRelease::find($contentId),
            'PressDossier' => PressDossier::with('sections')->find($contentId),
            default => null
        };
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
            
            $allLanguages = Language::pluck('code')->toArray();
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