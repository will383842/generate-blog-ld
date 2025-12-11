<?php

namespace App\Http\Controllers\Api\Press;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PressController extends Controller
{
    public function analytics(Request $request): JsonResponse
    {
        $dateRange = $request->input('range', '30d');
        
        // Production data for charts
        $productionData = $this->getProductionData($dateRange);
        
        // Language distribution
        $languageDistribution = $this->getLanguageDistribution();
        
        // Platform stats
        $platformStats = $this->getPlatformStats();
        
        // Quality distribution
        $qualityDistribution = $this->getQualityDistribution();
        
        return response()->json([
            'productionData' => $productionData,
            'languageDistribution' => $languageDistribution,
            'platformStats' => $platformStats,
            'qualityDistribution' => $qualityDistribution,
        ]);
    }
    
    private function getProductionData(string $range): array
    {
        $days = match($range) {
            '7d' => 7,
            '30d' => 30,
            '90d' => 90,
            '12m' => 365,
            default => 30
        };
        
        return DB::table('press_releases')
            ->selectRaw('DATE(created_at) as date, COUNT(*) as releases')
            ->where('created_at', '>=', now()->subDays($days))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->toArray();
    }
    
    private function getLanguageDistribution(): array
    {
        return DB::table('press_releases')
            ->selectRaw('language, COUNT(*) as count')
            ->groupBy('language')
            ->get()
            ->toArray();
    }
    
    private function getPlatformStats(): array
    {
        return DB::table('press_releases')
            ->selectRaw('platform_id, COUNT(*) as releases')
            ->groupBy('platform_id')
            ->get()
            ->toArray();
    }
    
    private function getQualityDistribution(): array
    {
        return [
            ['range' => '90-100%', 'count' => 0],
            ['range' => '70-89%', 'count' => 0],
            ['range' => '50-69%', 'count' => 0],
            ['range' => '0-49%', 'count' => 0],
        ];
    }
}
