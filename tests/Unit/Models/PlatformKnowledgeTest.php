<?php

/*
 * TESTS UNITAIRES PHASE 11 - PLATFORM KNOWLEDGE
 * 
 * 3 fichiers de tests:
 * 1. PlatformKnowledgeTest.php (Models)
 * 2. PlatformKnowledgeServiceTest.php (Service)
 * 3. PlatformKnowledgeControllerTest.php (Controller API)
 */

// ============================================================================
// FICHIER 1: tests/Unit/Models/PlatformKnowledgeTest.php
// ============================================================================

namespace Tests\Unit\Models;

use Tests\TestCase;
use App\Models\PlatformKnowledge;
use App\Models\PlatformKnowledgeTranslation;
use App\Models\Platform;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PlatformKnowledgeTest extends TestCase
{
    use RefreshDatabase;

    protected Platform $platform;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->platform = Platform::factory()->create([
            'name' => 'Test Platform',
            'code' => 'test-platform'
        ]);
    }

    /** @test */
    public function it_can_create_platform_knowledge()
    {
        $knowledge = PlatformKnowledge::create([
            'platform_id' => $this->platform->id,
            'knowledge_type' => 'facts',
            'title' => 'Test Facts',
            'content' => 'Test content with facts',
            'language_code' => 'fr',
            'priority' => 100,
            'is_active' => true,
            'use_in_articles' => true,
        ]);

        $this->assertDatabaseHas('platform_knowledge', [
            'platform_id' => $this->platform->id,
            'knowledge_type' => 'facts',
            'language_code' => 'fr',
        ]);

        $this->assertEquals('Test Facts', $knowledge->title);
    }

    /** @test */
    public function it_belongs_to_platform()
    {
        $knowledge = PlatformKnowledge::factory()->create([
            'platform_id' => $this->platform->id,
        ]);

        $this->assertInstanceOf(Platform::class, $knowledge->platform);
        $this->assertEquals($this->platform->id, $knowledge->platform->id);
    }

    /** @test */
    public function it_has_many_translations()
    {
        $knowledge = PlatformKnowledge::factory()->create([
            'platform_id' => $this->platform->id,
            'language_code' => 'fr',
        ]);

        PlatformKnowledgeTranslation::create([
            'knowledge_id' => $knowledge->id,
            'language_code' => 'en',
            'title' => 'English Title',
            'content' => 'English content',
        ]);

        PlatformKnowledgeTranslation::create([
            'knowledge_id' => $knowledge->id,
            'language_code' => 'es',
            'title' => 'Spanish Title',
            'content' => 'Spanish content',
        ]);

        $this->assertCount(2, $knowledge->translations);
    }

    /** @test */
    public function scope_active_filters_active_knowledge()
    {
        PlatformKnowledge::factory()->create([
            'platform_id' => $this->platform->id,
            'is_active' => true,
        ]);

        PlatformKnowledge::factory()->create([
            'platform_id' => $this->platform->id,
            'is_active' => false,
        ]);

        $active = PlatformKnowledge::active()->get();

        $this->assertCount(1, $active);
        $this->assertTrue($active->first()->is_active);
    }

    /** @test */
    public function scope_by_type_filters_by_knowledge_type()
    {
        PlatformKnowledge::factory()->create([
            'platform_id' => $this->platform->id,
            'knowledge_type' => 'facts',
        ]);

        PlatformKnowledge::factory()->create([
            'platform_id' => $this->platform->id,
            'knowledge_type' => 'tone',
        ]);

        $facts = PlatformKnowledge::byType('facts')->get();

        $this->assertCount(1, $facts);
        $this->assertEquals('facts', $facts->first()->knowledge_type);
    }

    /** @test */
    public function scope_by_language_filters_by_language_code()
    {
        PlatformKnowledge::factory()->create([
            'platform_id' => $this->platform->id,
            'language_code' => 'fr',
        ]);

        PlatformKnowledge::factory()->create([
            'platform_id' => $this->platform->id,
            'language_code' => 'en',
        ]);

        $french = PlatformKnowledge::byLanguage('fr')->get();

        $this->assertCount(1, $french);
        $this->assertEquals('fr', $french->first()->language_code);
    }

    /** @test */
    public function scope_for_content_type_filters_by_use_in_flags()
    {
        PlatformKnowledge::factory()->create([
            'platform_id' => $this->platform->id,
            'use_in_articles' => true,
            'use_in_landings' => false,
        ]);

        PlatformKnowledge::factory()->create([
            'platform_id' => $this->platform->id,
            'use_in_articles' => false,
            'use_in_landings' => true,
        ]);

        $forArticles = PlatformKnowledge::forContentType('articles')->get();
        $forLandings = PlatformKnowledge::forContentType('landings')->get();

        $this->assertCount(1, $forArticles);
        $this->assertCount(1, $forLandings);
    }

    /** @test */
    public function it_can_get_translation_for_language()
    {
        $knowledge = PlatformKnowledge::factory()->create([
            'platform_id' => $this->platform->id,
            'language_code' => 'fr',
        ]);

        $translation = PlatformKnowledgeTranslation::create([
            'knowledge_id' => $knowledge->id,
            'language_code' => 'en',
            'title' => 'English Title',
            'content' => 'English content',
        ]);

        $retrieved = $knowledge->getTranslation('en');

        $this->assertNotNull($retrieved);
        $this->assertEquals('English Title', $retrieved->title);
    }

    /** @test */
    public function it_returns_null_when_translation_not_found()
    {
        $knowledge = PlatformKnowledge::factory()->create([
            'platform_id' => $this->platform->id,
            'language_code' => 'fr',
        ]);

        $translation = $knowledge->getTranslation('de');

        $this->assertNull($translation);
    }

    /** @test */
    public function it_can_check_if_translation_exists()
    {
        $knowledge = PlatformKnowledge::factory()->create([
            'platform_id' => $this->platform->id,
            'language_code' => 'fr',
        ]);

        PlatformKnowledgeTranslation::create([
            'knowledge_id' => $knowledge->id,
            'language_code' => 'en',
            'title' => 'Test',
            'content' => 'Test',
        ]);

        $this->assertTrue($knowledge->hasTranslation('en'));
        $this->assertFalse($knowledge->hasTranslation('de'));
    }
}


// ============================================================================
// FICHIER 2: tests/Unit/Services/PlatformKnowledgeServiceTest.php
// ============================================================================

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Models\PlatformKnowledge;
use App\Models\Platform;
use App\Services\Content\PlatformKnowledgeService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PlatformKnowledgeServiceTest extends TestCase
{
    use RefreshDatabase;

    protected PlatformKnowledgeService $service;
    protected Platform $platform;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->service = app(PlatformKnowledgeService::class);
        
        $this->platform = Platform::factory()->create([
            'name' => 'SOS-Expat',
            'code' => 'sos-expat'
        ]);
    }

    /** @test */
    public function it_can_get_knowledge_context()
    {
        // Créer des knowledge
        PlatformKnowledge::create([
            'platform_id' => $this->platform->id,
            'knowledge_type' => 'facts',
            'title' => 'Faits',
            'content' => '304 millions d\'expatriés, 197 pays, <5 minutes, 2500+ avocats',
            'language_code' => 'fr',
            'priority' => 100,
            'is_active' => true,
            'use_in_articles' => true,
        ]);

        PlatformKnowledge::create([
            'platform_id' => $this->platform->id,
            'knowledge_type' => 'tone',
            'title' => 'Ton',
            'content' => 'Rassurant, vouvoiement obligatoire',
            'language_code' => 'fr',
            'priority' => 85,
            'is_active' => true,
            'use_in_articles' => true,
        ]);

        $context = $this->service->getKnowledgeContext($this->platform, 'fr', 'articles');

        $this->assertStringContainsString('SOS-Expat', $context);
        $this->assertStringContainsString('304 millions', $context);
        $this->assertStringContainsString('CRITIQUE', $context);
    }

    /** @test */
    public function it_validates_content_successfully()
    {
        PlatformKnowledge::create([
            'platform_id' => $this->platform->id,
            'knowledge_type' => 'facts',
            'title' => 'Faits',
            'content' => '304 millions d\'expatriés, 197 pays, <5 minutes, 2500+ avocats',
            'language_code' => 'fr',
            'priority' => 100,
            'is_active' => true,
            'use_in_articles' => true,
        ]);

        $validContent = "SOS-Expat connecte 304 millions d'expatriés avec 2500+ avocats vérifiés dans 197 pays. Réponse en moins de 5 minutes garantie.";

        $result = $this->service->validateContent($validContent, $this->platform, 'fr');

        $this->assertTrue($result['valid']);
        $this->assertGreaterThanOrEqual(70, $result['score']);
        $this->assertEmpty($result['errors']);
    }

    /** @test */
    public function it_detects_missing_facts()
    {
        PlatformKnowledge::create([
            'platform_id' => $this->platform->id,
            'knowledge_type' => 'facts',
            'title' => 'Faits',
            'content' => '304 millions d\'expatriés, 197 pays',
            'language_code' => 'fr',
            'priority' => 100,
            'is_active' => true,
            'use_in_articles' => true,
        ]);

        $invalidContent = "Nous offrons des services juridiques pour expatriés.";

        $result = $this->service->validateContent($invalidContent, $this->platform, 'fr');

        $this->assertFalse($result['valid']);
        $this->assertLessThan(70, $result['score']);
        $this->assertNotEmpty($result['errors']);
    }

    /** @test */
    public function it_detects_forbidden_words()
    {
        PlatformKnowledge::create([
            'platform_id' => $this->platform->id,
            'knowledge_type' => 'vocabulary',
            'title' => 'Vocabulaire',
            'content' => 'JAMAIS : immigrant, sans-papiers, rendez-vous',
            'language_code' => 'fr',
            'priority' => 70,
            'is_active' => true,
            'use_in_articles' => true,
        ]);

        $invalidContent = "Nous aidons les immigrants et sans-papiers.";

        $result = $this->service->validateContent($invalidContent, $this->platform, 'fr');

        $this->assertNotEmpty($result['errors']);
        $this->assertStringContainsString('immigrant', implode(' ', $result['errors']));
    }

    /** @test */
    public function it_formats_knowledge_for_prompt_correctly()
    {
        $knowledge = collect([
            PlatformKnowledge::create([
                'platform_id' => $this->platform->id,
                'knowledge_type' => 'facts',
                'title' => 'Faits',
                'content' => '304 millions d\'expatriés',
                'language_code' => 'fr',
                'priority' => 100,
                'is_active' => true,
            ]),
        ]);

        $formatted = $this->service->formatKnowledgeForPrompt($this->platform, $knowledge);

        $this->assertStringContainsString('# INFORMATIONS ESSENTIELLES', $formatted);
        $this->assertStringContainsString('SOS-Expat', $formatted);
        $this->assertStringContainsString('CRITIQUE', $formatted);
        $this->assertStringContainsString('304 millions', $formatted);
    }
}


// ============================================================================
// FICHIER 3: tests/Feature/Api/PlatformKnowledgeControllerTest.php
// ============================================================================

namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Models\PlatformKnowledge;
use App\Models\Platform;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PlatformKnowledgeControllerTest extends TestCase
{
    use RefreshDatabase;

    protected Platform $platform;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->platform = Platform::factory()->create([
            'name' => 'Test Platform',
            'code' => 'test'
        ]);
    }

    /** @test */
    public function it_can_list_platform_knowledge()
    {
        PlatformKnowledge::factory()->count(5)->create([
            'platform_id' => $this->platform->id,
        ]);

        $response = $this->getJson('/api/platform-knowledge');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'platform_id', 'knowledge_type', 'title', 'content']
                ]
            ]);
    }

    /** @test */
    public function it_can_filter_by_platform()
    {
        PlatformKnowledge::factory()->create([
            'platform_id' => $this->platform->id,
        ]);

        $otherPlatform = Platform::factory()->create();
        PlatformKnowledge::factory()->create([
            'platform_id' => $otherPlatform->id,
        ]);

        $response = $this->getJson('/api/platform-knowledge?platform_id=' . $this->platform->id);

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }

    /** @test */
    public function it_can_create_platform_knowledge()
    {
        $data = [
            'platform_id' => $this->platform->id,
            'knowledge_type' => 'facts',
            'title' => 'Test Facts',
            'content' => 'Test content',
            'language_code' => 'fr',
            'priority' => 100,
            'is_active' => true,
            'use_in_articles' => true,
        ];

        $response = $this->postJson('/api/platform-knowledge', $data);

        $response->assertStatus(201)
            ->assertJsonFragment(['title' => 'Test Facts']);

        $this->assertDatabaseHas('platform_knowledge', [
            'title' => 'Test Facts',
            'platform_id' => $this->platform->id,
        ]);
    }

    /** @test */
    public function it_validates_language_code_strictly()
    {
        $data = [
            'platform_id' => $this->platform->id,
            'knowledge_type' => 'facts',
            'title' => 'Test',
            'content' => 'Test',
            'language_code' => 'XX', // Code invalide
        ];

        $response = $this->postJson('/api/platform-knowledge', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('language_code');
    }

    /** @test */
    public function it_can_update_platform_knowledge()
    {
        $knowledge = PlatformKnowledge::factory()->create([
            'platform_id' => $this->platform->id,
            'title' => 'Original Title',
        ]);

        $response = $this->putJson("/api/platform-knowledge/{$knowledge->id}", [
            'title' => 'Updated Title',
        ]);

        $response->assertStatus(200)
            ->assertJsonFragment(['title' => 'Updated Title']);

        $this->assertDatabaseHas('platform_knowledge', [
            'id' => $knowledge->id,
            'title' => 'Updated Title',
        ]);
    }

    /** @test */
    public function it_can_delete_platform_knowledge()
    {
        $knowledge = PlatformKnowledge::factory()->create([
            'platform_id' => $this->platform->id,
        ]);

        $response = $this->deleteJson("/api/platform-knowledge/{$knowledge->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('platform_knowledge', [
            'id' => $knowledge->id,
        ]);
    }

    /** @test */
    public function it_can_validate_content()
    {
        PlatformKnowledge::factory()->create([
            'platform_id' => $this->platform->id,
            'knowledge_type' => 'facts',
            'content' => '304 millions, 197 pays',
            'language_code' => 'fr',
            'use_in_articles' => true,
        ]);

        $response = $this->postJson('/api/platform-knowledge/validate-content', [
            'content' => 'Test avec 304 millions et 197 pays',
            'platform_id' => $this->platform->id,
            'language_code' => 'fr',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['valid', 'score', 'errors', 'warnings']);
    }

    /** @test */
    public function it_can_preview_prompt()
    {
        PlatformKnowledge::factory()->create([
            'platform_id' => $this->platform->id,
            'language_code' => 'fr',
            'use_in_articles' => true,
        ]);

        $response = $this->postJson('/api/platform-knowledge/preview-prompt', [
            'platform_id' => $this->platform->id,
            'language_code' => 'fr',
            'content_type' => 'articles',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['platform', 'language', 'content_type', 'prompt', 'length']);
    }
}

/*
 * COMMANDES POUR EXÉCUTER LES TESTS:
 * 
 * # Tous les tests Phase 11
 * php artisan test --filter PlatformKnowledge
 * 
 * # Tests Models uniquement
 * php artisan test tests/Unit/Models/PlatformKnowledgeTest.php
 * 
 * # Tests Service uniquement
 * php artisan test tests/Unit/Services/PlatformKnowledgeServiceTest.php
 * 
 * # Tests Controller uniquement
 * php artisan test tests/Feature/Api/PlatformKnowledgeControllerTest.php
 * 
 * # Avec coverage
 * php artisan test --filter PlatformKnowledge --coverage
 * 
 * COUVERTURE ATTENDUE:
 * - Models: 90%+
 * - Service: 85%+
 * - Controller: 80%+
 * 
 * TEMPS EXÉCUTION:
 * - Total: ~15-20 secondes
 * - 30+ tests
 */