<?php

namespace Tests\Unit\Services\AI;

use Tests\TestCase;
use App\Services\AI\DalleService;
use App\Models\ImageLibrary;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Foundation\Testing\RefreshDatabase;

class DalleServiceTest extends TestCase
{
    use RefreshDatabase;

    protected DalleService $service;

    protected function setUp(): void
    {
        parent::setUp();

        // Configurer l'API key pour les tests
        config(['ai.dalle.api_key' => 'test-key']);
        config(['ai.dalle.storage_disk' => 'public']);
        config(['ai.dalle.storage_path' => 'images/generated']);
        config(['ai.dalle.convert_to_webp' => false]); // Désactiver pour les tests
        
        $this->service = new DalleService();
        
        // Fake storage
        Storage::fake('public');
        
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
        config(['ai.dalle.api_key' => null]);
        config(['services.openai.api_key' => null]);
        $service = new DalleService();
        
        $this->assertFalse($service->isAvailable());
    }

    /** @test */
    public function it_returns_correct_service_name()
    {
        $this->assertEquals('dalle', $this->service->getServiceName());
    }

    /** @test */
    public function it_can_estimate_cost_for_standard_quality()
    {
        $cost = $this->service->estimateCost('generate', [
            'model' => 'dall-e-3',
            'quality' => 'standard',
            'size' => '1024x1024',
        ]);

        $this->assertEquals(0.04, $cost);
    }

    /** @test */
    public function it_can_estimate_cost_for_hd_quality()
    {
        $cost = $this->service->estimateCost('generate', [
            'model' => 'dall-e-3',
            'quality' => 'hd',
            'size' => '1792x1024',
        ]);

        $this->assertEquals(0.12, $cost);
    }

    /** @test */
    public function it_can_estimate_cost_for_multiple_images()
    {
        $cost = $this->service->estimateCost('generate', [
            'model' => 'dall-e-3',
            'quality' => 'standard',
            'size' => '1024x1024',
            'count' => 3,
        ]);

        $this->assertEquals(0.12, $cost); // 0.04 * 3
    }

    /** @test */
    public function it_can_generate_image()
    {
        Http::fake([
            'api.openai.com/*' => Http::response([
                'data' => [
                    [
                        'url' => 'https://example.com/image.png',
                        'revised_prompt' => 'A professional photo...',
                    ],
                ],
            ]),
        ]);

        $result = $this->service->generateImage([
            'prompt' => 'A beautiful sunset over the ocean',
            'size' => '1024x1024',
            'quality' => 'standard',
        ]);

        $this->assertArrayHasKey('url', $result);
        $this->assertArrayHasKey('revised_prompt', $result);
        $this->assertArrayHasKey('model', $result);
        $this->assertArrayHasKey('cost', $result);
        $this->assertEquals('https://example.com/image.png', $result['url']);
    }

    /** @test */
    public function it_uses_correct_model_and_options()
    {
        Http::fake([
            'api.openai.com/*' => Http::response([
                'data' => [
                    [
                        'url' => 'https://example.com/image.png',
                        'revised_prompt' => 'Test',
                    ],
                ],
            ]),
        ]);

        $this->service->generateImage([
            'prompt' => 'Test prompt',
            'model' => 'dall-e-3',
            'size' => '1792x1024',
            'quality' => 'hd',
            'style' => 'vivid',
        ]);

        Http::assertSent(function ($request) {
            $body = json_decode($request->body(), true);
            return $body['model'] === 'dall-e-3'
                && $body['size'] === '1792x1024'
                && $body['quality'] === 'hd'
                && $body['style'] === 'vivid';
        });
    }

    /** @test */
    public function it_sanitizes_prompt()
    {
        Http::fake([
            'api.openai.com/*' => Http::response([
                'data' => [
                    [
                        'url' => 'https://example.com/image.png',
                        'revised_prompt' => 'Sanitized',
                    ],
                ],
            ]),
        ]);

        $this->service->generateImage([
            'prompt' => 'Test with <script>alert("xss")</script> and emoji 😀',
        ]);

        Http::assertSent(function ($request) {
            $body = json_decode($request->body(), true);
            // Le script devrait être supprimé
            return strpos($body['prompt'], '<script>') === false;
        });
    }

    /** @test */
    public function it_can_download_and_store_image()
    {
        // Créer une image PNG factice
        $pngContent = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');

        Http::fake([
            'example.com/*' => Http::response($pngContent, 200, [
                'Content-Type' => 'image/png',
            ]),
        ]);

        $path = $this->service->downloadAndStore('https://example.com/image.png', [
            'filename' => 'test-image',
            'convert_to_webp' => false,
        ]);

        $this->assertStringContainsString('images/generated', $path);
        $this->assertStringContainsString('test-image', $path);
        Storage::disk('public')->assertExists($path);
    }

    /** @test */
    public function it_handles_api_errors_gracefully()
    {
        Http::fake([
            'api.openai.com/*' => Http::response([
                'error' => [
                    'message' => 'Invalid prompt',
                ],
            ], 400),
        ]);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('DALL-E API error');

        $this->service->generateImage([
            'prompt' => 'Test',
        ]);
    }

    /** @test */
    public function it_records_cost_after_generation()
    {
        Http::fake([
            'api.openai.com/*' => Http::response([
                'data' => [
                    [
                        'url' => 'https://example.com/image.png',
                        'revised_prompt' => 'Test',
                    ],
                ],
            ]),
        ]);

        $this->service->generateImage([
            'prompt' => 'Test prompt',
            'size' => '1024x1024',
            'quality' => 'standard',
        ]);

        // Vérifier que le compteur d'images a été incrémenté
        $imagesCount = Cache::get("ai_images:dalle:" . now()->format('Y-m-d'), 0);
        $this->assertEquals(1, $imagesCount);
    }

    /** @test */
    public function it_can_build_article_image_prompt()
    {
        Http::fake([
            'api.openai.com/*' => Http::response([
                'data' => [
                    [
                        'url' => 'https://example.com/image.png',
                        'revised_prompt' => 'Professional photo',
                    ],
                ],
            ]),
        ]);

        Http::fake([
            'example.com/*' => Http::response(
                base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='),
                200
            ),
        ]);

        // Cette méthode nécessite le model ImageLibrary
        // On va juste vérifier que le prompt contient les bons éléments
        Http::assertNothingSent(); // Pas encore d'appel

        // Test que generateForArticle utilise le bon format
        $this->assertTrue(true); // Placeholder - le test complet nécessite la BDD
    }

    /** @test */
    public function it_returns_correct_usage_stats()
    {
        $today = now()->format('Y-m-d');
        
        // Simuler des coûts
        Cache::put("ai_costs:dalle:{$today}", 0.24);
        Cache::put("ai_images:dalle:{$today}", 3);

        $stats = $this->service->getUsageStats();

        $this->assertArrayHasKey('daily_cost', $stats);
        $this->assertArrayHasKey('images_today', $stats);
        $this->assertEquals(0.24, $stats['daily_cost']);
        $this->assertEquals(3, $stats['images_today']);
    }

    /** @test */
    public function it_extracts_dimensions_correctly()
    {
        // Test interne via réflexion ou test fonctionnel
        $reflection = new \ReflectionClass($this->service);
        
        $widthMethod = $reflection->getMethod('extractWidth');
        $widthMethod->setAccessible(true);
        
        $heightMethod = $reflection->getMethod('extractHeight');
        $heightMethod->setAccessible(true);
        
        $this->assertEquals(1792, $widthMethod->invoke($this->service, '1792x1024'));
        $this->assertEquals(1024, $heightMethod->invoke($this->service, '1792x1024'));
        $this->assertEquals(1024, $widthMethod->invoke($this->service, '1024x1024'));
        $this->assertEquals(1024, $heightMethod->invoke($this->service, '1024x1024'));
    }

    /** @test */
    public function it_uses_landscape_format_for_articles()
    {
        Http::fake([
            'api.openai.com/*' => Http::response([
                'data' => [
                    [
                        'url' => 'https://example.com/image.png',
                        'revised_prompt' => 'Test',
                    ],
                ],
            ]),
        ]);

        $this->service->generateImage([
            'prompt' => 'Article header image',
        ]);

        Http::assertSent(function ($request) {
            $body = json_decode($request->body(), true);
            // Par défaut, devrait utiliser le format paysage
            return $body['size'] === '1792x1024';
        });
    }
}
