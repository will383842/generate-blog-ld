<?php

namespace App\Services\Content;

use App\Models\Country;
use App\Models\CountryTranslation;
use App\Models\Language;
use App\Models\LawyerSpecialty;
use App\Models\Platform;
use App\Models\Testimonial;
use App\Models\TestimonialTranslation;
use App\Models\UlixaiService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Service de gestion des témoignages
 * 
 * Gère la récupération, création et mise à jour des témoignages
 * pour les landing pages et autres contenus marketing.
 * 
 * Support : 197 pays × 9 langues
 */
class TestimonialService
{
    /**
     * Récupère les témoignages pour une landing page
     * 
     * Algorithme de sélection intelligent avec scoring :
     * 1. Filtre par plateforme (obligatoire)
     * 2. Préférence témoignages du même pays (+50 points)
     * 3. Préférence témoignages featured (+30 points)
     * 4. Prise en compte de la note (x10 points)
     * 5. Tri par score total décroissant
     * 
     * @param int $platformId
     * @param string $countryCode Code pays ISO (ex: FR, ES, DE)
     * @param string|null $service Service ou thème (optionnel)
     * @param int $count Nombre de témoignages à retourner
     * @return array
     */
    public function getForLanding(
        int $platformId, 
        string $countryCode, 
        ?string $service = null, 
        int $count = 3
    ): array {
        Log::info('Récupération témoignages pour landing', [
            'platform_id' => $platformId,
            'country_code' => $countryCode,
            'service' => $service,
            'count' => $count,
        ]);

        // Construction de la requête avec scoring intelligent
        $testimonials = Testimonial::query()
            ->where('platform_id', $platformId)
            ->where('is_active', true)
            ->select('testimonials.*')
            // Score pays : +50 si même pays
            ->selectRaw('
                (CASE 
                    WHEN country_code = ? THEN 50 
                    ELSE 0 
                END) as country_score
            ', [$countryCode])
            // Score featured : +30 si mis en avant
            ->selectRaw('
                (CASE 
                    WHEN is_featured = 1 THEN 30 
                    ELSE 0 
                END) as featured_score
            ')
            // Score note : note × 10
            ->selectRaw('(COALESCE(rating, 0) * 10) as rating_score')
            // Score total
            ->selectRaw('
                (country_score + featured_score + rating_score) as total_score
            ')
            ->orderByDesc('total_score')
            ->orderByDesc('rating')
            ->orderBy('sort_order')
            ->take($count)
            ->with(['translations', 'service', 'specialty'])
            ->get();

        if ($testimonials->isEmpty()) {
            Log::warning('Aucun témoignage trouvé', [
                'platform_id' => $platformId,
                'country_code' => $countryCode,
            ]);
            return [];
        }

        // Formater les témoignages pour la landing page
        return $testimonials->map(function (Testimonial $testimonial) {
            return $this->formatForDisplay($testimonial);
        })->toArray();
    }

    /**
     * Récupère un témoignage traduit dans une langue spécifique
     * 
     * @param int $testimonialId
     * @param string $languageCode Code langue (fr, en, de, es, pt, ru, zh, ar, hi)
     * @return array|null
     */
    public function getTranslated(int $testimonialId, string $languageCode): ?array
    {
        $testimonial = Testimonial::with(['translations'])
            ->where('id', $testimonialId)
            ->where('is_active', true)
            ->first();

        if (!$testimonial) {
            return null;
        }

        return $this->formatForDisplay($testimonial, $languageCode);
    }

    /**
     * Crée un nouveau témoignage
     * 
     * @param array $data
     * @return Testimonial
     */
    public function create(array $data): Testimonial
    {
        DB::beginTransaction();
        
        try {
            // Création du témoignage principal
            $testimonial = Testimonial::create([
                'platform_id' => $data['platform_id'],
                'first_name' => $data['first_name'],
                'last_name_initial' => $data['last_name_initial'],
                'country_code' => $data['country_code'] ?? null,
                'city' => $data['city'] ?? null,
                'service_id' => $data['service_id'] ?? null,
                'specialty_id' => $data['specialty_id'] ?? null,
                'photo_url' => $data['photo_url'] ?? null,
                'rating' => $data['rating'] ?? null,
                'source' => $data['source'] ?? 'manual',
                'is_active' => $data['is_active'] ?? true,
                'is_featured' => $data['is_featured'] ?? false,
                'sort_order' => $data['sort_order'] ?? 0,
            ]);

            // Création de la traduction principale
            if (isset($data['quote']) && isset($data['language_code'])) {
                TestimonialTranslation::create([
                    'testimonial_id' => $testimonial->id,
                    'language_code' => $data['language_code'],
                    'quote' => $data['quote'],
                    'service_used' => $data['service_used'] ?? null,
                    'is_auto_translated' => false,
                ]);
            }

            DB::commit();
            
            Log::info('Témoignage créé', [
                'testimonial_id' => $testimonial->id,
                'platform_id' => $data['platform_id'],
            ]);

            return $testimonial->fresh(['translations']);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur création témoignage', [
                'error' => $e->getMessage(),
                'data' => $data,
            ]);
            throw $e;
        }
    }

    /**
     * Met à jour un témoignage existant
     * 
     * @param Testimonial $testimonial
     * @param array $data
     * @return Testimonial
     */
    public function update(Testimonial $testimonial, array $data): Testimonial
    {
        DB::beginTransaction();
        
        try {
            // Mise à jour des champs principaux
            $testimonial->update([
                'first_name' => $data['first_name'] ?? $testimonial->first_name,
                'last_name_initial' => $data['last_name_initial'] ?? $testimonial->last_name_initial,
                'country_code' => $data['country_code'] ?? $testimonial->country_code,
                'city' => $data['city'] ?? $testimonial->city,
                'service_id' => $data['service_id'] ?? $testimonial->service_id,
                'specialty_id' => $data['specialty_id'] ?? $testimonial->specialty_id,
                'photo_url' => $data['photo_url'] ?? $testimonial->photo_url,
                'rating' => $data['rating'] ?? $testimonial->rating,
                'is_active' => $data['is_active'] ?? $testimonial->is_active,
                'is_featured' => $data['is_featured'] ?? $testimonial->is_featured,
                'sort_order' => $data['sort_order'] ?? $testimonial->sort_order,
            ]);

            // Mise à jour de la traduction si fournie
            if (isset($data['quote']) && isset($data['language_code'])) {
                TestimonialTranslation::updateOrCreate(
                    [
                        'testimonial_id' => $testimonial->id,
                        'language_code' => $data['language_code'],
                    ],
                    [
                        'quote' => $data['quote'],
                        'service_used' => $data['service_used'] ?? null,
                        'is_auto_translated' => false,
                    ]
                );
            }

            DB::commit();
            
            Log::info('Témoignage mis à jour', [
                'testimonial_id' => $testimonial->id,
            ]);

            return $testimonial->fresh(['translations']);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur mise à jour témoignage', [
                'testimonial_id' => $testimonial->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Active/désactive un témoignage
     * 
     * @param Testimonial $testimonial
     * @param bool $active
     * @return void
     */
    public function setActive(Testimonial $testimonial, bool $active): void
    {
        $testimonial->update(['is_active' => $active]);
        
        Log::info('Statut témoignage modifié', [
            'testimonial_id' => $testimonial->id,
            'active' => $active,
        ]);
    }

    /**
     * Marque/démarque un témoignage comme featured
     * 
     * @param Testimonial $testimonial
     * @param bool $featured
     * @return void
     */
    public function setFeatured(Testimonial $testimonial, bool $featured): void
    {
        $testimonial->update(['is_featured' => $featured]);
        
        Log::info('Statut featured témoignage modifié', [
            'testimonial_id' => $testimonial->id,
            'featured' => $featured,
        ]);
    }

    /**
     * Obtient les statistiques des témoignages par plateforme
     * 
     * @param int $platformId
     * @return array
     */
    public function getStats(int $platformId): array
    {
        $stats = [
            'total' => Testimonial::where('platform_id', $platformId)->count(),
            'active' => Testimonial::where('platform_id', $platformId)
                ->where('is_active', true)
                ->count(),
            'featured' => Testimonial::where('platform_id', $platformId)
                ->where('is_featured', true)
                ->count(),
            'by_country' => [],
            'by_rating' => [],
            'by_source' => [],
        ];

        // Statistiques par pays
        $byCountry = Testimonial::where('platform_id', $platformId)
            ->where('is_active', true)
            ->select('country_code', DB::raw('count(*) as count'))
            ->groupBy('country_code')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        foreach ($byCountry as $item) {
            $stats['by_country'][$item->country_code] = $item->count;
        }

        // Statistiques par note
        $byRating = Testimonial::where('platform_id', $platformId)
            ->where('is_active', true)
            ->whereNotNull('rating')
            ->select('rating', DB::raw('count(*) as count'))
            ->groupBy('rating')
            ->orderBy('rating')
            ->get();

        foreach ($byRating as $item) {
            $stats['by_rating'][$item->rating] = $item->count;
        }

        // Statistiques par source
        $bySource = Testimonial::where('platform_id', $platformId)
            ->select('source', DB::raw('count(*) as count'))
            ->groupBy('source')
            ->get();

        foreach ($bySource as $item) {
            $stats['by_source'][$item->source] = $item->count;
        }

        return $stats;
    }

    /**
     * Recherche de témoignages avec filtres
     * 
     * @param array $filters
     * @return Collection
     */
    public function search(array $filters): Collection
    {
        $query = Testimonial::query();

        // Filtre par plateforme
        if (isset($filters['platform_id'])) {
            $query->where('platform_id', $filters['platform_id']);
        }

        // Filtre par pays
        if (isset($filters['country_code'])) {
            $query->where('country_code', $filters['country_code']);
        }

        // Filtre par service
        if (isset($filters['service_id'])) {
            $query->where('service_id', $filters['service_id']);
        }

        // Filtre par spécialité
        if (isset($filters['specialty_id'])) {
            $query->where('specialty_id', $filters['specialty_id']);
        }

        // Filtre par note minimale
        if (isset($filters['rating'])) {
            $query->where('rating', '>=', $filters['rating']);
        }

        // Filtre par statut
        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        if (isset($filters['is_featured'])) {
            $query->where('is_featured', $filters['is_featured']);
        }

        // Filtre par source
        if (isset($filters['source'])) {
            $query->where('source', $filters['source']);
        }

        // Tri
        $query->orderBy('sort_order')
            ->orderByDesc('rating')
            ->orderByDesc('created_at');

        return $query->with(['translations', 'service', 'specialty'])->get();
    }

    // =========================================================================
    // MÉTHODES PRIVÉES
    // =========================================================================

    /**
     * Formate un témoignage pour l'affichage
     * 
     * @param Testimonial $testimonial
     * @param string|null $languageCode Code langue (fr, en, etc.)
     * @return array
     */
    protected function formatForDisplay(Testimonial $testimonial, ?string $languageCode = 'fr'): array
    {
        // Récupérer la traduction dans la langue demandée
        $translation = $testimonial->translations()
            ->where('language_code', $languageCode)
            ->first();

        // Fallback sur la première traduction disponible si pas de traduction dans la langue demandée
        if (!$translation) {
            $translation = $testimonial->translations()->first();
        }

        return [
            'id' => $testimonial->id,
            'name' => $testimonial->getDisplayName(),
            'location' => $testimonial->getLocation($languageCode),
            'country_code' => $testimonial->country_code,
            'city' => $testimonial->city,
            'quote' => $translation?->quote ?? '',
            'service_used' => $translation?->service_used ?? '',
            'photo_url' => $testimonial->getPhotoUrl(),
            'rating' => $testimonial->rating,
            'rating_stars' => $testimonial->getRatingStars(),
            'is_featured' => $testimonial->is_featured,
            'source' => $testimonial->source,
        ];
    }

    /**
     * Génère une photo d'avatar par défaut
     * 
     * @param string $name
     * @return string URL de l'avatar généré
     */
    protected function generateAvatar(string $name): string
    {
        // Utilisation d'un service d'avatar comme UI Avatars
        $initials = $this->getInitials($name);
        return "https://ui-avatars.com/api/?name=" . urlencode($initials) . "&size=200&background=random";
    }

    /**
     * Extrait les initiales d'un nom
     * 
     * @param string $name
     * @return string
     */
    protected function getInitials(string $name): string
    {
        $words = explode(' ', $name);
        $initials = '';
        
        foreach ($words as $word) {
            if (!empty($word)) {
                $initials .= mb_substr($word, 0, 1);
            }
        }
        
        return strtoupper($initials);
    }
}