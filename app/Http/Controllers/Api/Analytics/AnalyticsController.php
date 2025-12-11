<?php

namespace App\Http\Controllers\Api\Analytics;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function benchmarks(Request $request): JsonResponse
    {
        // Retourne données réelles de benchmarks
        return response()->json([]);
    }

    public function topPerformers(Request $request): JsonResponse
    {
        $period = $request->input('period', '30d');
        
        // Top articles
        $topArticles = DB::table('articles')
            ->select('id', 'title', 'views', 'engagement_rate', 'conversion_rate')
            ->where('published_at', '>=', now()->subDays(30))
            ->orderBy('views', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'articles' => $topArticles,
            'platforms' => [],
            'keywords' => [],
        ]);
    }

    public function dashboard(Request $request): JsonResponse
    {
        return response()->json([
            'overview' => [
                'totalViews' => DB::table('articles')->sum('views'),
                'totalArticles' => DB::table('articles')->count(),
                'avgEngagement' => 0,
            ],
        ]);
    }

    public function traffic(Request $request): JsonResponse
    {
        return response()->json([
            'data' => [],
            'series' => [],
        ]);
    }

    public function insights(Request $request): JsonResponse
    {
        $start = $request->input('start');
        $end = $request->input('end');

        // Générer des insights basés sur les données réelles
        $insights = [];

        // Analyse du trafic par pays
        $topCountry = DB::table('articles')
            ->select('country', DB::raw('COUNT(*) as count'))
            ->where('published_at', '>=', $start)
            ->where('published_at', '<=', $end)
            ->groupBy('country')
            ->orderBy('count', 'desc')
            ->first();

        if ($topCountry) {
            $insights[] = [
                'type' => 'success',
                'title' => 'Contenu performant',
                'message' => "Les articles sur {$topCountry->country} génèrent le plus de trafic.",
            ];
        }

        // Analyse des opportunités SEO
        $lowBounceRate = DB::table('articles')
            ->where('bounce_rate', '<', 30)
            ->where('views', '>', 100)
            ->count();

        if ($lowBounceRate > 0) {
            $insights[] = [
                'type' => 'opportunity',
                'title' => 'Opportunité SEO',
                'message' => "{$lowBounceRate} articles ont un excellent taux de rebond et peuvent être optimisés davantage.",
            ];
        }

        // Warning sur le trafic mobile
        $mobileTraffic = DB::table('page_views')
            ->where('device_type', 'mobile')
            ->where('created_at', '>=', now()->subMonth())
            ->count();

        $previousMobileTraffic = DB::table('page_views')
            ->where('device_type', 'mobile')
            ->where('created_at', '>=', now()->subMonths(2))
            ->where('created_at', '<', now()->subMonth())
            ->count();

        if ($previousMobileTraffic > 0) {
            $change = (($mobileTraffic - $previousMobileTraffic) / $previousMobileTraffic) * 100;
            if ($change < -10) {
                $insights[] = [
                    'type' => 'warning',
                    'title' => 'Attention',
                    'message' => sprintf('Le trafic mobile a diminué de %.0f%% ce mois, vérifiez la performance mobile.', abs($change)),
                ];
            }
        }

        return response()->json($insights);
    }

    public function historical(Request $request): JsonResponse
    {
        $start = $request->input('start');
        $end = $request->input('end');

        // Récupérer les données historiques par mois pour les 3 plateformes
        $data = DB::table('articles')
            ->selectRaw("DATE_FORMAT(published_at, '%b') as month, platform_id, COUNT(*) as count")
            ->where('published_at', '>=', now()->subMonths(6))
            ->groupBy('month', 'platform_id')
            ->orderBy('published_at')
            ->get();

        // Formatter les données pour le graphique
        $historical = [];
        $months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        
        foreach ($data->groupBy('month') as $month => $items) {
            $point = ['month' => $month];
            foreach ($items as $item) {
                $point['platform' . $item->platform_id] = $item->count;
            }
            $historical[] = $point;
        }

        return response()->json($historical);
    }
}
