<?php

namespace App\Console\Commands;

use App\Services\Content\ProgramService;
use Illuminate\Console\Command;

class RunScheduledPrograms extends Command
{
    protected $signature = 'programs:run-scheduled 
                            {--force : Forcer l\'exécution même si limites atteintes}
                            {--dry-run : Afficher les programmes sans les exécuter}';

    protected $description = 'Exécute tous les programmes planifiés prêts à être lancés';

    public function handle(ProgramService $programService): int
    {
        $this->info('🔍 Recherche des programmes prêts à être exécutés...');

        $programs = $programService->getReadyToRun();

        if ($programs->isEmpty()) {
            $this->info('✅ Aucun programme à exécuter.');
            return self::SUCCESS;
        }

        $this->info("📋 {$programs->count()} programme(s) trouvé(s)");

        if ($this->option('dry-run')) {
            $this->table(
                ['ID', 'Nom', 'Plateforme', 'Récurrence', 'Prochaine exécution'],
                $programs->map(fn($p) => [
                    $p->id,
                    $p->name,
                    $p->platform->name ?? '-',
                    $p->recurrence_type,
                    $p->next_run_at?->format('d/m/Y H:i') ?? 'Maintenant',
                ])
            );
            return self::SUCCESS;
        }

        $executed = 0;
        $skipped = 0;

        foreach ($programs as $program) {
            $this->line("▶️  Programme #{$program->id}: {$program->name}");

            // Vérifier si un run est déjà en cours
            if ($program->runs()->where('status', 'running')->exists()) {
                $this->warn("   ⏭️  Déjà en cours d'exécution, ignoré");
                $skipped++;
                continue;
            }

            // Vérifier les limites (sauf si --force)
            if (!$this->option('force') && !$program->canRunToday()) {
                $this->warn("   ⏭️  Limite journalière atteinte, ignoré");
                $skipped++;
                continue;
            }

            try {
                $run = $programService->dispatch($program);
                $this->info("   ✅ Lancé (Run #{$run->id}, {$run->articles_planned} articles planifiés)");
                $executed++;
            } catch (\Exception $e) {
                $this->error("   ❌ Erreur: {$e->getMessage()}");
                $skipped++;
            }
        }

        $this->newLine();
        $this->info("📊 Résumé: {$executed} lancé(s), {$skipped} ignoré(s)");

        return self::SUCCESS;
    }
}