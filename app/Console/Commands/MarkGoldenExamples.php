<?php

namespace App\Console\Commands;

use App\Services\Quality\GoldenExamplesService;
use Illuminate\Console\Command;

class MarkGoldenExamples extends Command
{
    /**
     * Signature de la commande
     *
     * @var string
     */
    protected $signature = 'golden:mark-auto
                            {--days=7 : Nombre de jours à analyser}
                            {--min-score=90 : Score minimum requis}';

    /**
     * Description de la commande
     *
     * @var string
     */
    protected $description = 'Marquer automatiquement les articles avec score élevé comme golden examples';

    /**
     * Service golden examples
     *
     * @var GoldenExamplesService
     */
    protected GoldenExamplesService $goldenService;

    /**
     * Constructeur
     */
    public function __construct(GoldenExamplesService $goldenService)
    {
        parent::__construct();
        $this->goldenService = $goldenService;
    }

    /**
     * Exécuter la commande
     *
     * @return int
     */
    public function handle(): int
    {
        $days = (int) $this->option('days');
        $minScore = (int) $this->option('min-score');

        $this->info("🏆 Marquage automatique golden examples");
        $this->info("   Période : {$days} derniers jours");
        $this->info("   Score minimum : {$minScore}%");
        $this->newLine();

        // Marquer articles comme golden examples
        $marked = $this->goldenService->autoMarkGoldenExamples($days, $minScore);

        // Afficher résultats
        $this->info("✅ Résultats :");
        $this->info("   • Articles marqués : {$marked}");

        // Stats
        $stats = $this->goldenService->getUsageStats(30);
        $this->newLine();
        $this->info("📊 Statistiques golden examples :");
        $this->info("   • Total examples : {$stats['total_examples']}");
        $this->info("   • Total utilisations : " . ($stats['total_uses'] ?? 0));
        $this->info("   • Avg utilisation/example : " . round($stats['avg_uses_per_example'] ?? 0, 1) . "x");
        return Command::SUCCESS;
    }
}