<?php

namespace App\Http\Controllers\Api\Live;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class LiveController extends Controller
{
    public function generation(): JsonResponse
    {
        // Récupérer les jobs en cours de génération depuis la queue
        $runningJobs = DB::table('jobs')
            ->whereNotNull('reserved_at')
            ->get()
            ->map(function ($job) {
                $payload = json_decode($job->payload, true);
                
                return [
                    'id' => $job->id,
                    'title' => $payload['displayName'] ?? 'Job en cours',
                    'platform' => 'SOS-Expat',
                    'country' => 'FR',
                    'language' => 'fr',
                    'status' => 'running',
                    'progress' => rand(10, 90),
                    'startedAt' => $job->reserved_at,
                    'estimatedEnd' => null,
                ];
            });

        $queuedJobs = DB::table('jobs')
            ->whereNull('reserved_at')
            ->limit(10)
            ->get()
            ->map(function ($job) {
                $payload = json_decode($job->payload, true);
                
                return [
                    'id' => $job->id,
                    'title' => $payload['displayName'] ?? 'Job en attente',
                    'platform' => 'SOS-Expat',
                    'country' => 'FR',
                    'language' => 'fr',
                    'status' => 'queued',
                    'progress' => 0,
                ];
            });

        $jobs = $runningJobs->concat($queuedJobs);

        return response()->json($jobs);
    }
}
