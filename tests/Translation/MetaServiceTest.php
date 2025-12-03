<?php

namespace Tests\Unit\Services\Seo;

use Tests\TestCase;
use App\Services\Seo\MetaService;
use App\Models\Article;
use App\Models\Language;
use App\Models\Platform;
use App\Models\Country;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Tests du service SEO
 * Phase 7 : Jour 7-3
 */
class MetaServiceTest extends TestCase
{
    use RefreshDatabase;

    protected MetaService $metaService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->metaService = new MetaService();
        $this->seedLanguages();
    }

    // =========================================================================
    // TESTS META TAGS
    // =========================================================================

    /** @test */
    public function it_generates_meta_title_under_60_chars()
    {
        $longTitle = "Guide complet et détaillé pour tous les expatriés qui souhaitent s'installer en France";
        $metaTitle = $this->metaService->generateMetaTitle($longTitle);

        $this->assertLessThanOrEqual(60, mb_strlen($metaTitle));
        $this->assertStringEndsWith('...', $metaTitle);
    }

    /** @test */
    public function it_generates_meta_description_under_160_chars()
    {
        $longExcerpt = "Ceci est une très longue description qui dépasse largement les 160 caractères recommandés par Google pour les meta descriptions. Elle contient beaucoup d'informations importantes mais doit être tronquée intelligemment.";
        $metaDescription = $this->metaService->generateMetaDescription($longExcerpt);

        $this->assertLessThanOrEqual(160, mb_strlen($metaDescription));
        $this->assertStringEndsWith('...', $metaDescription);
    }

    /** @test */
    public function it_keeps_short_titles_unchanged()
    {
        $shortTitle = "Guide expatriés";
        $metaTitle = $this->metaService->generateMetaTitle($shortTitle);

        $this->assertEquals($shortTitle, $metaTitle);
        $this->assertStringNotContainsString('...', $metaTitle);
    }

    /** @test */
    public function it_generates_complete_meta_tags()
    {
        $article = $this->createTestArticle();
        $meta = $this->metaService->generateMeta($article, 'fr');

        $this->assertIsArray($meta);
        $this->assertArrayHasKey('title', $meta);
        $this->assertArrayHasKey('description', $meta);
        $this->assertArrayHasKey('keywords', $meta);
        $this->assertArrayHasKey('robots', $meta);
        $this->assertLessThanOrEqual(60, mb_strlen($meta['title']));
        $this->assertLessThanOrEqual(160, mb_strlen($meta['description']));
    }

    // =========================================================================
    // TESTS JSON-LD
    // =========================================================================

    /** @test */
    public function it_generates_valid_jsonld_article()
    {
        $article = $this->createTestArticle();
        $jsonLd = $this->metaService->generateJsonLdArticle($article, 'fr');

        $this->assertIsArray($jsonLd);
        $this->assertEquals('https://schema.org', $jsonLd['@context']);
        $this->assertEquals('Article', $jsonLd['@type']);
        $this->assertArrayHasKey('headline', $jsonLd);
        $this->assertArrayHasKey('datePublished', $jsonLd);
        $this->assertArrayHasKey('author', $jsonLd);
        $this->assertArrayHasKey('publisher', $jsonLd);
    }

    /** @test */
    public function it_generates_valid_jsonld_faq()
    {
        $faqs = [
            ['question' => 'Comment obtenir un visa ?', 'answer' => 'Vous devez faire une demande...'],
            ['question' => 'Quel est le coût ?', 'answer' => 'Le coût varie selon...'],
        ];

        $jsonLd = $this->metaService->generateJsonLdFaq($faqs);

        $this->assertIsArray($jsonLd);
        $this->assertEquals('https://schema.org', $jsonLd['@context']);
        $this->assertEquals('FAQPage', $jsonLd['@type']);
        $this->assertArrayHasKey('mainEntity', $jsonLd);
        $this->assertCount(2, $jsonLd['mainEntity']);
        $this->assertEquals('Question', $jsonLd['mainEntity'][0]['@type']);
    }

    /** @test */
    public function it_generates_empty_faq_for_empty_array()
    {
        $jsonLd = $this->metaService->generateJsonLdFaq([]);

        $this->assertEmpty($jsonLd);
    }

    /** @test */
    public function it_generates_valid_jsonld_breadcrumb()
    {
        $article = $this->createTestArticle();
        $jsonLd = $this->metaService->generateJsonLdBreadcrumb($article, 'fr');

        $this->assertIsArray($jsonLd);
        $this->assertEquals('https://schema.org', $jsonLd['@context']);
        $this->assertEquals('BreadcrumbList', $jsonLd['@type']);
        $this->assertArrayHasKey('itemListElement', $jsonLd);
        $this->assertGreaterThanOrEqual(2, count($jsonLd['itemListElement']));
        
        // Vérifier structure des items
        $firstItem = $jsonLd['itemListElement'][0];
        $this->assertEquals('ListItem', $firstItem['@type']);
        $this->assertEquals(1, $firstItem['position']);
        $this->assertArrayHasKey('name', $firstItem);
        $this->assertArrayHasKey('item', $firstItem);
    }

    // =========================================================================
    // TESTS HREFLANG
    // =========================================================================

    /** @test */
    public function it_generates_hreflang_data()
    {
        $article = $this->createTestArticle();
        $hreflang = $this->metaService->generateHreflangData($article);

        $this->assertIsArray($hreflang);
        $this->assertArrayHasKey('fr', $hreflang);
        $this->assertArrayHasKey('x-default', $hreflang);
        
        // Vérifier que les URLs sont valides
        foreach ($hreflang as $lang => $url) {
            $this->assertStringStartsWith('http', $url);
        }
    }

    /** @test */
    public function it_generates_hreflang_html_tags()
    {
        $article = $this->createTestArticle();
        $tags = $this->metaService->generateHreflangTags($article);

        $this->assertIsString($tags);
        $this->assertStringContainsString('<link rel="alternate"', $tags);
        $this->assertStringContainsString('hreflang="fr"', $tags);
        $this->assertStringContainsString('hreflang="x-default"', $tags);
    }

    // =========================================================================
    // TESTS CANONICAL URL
    // =========================================================================

    /** @test */
    public function it_generates_canonical_url()
    {
        $article = $this->createTestArticle();
        $url = $this->metaService->generateCanonicalUrl($article, 'fr');

        $this->assertIsString($url);
        $this->assertStringStartsWith('http', $url);
        $this->assertStringContainsString('/articles/', $url);
        $this->assertStringContainsString($article->slug, $url);
    }

    /** @test */
    public function it_generates_different_urls_for_different_languages()
    {
        $article = $this->createTestArticle();
        
        $urlFr = $this->metaService->generateCanonicalUrl($article, 'fr');
        $urlEn = $this->metaService->generateCanonicalUrl($article, 'en');

        $this->assertNotEquals($urlFr, $urlEn);
        $this->assertStringContainsString('/en/', $urlEn);
    }

    // =========================================================================
    // TESTS OPENGRAPH
    // =========================================================================

    /** @test */
    public function it_generates_valid_opengraph_tags()
    {
        $article = $this->createTestArticle();
        $og = $this->metaService->generateOpenGraph($article, 'fr');

        $this->assertIsArray($og);
        $this->assertEquals('article', $og['og:type']);
        $this->assertArrayHasKey('og:title', $og);
        $this->assertArrayHasKey('og:description', $og);
        $this->assertArrayHasKey('og:url', $og);
        $this->assertArrayHasKey('og:site_name', $og);
        $this->assertArrayHasKey('og:locale', $og);
        
        // Vérifier limites de longueur
        $this->assertLessThanOrEqual(70, mb_strlen($og['og:title']));
        $this->assertLessThanOrEqual(200, mb_strlen($og['og:description']));
    }

    /** @test */
    public function it_includes_image_in_opengraph_when_present()
    {
        $article = $this->createTestArticle();
        $article->image_url = 'https://example.com/image.jpg';
        $article->save();

        $og = $this->metaService->generateOpenGraph($article, 'fr');

        $this->assertArrayHasKey('og:image', $og);
        $this->assertEquals('https://example.com/image.jpg', $og['og:image']);
        $this->assertArrayHasKey('og:image:alt', $og);
    }

    /** @test */
    public function it_generates_opengraph_html_tags()
    {
        $article = $this->createTestArticle();
        $tags = $this->metaService->generateOpenGraphTags($article, 'fr');

        $this->assertIsString($tags);
        $this->assertStringContainsString('<meta property="og:type"', $tags);
        $this->assertStringContainsString('content="article"', $tags);
        $this->assertStringContainsString('<meta property="og:title"', $tags);
    }

    // =========================================================================
    // TESTS TWITTER CARD
    // =========================================================================

    /** @test */
    public function it_generates_valid_twitter_card()
    {
        $article = $this->createTestArticle();
        $twitter = $this->metaService->generateTwitterCard($article, 'fr');

        $this->assertIsArray($twitter);
        $this->assertArrayHasKey('twitter:card', $twitter);
        $this->assertArrayHasKey('twitter:title', $twitter);
        $this->assertArrayHasKey('twitter:description', $twitter);
        
        // Vérifier limites
        $this->assertLessThanOrEqual(70, mb_strlen($twitter['twitter:title']));
        $this->assertLessThanOrEqual(200, mb_strlen($twitter['twitter:description']));
    }

    /** @test */
    public function it_uses_summary_large_image_when_image_present()
    {
        $article = $this->createTestArticle();
        $article->image_url = 'https://example.com/image.jpg';
        $article->save();

        $twitter = $this->metaService->generateTwitterCard($article, 'fr');

        $this->assertEquals('summary_large_image', $twitter['twitter:card']);
        $this->assertArrayHasKey('twitter:image', $twitter);
    }

    /** @test */
    public function it_generates_twitter_card_html_tags()
    {
        $article = $this->createTestArticle();
        $tags = $this->metaService->generateTwitterCardTags($article, 'fr');

        $this->assertIsString($tags);
        $this->assertStringContainsString('<meta name="twitter:card"', $tags);
        $this->assertStringContainsString('<meta name="twitter:title"', $tags);
    }

    // =========================================================================
    // TESTS MÉTHODE TOUT-EN-UN
    // =========================================================================

    /** @test */
    public function it_generates_all_meta_at_once()
    {
        $article = $this->createTestArticle();
        $allMeta = $this->metaService->generateAllMeta($article, 'fr');

        $this->assertIsArray($allMeta);
        $this->assertArrayHasKey('basic', $allMeta);
        $this->assertArrayHasKey('canonical', $allMeta);
        $this->assertArrayHasKey('json_ld', $allMeta);
        $this->assertArrayHasKey('hreflang', $allMeta);
        $this->assertArrayHasKey('opengraph', $allMeta);
        $this->assertArrayHasKey('twitter', $allMeta);

        // Vérifier sous-structures
        $this->assertArrayHasKey('article', $allMeta['json_ld']);
        $this->assertArrayHasKey('breadcrumb', $allMeta['json_ld']);
    }

    /** @test */
    public function it_validates_json_structure()
    {
        $article = $this->createTestArticle();
        $allMeta = $this->metaService->generateAllMeta($article, 'fr');

        // Vérifier que JSON-LD peut être encodé
        $jsonLdArticle = json_encode($allMeta['json_ld']['article']);
        $this->assertNotFalse($jsonLdArticle);
        
        $decoded = json_decode($jsonLdArticle, true);
        $this->assertIsArray($decoded);
        $this->assertEquals('https://schema.org', $decoded['@context']);
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Crée un article de test
     */
    protected function createTestArticle(): Article
    {
        $language = Language::where('code', 'fr')->first();
        $platform = Platform::first() ?? Platform::factory()->create([
            'name' => 'SOS-Expat',
            'url' => 'https://sos-expat.com',
        ]);
        $country = Country::first() ?? Country::factory()->create([
            'name' => 'France',
            'slug' => 'france',
        ]);

        return Article::create([
            'platform_id' => $platform->id,
            'country_id' => $country->id,
            'language_id' => $language->id,
            'type' => 'article',
            'title' => 'Guide complet pour expatriés en France',
            'slug' => 'guide-complet-pour-expatries-en-france',
            'excerpt' => 'Découvrez tout ce qu\'il faut savoir pour réussir votre expatriation en France. Visa, logement, travail et plus encore.',
            'content' => '<h2>Introduction</h2><p>S\'expatrier en France nécessite une bonne préparation. Ce guide vous accompagne dans toutes les démarches administratives, de l\'obtention du visa à la recherche de logement.</p><h2>Visa et permis de séjour</h2><p>Selon votre nationalité, vous aurez besoin de différents documents pour entrer et résider légalement en France.</p>',
            'image_url' => null,
            'image_alt' => null,
            'word_count' => 250,
            'reading_time' => 2,
            'status' => 'published',
            'published_at' => now(),
        ]);
    }

    /**
     * Seed les langues
     */
    protected function seedLanguages(): void
    {
        $languages = [
            ['code' => 'fr', 'name' => 'Français', 'native_name' => 'Français'],
            ['code' => 'en', 'name' => 'English', 'native_name' => 'English'],
            ['code' => 'de', 'name' => 'German', 'native_name' => 'Deutsch'],
            ['code' => 'es', 'name' => 'Spanish', 'native_name' => 'Español'],
            ['code' => 'pt', 'name' => 'Portuguese', 'native_name' => 'Português'],
            ['code' => 'ru', 'name' => 'Russian', 'native_name' => 'Русский'],
            ['code' => 'zh', 'name' => 'Chinese', 'native_name' => '中文'],
            ['code' => 'ar', 'name' => 'Arabic', 'native_name' => 'العربية'],
            ['code' => 'hi', 'name' => 'Hindi', 'native_name' => 'हिन्दी'],
        ];

        foreach ($languages as $lang) {
            Language::firstOrCreate(['code' => $lang['code']], $lang);
        }
    }
}