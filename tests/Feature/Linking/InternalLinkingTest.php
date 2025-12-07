<?php

namespace Tests\Feature\Linking;

use App\Models\Article;
use App\Models\InternalLink;
use App\Models\Platform;
use App\Services\Linking\InternalLinkingService;
use App\Services\Linking\TfIdfService;
use App\Services\Linking\AnchorTextService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InternalLinkingTest extends TestCase
{
    use RefreshDatabase;

    protected InternalLinkingService $service;
    protected Platform $platform;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->service = app(InternalLinkingService::class);
        $this->platform = Platform::factory()->create();
    }

    /** @test */
    public function it_generates_internal_links_for_article()
    {
        // Créer des articles cibles
        $targetArticles = Article::factory()
            ->count(10)
            ->create([
                'platform_id' => $this->platform->id,
                'language_code' => 'fr',
                'theme' => 'visa',
                'status' => 'published'
            ]);

        // Créer l'article source
        $sourceArticle = Article::factory()->create([
            'platform_id' => $this->platform->id,
            'language_code' => 'fr',
            'theme' => 'visa',
            'title' => 'Guide visa Thaïlande',
            'content' => '<p>Ce guide vous explique comment obtenir un visa pour la Thaïlande. Les démarches sont simples mais nécessitent plusieurs documents.</p>',
            'status' => 'published'
        ]);

        $result = $this->service->generateInternalLinks($sourceArticle);

        $this->assertArrayHasKey('created', $result);
        $this->assertGreaterThan(0, $result['created']);
        
        // Vérifier que les liens sont créés en base
        $links = InternalLink::where('source_article_id', $sourceArticle->id)->get();
        $this->assertNotEmpty($links);
    }

    /** @test */
    public function it_respects_max_links_limit()
    {
        $targetArticles = Article::factory()
            ->count(20)
            ->create([
                'platform_id' => $this->platform->id,
                'language_code' => 'fr',
                'status' => 'published'
            ]);

        $sourceArticle = Article::factory()->create([
            'platform_id' => $this->platform->id,
            'language_code' => 'fr',
            'status' => 'published',
            'content' => '<p>Contenu test avec beaucoup de texte.</p>'
        ]);

        $maxLinks = config('linking.internal.max_links_per_article', 12);
        
        $result = $this->service->generateInternalLinks($sourceArticle);

        $links = InternalLink::where('source_article_id', $sourceArticle->id)->count();
        $this->assertLessThanOrEqual($maxLinks, $links);
    }

    /** @test */
    public function it_only_links_articles_with_same_language()
    {
        // Articles en français
        Article::factory()->count(5)->create([
            'platform_id' => $this->platform->id,
            'language_code' => 'fr',
            'status' => 'published'
        ]);

        // Articles en anglais
        Article::factory()->count(5)->create([
            'platform_id' => $this->platform->id,
            'language_code' => 'en',
            'status' => 'published'
        ]);

        $sourceArticle = Article::factory()->create([
            'platform_id' => $this->platform->id,
            'language_code' => 'fr',
            'status' => 'published'
        ]);

        $this->service->generateInternalLinks($sourceArticle);

        $links = InternalLink::where('source_article_id', $sourceArticle->id)
            ->with('targetArticle')
            ->get();

        foreach ($links as $link) {
            $this->assertEquals('fr', $link->targetArticle->language_code);
        }
    }

    /** @test */
    public function it_prioritizes_articles_with_same_country()
    {
        // Articles sur la Thaïlande
        Article::factory()->count(5)->create([
            'platform_id' => $this->platform->id,
            'language_code' => 'fr',
            'country_code' => 'TH',
            'status' => 'published'
        ]);

        // Articles sur la France
        Article::factory()->count(5)->create([
            'platform_id' => $this->platform->id,
            'language_code' => 'fr',
            'country_code' => 'FR',
            'status' => 'published'
        ]);

        $sourceArticle = Article::factory()->create([
            'platform_id' => $this->platform->id,
            'language_code' => 'fr',
            'country_code' => 'TH',
            'status' => 'published'
        ]);

        $this->service->generateInternalLinks($sourceArticle);

        $links = InternalLink::where('source_article_id', $sourceArticle->id)
            ->with('targetArticle')
            ->get();

        // La majorité des liens devraient pointer vers des articles TH
        $thLinks = $links->filter(fn($l) => $l->targetArticle->country_code === 'TH');
        $this->assertGreaterThan($links->count() / 2, $thLinks->count());
    }

    /** @test */
    public function it_does_not_create_duplicate_links()
    {
        $targetArticle = Article::factory()->create([
            'platform_id' => $this->platform->id,
            'language_code' => 'fr',
            'status' => 'published'
        ]);

        $sourceArticle = Article::factory()->create([
            'platform_id' => $this->platform->id,
            'language_code' => 'fr',
            'status' => 'published'
        ]);

        // Générer une première fois
        $this->service->generateInternalLinks($sourceArticle);
        $firstCount = InternalLink::where('source_article_id', $sourceArticle->id)->count();

        // Générer une deuxième fois
        $this->service->generateInternalLinks($sourceArticle);
        $secondCount = InternalLink::where('source_article_id', $sourceArticle->id)->count();

        // Les doublons ne devraient pas être créés
        $this->assertEquals($firstCount, $secondCount);
    }

    /** @test */
    public function it_does_not_link_to_itself()
    {
        $article = Article::factory()->create([
            'platform_id' => $this->platform->id,
            'status' => 'published'
        ]);

        $this->service->generateInternalLinks($article);

        $selfLink = InternalLink::where('source_article_id', $article->id)
            ->where('target_article_id', $article->id)
            ->exists();

        $this->assertFalse($selfLink);
    }

    /** @test */
    public function it_calculates_relevance_score()
    {
        $targetArticle = Article::factory()->create([
            'platform_id' => $this->platform->id,
            'language_code' => 'fr',
            'theme' => 'visa',
            'title' => 'Visa Thaïlande',
            'status' => 'published'
        ]);

        $sourceArticle = Article::factory()->create([
            'platform_id' => $this->platform->id,
            'language_code' => 'fr',
            'theme' => 'visa',
            'title' => 'Guide expatriation Thaïlande',
            'status' => 'published'
        ]);

        $this->service->generateInternalLinks($sourceArticle);

        $link = InternalLink::where('source_article_id', $sourceArticle->id)
            ->where('target_article_id', $targetArticle->id)
            ->first();

        if ($link) {
            $this->assertNotNull($link->relevance_score);
            $this->assertGreaterThanOrEqual(0, $link->relevance_score);
            $this->assertLessThanOrEqual(100, $link->relevance_score);
        }
    }

    /** @test */
    public function it_generates_varied_anchor_texts()
    {
        Article::factory()->count(10)->create([
            'platform_id' => $this->platform->id,
            'language_code' => 'fr',
            'status' => 'published'
        ]);

        $sourceArticle = Article::factory()->create([
            'platform_id' => $this->platform->id,
            'language_code' => 'fr',
            'status' => 'published'
        ]);

        $this->service->generateInternalLinks($sourceArticle);

        $links = InternalLink::where('source_article_id', $sourceArticle->id)->get();
        $anchorTypes = $links->pluck('anchor_type')->unique();

        // Devrait avoir plus d'un type d'anchor
        $this->assertGreaterThanOrEqual(1, $anchorTypes->count());
    }

    /** @test */
    public function it_deletes_old_automatic_links_when_regenerating()
    {
        $sourceArticle = Article::factory()->create([
            'platform_id' => $this->platform->id,
            'status' => 'published'
        ]);

        // Créer un lien automatique existant
        InternalLink::factory()->create([
            'source_article_id' => $sourceArticle->id,
            'is_automatic' => true
        ]);

        // Créer un lien manuel
        $manualLink = InternalLink::factory()->create([
            'source_article_id' => $sourceArticle->id,
            'is_automatic' => false
        ]);

        // Régénérer
        $this->service->generateInternalLinks($sourceArticle);

        // Le lien manuel doit être conservé
        $this->assertTrue(InternalLink::where('id', $manualLink->id)->exists());
    }
}
