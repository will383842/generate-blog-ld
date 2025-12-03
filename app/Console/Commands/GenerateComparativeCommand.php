<?php

namespace App\Console\Commands;

use App\Models\Platform;
use App\Models\Country;
use App\Models\Language;
use App\Services\Content\ComparativeGenerator;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Commande artisan pour générer des articles comparatifs
 * 
 * OBJECTIF : Comparer les prestataires disponibles sur les plateformes
 * Ulixai.com et SOS-Expat.com pour promouvoir l'utilisation de la plateforme.
 * 
 * Usage:
 * php artisan comparative:generate ulixai france fr "Déménageurs internationaux" --competitors=5
 * php artisan comparative:generate sos-expat spain es "Abogados inmigración" --with-image
 * 
 * @package App\Console\Commands
 */
class GenerateComparativeCommand extends Command
{
    /**
     * Signature de la commande
     */
    protected $signature = 'comparative:generate
                            {platform : Platform slug, name or ID (check with: php artisan tinker → Platform::all())}
                            {country : Country code (FR, US, ES, DE...)}
                            {language : Language code (fr, en, es, de, pt, ru, zh, ar, hi)}
                            {service_type : Type of service to compare}
                            {--competitors=5 : Number of providers (3-10)}
                            {--with-image : Generate DALL-E image}
                            {--with-cta : Include platform CTA buttons}
                            {--publish : Publish immediately}
                            {--force : Skip confirmation}';

    /**
     * Description de la commande
     */
    protected $description = 'Generate a comparative article with tables, charts, and detailed sections';

    protected ComparativeGenerator $generator;

    /**
     * Constructeur
     */
    public function __construct(ComparativeGenerator $generator)
    {
        parent::__construct();
        $this->generator = $generator;
    }

    /**
     * Exécution de la commande
     */
    public function handle(): int
    {
        $this->info('🔄 Content Engine V9.4 - Comparative Generator');
        $this->newLine();

        try {
            // 1. Récupération et validation des paramètres
            $params = $this->gatherParams();

            // 2. Affichage récapitulatif
            $this->displaySummary($params);

            // 3. Confirmation
            if (!$this->option('force') && !$this->confirm('Generate this comparative article?')) {
                $this->warn('❌ Generation cancelled');
                return self::FAILURE;
            }

            // 4. Génération
            $this->newLine();
            $this->info('⏳ Generating comparative article...');
            $this->newLine();

            $startTime = microtime(true);

            $article = $this->generator->generate($params);

            $duration = round(microtime(true) - $startTime, 2);
            $stats = $this->generator->getStats();

            // 5. Publication si demandée
            if ($this->option('publish')) {
                $article->publish();
                $this->info('✅ Article published');
            }

            // 6. Affichage résultats
            $this->displayResults($article, $stats, $duration);

            return self::SUCCESS;

        } catch (\Exception $e) {
            $this->newLine();
            $this->error('❌ Error: ' . $e->getMessage());
            $this->newLine();
            
            if ($this->option('verbose')) {
                $this->error($e->getTraceAsString());
            }

            return self::FAILURE;
        }
    }

    /**
     * Récupérer et valider les paramètres
     */
    protected function gatherParams(): array
    {
        // Platform - accepter ID, slug ou nom
        $platformInput = $this->argument('platform');
        
        // Essayer d'abord par ID si c'est un nombre
        if (is_numeric($platformInput)) {
            $platform = Platform::find((int)$platformInput);
        } else {
            // Sinon chercher par slug ou nom
            $platform = Platform::where('slug', $platformInput)
                ->orWhere('name', 'like', '%' . $platformInput . '%')
                ->first();
        }
        
        if (!$platform) {
            // Afficher les plateformes disponibles
            $availablePlatforms = Platform::all(['id', 'name', 'slug'])->toArray();
            
            $this->error("Platform '{$platformInput}' not found.");
            $this->newLine();
            $this->info('Available platforms:');
            $this->table(
                ['ID', 'Name', 'Slug'],
                array_map(function($p) {
                    return [$p['id'], $p['name'], $p['slug'] ?? 'N/A'];
                }, $availablePlatforms)
            );
            
            throw new \InvalidArgumentException("Platform '{$platformInput}' not found");
        }

        // Country
        $countryCode = strtoupper($this->argument('country'));
        $country = Country::where('code', $countryCode)->first();
        
        if (!$country) {
            throw new \InvalidArgumentException("Country '{$countryCode}' not found");
        }

        // Language
        $languageCode = strtolower($this->argument('language'));
        $language = Language::where('code', $languageCode)->first();
        
        if (!$language) {
            throw new \InvalidArgumentException("Language '{$languageCode}' not found");
        }

        // Competitors count
        $competitorsCount = (int) $this->option('competitors');
        if ($competitorsCount < 3 || $competitorsCount > 10) {
            throw new \InvalidArgumentException('Competitors count must be between 3 and 10');
        }

        return [
            'platform_id' => $platform->id,
            'country_id' => $country->id,
            'language_code' => $language->code,
            'service_type' => $this->argument('service_type'),
            'competitors_count' => $competitorsCount,
            'generate_image' => $this->option('with-image'),
            'with_cta' => $this->option('with-cta') ?? true,
        ];
    }

    /**
     * Afficher récapitulatif avant génération
     */
    protected function displaySummary(array $params): void
    {
        $platform = Platform::find($params['platform_id']);
        $country = Country::find($params['country_id']);
        $language = Language::where('code', $params['language_code'])->first();

        $this->table(
            ['Parameter', 'Value'],
            [
                ['Platform', $platform->name],
                ['Country', $country->name . ' (' . $country->code . ')'],
                ['Language', $language->name . ' (' . $language->code . ')'],
                ['Service Type', $params['service_type']],
                ['Providers', $params['competitors_count']],
                ['With Image', $params['generate_image'] ? 'Yes' : 'No'],
                ['With CTA', $params['with_cta'] ? 'Yes' : 'No'],
                ['Publish', $this->option('publish') ? 'Yes' : 'Draft'],
            ]
        );

        $this->newLine();
    }

    /**
     * Afficher résultats de génération
     */
    protected function displayResults($article, array $stats, float $duration): void
    {
        $this->newLine();
        $this->info('✅ Comparative article generated successfully!');
        $this->newLine();

        $this->table(
            ['Metric', 'Value'],
            [
                ['Article ID', $article->id],
                ['UUID', $article->uuid],
                ['Title', $article->title],
                ['Slug', $article->slug],
                ['Word Count', number_format($article->word_count)],
                ['Reading Time', $article->reading_time . ' min'],
                ['FAQs', $article->faqs->count()],
                ['Status', $article->status],
                ['---', '---'],
                ['Duration', $duration . 's'],
                ['GPT Calls', $stats['gpt_calls']],
                ['Perplexity Calls', $stats['perplexity_calls']],
                ['DALL-E Calls', $stats['dalle_calls']],
                ['Total Cost', '$' . number_format($stats['total_cost'], 4)],
            ]
        );

        $this->newLine();
        $this->comment('📝 View article: /articles/' . $article->slug);
        $this->comment('🔗 Edit article: /admin/articles/' . $article->id . '/edit');
        $this->newLine();
    }
}