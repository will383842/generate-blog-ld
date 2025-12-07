<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LinkingRule;
use App\Models\Platform;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class LinkingRulesController extends Controller
{
    /**
     * Liste les règles de maillage
     *
     * GET /api/linking-rules
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'platform_id' => 'nullable|exists:platforms,id',
        ]);

        $query = LinkingRule::with('platform');

        if (isset($validated['platform_id'])) {
            $query->where('platform_id', $validated['platform_id']);
        }

        $rules = $query->get();

        return response()->json([
            'success' => true,
            'data' => $rules
        ]);
    }

    /**
     * Affiche une règle spécifique
     *
     * GET /api/linking-rules/{rule}
     */
    public function show(LinkingRule $rule): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $rule->load('platform')
        ]);
    }

    /**
     * Affiche les règles d'une plateforme
     *
     * GET /api/linking-rules/platforms/{platform}
     */
    public function forPlatform(Platform $platform): JsonResponse
    {
        $rules = LinkingRule::where('platform_id', $platform->id)->first();

        if (!$rules) {
            // Retourner les règles par défaut
            $rules = $this->getDefaultRules($platform);
        }

        return response()->json([
            'success' => true,
            'data' => $rules
        ]);
    }

    /**
     * Crée une nouvelle règle de maillage
     *
     * POST /api/linking-rules
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'platform_id' => 'required|exists:platforms,id|unique:linking_rules,platform_id',
            // Liens internes
            'min_internal_links' => 'nullable|integer|min:0|max:20',
            'max_internal_links' => 'nullable|integer|min:1|max:30',
            'min_relevance_score' => 'nullable|integer|min:0|max:100',
            // Liens externes
            'min_external_links' => 'nullable|integer|min:0|max:10',
            'max_external_links' => 'nullable|integer|min:1|max:15',
            'min_authority_score' => 'nullable|integer|min:0|max:100',
            'require_government' => 'nullable|boolean',
            // Liens affiliés
            'max_affiliate_per_article' => 'nullable|integer|min:0|max:10',
            'affiliate_allowed' => 'nullable|boolean',
            // Distribution anchors
            'anchor_distribution' => 'nullable|array',
            // Zones d'exclusion
            'exclude_intro' => 'nullable|boolean',
            'exclude_conclusion' => 'nullable|boolean',
            'max_links_per_paragraph' => 'nullable|integer|min:1|max:5',
            // Source priorité
            'source_priority' => 'nullable|array',
            // Pillar
            'max_pillar_children' => 'nullable|integer|min:5|max:50',
            'require_pillar_link' => 'nullable|boolean',
            // Activation
            'is_active' => 'nullable|boolean',
        ]);

        $rules = LinkingRule::create($validated);

        return response()->json([
            'success' => true,
            'message' => __('linking.rules_created'),
            'data' => $rules->load('platform')
        ], 201);
    }

    /**
     * Crée ou met à jour les règles d'une plateforme
     *
     * PUT /api/linking-rules/{platform}
     */
    public function update(Request $request, Platform $platform): JsonResponse
    {
        $validated = $request->validate([
            // Liens internes
            'min_internal_links' => 'nullable|integer|min:0|max:20',
            'max_internal_links' => 'nullable|integer|min:1|max:30',
            'min_relevance_score' => 'nullable|integer|min:0|max:100',
            
            // Liens externes
            'min_external_links' => 'nullable|integer|min:0|max:10',
            'max_external_links' => 'nullable|integer|min:1|max:15',
            'min_authority_score' => 'nullable|integer|min:0|max:100',
            'require_government' => 'nullable|boolean',
            
            // Liens affiliés
            'max_affiliate_per_article' => 'nullable|integer|min:0|max:10',
            'affiliate_allowed' => 'nullable|boolean',
            
            // Distribution anchors
            'anchor_distribution' => 'nullable|array',
            'anchor_distribution.exact_match' => 'nullable|integer|min:0|max:100',
            'anchor_distribution.long_tail' => 'nullable|integer|min:0|max:100',
            'anchor_distribution.generic' => 'nullable|integer|min:0|max:100',
            'anchor_distribution.cta' => 'nullable|integer|min:0|max:100',
            'anchor_distribution.question' => 'nullable|integer|min:0|max:100',
            
            // Zones d'exclusion
            'exclude_intro' => 'nullable|boolean',
            'exclude_conclusion' => 'nullable|boolean',
            'max_links_per_paragraph' => 'nullable|integer|min:1|max:5',
            
            // Source priorité
            'source_priority' => 'nullable|array',
            'source_priority.*' => 'string|in:government,organization,reference,news,authority',
            
            // Pillar
            'max_pillar_children' => 'nullable|integer|min:5|max:50',
            'require_pillar_link' => 'nullable|boolean',
            
            // Activation
            'is_active' => 'nullable|boolean',
        ]);

        $rules = LinkingRule::updateOrCreate(
            ['platform_id' => $platform->id],
            array_merge($validated, ['platform_id' => $platform->id])
        );

        return response()->json([
            'success' => true,
            'message' => __('linking.rules_updated'),
            'data' => $rules
        ]);
    }

    /**
     * Réinitialise les règles aux valeurs par défaut
     *
     * DELETE /api/linking-rules/{platform}
     */
    public function destroy(Platform $platform): JsonResponse
    {
        LinkingRule::where('platform_id', $platform->id)->delete();

        return response()->json([
            'success' => true,
            'message' => __('linking.rules_reset')
        ]);
    }

    /**
     * Copie les règles d'une plateforme vers une autre
     *
     * POST /api/linking-rules/{platform}/copy
     */
    public function copy(Request $request, Platform $platform): JsonResponse
    {
        $validated = $request->validate([
            'target_platform_id' => 'required|exists:platforms,id|different:platform.id',
        ]);

        $sourceRules = LinkingRule::where('platform_id', $platform->id)->first();

        if (!$sourceRules) {
            return response()->json([
                'success' => false,
                'message' => __('linking.no_rules_to_copy')
            ], 404);
        }

        $targetRules = $sourceRules->replicate();
        $targetRules->platform_id = $validated['target_platform_id'];
        $targetRules->save();

        return response()->json([
            'success' => true,
            'message' => __('linking.rules_copied'),
            'data' => $targetRules
        ]);
    }

    /**
     * Duplique une règle existante
     *
     * POST /api/linking-rules/{rule}/duplicate
     */
    public function duplicate(Request $request, LinkingRule $rule): JsonResponse
    {
        $validated = $request->validate([
            'platform_id' => 'required|exists:platforms,id|unique:linking_rules,platform_id',
        ]);

        $newRule = $rule->replicate();
        $newRule->platform_id = $validated['platform_id'];
        $newRule->save();

        return response()->json([
            'success' => true,
            'message' => __('linking.rules_duplicated'),
            'data' => $newRule->load('platform')
        ], 201);
    }

    /**
     * Récupère les règles par défaut
     */
    protected function getDefaultRules(Platform $platform): array
    {
        return [
            'platform_id' => $platform->id,
            'is_default' => true,
            'min_internal_links' => config('linking.internal.min_links_per_article', 5),
            'max_internal_links' => config('linking.internal.max_links_per_article', 12),
            'min_relevance_score' => config('linking.internal.min_relevance_score', 40),
            'min_external_links' => config('linking.external.min_per_article', 2),
            'max_external_links' => config('linking.external.max_per_article', 5),
            'min_authority_score' => config('linking.external.min_authority_score', 60),
            'require_government' => true,
            'max_affiliate_per_article' => config('linking.affiliate.max_per_article', 3),
            'affiliate_allowed' => true,
            'anchor_distribution' => config('linking.internal.anchor_distribution'),
            'exclude_intro' => config('linking.internal.exclude_zones.intro', true),
            'exclude_conclusion' => config('linking.internal.exclude_zones.conclusion', true),
            'max_links_per_paragraph' => config('linking.internal.max_per_paragraph', 1),
            'source_priority' => config('linking.external.source_priority'),
            'max_pillar_children' => 20,
            'require_pillar_link' => true,
        ];
    }

    /**
     * Valide une configuration de règles
     *
     * POST /api/linking-rules/validate
     */
    public function validate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'rules' => 'required|array'
        ]);

        $rules = $validated['rules'];
        $errors = [];

        // Vérifier la cohérence
        if (isset($rules['min_internal_links'], $rules['max_internal_links'])) {
            if ($rules['min_internal_links'] > $rules['max_internal_links']) {
                $errors[] = 'min_internal_links cannot be greater than max_internal_links';
            }
        }

        if (isset($rules['min_external_links'], $rules['max_external_links'])) {
            if ($rules['min_external_links'] > $rules['max_external_links']) {
                $errors[] = 'min_external_links cannot be greater than max_external_links';
            }
        }

        if (isset($rules['anchor_distribution'])) {
            $total = array_sum($rules['anchor_distribution']);
            if ($total !== 100) {
                $errors[] = "anchor_distribution must sum to 100 (currently {$total})";
            }
        }

        return response()->json([
            'success' => empty($errors),
            'valid' => empty($errors),
            'errors' => $errors
        ]);
    }
}
