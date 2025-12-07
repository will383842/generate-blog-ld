<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuthorityDomain;
use App\Services\Linking\AuthorityDomainService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AuthorityDomainsController extends Controller
{
    protected AuthorityDomainService $service;

    public function __construct(AuthorityDomainService $service)
    {
        $this->service = $service;
    }

    /**
     * Liste les domaines autorité
     *
     * GET /api/authority-domains
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'nullable|in:government,organization,reference,news,authority',
            'country' => 'nullable|string|size:2',
            'topic' => 'nullable|string',
            'min_authority' => 'nullable|integer|min:0|max:100',
            'active_only' => 'boolean',
            'search' => 'nullable|string|max:100',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $query = AuthorityDomain::query();

        if (isset($validated['type'])) {
            $query->byType($validated['type']);
        }

        if (isset($validated['country'])) {
            $query->forCountry($validated['country']);
        }

        if (isset($validated['topic'])) {
            $query->byTopics([$validated['topic']]);
        }

        if (isset($validated['min_authority'])) {
            $query->where('authority_score', '>=', $validated['min_authority']);
        }

        if ($validated['active_only'] ?? true) {
            $query->active();
        }

        if (isset($validated['search'])) {
            $results = $this->service->search($validated['search']);
            return response()->json([
                'success' => true,
                'data' => $results
            ]);
        }

        $domains = $query->orderByAuthority()
            ->paginate($validated['per_page'] ?? 25);

        return response()->json([
            'success' => true,
            'data' => $domains
        ]);
    }

    /**
     * Affiche un domaine
     *
     * GET /api/authority-domains/{domain}
     */
    public function show(AuthorityDomain $authorityDomain): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $authorityDomain
        ]);
    }

    /**
     * Crée un nouveau domaine
     *
     * POST /api/authority-domains
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'domain' => 'required|string|max:255|unique:authority_domains,domain',
            'name' => 'required|string|max:255',
            'source_type' => 'required|in:government,organization,reference,news,authority',
            'country_code' => 'nullable|string|size:2',
            'languages' => 'nullable|array',
            'languages.*' => 'string|size:2',
            'topics' => 'nullable|array',
            'topics.*' => 'string|max:50',
            'authority_score' => 'nullable|integer|min:0|max:100',
            'is_active' => 'boolean',
        ]);

        // Calculer le score si non fourni
        if (!isset($validated['authority_score'])) {
            $validated['authority_score'] = $this->service->scoreAuthorityDomain(
                $validated['domain'],
                $validated['source_type']
            );
        }

        $domain = AuthorityDomain::create($validated);

        return response()->json([
            'success' => true,
            'message' => __('linking.domain_created'),
            'data' => $domain
        ], 201);
    }

    /**
     * Met à jour un domaine
     *
     * PUT /api/authority-domains/{domain}
     */
    public function update(Request $request, AuthorityDomain $authorityDomain): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'source_type' => 'sometimes|in:government,organization,reference,news,authority',
            'country_code' => 'nullable|string|size:2',
            'languages' => 'nullable|array',
            'languages.*' => 'string|size:2',
            'topics' => 'nullable|array',
            'topics.*' => 'string|max:50',
            'authority_score' => 'nullable|integer|min:0|max:100',
            'is_active' => 'boolean',
        ]);

        $authorityDomain->update($validated);

        return response()->json([
            'success' => true,
            'message' => __('linking.domain_updated'),
            'data' => $authorityDomain->fresh()
        ]);
    }

    /**
     * Supprime un domaine
     *
     * DELETE /api/authority-domains/{domain}
     */
    public function destroy(AuthorityDomain $authorityDomain): JsonResponse
    {
        $authorityDomain->delete();

        return response()->json([
            'success' => true,
            'message' => __('linking.domain_deleted')
        ]);
    }

    /**
     * Vérifie si un domaine est actif
     *
     * POST /api/authority-domains/{domain}/verify
     */
    public function verify(AuthorityDomain $authorityDomain): JsonResponse
    {
        $isActive = $this->service->verifyDomainActive($authorityDomain);

        $authorityDomain->update([
            'is_active' => $isActive,
            'last_verified_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'domain' => $authorityDomain->domain,
                'is_active' => $isActive
            ]
        ]);
    }

    /**
     * Récupère les statistiques
     *
     * GET /api/authority-domains/stats
     */
    public function stats(): JsonResponse
    {
        $stats = $this->service->getStatistics();

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Ajoute un domaine découvert automatiquement
     *
     * POST /api/authority-domains/discover
     */
    public function discover(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'url' => 'required|url',
            'source_type' => 'nullable|in:government,organization,reference,news,authority',
        ]);

        $result = $this->service->addDiscoveredDomain(
            $validated['url'],
            $validated['source_type'] ?? null
        );

        if (isset($result['error'])) {
            return response()->json([
                'success' => false,
                'message' => $result['error']
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => $result['created'] ? __('linking.domain_created') : __('linking.domain_exists'),
            'data' => $result['domain']
        ], $result['created'] ? 201 : 200);
    }

    /**
     * Import CSV
     *
     * POST /api/authority-domains/import
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:5120',
        ]);

        $path = $request->file('file')->getRealPath();
        $result = $this->service->importFromCsv($path);

        return response()->json([
            'success' => true,
            'data' => $result
        ]);
    }

    /**
     * Export CSV
     *
     * GET /api/authority-domains/export
     */
    public function export(): JsonResponse
    {
        $filename = 'authority_domains_' . now()->format('Y-m-d_His') . '.csv';
        $path = storage_path("app/exports/{$filename}");

        // Créer le dossier si nécessaire
        if (!is_dir(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }

        $count = $this->service->exportToCsv($path);

        return response()->json([
            'success' => true,
            'data' => [
                'filename' => $filename,
                'count' => $count,
                'download_url' => route('api.authority-domains.download', ['filename' => $filename])
            ]
        ]);
    }

    /**
     * Recherche de domaines autorité
     *
     * GET /api/authority-domains/search
     */
    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => 'required|string|min:2|max:100',
            'type' => 'nullable|in:government,organization,reference,news,authority',
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        $results = $this->service->search(
            $validated['q'],
            $validated['type'] ?? null,
            $validated['limit'] ?? 20
        );

        return response()->json([
            'success' => true,
            'data' => $results
        ]);
    }

    /**
     * Télécharge un fichier exporté
     *
     * GET /api/authority-domains/download/{filename}
     */
    public function download(string $filename): \Symfony\Component\HttpFoundation\BinaryFileResponse|JsonResponse
    {
        $path = storage_path("app/exports/{$filename}");

        if (!file_exists($path)) {
            return response()->json([
                'success' => false,
                'message' => __('linking.file_not_found')
            ], 404);
        }

        return response()->download($path, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }
}
