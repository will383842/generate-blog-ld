<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Testimonial;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TestimonialController extends Controller
{
    /**
     * Liste des témoignages
     */
    public function index(Request $request): JsonResponse
    {
        $query = Testimonial::with(['platform', 'country', 'language']);

        // Filtrer par plateforme
        if ($request->has('platform_id')) {
            $query->where('platform_id', $request->platform_id);
        }

        // Filtrer par pays
        if ($request->has('country_id')) {
            $query->where('country_id', $request->country_id);
        }

        // Filtrer par langue
        if ($request->has('language_id')) {
            $query->where('language_id', $request->language_id);
        }

        // Recherche
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('author_name', 'LIKE', "%{$search}%")
                  ->orWhere('author_position', 'LIKE', "%{$search}%")
                  ->orWhere('content', 'LIKE', "%{$search}%");
            });
        }

        // Filtrer par note
        if ($request->has('min_rating')) {
            $query->where('rating', '>=', $request->min_rating);
        }

        // Actif/approuvé uniquement
        if ($request->has('approved') && $request->approved === 'true') {
            $query->where('is_approved', true);
        }

        if ($request->has('active') && $request->active === 'true') {
            $query->where('is_active', true);
        }

        // Tri
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $testimonials = $request->has('paginate') && $request->paginate === 'false'
            ? $query->get()
            : $query->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $testimonials,
        ]);
    }

    /**
     * Détail d'un témoignage
     */
    public function show(int $id): JsonResponse
    {
        $testimonial = Testimonial::with(['platform', 'country', 'language'])->findOrFail($id);
        
        return response()->json([
            'success' => true,
            'data' => $testimonial,
        ]);
    }

    /**
     * Créer un témoignage
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'platform_id' => 'required|integer|exists:platforms,id',
            'country_id' => 'nullable|integer|exists:countries,id',
            'language_id' => 'required|integer|exists:languages,id',
            'author_name' => 'required|string|max:255',
            'author_position' => 'nullable|string|max:255',
            'author_company' => 'nullable|string|max:255',
            'author_avatar' => 'nullable|url',
            'content' => 'required|string',
            'rating' => 'required|integer|min:1|max:5',
            'service_type' => 'nullable|string|max:100',
            'is_verified' => 'nullable|boolean',
            'is_approved' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'featured' => 'nullable|boolean',
            'display_order' => 'nullable|integer',
            'published_at' => 'nullable|date',
        ]);

        $testimonial = Testimonial::create($validated);

        return response()->json([
            'success' => true,
            'data' => $testimonial,
            'message' => 'Témoignage créé avec succès',
        ], 201);
    }

    /**
     * Mettre à jour un témoignage
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $testimonial = Testimonial::findOrFail($id);

        $validated = $request->validate([
            'platform_id' => 'sometimes|required|integer|exists:platforms,id',
            'country_id' => 'nullable|integer|exists:countries,id',
            'language_id' => 'sometimes|required|integer|exists:languages,id',
            'author_name' => 'sometimes|required|string|max:255',
            'author_position' => 'nullable|string|max:255',
            'author_company' => 'nullable|string|max:255',
            'author_avatar' => 'nullable|url',
            'content' => 'sometimes|required|string',
            'rating' => 'sometimes|required|integer|min:1|max:5',
            'service_type' => 'nullable|string|max:100',
            'is_verified' => 'nullable|boolean',
            'is_approved' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'featured' => 'nullable|boolean',
            'display_order' => 'nullable|integer',
            'published_at' => 'nullable|date',
        ]);

        $testimonial->update($validated);

        return response()->json([
            'success' => true,
            'data' => $testimonial,
            'message' => 'Témoignage mis à jour avec succès',
        ]);
    }

    /**
     * Approuver un témoignage
     */
    public function approve(int $id): JsonResponse
    {
        $testimonial = Testimonial::findOrFail($id);
        $testimonial->update([
            'is_approved' => true,
            'approved_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $testimonial,
            'message' => 'Témoignage approuvé avec succès',
        ]);
    }

    /**
     * Rejeter un témoignage
     */
    public function reject(int $id): JsonResponse
    {
        $testimonial = Testimonial::findOrFail($id);
        $testimonial->update([
            'is_approved' => false,
            'is_active' => false,
        ]);

        return response()->json([
            'success' => true,
            'data' => $testimonial,
            'message' => 'Témoignage rejeté avec succès',
        ]);
    }

    /**
     * Supprimer un témoignage
     */
    public function destroy(int $id): JsonResponse
    {
        $testimonial = Testimonial::findOrFail($id);
        $testimonial->delete();

        return response()->json([
            'success' => true,
            'message' => 'Témoignage supprimé avec succès',
        ]);
    }
}