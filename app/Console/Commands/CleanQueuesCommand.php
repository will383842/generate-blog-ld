<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;

/**
 * Commande pour nettoyer TOUTES les queues et jobs
 * Usage: php artisan queue:clean
 */
class CleanQueuesCommand extends Command
{
    protected $signature = 'queue:clean {--force : Force la suppression sans confirmation}';
    protected $description = 'Nettoie toutes les queues, jobs, et failed_jobs';

    public function handle()
    {
        if (!$this->option('force')) {
            if (!$this->confirm('⚠️  Cela va supprimer TOUS les jobs en queue. Continuer?')) {
                $this->info('Opération annulée.');
                return 0;
            }
        }

        $this->info('🧹 Nettoyage des queues en cours...');

        try {
            // 1. Vider la table jobs
            $jobsCount = DB::table('jobs')->count();
            DB::table('jobs')->truncate();
            $this->info("✅ {$jobsCount} jobs supprimés");

            // 2. Vider la table failed_jobs
            $failedCount = DB::table('failed_jobs')->count();
            DB::table('failed_jobs')->truncate();
            $this->info("✅ {$failedCount} failed_jobs supprimés");

            // 3. Nettoyer Redis si utilisé
            if (config('queue.default') === 'redis') {
                Artisan::call('queue:clear', ['--queue' => 'default']);
                $this->info("✅ Queue Redis nettoyée");
            }

            // 4. Arrêter tous les workers
            $this->info("⏹️  Pour arrêter les workers, exécuter: php artisan queue:restart");

            $this->newLine();
            $this->info('✅ Nettoyage terminé avec succès!');
            $this->newLine();

        } catch (\Exception $e) {
            $this->error('❌ Erreur: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
