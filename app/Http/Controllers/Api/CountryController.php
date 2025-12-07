<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Country;
use App\Models\Region;

class CountryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Country::query()->with('region');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name_fr', 'LIKE', "%{$search}%")
                  ->orWhere('name_en', 'LIKE', "%{$search}%")
                  ->orWhere('code', 'LIKE', "%{$search}%");
            });
        }

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        if ($request->has('region_id')) {
            $query->where('region_id', $request->region_id);
        }

        $countries = $query->orderBy('priority')->orderBy('name_fr')->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'code' => $c->code,
                'code3' => $c->code_alpha3,
                'name' => $c->name,
                'name_fr' => $c->name_fr,
                'name_en' => $c->name_en,
                'flag' => $c->flag_svg,
                'continent' => $c->region?->name,
                'region' => $c->region?->code,
                'region_id' => $c->region_id,
                'isActive' => $c->is_active,
                'priority' => $c->priority,
                'articlesCount' => $c->articles()->count(),
            ]);

        return response()->json([
            'success' => true,
            'data' => $countries,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $country = Country::with(['languages', 'region', 'currency'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $country->id,
                'code' => $country->code,
                'code3' => $country->code_alpha3,
                'name' => $country->name,
                'names' => $country->getAllNames(),
                'slugs' => $country->getAllSlugs(),
                'flag' => $country->flag_svg,
                'continent' => $country->region?->name,
                'region' => $country->region,
                'currency' => $country->currency,
                'languages' => $country->languages,
                'timezone' => $country->timezone,
                'phone_code' => $country->phone_code,
                'isActive' => $country->is_active,
                'priority' => $country->priority,
                'articlesCount' => $country->articles()->count(),
            ],
        ]);
    }

    /**
     * Liste des pays par continent/région
     */
    public function byContinent(string $continent): JsonResponse
    {
        // Chercher la région par code ou nom
        $region = Region::where('code', $continent)
            ->orWhere('name', 'LIKE', "%{$continent}%")
            ->first();

        if (!$region) {
            return response()->json([
                'success' => false,
                'message' => 'Continent/Region not found',
            ], 404);
        }

        $countries = Country::where('region_id', $region->id)
            ->where('is_active', true)
            ->orderBy('priority')
            ->orderBy('name_fr')
            ->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'code' => $c->code,
                'name' => $c->name,
                'flag' => $c->flag_svg,
                'isActive' => $c->is_active,
                'articlesCount' => $c->articles()->count(),
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'region' => [
                    'id' => $region->id,
                    'code' => $region->code,
                    'name' => $region->name,
                ],
                'countries' => $countries,
            ],
        ]);
    }

    /**
     * Liste toutes les régions/continents avec leurs pays
     */
    public function regions(): JsonResponse
    {
        $regions = Region::with(['countries' => function ($q) {
            $q->where('is_active', true)
              ->orderBy('priority')
              ->orderBy('name_fr');
        }])->orderBy('order')->get();

        return response()->json([
            'success' => true,
            'data' => $regions->map(fn($r) => [
                'id' => $r->id,
                'code' => $r->code,
                'name' => $r->name,
                'countriesCount' => $r->countries->count(),
                'countries' => $r->countries->map(fn($c) => [
                    'id' => $c->id,
                    'code' => $c->code,
                    'name' => $c->name,
                    'flag' => $c->flag_svg,
                ]),
            ]),
        ]);
    }
}