<?php

namespace Tests\Feature\Services;

use App\Models\Article;
use App\Models\Country;
use App\Models\Language;
use App\Models\Platform;
use App\Models\Testimonial;
use App\Models\TestimonialTranslation;
use App\Services\AI\GptService;
use App\Services\Content\LandingGenerator;
use App\Services\Content\LandingSectionManager;
use App\Services\Content\TestimonialService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * Tests pour le système de génération de landing pages
 * 
 * Couvre :
 * - LandingGenerator (génération complète)
 * - LandingSectionManager (configuration sections)
 * - TestimonialService (gestion témoignages)
 * - Intégration complète
 */
class LandingGeneratorTest extends TestCase
{
    use RefreshDatabase;

    protected Platform $platform;
    protected Country $country;
    protected Language $language;

    protected function setUp(): void
    {
        parent::setUp();

        // Créer les données de test
        $this->platform = Platform::factory()->create(['slug' => 'ulixai']);
        $this->country = Country::factory()->create(['code' => 'FR', 'name' => 'France']);
        $this->language = Language::factory()->create(['code' => 'fr', 'name' => 'Français']);
    }

    // =========================================================================
    // TESTS LANDINGGENERATOR
    // =========================================================================

    /** @test */
    public function it_can_generate_a_complete_landing_page()
    {
        $generator = app(LandingGenerator::class);

        $article = $generator->generate([
            'platform_id' => $this->platform->id,
            'country_id' => $this->country->id,
            'language_id' => $this->language->id,
            'service' => 'Avocat spécialisé immigration',
        ]);

        $this->assertInstanceOf(Article::class, $article);
        $this->assertEquals(Article::TYPE_LANDING, $article->type);
        $this->assertEquals($this->platform->id, $article->platform_id);
        $this->assertEquals($this->country->id, $article->country_id);
        $this->assertEquals($this->language->id, $article->language_id);
        $this->assertNotEmpty($article->title);
        $this->assertNotEmpty($article->content);
        $this->assertGreaterThan(0, $article->word_count);
        $this->assertEquals(Article::STATUS_DRAFT, $article->status);
    }

    /** @test */
    public function it_generates_landing_with_faqs()
    {
        $generator = app(LandingGenerator::class);

        $article = $generator->generate([
            'platform_id' => $this->platform->id,
            'country_id' => $this->country->id,
            'language_id' => $this->language->id,
            'service' => 'Service déménagement',
        ]);

        // Vérifier que des FAQs ont été créées
        $this->assertGreaterThanOrEqual(4, $article->faqs->count());
        $this->assertLessThanOrEqual(6, $article->faqs->count());

        $faq = $article->faqs->first();
        $this->assertNotEmpty($faq->question);
        $this->assertNotEmpty($faq->answer);
    }

    /** @test */
    public function it_generates_unique_slugs()
    {
        $generator = app(LandingGenerator::class);

        // Générer 2 landing pages avec le même service
        $article1 = $generator->generate([
            'platform_id' => $this->platform->id,
            'country_id' => $this->country->id,
            'language_id' => $this->language->id,
            'service' => 'Service test',
        ]);

        $article2 = $generator->generate([
            'platform_id' => $this->platform->id,
            'country_id' => $this->country->id,
            'language_id' => $this->language->id,
            'service' => 'Service test',
        ]);

        $this->assertNotEquals($article1->slug, $article2->slug);
    }

    /** @test */
    public function it_generates_seo_metadata()
    {
        $generator = app(LandingGenerator::class);

        $article = $generator->generate([
            'platform_id' => $this->platform->id,
            'country_id' => $this->country->id,
            'language_id' => $this->language->id,
            'service' => 'Cours de langue',
        ]);

        // Meta title
        $this->assertNotEmpty($article->meta_title);
        $this->assertLessThanOrEqual(60, mb_strlen($article->meta_title));

        // Meta description
        $this->assertNotEmpty($article->meta_description);
        $this->assertLessThanOrEqual(160, mb_strlen($article->meta_description));

        // JSON-LD
        $this->assertIsArray($article->json_ld);
        $this->assertEquals('https://schema.org', $article->json_ld['@context']);
        $this->assertEquals('WebPage', $article->json_ld['@type']);
    }

    /** @test */
    public function it_includes_json_ld_faq_schema_when_faqs_present()
    {
        $generator = app(LandingGenerator::class);

        $article = $generator->generate([
            'platform_id' => $this->platform->id,
            'country_id' => $this->country->id,
            'language_id' => $this->language->id,
            'service' => 'Service avec FAQ',
        ]);

        $this->assertArrayHasKey('about', $article->json_ld);
        $this->assertEquals('FAQPage', $article->json_ld['about']['@type']);
        $this->assertArrayHasKey('mainEntity', $article->json_ld['about']);
        $this->assertIsArray($article->json_ld['about']['mainEntity']);
    }

    // =========================================================================
    // TESTS LANDINGSECTIONMANAGER
    // =========================================================================

    /** @test */
    public function it_returns_default_sections_config()
    {
        $manager = app(LandingSectionManager::class);
        $sections = $manager->getAllSections($this->platform->id);

        $this->assertIsArray($sections);
        $this->assertArrayHasKey('hero', $sections);
        $this->assertArrayHasKey('final_cta', $sections);
        $this->assertEquals(9, count($sections));
    }

    /** @test */
    public function it_has_testimonials_disabled_by_default()
    {
        $manager = app(LandingSectionManager::class);
        $sections = $manager->getAllSections($this->platform->id);

        $this->assertFalse($sections['testimonials']['enabled']);
    }

    /** @test */
    public function it_has_pricing_disabled_by_default()
    {
        $manager = app(LandingSectionManager::class);
        $sections = $manager->getAllSections($this->platform->id);

        $this->assertFalse($sections['pricing']['enabled']);
    }

    /** @test */
    public function it_can_enable_a_section()
    {
        $manager = app(LandingSectionManager::class);
        
        $manager->updateSectionStatus($this->platform->id, 'testimonials', true);
        
        $this->assertTrue($manager->isSectionEnabled($this->platform->id, 'testimonials'));
    }

    /** @test */
    public function it_can_disable_a_non_required_section()
    {
        $manager = app(LandingSectionManager::class);
        
        $manager->updateSectionStatus($this->platform->id, 'problem', false);
        
        $this->assertFalse($manager->isSectionEnabled($this->platform->id, 'problem'));
    }

    /** @test */
    public function it_cannot_disable_required_sections()
    {
        $this->expectException(\InvalidArgumentException::class);
        
        $manager = app(LandingSectionManager::class);
        $manager->updateSectionStatus($this->platform->id, 'hero', false);
    }

    /** @test */
    public function it_can_reorder_sections()
    {
        $manager = app(LandingSectionManager::class);
        
        $newOrder = [
            'hero' => 1,
            'solution' => 2,
            'problem' => 3,
        ];
        
        $manager->reorderSections($this->platform->id, $newOrder);
        
        $sections = $manager->getAllSections($this->platform->id);
        $this->assertEquals(2, $sections['solution']['order']);
        $this->assertEquals(3, $sections['problem']['order']);
    }

    /** @test */
    public function it_caches_sections_config()
    {
        $manager = app(LandingSectionManager::class);
        
        // Premier appel
        $manager->getEnabledSections($this->platform->id);
        
        // Vérifier que le cache existe
        $cacheKey = "landing_sections.platform_{$this->platform->id}";
        $this->assertTrue(Cache::has($cacheKey));
    }

    /** @test */
    public function it_invalidates_cache_on_update()
    {
        $manager = app(LandingSectionManager::class);
        
        // Créer le cache
        $manager->getEnabledSections($this->platform->id);
        
        $cacheKey = "landing_sections.platform_{$this->platform->id}";
        $this->assertTrue(Cache::has($cacheKey));
        
        // Modifier la configuration
        $manager->updateSectionStatus($this->platform->id, 'testimonials', true);
        
        // Le cache doit être invalidé
        $this->assertFalse(Cache::has($cacheKey));
    }

    /** @test */
    public function it_can_apply_templates()
    {
        $manager = app(LandingSectionManager::class);
        
        // Template minimal
        $manager->applyTemplate($this->platform->id, 'minimal');
        $sections = $manager->getEnabledSections($this->platform->id);
        $this->assertEquals(4, count($sections));
        
        // Template complet
        $manager->applyTemplate($this->platform->id, 'complete');
        $sections = $manager->getEnabledSections($this->platform->id);
        $this->assertEquals(9, count($sections));
        
        // Template conversion
        $manager->applyTemplate($this->platform->id, 'conversion');
        $sections = $manager->getEnabledSections($this->platform->id);
        $this->assertEquals(7, count($sections));
        $this->assertArrayHasKey('testimonials', $sections);
    }

    // =========================================================================
    // TESTS TESTIMONIALSERVICE
    // =========================================================================

    /** @test */
    public function it_can_create_testimonial()
    {
        $service = app(TestimonialService::class);
        
        $testimonial = $service->create([
            'platform_id' => $this->platform->id,
            'first_name' => 'Jean',
            'last_name_initial' => 'D',
            'country_code' => 'FR',
            'city' => 'Paris',
            'rating' => 5,
            'quote' => 'Excellent service !',
            'language_code' => 'fr',
        ]);

        $this->assertInstanceOf(Testimonial::class, $testimonial);
        $this->assertEquals('Jean', $testimonial->first_name);
        $this->assertEquals(5, $testimonial->rating);
        $this->assertCount(1, $testimonial->translations);
    }

    /** @test */
    public function it_can_retrieve_testimonials_for_landing()
    {
        $service = app(TestimonialService::class);
        
        // Créer 3 témoignages
        for ($i = 1; $i <= 3; $i++) {
            Testimonial::factory()->create([
                'platform_id' => $this->platform->id,
                'country_code' => 'FR',
                'rating' => 5,
                'is_active' => true,
            ]);
        }

        $testimonials = $service->getForLanding($this->platform->id, 'FR', null, 3);

        $this->assertCount(3, $testimonials);
        $this->assertArrayHasKey('name', $testimonials[0]);
        $this->assertArrayHasKey('quote', $testimonials[0]);
        $this->assertArrayHasKey('rating', $testimonials[0]);
    }

    /** @test */
    public function it_prioritizes_same_country_testimonials()
    {
        $service = app(TestimonialService::class);
        
        // Témoignage FR avec note 4
        $frTestimonial = Testimonial::factory()->create([
            'platform_id' => $this->platform->id,
            'country_code' => 'FR',
            'rating' => 4,
            'is_active' => true,
            'is_featured' => false,
        ]);

        // Témoignage ES avec note 5
        $esTestimonial = Testimonial::factory()->create([
            'platform_id' => $this->platform->id,
            'country_code' => 'ES',
            'rating' => 5,
            'is_active' => true,
            'is_featured' => false,
        ]);

        $testimonials = $service->getForLanding($this->platform->id, 'FR', null, 2);

        // Le témoignage FR doit être prioritaire même avec une note inférieure
        $this->assertEquals($frTestimonial->id, $testimonials[0]['id']);
    }

    /** @test */
    public function it_can_update_testimonial()
    {
        $service = app(TestimonialService::class);
        
        $testimonial = Testimonial::factory()->create([
            'platform_id' => $this->platform->id,
            'first_name' => 'Jean',
            'rating' => 4,
        ]);

        $updated = $service->update($testimonial, [
            'first_name' => 'Pierre',
            'rating' => 5,
        ]);

        $this->assertEquals('Pierre', $updated->first_name);
        $this->assertEquals(5, $updated->rating);
    }

    /** @test */
    public function it_can_toggle_testimonial_active_status()
    {
        $service = app(TestimonialService::class);
        
        $testimonial = Testimonial::factory()->create([
            'platform_id' => $this->platform->id,
            'is_active' => true,
        ]);

        $service->setActive($testimonial, false);
        $testimonial->refresh();

        $this->assertFalse($testimonial->is_active);
    }

    /** @test */
    public function it_can_toggle_testimonial_featured_status()
    {
        $service = app(TestimonialService::class);
        
        $testimonial = Testimonial::factory()->create([
            'platform_id' => $this->platform->id,
            'is_featured' => false,
        ]);

        $service->setFeatured($testimonial, true);
        $testimonial->refresh();

        $this->assertTrue($testimonial->is_featured);
    }

    /** @test */
    public function it_can_get_testimonial_stats()
    {
        $service = app(TestimonialService::class);
        
        // Créer plusieurs témoignages
        Testimonial::factory()->count(5)->create([
            'platform_id' => $this->platform->id,
            'is_active' => true,
        ]);
        Testimonial::factory()->count(2)->create([
            'platform_id' => $this->platform->id,
            'is_active' => false,
        ]);

        $stats = $service->getStats($this->platform->id);

        $this->assertEquals(7, $stats['total']);
        $this->assertEquals(5, $stats['active']);
    }

    // =========================================================================
    // TESTS INTÉGRATION
    // =========================================================================

    /** @test */
    public function it_generates_landing_without_testimonials_by_default()
    {
        $generator = app(LandingGenerator::class);

        $article = $generator->generate([
            'platform_id' => $this->platform->id,
            'country_id' => $this->country->id,
            'language_id' => $this->language->id,
            'service' => 'Service test',
        ]);

        // Vérifier que la section testimonials n'est pas dans le contenu
        $this->assertStringNotContainsString('testimonials-section', $article->content);
    }

    /** @test */
    public function it_generates_landing_with_testimonials_when_enabled()
    {
        // Créer des témoignages
        Testimonial::factory()->count(3)->create([
            'platform_id' => $this->platform->id,
            'country_code' => 'FR',
            'is_active' => true,
        ]);

        // Activer la section testimonials
        $manager = app(LandingSectionManager::class);
        $manager->updateSectionStatus($this->platform->id, 'testimonials', true);

        // Générer
        $generator = app(LandingGenerator::class);
        $article = $generator->generate([
            'platform_id' => $this->platform->id,
            'country_id' => $this->country->id,
            'language_id' => $this->language->id,
            'service' => 'Service test',
        ]);

        // Vérifier que la section testimonials est dans le contenu
        $this->assertStringContainsString('testimonials-section', $article->content);
    }

    /** @test */
    public function it_generates_landing_respecting_custom_sections()
    {
        $generator = app(LandingGenerator::class);
        $manager = app(LandingSectionManager::class);

        // Obtenir les sections
        $allSections = $manager->getAllSections($this->platform->id);

        // Ne garder que hero, solution, faq, final_cta
        $customSections = [
            'hero' => $allSections['hero'],
            'solution' => $allSections['solution'],
            'faq' => $allSections['faq'],
            'final_cta' => $allSections['final_cta'],
        ];

        $article = $generator->generate([
            'platform_id' => $this->platform->id,
            'country_id' => $this->country->id,
            'language_id' => $this->language->id,
            'service' => 'Service test',
            'sections_enabled' => $customSections,
        ]);

        // Vérifier que seules les sections demandées sont présentes
        $this->assertStringContainsString('hero-section', $article->content);
        $this->assertStringContainsString('solution-section', $article->content);
        $this->assertStringContainsString('faq-section', $article->content);
        $this->assertStringContainsString('final-cta-section', $article->content);

        // Vérifier que les autres ne sont pas là
        $this->assertStringNotContainsString('problem-section', $article->content);
        $this->assertStringNotContainsString('advantages-section', $article->content);
    }
}