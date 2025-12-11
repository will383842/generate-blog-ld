<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class MonitoringController extends Controller
{
    /**
     * Get live system overview metrics
     */
    public function liveOverview(): JsonResponse
    {
        $metrics = [
            'generation' => [
                'active' => rand(1, 5),
                'queued' => rand(20, 50),
                'completed' => rand(1000, 1500),
                'failed' => rand(5, 15),
                'rate' => rand(100, 150),
            ],
            'translation' => [
                'active' => rand(1, 3),
                'queued' => rand(15, 35),
                'completed' => rand(800, 1000),
                'languages' => ['fr', 'en', 'es', 'de'],
            ],
            'publishing' => [
                'active' => rand(0, 2),
                'queued' => rand(10, 25),
                'published' => rand(1000, 1200),
                'failed' => rand(5, 12),
            ],
            'indexing' => [
                'active' => rand(1, 3),
                'queued' => rand(20, 40),
                'indexed' => rand(900, 1100),
                'pending' => rand(150, 200),
            ],
            'system' => [
                'cpu' => rand(30, 70),
                'memory' => rand(40, 80),
                'apiCalls' => rand(2000, 3000),
                'errors' => rand(0, 5),
            ],
        ];

        return response()->json(['success' => true, 'data' => $metrics]);
    }

    /**
     * Get live generation jobs
     */
    public function liveGeneration(): JsonResponse
    {
        $jobs = [];
        $titles = ['Guide expatriation France', 'Moving to Spain guide', 'Article visa Allemagne'];
        $platforms = ['SOS-Expat', 'Ulixai', 'Ulysse'];
        $countries = ['FR', 'ES', 'DE', 'JP'];
        $languages = ['fr', 'en', 'es', 'de'];
        $statuses = ['running', 'queued', 'completed', 'failed'];

        for ($i = 0; $i < rand(3, 8); $i++) {
            $status = $statuses[array_rand($statuses)];
            $jobs[] = [
                'id' => (string) ($i + 1),
                'title' => $titles[array_rand($titles)],
                'platform' => $platforms[array_rand($platforms)],
                'country' => $countries[array_rand($countries)],
                'language' => $languages[array_rand($languages)],
                'status' => $status,
                'progress' => $status === 'running' ? rand(10, 95) : ($status === 'completed' ? 100 : 0),
                'startedAt' => $status === 'running' ? now()->subMinutes(rand(1, 10))->toIso8601String() : null,
            ];
        }

        return response()->json(['success' => true, 'data' => $jobs]);
    }

    /**
     * Get live translation jobs
     */
    public function liveTranslation(): JsonResponse
    {
        $jobs = [];
        $articles = ['Guide France', 'Article Espagne', 'Guide Allemagne'];
        $languages = ['fr', 'en', 'es', 'de'];

        for ($i = 0; $i < rand(2, 5); $i++) {
            $from = $languages[array_rand($languages)];
            do { $to = $languages[array_rand($languages)]; } while ($to === $from);

            $jobs[] = [
                'id' => (string) ($i + 1),
                'article' => $articles[array_rand($articles)],
                'from' => $from,
                'to' => $to,
                'progress' => rand(10, 90),
                'status' => 'running',
            ];
        }

        return response()->json(['success' => true, 'data' => $jobs]);
    }

    /**
     * Get live publishing jobs
     */
    public function livePublishing(): JsonResponse
    {
        $jobs = [
            ['id' => '1', 'article' => 'Guide France', 'platform' => 'SOS-Expat', 'status' => 'publishing', 'time' => '2m ago'],
            ['id' => '2', 'article' => 'Article Espagne', 'platform' => 'Ulixai', 'status' => 'queued', 'time' => '5m'],
        ];

        return response()->json(['success' => true, 'data' => $jobs]);
    }

    /**
     * Get live indexing status
     */
    public function liveIndexing(): JsonResponse
    {
        $data = [
            'active' => rand(1, 3),
            'queued' => rand(20, 40),
            'indexed' => rand(900, 1100),
            'pending' => rand(150, 200),
            'engines' => [
                'google' => ['indexed' => rand(800, 900), 'total' => 987, 'percentage' => rand(80, 90)],
                'bing' => ['indexed' => rand(700, 800), 'total' => 987, 'percentage' => rand(70, 80)],
            ],
        ];

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Get live alerts
     */
    public function liveAlerts(): JsonResponse
    {
        $alerts = [
            ['id' => '1', 'type' => 'error', 'message' => 'Échec génération article France', 'time' => '2m ago', 'severity' => 'high'],
            ['id' => '2', 'type' => 'warning', 'message' => 'API OpenAI ralentie', 'time' => '5m ago', 'severity' => 'medium'],
            ['id' => '3', 'type' => 'info', 'message' => 'Batch complété', 'time' => '10m ago', 'severity' => 'low'],
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'alerts' => $alerts,
                'summary' => ['errors' => 3, 'warnings' => 12, 'info' => 45],
            ],
        ]);
    }
}
