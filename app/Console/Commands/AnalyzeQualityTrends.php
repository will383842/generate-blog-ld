<?php

namespace App\Console\Commands;

use App\Services\Quality\FeedbackLoopService;
use Illuminate\Console\Command;

class AnalyzeQualityTrends extends Command
{
    /**
     * Signature de la commande
     *
     * @var string
     */
    protected $signature = 'quality:analyze
                            {--days=30 : Nombre de jours à analyser}
                            {--apply : Appliquer automatiquement les recommandations}
                            {--dry-run : Simulation sans application}';

    /**
     * Description de la commande
     *
     * @var string
     */
    protected $description = 'Analyser les tendances qualité et générer recommandations';

    /**
     * Service feedback loop
     *
     * @var FeedbackLoopService
     */
    protected FeedbackLoopService $feedbackService;

    /**
     * Constructeur
     */
    public function __construct(FeedbackLoopService $feedbackService)
    {
        parent::__construct();
        $this->feedbackService = $feedbackService;
    }

    /**
     * Exécuter la commande
     *
     * @return int
     */
    public function handle(): int
    {
        $days = (int) $this->option('days');
        $apply = $this->option('apply');
        $dryRun = $this->option('dry-run');

        $this->info("🔍 Analyse tendances qualité");
        $this->info("   Période : {$days} derniers jours");
        if ($apply) {
            $this->warn("   Mode : Application automatique");
        } elseif ($dryRun) {
            $this->info("   Mode : Simulation (dry-run)");
        } else {
            $this->info("   Mode : Analyse seule");
        }
        $this->newLine();

        // Analyser patterns
        $recommendations = $this->feedbackService->analyzeForImprovement($days);

        $totalReco = count($recommendations['prompt_adjustments'] ?? [])
                   + count($recommendations['settings_changes'] ?? [])
                   + count($recommendations['training_needed'] ?? []);

        if ($totalReco === 0) {
            $this->info("✅ Aucune recommandation - système optimal");
            return Command::SUCCESS;
        }

        $this->info("📊 RECOMMANDATIONS GÉNÉRÉES : {$totalReco}");
        $this->newLine();

        // Ajustements prompts
        if (!empty($recommendations['prompt_adjustments'])) {
            $this->info("🔧 AJUSTEMENTS PROMPTS (" . count($recommendations['prompt_adjustments']) . ")");
            foreach ($recommendations['prompt_adjustments'] as $adjustment) {
                $this->line("   • {$adjustment}");
            }
            $this->newLine();
        }

        // Changements settings
        if (!empty($recommendations['settings_changes'])) {
            $this->info("⚙️  CHANGEMENTS SETTINGS (" . count($recommendations['settings_changes']) . ")");
            foreach ($recommendations['settings_changes'] as $change) {
                $this->line("   • {$change}");
            }
            $this->newLine();
        }

        // Training nécessaire
        if (!empty($recommendations['training_needed'])) {
            $this->warn("📚 TRAINING NÉCESSAIRE (" . count($recommendations['training_needed']) . ")");
            foreach ($recommendations['training_needed'] as $training) {
                $this->line("   • {$training}");
            }
            $this->newLine();
        }

        // Application
        if ($apply && !$dryRun) {
            if ($this->confirm('Voulez-vous appliquer ces recommandations ?', false)) {
                $this->info("⏳ Application en cours...");
                
                $result = $this->feedbackService->applyImprovements($recommendations, false);
                
                $this->info("✅ Recommandations appliquées :");
                $this->info("   • Ajustements appliqués : " . ($result['applied_count'] ?? 0));
                $this->info("   • Notifications envoyées : " . ($result['notifications_sent'] ?? 0));
            } else {
                $this->info("❌ Application annulée");
            }
        } elseif ($dryRun) {
            $this->info("🔍 Simulation - Aucune modification effectuée");
            
            // Calculer le nombre total de modifications qui seraient appliquées
            $totalReco = count($recommendations['prompt_adjustments'] ?? [])
                       + count($recommendations['settings_changes'] ?? [])
                       + count($recommendations['training_needed'] ?? []);
            
            $this->info("   • {$totalReco} modifications seraient appliquées");
        }

        return Command::SUCCESS;
    }
}