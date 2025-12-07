<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use App\Services\Quality\GoldenExamplesService;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule): void
    {
        // =====================================================================
        // TOUTES LES MINUTES - Publication automatique (CRITIQUE)
        // =====================================================================
        
        $schedule->command('content:publish-scheduled')
                 ->everyMinute()
                 ->name('publish-scheduled')
                 ->withoutOverlapping()
                 ->runInBackground()
                 ->appendOutputTo(storage_path('logs/publish-scheduled.log'));

        // =====================================================================
        // TOUTES LES 5 MINUTES
        // =====================================================================
        
        $schedule->command('export:process-queue')
                 ->everyFiveMinutes()
                 ->name('export-queue-processing')
                 ->withoutOverlapping()
                 ->runInBackground()
                 ->appendOutputTo(storage_path('logs/export-queue.log'));

        // =====================================================================
        // TOUTES LES 15 MINUTES
        // =====================================================================
        
        $schedule->command('titles:process-queue --limit=20')
                 ->everyFifteenMinutes()
                 ->name('titles-process-queue')
                 ->withoutOverlapping()
                 ->runInBackground()
                 ->appendOutputTo(storage_path('logs/titles-queue.log'));

        // =====================================================================
        // TOUTES LES HEURES
        // =====================================================================
        
        $schedule->command('monitoring:check-alerts')
                 ->hourly()
                 ->name('monitoring-check-alerts')
                 ->withoutOverlapping()
                 ->runInBackground()
                 ->appendOutputTo(storage_path('logs/monitoring-alerts.log'));

        $schedule->command('programs:run-scheduled')
                 ->hourly()
                 ->name('programs-run-scheduled')
                 ->withoutOverlapping()
                 ->runInBackground()
                 ->appendOutputTo(storage_path('logs/programs-scheduled.log'));

        // =====================================================================
        // QUOTIDIEN
        // =====================================================================
        
        $schedule->command('golden:mark-auto --days=1')
                 ->dailyAt('03:00')
                 ->name('golden-marking-daily')
                 ->withoutOverlapping();

        $schedule->command('pillar:generate-today')
                 ->dailyAt('05:00')
                 ->timezone('Europe/Paris')
                 ->name('pillar-generation-daily')
                 ->withoutOverlapping()
                 ->runInBackground()
                 ->appendOutputTo(storage_path('logs/pillar-generation.log'));

        $schedule->command('costs:report')
                 ->dailyAt('08:00')
                 ->name('daily-cost-report')
                 ->withoutOverlapping()
                 ->appendOutputTo(storage_path('logs/cost-reports.log'));

        // =====================================================================
        // HEBDOMADAIRE (Lundi)
        // =====================================================================
        
        $schedule->command('pillar:schedule-month')
                 ->weeklyOn(1, '01:00')
                 ->timezone('Europe/Paris')
                 ->name('pillar-scheduling-weekly')
                 ->withoutOverlapping()
                 ->runInBackground()
                 ->appendOutputTo(storage_path('logs/pillar-scheduling.log'));

        $schedule->command('quality:analyze --days=7 --apply')
                 ->weeklyOn(1, '02:00')
                 ->name('feedback-loop-weekly')
                 ->withoutOverlapping();

        $schedule->command('quality:report --weekly')
                 ->weeklyOn(1, '08:00')
                 ->name('quality-report-weekly');

        // =====================================================================
        // MENSUEL
        // =====================================================================
        
        // Archivage golden examples anciens (1er du mois à 04:00)
        $schedule->call(function () {
            $service = app(GoldenExamplesService::class);
            $archived = $service->archiveOldExamples(90, 5);
            \Log::info("Archivage golden examples : {$archived} exemples archivés");
        })
        ->monthlyOn(1, '04:00')
        ->name('archive-golden-examples-monthly')
        ->withoutOverlapping();

        // Archivage vieux articles (1er du mois à 04:30)
        $schedule->command('archive:old-articles --days=180')
                 ->monthlyOn(1, '04:30')
                 ->name('archive-old-articles-monthly')
                 ->withoutOverlapping()
                 ->appendOutputTo(storage_path('logs/archive-articles.log'));

        // Rapport mensuel coûts (1er du mois à 10:00)
        $schedule->command('costs:report --monthly --export')
                 ->monthlyOn(1, '10:00')
                 ->name('monthly-cost-report')
                 ->withoutOverlapping()
                 ->appendOutputTo(storage_path('logs/cost-reports.log'));

        // Export training JSONL (15 du mois à 03:00)
        $schedule->call(function () {
            $service = app(GoldenExamplesService::class);
            $filename = $service->exportForTraining('jsonl');
            \Log::info("Export training créé : {$filename}");
        })
        ->monthlyOn(15, '03:00')
        ->name('export-training-monthly')
        ->withoutOverlapping();

        // =====================================================================
        // MAINTENANCE - Nettoyage des logs (quotidien à 02:00)
        // =====================================================================

        $schedule->command('logs:clean --days=7')
                 ->dailyAt('02:00')
                 ->name('logs-cleanup-daily')
                 ->withoutOverlapping();
    }

    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');
        require base_path('routes/console.php');
    }
}