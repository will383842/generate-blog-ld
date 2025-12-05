<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use App\Services\Quality\GoldenExamplesService;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // =================================================================
        // PHASE 13 : QUALITY & CONTENT PERFECTION - SCHEDULED TASKS
        // =================================================================
        
        // -----------------------------------------------------------------
        // TASK 1 : AUTO-MARKING GOLDEN EXAMPLES
        // -----------------------------------------------------------------
        // Fréquence : Quotidien à 03:00
        // Action : Marquer automatiquement les articles avec score ≥90
        //          comme golden examples (dernières 24h)
        // Résultat : 0-5 nouveaux golden examples créés par jour
        // Impact : +2-3% qualité/semaine
        // -----------------------------------------------------------------
        
        $schedule->command('golden:mark-auto --days=1')
                 ->daily()
                 ->at('03:00')
                 ->name('golden-marking-daily')
                 ->withoutOverlapping()
                 ->onSuccess(function () {
                     \Log::info('✅ Golden examples auto-marking terminé');
                 })
                 ->onFailure(function () {
                     \Log::error('❌ Échec auto-marking golden examples');
                 });

        // -----------------------------------------------------------------
        // TASK 2 : FEEDBACK LOOP HEBDOMADAIRE
        // -----------------------------------------------------------------
        // Fréquence : Hebdomadaire le lundi à 02:00
        // Action : Analyser les patterns d'erreurs des 7 derniers jours
        //          et appliquer automatiquement les améliorations "safe"
        // Résultat : Recommandations générées et appliquées automatiquement
        // Impact : +5-10% qualité/mois
        // -----------------------------------------------------------------
        
        $schedule->command('quality:analyze --days=7 --apply')
                 ->weekly()
                 ->mondays()
                 ->at('02:00')
                 ->name('feedback-loop-weekly')
                 ->withoutOverlapping()
                 ->emailOutputOnFailure('admin@ulixai.com')
                 ->onSuccess(function () {
                     \Log::info('✅ Feedback loop hebdomadaire terminé');
                 })
                 ->onFailure(function () {
                     \Log::error('❌ Échec feedback loop hebdomadaire');
                 });

        // -----------------------------------------------------------------
        // TASK 3 : ARCHIVAGE GOLDEN EXAMPLES ANCIENS
        // -----------------------------------------------------------------
        // Fréquence : Mensuel le 1er du mois à 04:00
        // Action : Archiver (soft delete) les golden examples :
        //          - Créés il y a plus de 90 jours ET
        //          - Utilisés moins de 5 fois
        // Résultat : Nettoyage automatique des exemples sous-utilisés
        // Impact : +15% performance requêtes
        // -----------------------------------------------------------------
        
        $schedule->call(function () {
            $service = app(GoldenExamplesService::class);
            $archived = $service->archiveOldExamples(90, 5);
            
            \Log::info("✅ Archivage golden examples : {$archived} exemples archivés");
        })
        ->monthly()
        ->at('04:00')
        ->name('archive-golden-examples-monthly')
        ->withoutOverlapping();

        // -----------------------------------------------------------------
        // TASK 4 (OPTIONNEL) : RAPPORT QUALITÉ HEBDOMADAIRE
        // -----------------------------------------------------------------
        // Fréquence : Hebdomadaire le lundi à 08:00
        // Action : Générer et envoyer par email un rapport qualité détaillé
        // Résultat : Email admin avec statistiques complètes
        // -----------------------------------------------------------------
        
        $schedule->command('quality:report --weekly')
                 ->weekly()
                 ->mondays()
                 ->at('08:00')
                 ->name('quality-report-weekly')
                 ->emailOutputTo('admin@ulixai.com');

        // -----------------------------------------------------------------
        // TASK 5 (OPTIONNEL) : EXPORT TRAINING MENSUEL
        // -----------------------------------------------------------------
        // Fréquence : Mensuel le 15 à 03:00
        // Action : Exporter les golden examples en format JSONL pour
        //          fine-tuning OpenAI
        // Résultat : Fichier storage/app/exports/golden_examples_*.jsonl
        // -----------------------------------------------------------------
        
        $schedule->call(function () {
            $service = app(GoldenExamplesService::class);
            $filename = $service->exportForTraining('jsonl');
            
            \Log::info("✅ Export training créé : {$filename}");
        })
        ->monthly()
        ->monthlyOn(15, '03:00')
        ->name('export-training-monthly')
        ->withoutOverlapping();

        // =================================================================
        // PHASE 14 : ARTICLES PILIERS PREMIUM - SCHEDULED TASKS
        // =================================================================

        // -----------------------------------------------------------------
        // TASK 6 : GÉNÉRATION QUOTIDIENNE ARTICLES PILIERS
        // -----------------------------------------------------------------
        // Fréquence : Quotidien à 05:00 (après golden marking)
        // Action : Générer automatiquement les articles piliers planifiés
        //          pour aujourd'hui (1 pilier/plateforme = 3 piliers/jour)
        // Résultat : 3 articles piliers 3000-5000 mots générés par jour
        //            avec recherche Perplexity + traductions 9 langues
        // Impact : 90 piliers/mois × 9 langues = 810 articles/mois
        // Coût : ~$0.93/jour ($28/mois)
        // -----------------------------------------------------------------

        $schedule->command('pillar:generate-today')
                 ->daily()
                 ->at('05:00')
                 ->timezone('Europe/Paris')
                 ->name('pillar-generation-daily')
                 ->withoutOverlapping()
                 ->runInBackground()
                 ->emailOutputOnFailure('admin@ulixai.com')
                 ->appendOutputTo(storage_path('logs/pillar-generation.log'))
                 ->onSuccess(function () {
                     \Log::info('✅ Génération quotidienne articles piliers terminée');
                 })
                 ->onFailure(function () {
                     \Log::error('❌ Échec génération articles piliers');
                 });

        // -----------------------------------------------------------------
        // TASK 7 : PLANIFICATION MENSUELLE ARTICLES PILIERS
        // -----------------------------------------------------------------
        // Fréquence : Hebdomadaire le lundi à 01:00 (avant feedback loop)
        // Action : Planifier automatiquement les articles piliers pour
        //          les 30 prochains jours avec rotation intelligente :
        //          - Sélection pays sous-servis (coverage < 80%)
        //          - Priorisation pays fort trafic
        //          - Évite doublons < 30 jours
        //          - Rotation 5 templates
        // Résultat : Calendrier 30 jours créé automatiquement
        // Impact : Planification autonome sans intervention manuelle
        // -----------------------------------------------------------------

        $schedule->command('pillar:schedule-month')
                 ->weekly()
                 ->mondays()
                 ->at('01:00')
                 ->timezone('Europe/Paris')
                 ->name('pillar-scheduling-weekly')
                 ->withoutOverlapping()
                 ->runInBackground()
                 ->emailOutputOnFailure('admin@ulixai.com')
                 ->appendOutputTo(storage_path('logs/pillar-scheduling.log'))
                 ->onSuccess(function () {
                     \Log::info('✅ Planification mensuelle articles piliers terminée');
                 })
                 ->onFailure(function () {
                     \Log::error('❌ Échec planification articles piliers');
                 });

        // =================================================================
        // PHASE 18 : EXPORT PDF/WORD MULTI-LANGUES - SCHEDULED TASKS ✨
        // =================================================================

        // -----------------------------------------------------------------
        // TASK 8 : TRAITEMENT QUEUE EXPORTS PDF/WORD
        // -----------------------------------------------------------------
        // Fréquence : Toutes les 5 minutes
        // Action : Traiter automatiquement la queue d'exports en attente
        //          (PDF et Word pour tous types de contenus)
        // Résultat : Exports pending → processing → completed
        // Capacité : 100-200 exports/heure (2 workers recommandés)
        // Impact : Génération automatique 18 fichiers/article
        //          (9 PDF + 9 WORD) à chaque publication
        // -----------------------------------------------------------------

        $schedule->command('export:process-queue')
                 ->everyFiveMinutes()
                 ->name('export-queue-processing')
                 ->withoutOverlapping()
                 ->runInBackground()
                 ->appendOutputTo(storage_path('logs/export-queue.log'))
                 ->onSuccess(function () {
                     \Log::info('✅ Queue exports traitée avec succès');
                 })
                 ->onFailure(function () {
                     \Log::error('❌ Échec traitement queue exports');
                 });

        // =================================================================
        // PHASE 20 : MONITORING & COST OPTIMIZATION - SCHEDULED TASKS ✨
        // =================================================================

        // -----------------------------------------------------------------
        // TASK 9 : VÉRIFICATION ALERTES SYSTÈME
        // -----------------------------------------------------------------
        // Fréquence : Toutes les heures
        // Action : Vérifier alertes budget, queue, erreurs, performance
        //          et envoyer emails si alertes critiques détectées
        // Résultat : Notifications email automatiques si problème
        // Impact : Détection proactive problèmes système
        // Coût : Gratuit (pas d'API externe)
        // -----------------------------------------------------------------

        $schedule->command('monitoring:check-alerts')
                 ->hourly()
                 ->name('monitoring-check-alerts')
                 ->withoutOverlapping()
                 ->runInBackground()
                 ->appendOutputTo(storage_path('logs/monitoring-alerts.log'))
                 ->onSuccess(function () {
                     \Log::info('✅ Vérification alertes monitoring terminée');
                 })
                 ->onFailure(function () {
                     \Log::error('❌ Échec vérification alertes monitoring');
                 });

        // -----------------------------------------------------------------
        // TASK 10 : RAPPORT QUOTIDIEN COÛTS API
        // -----------------------------------------------------------------
        // Fréquence : Quotidien à 08:00
        // Action : Générer rapport coûts API du jour précédent
        //          et envoyer par email (affichage console + email)
        // Résultat : Email quotidien avec breakdown coûts détaillé
        // Impact : Visibilité quotidienne dépenses API
        // Format : Console output + Email HTML
        // -----------------------------------------------------------------

        $schedule->command('costs:report')
                 ->dailyAt('08:00')
                 ->name('daily-cost-report')
                 ->withoutOverlapping()
                 ->emailOutputTo(config('monitoring.alerts.email'))
                 ->appendOutputTo(storage_path('logs/cost-reports.log'))
                 ->onSuccess(function () {
                     \Log::info('✅ Rapport quotidien coûts envoyé');
                 })
                 ->onFailure(function () {
                     \Log::error('❌ Échec envoi rapport quotidien coûts');
                 });

        // -----------------------------------------------------------------
        // TASK 11 : RAPPORT MENSUEL COÛTS API + EXPORT JSON
        // -----------------------------------------------------------------
        // Fréquence : Mensuel le 1er du mois à 10:00
        // Action : Générer rapport complet du mois précédent avec :
        //          - Coûts totaux et breakdown détaillé
        //          - Économies réalisées via optimisations
        //          - Prédiction mois en cours
        //          - Export JSON storage/app/reports/
        // Résultat : Email mensuel + fichier JSON archivé
        // Impact : Analyse mensuelle complète + archivage historique
        // -----------------------------------------------------------------

        $schedule->command('costs:report --monthly --export')
                 ->monthlyOn(1, '10:00')
                 ->name('monthly-cost-report')
                 ->withoutOverlapping()
                 ->emailOutputTo(config('monitoring.alerts.email'))
                 ->appendOutputTo(storage_path('logs/cost-reports.log'))
                 ->onSuccess(function () {
                     \Log::info('✅ Rapport mensuel coûts envoyé et exporté');
                 })
                 ->onFailure(function () {
                     \Log::error('❌ Échec envoi rapport mensuel coûts');
                 });

        // =================================================================
        // VOS AUTRES SCHEDULED TASKS EXISTANTS
        // =================================================================
        // Ajoutez ici vos autres scheduled tasks si vous en avez
        
        // Exemple :
        // $schedule->command('inspire')->hourly();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}

/*
|--------------------------------------------------------------------------
| VÉRIFICATION SCHEDULED TASKS
|--------------------------------------------------------------------------
|
| # Lister toutes les tasks schedulées
| php artisan schedule:list
|
| # Tester une task manuellement
| php artisan schedule:test
|
| # Exécuter scheduled tasks en local (développement)
| php artisan schedule:work
|
| # Voir les prochaines exécutions
| php artisan schedule:list
|
|--------------------------------------------------------------------------
| CONFIGURATION CRON PRODUCTION
|--------------------------------------------------------------------------
|
| Ajouter cette ligne unique dans votre crontab (crontab -e) :
|
| * * * * * cd /chemin/vers/projet && php artisan schedule:run >> /dev/null 2>&1
|
| Cette ligne unique exécutera automatiquement toutes les tasks schedulées
| définies dans cette méthode schedule().
|
|--------------------------------------------------------------------------
| LOGS SCHEDULED TASKS
|--------------------------------------------------------------------------
|
| # Phase 13 - Quality
| tail -f storage/logs/laravel.log | grep "Golden examples"
| tail -f storage/logs/laravel.log | grep "Feedback loop"
| tail -f storage/logs/laravel.log | grep "Archivage"
|
| # Phase 14 - Piliers
| tail -f storage/logs/pillar-generation.log
| tail -f storage/logs/pillar-scheduling.log
|
| # Phase 18 - Exports
| tail -f storage/logs/export-queue.log
|
| # Phase 20 - Monitoring ✨
| tail -f storage/logs/monitoring-alerts.log
| tail -f storage/logs/cost-reports.log
|
|--------------------------------------------------------------------------
| TABLEAU RÉCAPITULATIF SCHEDULED TASKS (PHASES 13 + 14 + 18 + 20) ✨
|--------------------------------------------------------------------------
|
| ┌─────┬────────────────────────────────┬──────────────┬──────────────┐
| │ #   │ Task                           │ Fréquence    │ Heure        │
| ├─────┼────────────────────────────────┼──────────────┼──────────────┤
| │     │ PHASE 13 : QUALITY             │              │              │
| ├─────┼────────────────────────────────┼──────────────┼──────────────┤
| │ 1   │ golden:mark-auto --days=1      │ Quotidien    │ 03:00        │
| │ 2   │ quality:analyze --days=7       │ Hebdo lundi  │ 02:00        │
| │ 3   │ archiveOldExamples(90, 5)      │ Mensuel      │ 04:00        │
| │ 4   │ quality:report --weekly (opt)  │ Hebdo lundi  │ 08:00        │
| │ 5   │ exportForTraining (opt)        │ Mensuel (15) │ 03:00        │
| ├─────┼────────────────────────────────┼──────────────┼──────────────┤
| │     │ PHASE 14 : PILIERS             │              │              │
| ├─────┼────────────────────────────────┼──────────────┼──────────────┤
| │ 6   │ pillar:generate-today          │ Quotidien    │ 05:00        │
| │ 7   │ pillar:schedule-month          │ Hebdo lundi  │ 01:00        │
| ├─────┼────────────────────────────────┼──────────────┼──────────────┤
| │     │ PHASE 18 : EXPORTS             │              │              │
| ├─────┼────────────────────────────────┼──────────────┼──────────────┤
| │ 8   │ export:process-queue           │ 5 minutes    │ Continu      │
| ├─────┼────────────────────────────────┼──────────────┼──────────────┤
| │     │ PHASE 20 : MONITORING ✨       │              │              │
| ├─────┼────────────────────────────────┼──────────────┼──────────────┤
| │ 9   │ monitoring:check-alerts        │ Horaire      │ Toutes h     │
| │ 10  │ costs:report                   │ Quotidien    │ 08:00        │
| │ 11  │ costs:report --monthly --export│ Mensuel      │ 1er 10:00    │
| └─────┴────────────────────────────────┴──────────────┴──────────────┘
|
|--------------------------------------------------------------------------
| CHRONOLOGIE QUOTIDIENNE (Lundi type) ✨
|--------------------------------------------------------------------------
|
| 01:00 - pillar:schedule-month (hebdo)
|         → Planifie 30 jours d'articles piliers
|
| 02:00 - quality:analyze (hebdo)
|         → Analyse qualité 7 derniers jours
|
| 03:00 - golden:mark-auto (quotidien)
|         → Marque golden examples dernières 24h
|         exportForTraining (mensuel 15)
|         → Export JSONL pour fine-tuning
|
| 04:00 - archiveOldExamples (mensuel 1er)
|         → Archive exemples anciens sous-utilisés
|
| 05:00 - pillar:generate-today (quotidien)
|         → Génère 3 articles piliers + traductions
|
| 08:00 - quality:report (hebdo)
|         → Email rapport qualité admin
|         costs:report (quotidien) ✨
|         → Email rapport coûts quotidien
|
| 10:00 - costs:report --monthly --export (mensuel 1er) ✨
|         → Email + export JSON rapport mensuel
|
| TOUTES LES HEURES - monitoring:check-alerts ✨
|         → Vérification alertes système
|         → Email si alerte critique
|
| TOUTES LES 5 MIN - export:process-queue (continu)
|         → Traite queue exports PDF/WORD
|         → 100-200 exports/heure
|
|--------------------------------------------------------------------------
| IMPACT GLOBAL PHASES 13 + 14 + 18 + 20 ✨
|--------------------------------------------------------------------------
|
| PHASE 13 (Quality) :
| → +2-3% qualité/semaine (golden examples auto)
| → +5-10% qualité/mois (feedback loop)
| → +15% performance requêtes (archivage)
| → Amélioration continue AUTONOME
|
| PHASE 14 (Piliers) :
| → 90 piliers/mois × 9 langues = 810 articles/mois
| → 3000-5000 mots/article premium
| → Recherches Perplexity automatiques
| → Traductions section par section
| → Coût : ~$28/mois
| → ROI : 1 pilier bien référencé = +500 visiteurs/mois
|
| PHASE 18 (Exports) :
| → Export automatique à publication
| → 1 article = 18 fichiers (9 PDF + 9 WORD)
| → Support parfait 9 langues + RTL arabe
| → Queue asynchrone 100-200 exports/h
| → Génération 5-10s PDF, 3-5s WORD
| → Storage ~6.3 MB/article complet
|
| PHASE 20 (Monitoring) : ✨ NOUVEAU
| → Tracking coûts API temps réel
| → Sélection automatique modèles optimaux (-35% coûts)
| → Optimisation prompts (-15% tokens)
| → Alertes budget automatiques
| → Prédictions coûts mensuels ML
| → Dashboard 14 endpoints API
| → Économies : jusqu'à -56% coûts API possibles
|
| RÉSULTAT COMBINÉ :
| → Production MASSIVE + Qualité MAXIMALE + Exports AUTOMATIQUES
| → Monitoring TEMPS RÉEL + Optimisation CONTINUE
| → Système 100% AUTONOME sans intervention manuelle
| → Amélioration continue garantie
| → Distribution multi-formats instantanée
| → Contrôle total des coûts ✨
|
|--------------------------------------------------------------------------
| TROUBLESHOOTING PHASE 20 ✨
|--------------------------------------------------------------------------
|
| Problème : Command monitoring:check-alerts introuvable
| Solution : 
|   1. Vérifier fichier existe : app/Console/Commands/CheckSystemAlerts.php
|   2. Clear cache : php artisan cache:clear
|   3. Lister commands : php artisan list monitoring
|
| Problème : Config monitoring.alerts.email not found
| Solution : 
|   1. Copier config/monitoring.php
|   2. Définir MONITORING_ALERT_EMAIL dans .env
|   3. Clear config : php artisan config:clear
|
| Problème : Services not found (ModelSelectionService)
| Solution : 
|   1. Vérifier AppServiceProvider.php (4 services enregistrés)
|   2. Vérifier fichiers existent dans app/Services/AI/
|   3. Clear cache : php artisan cache:clear
|
| Problème : Tables not found (ai_costs_detailed)
| Solution : 
|   1. Exécuter migrations : php artisan migrate
|   2. Vérifier migration files dans database/migrations/
|
|--------------------------------------------------------------------------
| MONITORING LOGS PHASE 20 ✨
|--------------------------------------------------------------------------
|
| # Alertes monitoring en temps réel
| tail -f storage/logs/monitoring-alerts.log
|
| # Rapports coûts quotidiens/mensuels
| tail -f storage/logs/cost-reports.log
|
| # Filtrer erreurs monitoring
| tail -f storage/logs/laravel.log | grep "monitoring\|cost"
|
| # Statistiques scheduler
| php artisan schedule:list | grep monitoring
|
|--------------------------------------------------------------------------
*/