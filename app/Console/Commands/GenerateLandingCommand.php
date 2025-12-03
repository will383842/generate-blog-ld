<?php

namespace App\Console\Commands;

use App\Models\Country;
use App\Models\Language;
use App\Models\Platform;
use App\Services\Content\LandingGenerator;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Commande CLI pour générer des landing pages
 * 
 * Usage :
 * php artisan landing:generate {platform} {country} {language} {service} [options]
 * 
 * Exemples :
 * php artisan landing:generate ulixai france fr "Avocat spécialisé"
 * php artisan landing:generate sos-expat spain es "Servicio de mudanza" --publish
 * php artisan landing:generate ulysse-ai germany de "Deutschkurs" --keywords="deutsch,kurs,expat"
 */
class GenerateLandingCommand extends Command
{
    protected $signature = 'landing:generate
                            {platform : Slug de la plateforme (ulixai, sos-expat, etc.)}
                            {country : Code ou nom du pays (france, FR, spain, ES, etc.)}
                            {language : Code langue (fr, en, de, es, pt, ru, zh, ar, hi)}
                            {service : Service ou thème de la landing page}
                            {--audience= : Audience cible (défaut: expatriés)}
                            {--keywords= : Mots-clés SEO séparés par des virgules}
                            {--sections= : Sections personnalisées séparées par des virgules}
                            {--publish : Publier immédiatement la landing page}';

    protected $description = 'Génère une landing page optimisée pour la conversion';

    protected LandingGenerator $generator;

    public function __construct(LandingGenerator $generator)
    {
        parent::__construct();
        $this->generator = $generator;
    }

    /**
     * Exécute la commande
     */
    public function handle(): int
    {
        $this->displayHeader();

        try {
            // 1. Validation et récupération des entités
            $platform = $this->getPlatform($this->argument('platform'));
            $country = $this->getCountry($this->argument('country'));
            $language = $this->getLanguage($this->argument('language'));
            $service = $this->argument('service');

            // 2. Afficher les informations
            $this->displayInfo($platform, $country, $language, $service);

            // 3. Confirmation
            if (!$this->confirm('Générer cette landing page ?', true)) {
                $this->warn('Génération annulée.');
                return Command::FAILURE;
            }

            // 4. Construction des paramètres
            $params = $this->buildParams($platform, $country, $language, $service);

            // 5. Génération
            $this->info('🚀 Génération en cours...');
            $this->newLine();

            $article = $this->generator->generate($params);

            // 6. Publication si demandée
            if ($this->option('publish')) {
                $article->update(['status' => 'published']);
                $this->info('✅ Landing page publiée !');
            }

            // 7. Afficher les résultats
            $this->displayResults($article);

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('❌ Erreur : ' . $e->getMessage());
            Log::error('Erreur génération landing page CLI', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return Command::FAILURE;
        }
    }

    /**
     * Affiche l'en-tête de la commande
     */
    protected function displayHeader(): void
    {
        $this->newLine();
        $this->line('╔══════════════════════════════════════════════════════════════╗');
        $this->line('║                                                              ║');
        $this->line('║         🚀 GÉNÉRATEUR DE LANDING PAGES 🚀                    ║');
        $this->line('║                                                              ║');
        $this->line('║         Support : 197 pays × 9 langues                       ║');
        $this->line('║                                                              ║');
        $this->line('╚══════════════════════════════════════════════════════════════╝');
        $this->newLine();
    }

    /**
     * Récupère la plateforme
     */
    protected function getPlatform(string $slug): Platform
    {
        $platform = Platform::where('slug', $slug)->first();

        if (!$platform) {
            $this->error("❌ Plateforme introuvable : {$slug}");
            $this->newLine();
            
            $available = Platform::pluck('slug')->take(10)->implode(', ');
            $this->info("Plateformes disponibles : {$available}");
            
            throw new \RuntimeException("Plateforme introuvable");
        }

        return $platform;
    }

    /**
     * Récupère le pays
     */
    protected function getCountry(string $identifier): Country
    {
        // Essayer par code ISO
        $country = Country::where('code', strtoupper($identifier))->first();

        // Essayer par slug dans différentes langues
        if (!$country) {
            $country = Country::where('slug_fr', strtolower($identifier))
                ->orWhere('slug_en', strtolower($identifier))
                ->orWhere('slug_de', strtolower($identifier))
                ->orWhere('slug_es', strtolower($identifier))
                ->orWhere('slug_pt', strtolower($identifier))
                ->first();
        }

        if (!$country) {
            $this->error("❌ Pays introuvable : {$identifier}");
            $this->newLine();
            
            $available = Country::take(20)->pluck('code')->implode(', ');
            $this->info("Exemples de codes pays : {$available}");
            $this->info("Vous pouvez utiliser le code (FR) ou le nom (france)");
            
            throw new \RuntimeException("Pays introuvable");
        }

        return $country;
    }

    /**
     * Récupère la langue
     */
    protected function getLanguage(string $code): Language
    {
        $language = Language::where('code', strtolower($code))->first();

        if (!$language) {
            $this->error("❌ Langue introuvable : {$code}");
            $this->newLine();
            
            $available = Language::pluck('code')->implode(', ');
            $this->info("Langues disponibles : {$available}");
            
            throw new \RuntimeException("Langue introuvable");
        }

        return $language;
    }

    /**
     * Affiche les informations de génération
     */
    protected function displayInfo(Platform $platform, Country $country, Language $language, string $service): void
    {
        $this->info('📋 INFORMATIONS DE GÉNÉRATION');
        $this->newLine();

        $this->table(
            ['Paramètre', 'Valeur'],
            [
                ['Plateforme', $platform->name],
                ['Pays', $country->name . ' (' . $country->code . ')'],
                ['Langue', $language->name . ' (' . $language->code . ')'],
                ['Service', $service],
                ['Audience', $this->option('audience') ?? 'expatriés'],
                ['Mots-clés', $this->option('keywords') ?? 'Auto'],
                ['Sections', $this->option('sections') ?? 'Par défaut'],
                ['Publication', $this->option('publish') ? 'Oui' : 'Non (brouillon)'],
            ]
        );

        $this->newLine();

        // Afficher les sections qui seront utilisées
        $manager = app(\App\Services\Content\LandingSectionManager::class);
        $sections = $manager->getEnabledSections($platform->id);
        
        $this->info('📑 Sections qui seront générées :');
        foreach ($sections as $key => $section) {
            $icon = $section['required'] ? '🔒' : '✓';
            $this->line("   {$icon} {$section['name']}");
        }
        
        $this->newLine();
    }

    /**
     * Construit les paramètres de génération
     */
    protected function buildParams(Platform $platform, Country $country, Language $language, string $service): array
    {
        $params = [
            'platform_id' => $platform->id,
            'country_id' => $country->id,
            'language_id' => $language->id,
            'service' => $service,
        ];

        // Audience
        if ($this->option('audience')) {
            $params['target_audience'] = $this->option('audience');
        }

        // Mots-clés
        if ($this->option('keywords')) {
            $params['keywords'] = explode(',', $this->option('keywords'));
            $params['keywords'] = array_map('trim', $params['keywords']);
        }

        // Sections personnalisées
        if ($this->option('sections')) {
            $customSections = explode(',', $this->option('sections'));
            $customSections = array_map('trim', $customSections);
            
            $manager = app(\App\Services\Content\LandingSectionManager::class);
            $allSections = $manager->getAllSections($platform->id);
            
            $params['sections_enabled'] = [];
            foreach ($customSections as $section) {
                if (isset($allSections[$section])) {
                    $params['sections_enabled'][$section] = $allSections[$section];
                }
            }
        }

        return $params;
    }

    /**
     * Affiche les résultats
     */
    protected function displayResults($article): void
    {
        $this->newLine();
        $this->info('✅ LANDING PAGE GÉNÉRÉE AVEC SUCCÈS !');
        $this->newLine();

        $this->table(
            ['Propriété', 'Valeur'],
            [
                ['ID', $article->id],
                ['UUID', $article->uuid],
                ['Titre', $article->title],
                ['Slug', $article->slug],
                ['Nombre de mots', $article->word_count],
                ['Temps de lecture', $article->reading_time . ' min'],
                ['FAQs', $article->faqs->count()],
                ['Statut', strtoupper($article->status)],
                ['Score qualité', $article->quality_score ?? 'Non calculé'],
            ]
        );

        $this->newLine();

        // URLs
        $previewUrl = config('app.url') . "/preview/{$article->uuid}";
        $editUrl = config('app.url') . "/admin/articles/{$article->id}/edit";

        $this->info('🔗 LIENS UTILES');
        $this->line("   Preview : {$previewUrl}");
        $this->line("   Édition : {$editUrl}");

        $this->newLine();
    }
}