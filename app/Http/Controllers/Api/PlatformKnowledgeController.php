<?php

namespace App\Http\Controllers\Api;

use App\Models\PlatformKnowledge;
use App\Models\Platform;
use App\Services\Content\PlatformKnowledgeService;
use App\Services\AI\GptService; // Pour traduction
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\Controller;

class PlatformKnowledgeController extends Controller
{
    protected PlatformKnowledgeService $knowledgeService;
    protected GptService $gptService;

    public function __construct(
        PlatformKnowledgeService $knowledgeService,
        GptService $gptService
    ) {
        $this->knowledgeService = $knowledgeService;
        $this->gptService = $gptService;
    }

    /**
     * Liste des platform knowledge
     * GET /api/platform-knowledge
     */
    public function index(Request $request): JsonResponse
    {
        $query = PlatformKnowledge::with(['platform', 'translations']);

        // Filtres
        if ($request->has('platform_id')) {
            $query->where('platform_id', $request->platform_id);
        }

        if ($request->has('language_code')) {
            $query->where('language_code', $request->language_code);
        }

        if ($request->has('knowledge_type')) {
            $query->where('knowledge_type', $request->knowledge_type);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $knowledge = $query->orderedByTypePriority()
            ->paginate($request->get('per_page', 50));

        return response()->json($knowledge);
    }

    /**
     * Détail d'un knowledge
     * GET /api/platform-knowledge/{id}
     */
    public function show(int $id): JsonResponse
    {
        $knowledge = PlatformKnowledge::with(['platform', 'translations'])->findOrFail($id);
        
        return response()->json($knowledge);
    }

    /**
     * Créer un knowledge
     * POST /api/platform-knowledge
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'platform_id' => 'required|exists:platforms,id',
            'knowledge_type' => 'required|string|in:' . implode(',', \App\Models\PlatformKnowledge::TYPES),
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'language_code' => 'required|size:2|in:fr,en,es,de,it,pt,ar,zh,hi',
            'priority' => 'nullable|integer|min:0|max:100',
            'is_active' => 'nullable|boolean',
            'use_in_articles' => 'nullable|boolean',
            'use_in_landings' => 'nullable|boolean',
            'use_in_comparatives' => 'nullable|boolean',
            'use_in_pillars' => 'nullable|boolean',
            'use_in_press' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $knowledge = PlatformKnowledge::create($validator->validated());

        return response()->json($knowledge, 201);
    }

    /**
     * Mettre à jour un knowledge
     * PUT /api/platform-knowledge/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $knowledge = PlatformKnowledge::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'platform_id' => 'sometimes|exists:platforms,id',
            'knowledge_type' => 'sometimes|string|in:' . implode(',', \App\Models\PlatformKnowledge::TYPES),
            'title' => 'sometimes|string|max:255',
            'content' => 'sometimes|string',
            'language_code' => 'sometimes|size:2|in:fr,en,es,de,it,pt,ar,zh,hi',
            'priority' => 'nullable|integer|min:0|max:100',
            'is_active' => 'nullable|boolean',
            'use_in_articles' => 'nullable|boolean',
            'use_in_landings' => 'nullable|boolean',
            'use_in_comparatives' => 'nullable|boolean',
            'use_in_pillars' => 'nullable|boolean',
            'use_in_press' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $knowledge->update($validator->validated());

        return response()->json($knowledge);
    }

    /**
     * Supprimer un knowledge
     * DELETE /api/platform-knowledge/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $knowledge = PlatformKnowledge::findOrFail($id);
        $knowledge->delete();

        return response()->json(['message' => 'Knowledge supprimé avec succès']);
    }

    /**
     * Liste knowledge par plateforme
     * GET /api/platform-knowledge/platform/{platformId}
     */
    public function byPlatform(int $platformId): JsonResponse
    {
        $platform = Platform::findOrFail($platformId);

        $knowledge = PlatformKnowledge::where('platform_id', $platformId)
            ->with('translations')
            ->orderedByTypePriority()
            ->get()
            ->groupBy('knowledge_type');

        return response()->json([
            'platform' => $platform,
            'knowledge' => $knowledge,
            'total' => PlatformKnowledge::where('platform_id', $platformId)->count(),
        ]);
    }

    /**
     * Valider un contenu
     * POST /api/platform-knowledge/validate-content
     */
    public function validateContent(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'content' => 'required|string',
            'platform_id' => 'required|exists:platforms,id',
            'language_code' => 'required|size:2|in:fr,en,es,de,it,pt,ar,zh,hi',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $platform = Platform::findOrFail($request->platform_id);

        $validation = $this->knowledgeService->validateContent(
            $request->content,
            $platform,
            $request->language_code
        );

        return response()->json($validation);
    }

    /**
     * Prévisualiser le prompt avec knowledge injecté
     * POST /api/platform-knowledge/preview-prompt
     */
    public function previewPrompt(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'platform_id' => 'required|exists:platforms,id',
            'language_code' => 'required|size:2|in:fr,en,es,de,it,pt,ar,zh,hi',
            'content_type' => 'required|in:articles,landings,comparatives,pillars,press',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $platform = Platform::findOrFail($request->platform_id);

        $prompt = $this->knowledgeService->getKnowledgeContext(
            $platform,
            $request->language_code,
            $request->content_type
        );

        return response()->json([
            'platform' => $platform->name,
            'language' => $request->language_code,
            'content_type' => $request->content_type,
            'prompt' => $prompt,
            'length' => strlen($prompt),
            'lines' => substr_count($prompt, "\n") + 1,
        ]);
    }

    /**
     * ✨ NOUVEAU: Traduire automatiquement un knowledge vers d'autres langues
     * POST /api/platform-knowledge/{id}/translate
     */
    public function translate(Request $request, int $id): JsonResponse
    {
        $knowledge = PlatformKnowledge::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'target_languages' => 'required|array',
            'target_languages.*' => 'required|string|size:2|in:fr,en,es,de,it,pt,ar,zh,hi',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $targetLanguages = $request->target_languages;
        $sourceLanguage = $knowledge->language_code;
        $translated = [];
        $errors = [];

        foreach ($targetLanguages as $targetLang) {
            // Vérifier si traduction existe déjà
            $existing = PlatformKnowledge::where('platform_id', $knowledge->platform_id)
                ->where('knowledge_type', $knowledge->knowledge_type)
                ->where('language_code', $targetLang)
                ->first();

            if ($existing) {
                $errors[] = "Knowledge already exists for language: {$targetLang}";
                continue;
            }

            try {
                // Traduction via GPT-4o-mini (moins cher)
                $translationPrompt = <<<PROMPT
Traduis le texte suivant de {$sourceLanguage} vers {$targetLang}.

IMPORTANT:
- Conserve le sens exact et les chiffres
- Adapte le ton à la langue cible
- Garde la structure (listes, paragraphes)
- Pour l'arabe: écris en arabe standard moderne
- Pour le chinois: utilise les caractères simplifiés

TEXTE SOURCE:
Titre: {$knowledge->title}
Contenu: {$knowledge->content}

RÉPONDS EN JSON:
{
  "title": "titre traduit",
  "content": "contenu traduit"
}
PROMPT;

                $response = $this->gptService->generateCompletion([
                    'model' => 'gpt-4o-mini', // Moins cher pour traduction
                    'system' => 'Tu es un traducteur expert multilingue spécialisé en contenu pour expatriés.',
                    'user' => $translationPrompt,
                    'max_tokens' => 2000,
                    'temperature' => 0.3, // Plus déterministe pour traduction
                ]);

                // Parser la réponse JSON
                $translatedData = json_decode($response['content'] ?? '{}', true);

                if (!isset($translatedData['title']) || !isset($translatedData['content'])) {
                    throw new \Exception("Invalid translation response format");
                }

                // Créer le nouveau knowledge traduit
                $translatedKnowledge = PlatformKnowledge::create([
                    'platform_id' => $knowledge->platform_id,
                    'knowledge_type' => $knowledge->knowledge_type,
                    'title' => $translatedData['title'],
                    'content' => $translatedData['content'],
                    'language_code' => $targetLang,
                    'priority' => $knowledge->priority,
                    'is_active' => $knowledge->is_active,
                    'use_in_articles' => $knowledge->use_in_articles,
                    'use_in_landings' => $knowledge->use_in_landings,
                    'use_in_comparatives' => $knowledge->use_in_comparatives,
                    'use_in_pillars' => $knowledge->use_in_pillars,
                    'use_in_press' => $knowledge->use_in_press,
                ]);

                $translated[] = [
                    'language' => $targetLang,
                    'knowledge_id' => $translatedKnowledge->id,
                    'success' => true,
                ];

            } catch (\Exception $e) {
                $errors[] = "Translation failed for {$targetLang}: " . $e->getMessage();
                $translated[] = [
                    'language' => $targetLang,
                    'success' => false,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return response()->json([
            'source_id' => $knowledge->id,
            'source_language' => $sourceLanguage,
            'translated' => $translated,
            'errors' => $errors,
            'success_count' => count(array_filter($translated, fn($t) => $t['success'])),
            'error_count' => count($errors),
        ]);
    }

    /**
     * ✨ BONUS: Traduire EN MASSE tous les knowledge d'une plateforme
     * POST /api/platform-knowledge/platform/{platformId}/translate-all
     */
    public function translateAllForPlatform(Request $request, int $platformId): JsonResponse
    {
        $platform = Platform::findOrFail($platformId);

        $validator = Validator::make($request->all(), [
            'source_language' => 'required|string|size:2|in:fr,en,es,de,it,pt,ar,zh,hi',
            'target_languages' => 'required|array',
            'target_languages.*' => 'required|string|size:2|in:fr,en,es,de,it,pt,ar,zh,hi',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Récupérer tous les knowledge de la langue source
        $sourceKnowledge = PlatformKnowledge::where('platform_id', $platformId)
            ->where('language_code', $request->source_language)
            ->get();

        if ($sourceKnowledge->isEmpty()) {
            return response()->json([
                'error' => "No knowledge found for language: {$request->source_language}"
            ], 404);
        }

        $results = [
            'platform' => $platform->name,
            'source_language' => $request->source_language,
            'source_count' => $sourceKnowledge->count(),
            'target_languages' => $request->target_languages,
            'translations' => [],
            'total_created' => 0,
            'total_errors' => 0,
        ];

        // Pour chaque knowledge source
        foreach ($sourceKnowledge as $knowledge) {
            foreach ($request->target_languages as $targetLang) {
                // Appeler l'endpoint translate pour chaque knowledge
                $translateRequest = new Request([
                    'target_languages' => [$targetLang]
                ]);

                $result = $this->translate($translateRequest, $knowledge->id);
                $resultData = $result->getData(true);

                $results['translations'][] = [
                    'knowledge_type' => $knowledge->knowledge_type,
                    'target_language' => $targetLang,
                    'success' => $resultData['success_count'] > 0,
                ];

                $results['total_created'] += $resultData['success_count'];
                $results['total_errors'] += $resultData['error_count'];
            }
        }

        return response()->json($results);
    }
}

/*
 * ENDPOINTS DISPONIBLES:
 * 
 * 1. GET    /api/platform-knowledge                                      ← Liste avec filtres
 * 2. GET    /api/platform-knowledge/{id}                                 ← Détail
 * 3. POST   /api/platform-knowledge                                      ← Créer
 * 4. PUT    /api/platform-knowledge/{id}                                 ← Modifier
 * 5. DELETE /api/platform-knowledge/{id}                                 ← Supprimer
 * 6. GET    /api/platform-knowledge/platform/{platformId}                ← Par plateforme
 * 7. POST   /api/platform-knowledge/validate-content                     ← Valider contenu
 * 8. POST   /api/platform-knowledge/preview-prompt                       ← Preview prompt
 * 9. POST   /api/platform-knowledge/{id}/translate                       ← ✨ NOUVEAU: Traduire
 * 10. POST  /api/platform-knowledge/platform/{platformId}/translate-all  ← ✨ BONUS: Tout traduire
 * 
 * EXEMPLE UTILISATION TRADUCTION:
 * 
 * POST /api/platform-knowledge/123/translate
 * {
 *   "target_languages": ["en", "es", "de"]
 * }
 * 
 * RÉPONSE:
 * {
 *   "source_id": 123,
 *   "source_language": "fr",
 *   "translated": [
 *     {"language": "en", "knowledge_id": 124, "success": true},
 *     {"language": "es", "knowledge_id": 125, "success": true},
 *     {"language": "de", "knowledge_id": 126, "success": true}
 *   ],
 *   "success_count": 3,
 *   "error_count": 0
 * }
 * 
 * TEMPS TRADUCTION:
 * - 1 langue: ~3-5 secondes
 * - 8 langues: ~25-40 secondes
 * - Coût: ~$0.001 par traduction (GPT-4o-mini)
 */