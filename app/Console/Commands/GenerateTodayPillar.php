<?php

namespace App\Console\Commands;

use App\Services\Content\PillarSchedulerService;
use Illuminate\Console\Command;

/**
 * Command : php artisan pillar:generate-today
 * 
 * Génère automatiquement tous les articles piliers planifiés pour aujourd'hui
 */
class GenerateTodayPillar extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pillar:generate-today 
                            {--dry-run : Simuler sans générer}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Génère les articles piliers planifiés pour aujourd\'hui';

    /**
     * Execute the console command.
     */
    public function handle(PillarSchedulerService $scheduler): int
    {
        $this->info('╔════════════════════════════════════════════════════════════╗');
        $this->info('║   🚀 GÉNÉRATION ARTICLES PILIERS DU JOUR                  ║');
        $this->info('╚════════════════════════════════════════════════════════════╝');
        $this->newLine();

        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->warn('⚠️  Mode DRY-RUN : aucune génération réelle');
            $this->newLine();
        }

        try {
            // Récupérer les plannings du jour
            $schedules = \App\Models\PillarSchedule::today()
                ->pending()
                ->with(['platform', 'country', 'theme'])
                ->get();

            if ($schedules->isEmpty()) {
                $this->info('ℹ️  Aucun article pilier planifié pour aujourd\'hui');
                return Command::SUCCESS;
            }

            $this->info("📝 {$schedules->count()} article(s) pilier(s) à générer");
            $this->newLine();

            // Afficher liste
            $this->table(
                ['#', 'Plateforme', 'Pays', 'Thème', 'Template', 'Priorité'],
                $schedules->map(function ($schedule, $index) {
                    return [
                        $index + 1,
                        $schedule->platform->name ?? 'N/A',
                        $schedule->country->name ?? 'N/A',
                        $schedule->theme->name ?? 'N/A',
                        $schedule->template_type,
                        $schedule->priority,
                    ];
                })
            );

            $this->newLine();

            if ($dryRun) {
                $this->info('✅ Dry-run terminé : ' . $schedules->count() . ' articles auraient été générés');
                return Command::SUCCESS;
            }

            // Confirmer
            if (!$this->confirm('Voulez-vous lancer la génération ?', true)) {
                $this->warn('❌ Génération annulée');
                return Command::SUCCESS;
            }

            $this->newLine();

            // Barre de progression
            $bar = $this->output->createProgressBar($schedules->count());
            $bar->setFormat(' %current%/%max% [%bar%] %percent:3s%% - %message%');
            $bar->setMessage('Démarrage...');
            $bar->start();

            // Générer
            $generated = 0;
            $failed = 0;

            foreach ($schedules as $index => $schedule) {
                $bar->setMessage("Génération {$schedule->title}...");

                try {
                    $schedule->markAsGenerating();

                    // Appeler le générateur via le service
                    $article = app(\App\Services\Content\PillarArticleGenerator::class)->generate([
                        'platform_id' => $schedule->platform_id,
                        'country_id' => $schedule->country_id,
                        'theme_id' => $schedule->theme_id,
                        'language_id' => $schedule->platform->default_language_id ?? 1,
                        'template_type' => $schedule->template_type,
                    ]);

                    $schedule->markAsCompleted($article->id);
                    $generated++;

                } catch (\Exception $e) {
                    $schedule->markAsFailed($e->getMessage());
                    $failed++;

                    if ($this->output->isVerbose()) {
                        $this->newLine();
                        $this->error("❌ Échec : {$e->getMessage()}");
                    }
                }

                $bar->advance();

                // Rate limiting entre générations
                if ($index < $schedules->count() - 1) {
                    sleep(5);
                }
            }

            $bar->setMessage('Terminé !');
            $bar->finish();

            $this->newLine(2);

            // Résumé
            $this->displaySummary($generated, $failed);

            return $failed === 0 ? Command::SUCCESS : Command::FAILURE;

        } catch (\Exception $e) {
            $this->error('❌ Erreur lors de la génération');
            $this->error($e->getMessage());

            if ($this->output->isVerbose()) {
                $this->error($e->getTraceAsString());
            }

            return Command::FAILURE;
        }
    }

    /**
     * Afficher le résumé
     */
    protected function displaySummary(int $generated, int $failed): void
    {
        $total = $generated + $failed;
        $successRate = $total > 0 ? round(($generated / $total) * 100, 1) : 0;

        $this->info('╔════════════════════════════════════════════════════════════╗');
        $this->info('║                    📊 RÉSUMÉ GÉNÉRATION                   ║');
        $this->info('╠════════════════════════════════════════════════════════════╣');
        $this->line("║  Articles générés   : " . str_pad($generated, 36) . "║");
        $this->line("║  Échecs             : " . str_pad($failed, 36) . "║");
        $this->line("║  Total              : " . str_pad($total, 36) . "║");
        $this->line("║  Taux de succès     : " . str_pad($successRate . '%', 36) . "║");
        $this->info('╚════════════════════════════════════════════════════════════╝');

        $this->newLine();

        if ($generated > 0) {
            $this->info("✅ {$generated} article(s) pilier(s) généré(s) avec succès !");
        }

        if ($failed > 0) {
            $this->warn("⚠️  {$failed} échec(s) - Vérifiez les logs pour plus de détails");
        }
    }
}
