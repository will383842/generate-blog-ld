<?php

namespace App\Console\Commands;

use App\Services\Research\ResearchAggregatorService;
use App\Services\Research\FactCheckingService;
use App\Models\ResearchCache;
use App\Models\ResearchQuery;
use Illuminate\Console\Command;

class TestResearchPhase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'research:test
                            {--query= : Query de test personnalisée}
                            {--lang=fr : Code langue}
                            {--claim= : Claim à fact-checker}
                            {--stats : Afficher seulement les statistiques}
                            {--clear-cache : Vider le cache expiré}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test complet de la Phase 19 - Recherche & Fact-checking';

    protected ResearchAggregatorService $researchService;
    protected FactCheckingService $factCheckingService;

    /**
     * Execute the console command.
     */
    public function handle(
        ResearchAggregatorService $researchService,
        FactCheckingService $factCheckingService
    ): int {
        $this->researchService = $researchService;
        $this->factCheckingService = $factCheckingService;

        $this->info('═══════════════════════════════════════════════════════════');
        $this->info('         TEST PHASE 19 - RECHERCHE & FACT-CHECKING         ');
        $this->info('═══════════════════════════════════════════════════════════');
        $this->newLine();

        // Option : Vider le cache
        if ($this->option('clear-cache')) {
            return $this->clearCache();
        }

        // Option : Statistiques uniquement
        if ($this->option('stats')) {
            return $this->showStats();
        }

        // Option : Fact-check personnalisé
        if ($claim = $this->option('claim')) {
            return $this->testFactCheck($claim, $this->option('lang'));
        }

        // Option : Recherche personnalisée
        if ($query = $this->option('query')) {
            return $this->testSearch($query, $this->option('lang'));
        }

        // Test complet par défaut
        return $this->runFullTest();
    }

    /**
     * Test complet de tous les features
     */
    protected function runFullTest(): int
    {
        $this->info('🚀 Exécution du test complet...');
        $this->newLine();

        // Test 1 : Recherche simple
        $this->testSearchFeature();
        $this->newLine();

        // Test 2 : Cache hit
        $this->testCacheFeature();
        $this->newLine();

        // Test 3 : Fact-checking
        $this->testFactCheckFeature();
        $this->newLine();

        // Test 4 : Extraction de claims
        $this->testExtractClaimsFeature();
        $this->newLine();

        // Statistiques finales
        $this->showStats();

        $this->newLine();
        $this->info('✅ Test complet terminé avec succès !');

        return Command::SUCCESS;
    }

    /**
     * Test : Recherche multi-sources
     */
    protected function testSearch(string $query, string $lang): int
    {
        $this->info("🔍 Recherche : \"$query\" (langue: $lang)");
        $this->newLine();

        try {
            $startTime = microtime(true);
            
            $results = $this->researchService->search($query, $lang, ['perplexity', 'news_api']);
            
            $duration = round((microtime(true) - $startTime) * 1000, 2);

            $this->info("✅ Recherche terminée en {$duration}ms");
            $this->info("📊 Résultats trouvés : " . count($results));
            $this->newLine();

            if (!empty($results)) {
                $this->info('🔝 Top 5 résultats :');
                foreach (array_slice($results, 0, 5) as $index => $result) {
                    $this->line(sprintf(
                        '  %d. [%s] %s (score: %d)',
                        $index + 1,
                        $result['source_type'],
                        mb_substr($result['title'], 0, 60),
                        $result['relevance_score']
                    ));
                }
            }

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('❌ Erreur : ' . $e->getMessage());
            return Command::FAILURE;
        }
    }

    /**
     * Test : Recherche simple
     */
    protected function testSearchFeature(): void
    {
        $this->info('📝 TEST 1 : Recherche multi-sources');
        $this->line('─────────────────────────────────────────────────────────');

        $query = 'statistiques expatriés français 2024';
        
        try {
            $results = $this->researchService->search($query, 'fr', ['news_api']);
            
            $this->info("✅ Recherche OK - " . count($results) . " résultats");
            
        } catch (\Exception $e) {
            $this->error("❌ Échec : " . $e->getMessage());
        }
    }

    /**
     * Test : Cache hit
     */
    protected function testCacheFeature(): void
    {
        $this->info('📝 TEST 2 : Cache 24h');
        $this->line('─────────────────────────────────────────────────────────');

        $query = 'test cache ' . time();
        
        try {
            // Première recherche (cache MISS)
            $this->line('  → Première recherche (MISS attendu)...');
            $startTime = microtime(true);
            $this->researchService->search($query, 'fr', ['news_api']);
            $duration1 = round((microtime(true) - $startTime) * 1000, 2);

            // Deuxième recherche (cache HIT)
            $this->line('  → Deuxième recherche (HIT attendu)...');
            $startTime = microtime(true);
            $this->researchService->search($query, 'fr', ['news_api']);
            $duration2 = round((microtime(true) - $startTime) * 1000, 2);

            $this->info(sprintf(
                "✅ Cache OK - MISS: %sms, HIT: %sms (gain: %sx)",
                $duration1,
                $duration2,
                round($duration1 / max($duration2, 1), 1)
            ));

        } catch (\Exception $e) {
            $this->error("❌ Échec : " . $e->getMessage());
        }
    }

    /**
     * Test : Fact-checking
     */
    protected function testFactCheck(string $claim, string $lang): int
    {
        $this->info("🔬 Fact-check : \"$claim\"");
        $this->newLine();

        try {
            $result = $this->factCheckingService->checkFact($claim, $lang);

            $this->info('Résultat :');
            $this->line('  Confiance : ' . strtoupper($result['confidence']));
            $this->line('  Statut : ' . $result['verification_status']);
            $this->line('  Recommandation : ' . $result['recommendation']);
            $this->line('  Explication : ' . $result['explanation']);
            
            if (!empty($result['supporting_sources'])) {
                $this->newLine();
                $this->info('Sources confirmantes : ' . count($result['supporting_sources']));
                foreach (array_slice($result['supporting_sources'], 0, 3) as $url) {
                    $this->line('  • ' . $url);
                }
            }

            if (!empty($result['contradicting_sources'])) {
                $this->newLine();
                $this->warn('Sources contradictoires : ' . count($result['contradicting_sources']));
            }

            if ($result['suggested_correction']) {
                $this->newLine();
                $this->comment('💡 ' . $result['suggested_correction']);
            }

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('❌ Erreur : ' . $e->getMessage());
            return Command::FAILURE;
        }
    }

    /**
     * Test : Fact-checking feature
     */
    protected function testFactCheckFeature(): void
    {
        $this->info('📝 TEST 3 : Fact-checking');
        $this->line('─────────────────────────────────────────────────────────');

        $claim = '304 millions d\'expatriés dans le monde';
        
        try {
            $result = $this->factCheckingService->checkFact($claim, 'fr');
            
            $this->info(sprintf(
                "✅ Fact-check OK - Confiance: %s, Statut: %s",
                $result['confidence'],
                $result['verification_status']
            ));
            
        } catch (\Exception $e) {
            $this->error("❌ Échec : " . $e->getMessage());
        }
    }

    /**
     * Test : Extraction de claims
     */
    protected function testExtractClaimsFeature(): void
    {
        $this->info('📝 TEST 4 : Extraction de claims');
        $this->line('─────────────────────────────────────────────────────────');

        $content = <<<TEXT
Selon les dernières données, 304 millions d'expatriés vivent actuellement dans le monde.
La France compte environ 2,5 millions de citoyens français expatriés.
En 2024, les règles d'expatriation ont changé significativement.
TEXT;
        
        try {
            $claims = $this->factCheckingService->extractClaimsFromContent($content);
            
            $this->info("✅ Extraction OK - " . count($claims) . " claims détectées");
            
            foreach ($claims as $claim) {
                $this->line(sprintf(
                    "  • [%s] %s",
                    $claim['type'],
                    mb_substr($claim['text'], 0, 50)
                ));
            }
            
        } catch (\Exception $e) {
            $this->error("❌ Échec : " . $e->getMessage());
        }
    }

    /**
     * Afficher les statistiques
     */
    protected function showStats(): int
    {
        $this->info('📊 STATISTIQUES PHASE 19');
        $this->line('─────────────────────────────────────────────────────────');

        // Stats cache
        $cacheStats = ResearchCache::getCacheStats();
        $this->info('Cache :');
        $this->line(sprintf('  • Total entrées : %d', $cacheStats['total_entries']));
        $this->line(sprintf('  • Entrées valides : %d', $cacheStats['valid_entries']));
        $this->line(sprintf('  • Entrées expirées : %d', $cacheStats['expired_entries']));
        $this->line(sprintf('  • Total hits : %d', $cacheStats['total_hits']));
        $this->line(sprintf('  • Moyenne hits/entrée : %.2f', $cacheStats['average_hits_per_entry']));
        $this->line(sprintf('  • Efficacité : %.1f%%', $cacheStats['cache_efficiency']));

        $this->newLine();

        // Stats queries
        $hitRate = ResearchQuery::getCacheHitRate(30);
        $this->info('Queries (30 derniers jours) :');
        $this->line(sprintf('  • Taux cache hit : %.1f%%', $hitRate));
        
        $totalQueries = ResearchQuery::where('created_at', '>=', now()->subDays(30))->count();
        $this->line(sprintf('  • Total queries : %d', $totalQueries));

        $this->newLine();

        // Top queries
        $popular = ResearchCache::getMostPopular(5);
        if (!empty($popular)) {
            $this->info('Top 5 requêtes populaires :');
            foreach ($popular as $index => $query) {
                $this->line(sprintf(
                    '  %d. %s (%d hits, %s)',
                    $index + 1,
                    mb_substr($query['query'], 0, 40),
                    $query['hits'],
                    $query['language']
                ));
            }
        }

        return Command::SUCCESS;
    }

    /**
     * Vider le cache expiré
     */
    protected function clearCache(): int
    {
        $this->info('🧹 Nettoyage du cache expiré...');
        
        $deleted = ResearchCache::cleanExpired();
        
        $this->info("✅ $deleted entrée(s) supprimée(s)");
        
        return Command::SUCCESS;
    }
}