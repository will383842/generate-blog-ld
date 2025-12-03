<?php

namespace App\Console\Commands;

use App\Services\Content\PillarSchedulerService;
use Illuminate\Console\Command;

/**
 * Command : php artisan pillar:schedule-month
 * 
 * Planifie automatiquement les articles piliers pour le mois à venir
 */
class SchedulePillars extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pillar:schedule-month 
                            {--days=30 : Nombre de jours à planifier}
                            {--force : Forcer la replanification}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Planifie les articles piliers pour le mois à venir (1/jour/plateforme)';

    /**
     * Execute the console command.
     */
    public function handle(PillarSchedulerService $scheduler): int
    {
        $this->info('╔════════════════════════════════════════════════════════════╗');
        $this->info('║   📅 PLANIFICATION ARTICLES PILIERS - CONTENT ENGINE     ║');
        $this->info('╚════════════════════════════════════════════════════════════╝');
        $this->newLine();

        $days = (int) $this->option('days');
        $force = $this->option('force');

        if ($force) {
            $this->warn('⚠️  Mode FORCE activé : replanification complète');
        }

        $this->info("🗓️  Planification pour les {$days} prochains jours...");
        $this->newLine();

        // Barre de progression
        $bar = $this->output->createProgressBar($days);
        $bar->setFormat(' %current%/%max% [%bar%] %percent:3s%% - %message%');
        $bar->setMessage('Initialisation...');
        $bar->start();

        try {
            // Planification
            $scheduled = $scheduler->schedulePillarArticles($days);

            $bar->setMessage('Terminé !');
            $bar->finish();

            $this->newLine(2);
            
            $this->info("✅ Planification terminée avec succès !");
            $this->info("📊 {$scheduled} articles piliers planifiés");
            
            $this->newLine();

            // Afficher statistiques
            $this->displayStats($scheduler);

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $bar->finish();
            $this->newLine(2);

            $this->error('❌ Erreur lors de la planification');
            $this->error($e->getMessage());

            if ($this->output->isVerbose()) {
                $this->error($e->getTraceAsString());
            }

            return Command::FAILURE;
        }
    }

    /**
     * Afficher les statistiques
     */
    protected function displayStats(PillarSchedulerService $scheduler): void
    {
        $stats = $scheduler->getScheduleStats();

        $this->info('╔════════════════════════════════════════════════════════════╗');
        $this->info('║                    📊 STATISTIQUES                        ║');
        $this->info('╠════════════════════════════════════════════════════════════╣');
        $this->line("║  Total planifié     : " . str_pad($stats['total'], 36) . "║");
        $this->line("║  En attente         : " . str_pad($stats['planned'], 36) . "║");
        $this->line("║  Complétés          : " . str_pad($stats['completed'], 36) . "║");
        $this->line("║  Échoués            : " . str_pad($stats['failed'], 36) . "║");
        $this->line("║  Taux de succès     : " . str_pad($stats['success_rate'] . '%', 36) . "║");
        
        if ($stats['next_scheduled']) {
            $this->line("║  Prochain prévu     : " . str_pad($stats['next_scheduled'], 36) . "║");
        }
        
        $this->info('╚════════════════════════════════════════════════════════════╝');
    }
}
