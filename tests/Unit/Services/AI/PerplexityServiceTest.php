<?php

namespace Tests\Unit\Services\AI;

use Tests\TestCase;
use App\Services\AI\PerplexityService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class PerplexityServiceTest extends TestCase
{
    protected PerplexityService $service;

    protected function setUp(): void
    {
        parent::setUp();

        // Configurer l'API key pour les tests
        config(['ai.perplexity.api_key' => 'test-key']);
        
        $this->service = new PerplexityService();
        
        // Nettoyer le cache
        Cache::flush();
    }

    /** @test */
    public function it_can_check_availability()
    {
        $this->assertTrue($this->service->isAvailable());
    }

    /** @test */
    public function it_returns_unavailable_without_api_key()
    {
        config(['ai.perplexity.api_key' => null]);
        $service = new PerplexityService();
        
        $this->assertFalse($service->isAvailable());
    }

    /** @test */
    public function it_returns_correct_service_name()
    {
        $this->assertEquals('perplexity', $this->service->getServiceName());
    }

    /** @test */
    public function it_can_estimate_cost()
    {
        $cost = $this->service->estimateCost('search', [
            'model' => 'llama-3.1-sonar-large-128k-online',
            'input_tokens' => 1000,
            'output_tokens' => 1000,
        ]);

        // 1000 tokens input à $0.001/1K + 1000 tokens output à $0.001/1K = $0.002
        $this->assertEquals(0.002, $cost);
    }

    /** @test */
    public function it_can_find_sources()
    {
        Http::fake([
            'api.perplexity.ai/*' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => 'Voici les sources officielles...',
                        ],
                    ],
                ],
                'citations' => [
                    'https://www.gouvernement.fr/visas',
                    'https://france-visas.gouv.fr',
                ],
                'usage' => [
                    'prompt_tokens' => 100,
                    'completion_tokens' => 200,
                ],
            ]),
        ]);

        $result = $this->service->findSources([
            'topic' => 'Visa France',
            'country' => 'France',
            'language' => 'fr',
        ]);

        $this->assertArrayHasKey('sources', $result);
        $this->assertArrayHasKey('summary', $result);
        $this->assertArrayHasKey('retrieved_at', $result);
        $this->assertNotEmpty($result['sources']);
    }

    /** @test */
    public function it_caches_sources_response()
    {
        Http::fake([
            'api.perplexity.ai/*' => Http::response([
                'choices' => [
                    ['message' => ['content' => 'Test content']],
                ],
                'citations' => ['https://example.gov'],
                'usage' => ['prompt_tokens' => 50, 'completion_tokens' => 100],
            ]),
        ]);

        $params = [
            'topic' => 'Test topic',
            'country' => 'TestCountry',
            'language' => 'fr',
        ];

        // Premier appel - devrait faire une requête API
        $result1 = $this->service->findSources($params);

        // Deuxième appel - devrait utiliser le cache
        $result2 = $this->service->findSources($params);

        // Vérifier qu'une seule requête HTTP a été faite
        Http::assertSentCount(1);
        
        // Les résultats devraient être identiques
        $this->assertEquals($result1, $result2);
    }

    /** @test */
    public function it_can_get_latest_info()
    {
        Http::fake([
            'api.perplexity.ai/*' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => 'Les dernières informations sur les visas...',
                        ],
                    ],
                ],
                'citations' => [],
                'usage' => [
                    'prompt_tokens' => 150,
                    'completion_tokens' => 300,
                ],
            ]),
        ]);

        $result = $this->service->getLatestInfo([
            'topic' => 'Changements visa 2024',
            'country' => 'Japon',
            'language' => 'fr',
        ]);

        $this->assertArrayHasKey('content', $result);
        $this->assertArrayHasKey('citations', $result);
        $this->assertArrayHasKey('retrieved_at', $result);
    }

    /** @test */
    public function it_can_fact_check()
    {
        Http::fake([
            'api.perplexity.ai/*' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => '{"verified": true, "confidence": 85, "explanation": "Cette information est correcte", "sources": ["https://example.gov"]}',
                        ],
                    ],
                ],
                'citations' => ['https://example.gov'],
                'usage' => [
                    'prompt_tokens' => 100,
                    'completion_tokens' => 150,
                ],
            ]),
        ]);

        $result = $this->service->factCheck(
            'Le visa touristique pour la France est valide 90 jours',
            'France'
        );

        $this->assertArrayHasKey('verified', $result);
        $this->assertArrayHasKey('confidence', $result);
        $this->assertArrayHasKey('explanation', $result);
    }

    /** @test */
    public function it_can_get_official_links()
    {
        Http::fake([
            'api.perplexity.ai/*' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => '{"links": [{"title": "Site officiel", "url": "https://example.gouv.fr", "type": "government", "description": "Site gouvernemental"}]}',
                        ],
                    ],
                ],
                'citations' => [],
                'usage' => [
                    'prompt_tokens' => 80,
                    'completion_tokens' => 120,
                ],
            ]),
        ]);

        $result = $this->service->getOfficialLinks('visa', 'France');

        $this->assertArrayHasKey('links', $result);
        $this->assertNotEmpty($result['links']);
        $this->assertArrayHasKey('url', $result['links'][0]);
    }

    /** @test */
    public function it_detects_government_source_type()
    {
        Http::fake([
            'api.perplexity.ai/*' => Http::response([
                'choices' => [
                    ['message' => ['content' => 'Sources officielles']],
                ],
                'citations' => [
                    'https://www.service-public.fr',
                    'https://www.gouvernement.fr',
                ],
                'usage' => ['prompt_tokens' => 50, 'completion_tokens' => 100],
            ]),
        ]);

        $result = $this->service->findSources([
            'topic' => 'Démarches administratives',
            'country' => 'France',
            'language' => 'fr',
        ]);

        // Vérifier que le type government est détecté
        $this->assertNotEmpty($result['sources']);
    }

    /** @test */
    public function it_handles_api_errors_gracefully()
    {
        Http::fake([
            'api.perplexity.ai/*' => Http::response(['error' => 'Rate limit exceeded'], 429),
        ]);

        $this->expectException(\RuntimeException::class);

        $this->service->findSources([
            'topic' => 'Test',
            'country' => 'Test',
            'language' => 'fr',
        ]);
    }

    /** @test */
    public function it_increments_cache_hits_counter()
    {
        Http::fake([
            'api.perplexity.ai/*' => Http::response([
                'choices' => [['message' => ['content' => 'Test']]],
                'citations' => [],
                'usage' => ['prompt_tokens' => 10, 'completion_tokens' => 20],
            ]),
        ]);

        $params = [
            'topic' => 'Cache test',
            'country' => 'Test',
            'language' => 'fr',
        ];

        // Premier appel
        $this->service->findSources($params);
        
        // Deuxième appel (cache hit)
        $this->service->findSources($params);

        // Vérifier le compteur de cache hits
        $cacheHits = Cache::get("ai_cache_hits:perplexity:" . now()->format('Y-m-d'), 0);
        $this->assertEquals(1, $cacheHits);
    }

    /** @test */
    public function it_returns_correct_usage_stats()
    {
        $today = now()->format('Y-m-d');
        
        // Simuler des coûts
        Cache::put("ai_costs:perplexity:{$today}", 0.05);
        Cache::put("ai_requests:perplexity:{$today}", 10);
        Cache::put("ai_cache_hits:perplexity:{$today}", 5);

        $stats = $this->service->getUsageStats();

        $this->assertArrayHasKey('daily_cost', $stats);
        $this->assertArrayHasKey('requests_today', $stats);
        $this->assertArrayHasKey('cache_hits_today', $stats);
        $this->assertEquals(0.05, $stats['daily_cost']);
        $this->assertEquals(10, $stats['requests_today']);
        $this->assertEquals(5, $stats['cache_hits_today']);
    }
}
