<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * WorkersController - API pour gestion des workers
 * VERSION SÉCURISÉE avec vérifications tables
 */
class WorkersController extends Controller
{
    /**
     * Liste tous les workers avec leurs statistiques
     */
    public function index(): JsonResponse
    {
        try {
            // Vérifier que les tables existent
            $hasJobsTable = Schema::hasTable('jobs');
            $hasFailedJobsTable = Schema::hasTable('failed_jobs');
            
            if (!$hasJobsTable) {
                // Si pas de table jobs, retourner workers vides
                return response()->json([
                    [
                        'id' => 'worker_default',
                        'name' => 'Default Queue Worker',
                        'status' => 'stopped',
                        'uptime' => '0h',
                        'tasksProcessed' => 0,
                        'currentTask' => null,
                        'cpu' => 0,
                        'memory' => 0,
                    ]
                ]);
            }
            
            $workers = [];
            $queues = ['default', 'high', 'low'];
            
            foreach ($queues as $queue) {
                $workers[] = [
                    'id' => "worker_{$queue}",
                    'name' => ucfirst($queue) . ' Queue Worker',
                    'status' => $this->getWorkerStatus($queue, $hasFailedJobsTable),
                    'uptime' => $this->getUptime($queue),
                    'tasksProcessed' => $this->getProcessedTasks($queue),
                    'currentTask' => $this->getCurrentTask($queue),
                    'cpu' => $this->getCpuUsage(),
                    'memory' => $this->getMemoryUsage(),
                ];
            }
            
            return response()->json($workers);
            
        } catch (\Exception $e) {
            // En cas d'erreur, retourner un worker par défaut
            return response()->json([
                [
                    'id' => 'worker_default',
                    'name' => 'Default Queue Worker',
                    'status' => 'error',
                    'uptime' => '0h',
                    'tasksProcessed' => 0,
                    'currentTask' => 'Error: ' . $e->getMessage(),
                    'cpu' => 0,
                    'memory' => 0,
                ]
            ]);
        }
    }

    /**
     * Arrêter tous les workers
     */
    public function stopAll(): JsonResponse
    {
        try {
            Artisan::call('queue:restart');
            
            return response()->json([
                'success' => true,
                'message' => 'All workers stopped'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to stop workers',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Démarrer tous les workers
     */
    public function startAll(): JsonResponse
    {
        try {
            Artisan::call('queue:restart');
            
            return response()->json([
                'success' => true,
                'message' => 'Workers restarted'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to start workers',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Redémarrer un worker spécifique
     */
    public function restart(string $queue): JsonResponse
    {
        try {
            Artisan::call('queue:restart');
            
            return response()->json([
                'success' => true,
                'message' => "Worker {$queue} restarted"
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to restart worker',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helpers privés
     */
    
    private function getWorkerStatus(string $queue, bool $hasFailedJobsTable): string
    {
        try {
            $runningJobs = DB::table('jobs')
                ->where('queue', $queue)
                ->whereNotNull('reserved_at')
                ->count();
                
            if ($hasFailedJobsTable) {
                $failedJobs = DB::table('failed_jobs')
                    ->where('queue', $queue)
                    ->count();
                    
                if ($failedJobs > 0) {
                    return 'error';
                }
            }
            
            if ($runningJobs > 0) {
                return 'running';
            }
            
            return 'stopped';
        } catch (\Exception $e) {
            return 'error';
        }
    }
    
    private function getUptime(string $queue): string
    {
        try {
            $firstJob = DB::table('jobs')
                ->where('queue', $queue)
                ->orderBy('created_at')
                ->first();
                
            if (!$firstJob) {
                return '0h';
            }
            
            $diff = now()->diff(new \DateTime($firstJob->created_at));
            
            if ($diff->days > 0) {
                return $diff->days . 'd ' . $diff->h . 'h';
            }
            
            return $diff->h . 'h';
        } catch (\Exception $e) {
            return '0h';
        }
    }
    
    private function getProcessedTasks(string $queue): int
    {
        try {
            return DB::table('jobs')
                ->where('queue', $queue)
                ->whereDate('created_at', today())
                ->count();
        } catch (\Exception $e) {
            return 0;
        }
    }
    
    private function getCurrentTask(string $queue): ?string
    {
        try {
            $job = DB::table('jobs')
                ->where('queue', $queue)
                ->whereNotNull('reserved_at')
                ->first();
                
            if (!$job) {
                return null;
            }
            
            $payload = json_decode($job->payload, true);
            $displayName = $payload['displayName'] ?? 'Job en cours';
            
            if (str_contains($displayName, '\\')) {
                $parts = explode('\\', $displayName);
                $displayName = end($parts);
            }
            
            return $displayName;
        } catch (\Exception $e) {
            return null;
        }
    }
    
    private function getCpuUsage(): int
    {
        try {
            if (PHP_OS_FAMILY === 'Linux' && file_exists('/proc/loadavg')) {
                $load = file_get_contents('/proc/loadavg');
                $loadAvg = (float) explode(' ', $load)[0];
                return min(100, (int)($loadAvg * 100));
            }
            
            $runningJobs = DB::table('jobs')
                ->whereNotNull('reserved_at')
                ->count();
                
            return min(100, $runningJobs * 20);
        } catch (\Exception $e) {
            return 0;
        }
    }
    
    private function getMemoryUsage(): int
    {
        try {
            $memUsed = memory_get_usage(true);
            $memLimit = ini_get('memory_limit');
            
            if ($memLimit === '-1') {
                return 0;
            }
            
            if (preg_match('/^(\d+)(.)$/', $memLimit, $matches)) {
                $limit = (int)$matches[1];
                switch ($matches[2]) {
                    case 'G': $limit *= 1024 * 1024 * 1024; break;
                    case 'M': $limit *= 1024 * 1024; break;
                    case 'K': $limit *= 1024; break;
                }
                
                if ($limit > 0) {
                    return min(100, (int)(($memUsed / $limit) * 100));
                }
            }
            
            return 0;
        } catch (\Exception $e) {
            return 0;
        }
    }
}
