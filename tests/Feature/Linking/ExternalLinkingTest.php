<?php

namespace Tests\Feature\Linking;

use App\Models\Article;
use App\Models\AuthorityDomain;
use App\Models\ExternalLink;
use App\Models\Platform;
use App\Services\Linking\ExternalLinkingService;
use App\Services\Linking\ExternalLinkDiscoveryService;
use App\Services\Linking\AuthorityDomainService;
use App\Services\Linking\LinkPositionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Mockery;

class ExternalLinkingTest extends TestCase
{
    use RefreshDatabase;

    protected ExternalLinkingService $service;
    protected Platform $platform;
    protected Article $article;

    protected function setUp(): void
    {
        parent::setUp();

        $this->platform = Platform::factory()->create();
        $this->article = Article::factory()->create([
            'platform_id' => $this->platform->id,
            'country_code' => 'FR',
            'language_code' => 'fr',
            'title' => 'Guide visa France 2024',
            'content' => '<p>Introduction au visa France.</p><p>Les démarches pour obtenir un visa en France sont nombreuses. Il est important de bien se préparer.</p><p>Conclusion et ressources utiles.</p>',
            'status' => 'published',
        ]);

        // Créer des domaines autorité
        AuthorityDomain::create([
            'domain' => 'service-public.fr',
            'name' => 'Service Public',
            'source_type' => 'government',
            'country_code' => 'FR',
            'languages' => ['fr'],
            'topics' => ['visa', 'immigration', 'general'],
            'authority_score' => 95,
            'is_active' => true,
        ]);

        AuthorityDomain::create([
            'domain' => 'france-visas.gouv.fr',
            'name' => 'France Visas',
            'source_type' => 'government',
            'country_code' => 'FR',
            'languages' => ['fr', 'en'],
            'topics' => ['visa'],
            'authority_score' => 98,
            'is_active' => true,
        ]);

        AuthorityDomain::create([
            'domain' => 'iom.int',
            'name' => 'IOM',
            'source_type' => 'organization',
            'country_code' => null,
            'languages' => ['en', 'fr'],
            'topics' => ['immigration', 'visa'],
            'authority_score' => 92,
            'is_active' => true,
        ]);

        // Mock le service de découverte pour éviter les appels API
        $discoveryMock = Mockery::mock(ExternalLinkDiscoveryService::class);
        $discoveryMock->shouldReceive('discoverLinks')->andReturn([
            [
                'url' => 'https://www.service-public.fr/particuliers/vosdroits/N110',
                'title' => 'Étranger en France',
                'domain' => 'service-public.fr',
                'source_type' => 'government',
                'authority_score' => 95,
            ],
        ]);

        $this->service = new ExternalLinkingService(
            $discoveryMock,
            app(AuthorityDomainService::class),
            app(LinkPositionService::class)
        );
    }

    public function test_generates_external_links_for_article()
    {
        $result = $this->service->generateExternalLinks($this->article);

        $this->assertArrayHasKey('created', $result);
        $this->assertGreaterThanOrEqual(1, $result['created']);

        // Vérifier que les liens sont créés en base
        $this->assertGreaterThanOrEqual(1, $this->article->externalLinks()->count());
    }

    public function test_respects_max_links_configuration()
    {
        config(['linking.external.max_links' => 2]);

        $result = $this->service->generateExternalLinks($this->article);

        $this->assertLessThanOrEqual(2, $this->article->externalLinks()->count());
    }

    public function test_prioritizes_government_sources()
    {
        $result = $this->service->generateExternalLinks($this->article);

        $links = $this->article->externalLinks()->get();
        
        // Au moins un lien gouvernemental devrait exister
        $govLinks = $links->where('source_type', 'government');
        $this->assertGreaterThanOrEqual(1, $govLinks->count());
    }

    public function test_filters_by_country()
    {
        // L'article est pour la France
        $result = $this->service->generateExternalLinks($this->article);

        $links = $this->article->externalLinks()->get();
        
        // Vérifier que les liens sont pertinents pour la France
        foreach ($links as $link) {
            // Soit c'est un lien France, soit c'est international
            $domain = AuthorityDomain::where('domain', $link->domain)->first();
            if ($domain && $domain->country_code) {
                $this->assertEquals('FR', $domain->country_code);
            }
        }
    }

    public function test_generates_correct_link_attributes()
    {
        $result = $this->service->generateExternalLinks($this->article);

        $link = $this->article->externalLinks()->first();

        $this->assertNotNull($link);
        $this->assertNotEmpty($link->url);
        $this->assertNotEmpty($link->anchor_text);
        $this->assertNotEmpty($link->domain);
        $this->assertTrue($link->is_automatic);
    }

    public function test_does_not_duplicate_links()
    {
        // Générer une première fois
        $this->service->generateExternalLinks($this->article);
        $countFirst = $this->article->externalLinks()->count();

        // Générer une deuxième fois
        $this->service->generateExternalLinks($this->article);
        $countSecond = $this->article->externalLinks()->count();

        // Le nombre ne devrait pas changer (liens existants non dupliqués)
        $this->assertEquals($countFirst, $countSecond);
    }

    public function test_handles_article_without_country()
    {
        $articleNoCountry = Article::factory()->create([
            'platform_id' => $this->platform->id,
            'country_code' => null,
            'language_code' => 'en',
            'content' => '<p>General content about visas.</p>',
        ]);

        $result = $this->service->generateExternalLinks($articleNoCountry);

        // Devrait quand même générer des liens (internationaux)
        $this->assertArrayHasKey('created', $result);
    }

    public function test_verifies_article_links()
    {
        // Créer un lien
        ExternalLink::create([
            'article_id' => $this->article->id,
            'url' => 'https://www.service-public.fr/test',
            'domain' => 'service-public.fr',
            'anchor_text' => 'Test link',
            'source_type' => 'government',
            'is_automatic' => true,
        ]);

        $result = $this->service->verifyArticleLinks($this->article);

        $this->assertArrayHasKey('total', $result);
        $this->assertArrayHasKey('verified', $result);
    }

    public function test_gets_authority_links_for_country()
    {
        $links = $this->service->getAuthorityLinks('FR', ['visa']);

        $this->assertGreaterThanOrEqual(1, $links->count());
        
        foreach ($links as $link) {
            $this->assertContains($link->country_code, ['FR', null]);
        }
    }

    public function test_generates_proper_anchor_text_per_language()
    {
        // Test français
        $result = $this->service->generateExternalLinks($this->article);
        $link = $this->article->externalLinks()->first();

        if ($link) {
            // L'anchor devrait être en français car l'article est en français
            $frenchPatterns = ['site officiel', 'officiel', 'gouvernement', 'service'];
            $hasPattern = false;
            foreach ($frenchPatterns as $pattern) {
                if (stripos($link->anchor_text, $pattern) !== false) {
                    $hasPattern = true;
                    break;
                }
            }
            // L'anchor devrait contenir au moins le nom du domaine ou un pattern FR
            $this->assertTrue(
                $hasPattern || stripos($link->anchor_text, $link->domain) !== false,
                "Anchor text should be in French or contain domain name"
            );
        }
    }

    public function test_stats_are_collected()
    {
        $this->service->generateExternalLinks($this->article);

        $stats = $this->service->getStats($this->platform->id);

        $this->assertArrayHasKey('total_links', $stats);
        $this->assertArrayHasKey('by_type', $stats);
        $this->assertArrayHasKey('by_country', $stats);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
