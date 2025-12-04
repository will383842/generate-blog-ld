<?php

namespace App\Console\Commands;

use App\Services\Content\ManualGenerationService;
use Illuminate\Console\Command;

class ProcessManualTitles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'titles:process-queue 
                            {--limit=10 : Nombre maximum de titres à traiter}
                            {--force : Forcer le traitement même si déjà en cours}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Traite la queue des titres manuels en attente de génération';

    /**
     * Execute the console command.
     */
    public function handle(ManualGenerationService $service): int
    {
        $this->info('🚀 Démarrage du traitement de la queue des titres manuels...');
        $this->newLine();

        $limit = (int) $this->option('limit');

        try {
            $processed = $service->processQueue($limit);

            $this->newLine();
            $this->info("✅ Traitement terminé : {$processed} titres traités");

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('❌ Erreur lors du traitement de la queue');
            $this->error($e->getMessage());
            
            return Command::FAILURE;
        }
    }
}