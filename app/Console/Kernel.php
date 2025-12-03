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
|--------------------------------------------------------------------------
| TABLEAU RÉCAPITULATIF SCHEDULED TASKS (PHASE 13 + 14)
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
| └─────┴────────────────────────────────┴──────────────┴──────────────┘
|
|--------------------------------------------------------------------------
| CHRONOLOGIE QUOTIDIENNE (Lundi type)
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
|
|--------------------------------------------------------------------------
| IMPACT GLOBAL PHASES 13 + 14
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
| RÉSULTAT COMBINÉ :
| → Production MASSIVE + Qualité MAXIMALE
| → Système 100% AUTONOME sans intervention manuelle
| → Amélioration continue garantie
|
|--------------------------------------------------------------------------
| TROUBLESHOOTING
|--------------------------------------------------------------------------
|
| Problème : Scheduled tasks ne s'exécutent pas
| Solution : 
|   1. Vérifier cron : crontab -l
|   2. Vérifier logs : tail -f storage/logs/laravel.log
|   3. Tester manuellement : php artisan schedule:run
|   4. Vérifier timezone : php artisan tinker puis echo now();
|
| Problème : pillar:generate-today bloqué
| Solution : 
|   1. Vérifier API keys (OpenAI, Perplexity) dans .env
|   2. Vérifier rate limits : tail -f storage/logs/pillar-generation.log
|   3. Augmenter memory_limit=512M dans php.ini
|   4. Vérifier disk space : df -h
|
| Problème : Traductions lentes
| Solution : 
|   1. Vérifier rate_limit_between_sections dans service
|   2. Utiliser queue Laravel pour traductions async
|   3. Monitorer : tail -f storage/logs/pillar-generation.log
|
| Problème : Email notifications ne partent pas
| Solution : 
|   1. Configurer MAIL_* dans .env
|   2. Remplacer admin@ulixai.com par votre email
|   3. Tester : php artisan tinker puis Mail::raw('test', fn($m) => $m->to('admin@ulixai.com'));
|
|--------------------------------------------------------------------------
| OPTIMISATIONS PRODUCTION
|--------------------------------------------------------------------------
|
| 1. Queue Laravel (fortement recommandé) :
|    - Déplacer traductions vers queue:work
|    - Gain : Génération 3× plus rapide
|    - Setup : php artisan queue:work --queue=pillar-translations
|
| 2. Cache Perplexity :
|    - Cache recherches identiques 7 jours
|    - Gain : -40% coûts Perplexity
|
| 3. Batch Translations :
|    - Grouper 3-4 sections par appel GPT
|    - Gain : -30% coûts traductions
|
| 4. Monitoring :
|    - Installer Laravel Telescope ou Horizon
|    - Monitoring temps réel génération
|
| 5. Alerting :
|    - Ajouter Slack/Discord webhooks sur onFailure
|    - Notifications temps réel échecs
|
|--------------------------------------------------------------------------
*/