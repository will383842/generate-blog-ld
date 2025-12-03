<?php

namespace App\Console\Commands;

use App\Models\QualityCheck;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class QualityReport extends Command
{
    /**
     * Signature de la commande
     *
     * @var string
     */
    protected $signature = 'quality:report
                            {--weekly : Rapport hebdomadaire}
                            {--monthly : Rapport mensuel}
                            {--days= : Nombre de jours spécifique}
                            {--platform= : Filtrer par platform_id}';

    /**
     * Description de la commande
     *
     * @var string
     */
    protected $description = 'Générer un rapport qualité détaillé';

    /**
     * Exécuter la commande
     *
     * @return int
     */
    public function handle(): int
    {
        // Déterminer la période
        if ($this->option('weekly')) {
            $days = 7;
            $period = 'hebdomadaire';
        } elseif ($this->option('monthly')) {
            $days = 30;
            $period = 'mensuel';
        } elseif ($this->option('days')) {
            $days = (int) $this->option('days');
            $period = "{$days} jours";
        } else {
            $days = 7;
            $period = 'hebdomadaire (défaut)';
        }

        $platformId = $this->option('platform');

        $this->info("📊 Rapport qualité {$period}");
        if ($platformId) {
            $this->info("   Platform ID : {$platformId}");
        }
        $this->newLine();

        // Récupérer les checks
        $query = QualityCheck::where('checked_at', '>=', now()->subDays($days));
        
        if ($platformId) {
            $query->where('platform_id', $platformId);
        }

        $checks = $query->get();
        $totalChecks = $checks->count();

        if ($totalChecks === 0) {
            $this->warn("⚠️  Aucun quality check trouvé pour cette période");
            return Command::SUCCESS;
        }

        // Statistiques globales
        $passed = $checks->where('status', 'passed')->count();
        $warning = $checks->where('status', 'warning')->count();
        $failed = $checks->where('status', 'failed')->count();

        $this->info("📈 STATISTIQUES GLOBALES");
        $this->info("   • Total checks : {$totalChecks}");
        $this->info("   • Passed : {$passed} (" . round(($passed / $totalChecks) * 100, 1) . "%)");
        $this->info("   • Warning : {$warning} (" . round(($warning / $totalChecks) * 100, 1) . "%)");
        $this->info("   • Failed : {$failed} (" . round(($failed / $totalChecks) * 100, 1) . "%)");
        $this->newLine();

        // Scores moyens par critère
        $avgKnowledge = round($checks->avg('knowledge_score'), 1);
        $avgBrand = round($checks->avg('brand_score'), 1);
        $avgSeo = round($checks->avg('seo_score'), 1);
        $avgReadability = round($checks->avg('readability_score'), 1);
        $avgStructure = round($checks->avg('structure_score'), 1);
        $avgOriginality = round($checks->avg('originality_score'), 1);
        $avgOverall = round($checks->avg('overall_score'), 1);

        $this->info("🎯 SCORES MOYENS PAR CRITÈRE");
        $this->line("   • Knowledge (30%)    : " . $this->colorizeScore($avgKnowledge) . "%");
        $this->line("   • Brand (25%)        : " . $this->colorizeScore($avgBrand) . "%");
        $this->line("   • SEO (15%)          : " . $this->colorizeScore($avgSeo) . "%");
        $this->line("   • Readability (15%)  : " . $this->colorizeScore($avgReadability) . "%");
        $this->line("   • Structure (10%)    : " . $this->colorizeScore($avgStructure) . "%");
        $this->line("   • Originality (5%)   : " . $this->colorizeScore($avgOriginality) . "%");
        $this->newLine();
        $this->line("   • OVERALL SCORE      : " . $this->colorizeScore($avgOverall) . "%");
        $this->newLine();

        // Identifier critère le plus faible
        $scores = [
            'Knowledge' => $avgKnowledge,
            'Brand' => $avgBrand,
            'SEO' => $avgSeo,
            'Readability' => $avgReadability,
            'Structure' => $avgStructure,
            'Originality' => $avgOriginality,
        ];

        $lowestCriterion = array_keys($scores, min($scores))[0];
        $lowestScore = min($scores);

        $this->warn("⚠️  Critère le plus faible : {$lowestCriterion} ({$lowestScore}%)");
        $this->newLine();

        // Recommandations
        $this->info("💡 RECOMMANDATIONS");
        if ($lowestScore < 60) {
            $this->warn("   • Critère {$lowestCriterion} nécessite attention urgente (< 60%)");
        }
        if ($avgOverall < 70) {
            $this->warn("   • Score global faible (< 70%), révision des prompts recommandée");
        }
        if ($failed > ($totalChecks * 0.2)) {
            $this->warn("   • Taux d'échec élevé (> 20%), révision système qualité nécessaire");
        }

        if ($lowestScore >= 80 && $avgOverall >= 80 && $failed < ($totalChecks * 0.1)) {
            $this->info("   ✅ Système de qualité performant !");
        }

        return Command::SUCCESS;
    }

    /**
     * Coloriser score selon seuils
     */
    protected function colorizeScore(float $score): string
    {
        if ($score >= 80) {
            return "<fg=green>{$score}</>";
        } elseif ($score >= 60) {
            return "<fg=yellow>{$score}</>";
        } else {
            return "<fg=red>{$score}</>";
        }
    }

    /**
     * Obtenir status lisible
     */
    protected function getScoreStatus(float $score): string
    {
        if ($score >= 80) {
            return 'Excellent';
        } elseif ($score >= 70) {
            return 'Bon';
        } elseif ($score >= 60) {
            return 'Moyen';
        } else {
            return 'Faible';
        }
    }
}