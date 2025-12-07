<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Carbon\Carbon;

class CleanOldLogs extends Command
{
    protected $signature = 'logs:clean {--days=7 : Nombre de jours à conserver}';

    protected $description = 'Nettoie les anciens fichiers de logs';

    public function handle(): int
    {
        $days = (int) $this->option('days');
        $logsPath = storage_path('logs');
        $cutoffDate = Carbon::now()->subDays($days);
        $deletedCount = 0;
        $freedBytes = 0;

        $this->info("Nettoyage des logs de plus de {$days} jours...");

        // Récupérer tous les fichiers .log
        $files = File::glob($logsPath . '/*.log');

        foreach ($files as $file) {
            $filename = basename($file);

            // Ne pas supprimer les fichiers principaux (sans date)
            // Les fichiers avec rotation ont le format: name-YYYY-MM-DD.log
            if (!preg_match('/-\d{4}-\d{2}-\d{2}\.log$/', $filename)) {
                continue;
            }

            // Extraire la date du nom de fichier
            if (preg_match('/-(\d{4}-\d{2}-\d{2})\.log$/', $filename, $matches)) {
                $fileDate = Carbon::parse($matches[1]);

                if ($fileDate->lt($cutoffDate)) {
                    $size = File::size($file);
                    File::delete($file);
                    $deletedCount++;
                    $freedBytes += $size;
                    $this->line("  Supprimé: {$filename} (" . $this->formatBytes($size) . ")");
                }
            }
        }

        // Nettoyer aussi les fichiers scheduler appendOutputTo (sans rotation native)
        $schedulerLogs = [
            'publish-scheduled.log',
            'export-queue.log',
            'titles-queue.log',
            'monitoring-alerts.log',
            'programs-scheduled.log',
            'pillar-generation.log',
            'pillar-scheduling.log',
            'cost-reports.log',
            'archive-articles.log',
        ];

        foreach ($schedulerLogs as $logFile) {
            $filePath = $logsPath . '/' . $logFile;

            if (File::exists($filePath)) {
                $size = File::size($filePath);
                $lastModified = Carbon::createFromTimestamp(File::lastModified($filePath));

                // Si le fichier fait plus de 10MB ou n'a pas été modifié depuis 30 jours, le tronquer
                if ($size > 10 * 1024 * 1024) { // 10MB
                    // Garder les dernières 1000 lignes
                    $this->truncateLog($filePath, 1000);
                    $newSize = File::size($filePath);
                    $freed = $size - $newSize;
                    $freedBytes += $freed;
                    $this->line("  Tronqué: {$logFile} (libéré " . $this->formatBytes($freed) . ")");
                }
            }
        }

        $this->newLine();
        $this->info("Nettoyage terminé:");
        $this->line("  - Fichiers supprimés: {$deletedCount}");
        $this->line("  - Espace libéré: " . $this->formatBytes($freedBytes));

        return Command::SUCCESS;
    }

    private function truncateLog(string $filePath, int $linesToKeep): void
    {
        $lines = file($filePath);

        if (count($lines) > $linesToKeep) {
            $lastLines = array_slice($lines, -$linesToKeep);
            File::put($filePath, implode('', $lastLines));
        }
    }

    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;

        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }
}
