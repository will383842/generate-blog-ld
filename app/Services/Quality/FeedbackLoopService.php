<?php

namespace App\Services\Quality;

use App\Models\QualityCheck;
use App\Models\Setting;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * =============================================================================
 * PHASE 13 - FICHIER 9/14 : Feedback Loop Service
 * =============================================================================
 * 
 * EMPLACEMENT : app/Services/Quality/FeedbackLoopService.php
 * 
 * DESCRIPTION : Amélioration continue automatique basée sur patterns erreurs
 * Analyse hebdomadaire, recommandations, application automatique
 * 
 * =============================================================================
 */

class FeedbackLoopService
{
    /**
     * Analyser patterns erreurs et générer recommandations
     */
    public function analyzeForImprovement(int $days = 30): array
    {
        Log::info('FeedbackLoopService: Démarrage analyse patterns', [
            'period_days' => $days,
        ]);
        
        // Récupérer quality checks failed/warning
        $checks = QualityCheck::where('checked_at', '>=', now()->subDays($days))
            ->whereIn('status', ['failed', 'warning'])
            ->get();
        
        $patterns = $this->detectPatterns($checks);
        $recommendations = $this->generateRecommendations($patterns);
        
        Log::info('FeedbackLoopService: Analyse terminée', [
            'checks_analyzed' => $checks->count(),
            'patterns_found' => count($patterns),
            'recommendations' => count($recommendations['total']),
        ]);
        
        return $recommendations;
    }

    /**
     * Détecter patterns récurrents
     */
    protected function detectPatterns($checks): array
    {
        $errorPatterns = [];
        $warningPatterns = [];
        
        foreach ($checks as $check) {
            // Analyser erreurs
            foreach ($check->errors ?? [] as $error) {
                $key = $this->normalizeError($error);
                if (!isset($errorPatterns[$key])) {
                    $errorPatterns[$key] = ['count' => 0, 'example' => $error];
                }
                $errorPatterns[$key]['count']++;
            }
            
            // Analyser warnings
            foreach ($check->warnings ?? [] as $warning) {
                $key = $this->normalizeError($warning);
                if (!isset($warningPatterns[$key])) {
                    $warningPatterns[$key] = ['count' => 0, 'example' => $warning];
                }
                $warningPatterns[$key]['count']++;
            }
        }
        
        // Trier par fréquence
        uasort($errorPatterns, fn($a, $b) => $b['count'] <=> $a['count']);
        uasort($warningPatterns, fn($a, $b) => $b['count'] <=> $a['count']);
        
        return [
            'errors' => array_slice($errorPatterns, 0, 10, true), // Top 10
            'warnings' => array_slice($warningPatterns, 0, 10, true),
        ];
    }

    /**
     * Normaliser message erreur pour groupement
     */
    protected function normalizeError(string $error): string
    {
        // Supprimer chiffres/valeurs variables
        $normalized = preg_replace('/\d+/', 'X', $error);
        $normalized = preg_replace('/[0-9.]+%/', 'X%', $normalized);
        $normalized = mb_strtolower($normalized);
        return $normalized;
    }

    /**
     * Générer recommandations
     */
    protected function generateRecommendations(array $patterns): array
    {
        $recommendations = [
            'prompt_adjustments' => [],
            'settings_changes' => [],
            'training_needed' => [],
            'total' => [],
        ];
        
        // ANALYSER ERREURS TOP 10
        foreach ($patterns['errors'] as $key => $pattern) {
            $example = $pattern['example'];
            $count = $pattern['count'];
            
            // Meta description
            if (stripos($example, 'meta description') !== false) {
                if (stripos($example, 'trop longue') !== false) {
                    $recommendations['prompt_adjustments'][] = 
                        "Insister davantage sur meta description 120-160 chars (erreur {$count}x)";
                    $recommendations['settings_changes'][] = 
                        "Réduire meta_description_max de 200 à 160";
                }
            }
            
            // Tutoiement
            if (stripos($example, 'tutoiement') !== false) {
                $recommendations['prompt_adjustments'][] = 
                    "RENFORCER consigne vouvoiement strict avec exemples (erreur {$count}x)";
                $recommendations['training_needed'][] = 
                    "Créer golden examples parfaits pour vouvoiement";
            }
            
            // Chiffres clés
            if (stripos($example, '304 million') !== false || stripos($example, 'chiffre clé') !== false) {
                $recommendations['prompt_adjustments'][] = 
                    "TOUJOURS mentionner '304 millions d'expatriés' dans intro (oublié {$count}x)";
                $recommendations['prompt_adjustments'][] = 
                    "Placer chiffres clés en début de prompt (haute priorité)";
            }
            
            // Phrases longues
            if (stripos($example, 'phrase') !== false && stripos($example, 'longue') !== false) {
                $recommendations['settings_changes'][] = 
                    "Réduire style_sentence_length_max de 25 à 23 mots";
                $recommendations['prompt_adjustments'][] = 
                    "Insister sur phrases courtes et percutantes";
            }
            
            // H1/H2
            if (stripos($example, 'h1') !== false || stripos($example, 'h2') !== false) {
                $recommendations['prompt_adjustments'][] = 
                    "Renforcer structure H1 unique + 6-8 H2";
            }
        }
        
        // ANALYSER WARNINGS TOP 10
        foreach ($patterns['warnings'] as $key => $pattern) {
            $example = $pattern['example'];
            $count = $pattern['count'];
            
            // FAQs
            if (stripos($example, 'faq') !== false) {
                $recommendations['prompt_adjustments'][] = 
                    "Exiger minimum 8 FAQs pour rich snippets (warning {$count}x)";
            }
            
            // Nom plateforme
            if (stripos($example, 'nom plateforme') !== false) {
                $recommendations['prompt_adjustments'][] = 
                    "Mentionner nom plateforme 2-3x dans contenu (warning {$count}x)";
            }
        }
        
        // Dédupliquer
        $recommendations['prompt_adjustments'] = array_unique($recommendations['prompt_adjustments']);
        $recommendations['settings_changes'] = array_unique($recommendations['settings_changes']);
        $recommendations['training_needed'] = array_unique($recommendations['training_needed']);
        
        $recommendations['total'] = array_merge(
            $recommendations['prompt_adjustments'],
            $recommendations['settings_changes'],
            $recommendations['training_needed']
        );
        
        return $recommendations;
    }

    /**
     * Appliquer améliorations (automatiques ou dry-run)
     */
    public function applyImprovements(array $recommendations, bool $dryRun = false): array
    {
        $applied = [];
        $notifications = [];
        
        foreach ($recommendations['settings_changes'] as $change) {
            // Changements "safe" automatiques
            if (stripos($change, 'réduire') !== false && stripos($change, 'sentence_length') !== false) {
                if (!$dryRun) {
                    Setting::set('sos-expat.style_sentence_length_max', 23);
                    Setting::set('ulixai.style_sentence_length_max', 21);
                    Setting::set('ulysse.style_sentence_length_max', 22);
                    $applied[] = $change;
                } else {
                    $applied[] = "[DRY-RUN] " . $change;
                }
            }
            
            // Changements "sensibles" → notification admin
            else {
                $notifications[] = $change;
            }
        }
        
        Log::info('FeedbackLoopService: Améliorations appliquées', [
            'dry_run' => $dryRun,
            'applied' => count($applied),
            'notifications' => count($notifications),
        ]);
        
        return [
            'applied' => $applied,
            'notifications' => $notifications,
            'prompt_adjustments' => $recommendations['prompt_adjustments'],
            'training_needed' => $recommendations['training_needed'],
        ];
    }

    /**
     * Rapport qualité hebdomadaire (scheduled task)
     */
    public function generateWeeklyReport(): array
    {
        $recommendations = $this->analyzeForImprovement(7); // 7 derniers jours
        
        $stats = QualityCheck::getGlobalStats();
        $trends = QualityCheck::getQualityTrends(7);
        
        $report = [
            'period' => '7 derniers jours',
            'stats' => $stats,
            'trends' => $trends,
            'recommendations' => $recommendations,
            'generated_at' => now()->toIso8601String(),
        ];
        
        // Notifier admin
        // Mail::to('admin@ulixai.com')->send(new WeeklyQualityReport($report));
        
        return $report;
    }
}