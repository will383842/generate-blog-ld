<?php

namespace Tests\Unit\Services\AI;

use Tests\TestCase;
use App\Services\AI\GptService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Foundation\Testing\RefreshDatabase;

class GptServiceTest extends TestCase
{
    use RefreshDatabase;

    protected GptService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new GptService();
    }

    /** @test */
    public function it_can_check_availability()
    {
        // Si la clé API n'est pas configurée
        config(['services.openai.api_key' => null]);
        $service = new GptService();
        $this->assertFalse($service->isAvailable());

        // Avec clé API
        config(['services.openai.api_key' => 'test-key']);
        $service = new GptService();
        $this->assertTrue($service->isAvailable());
    }

    /** @test */
    public function it_returns_correct_service_name()
    {
        $this->assertEquals('openai', $this->service->getServiceName());
    }

    /** @test */
    public function it_can_estimate_cost()
    {
        $cost = $this->service->estimateCost('chat', [
            'model' => 'gpt-4o-mini',
            'input_tokens' => 1000,
            'output_tokens' => 500,
        ]);

        // gpt-4o-mini: input=$0.00015/1K, output=$0.0006/1K
        // 1000 * 0.00015 + 500 * 0.0006 = 0.00015 + 0.0003 = 0.00045
        $this->assertEquals(0.00045, $cost);
    }

    /** @test */
    public function it_can_generate_content_with_mocked_api()
    {
        Http::fake([
            'api.openai.com/*' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => json_encode([
                                'title' => 'Test Article Title',
                                'excerpt' => 'Test excerpt',
                                'content' => '<p>Test content</p>',
                                'word_count' => 100,
                                'key_points' => ['point 1', 'point 2'],
                            ]),
                        ],
                    ],
                ],
                'usage' => [
                    'prompt_tokens' => 100,
                    'completion_tokens' => 200,
                    'total_tokens' => 300,
                ],
            ], 200),
        ]);

        config(['services.openai.api_key' => 'test-key']);
        $service = new GptService();

        $result = $service->generateContent([
            'theme' => 'Visa',
            'country' => 'France',
            'country_in' => 'en France',
            'language' => 'fr',
        ]);

        $this->assertArrayHasKey('title', $result);
        $this->assertArrayHasKey('content', $result);
        $this->assertEquals('Test Article Title', $result['title']);

        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'chat/completions');
        });
    }

    /** @test */
    public function it_can_translate_text_with_mocked_api()
    {
        Http::fake([
            'api.openai.com/*' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => 'This is a translation',
                        ],
                    ],
                ],
                'usage' => [
                    'prompt_tokens' => 50,
                    'completion_tokens' => 20,
                    'total_tokens' => 70,
                ],
            ], 200),
        ]);

        config(['services.openai.api_key' => 'test-key']);
        $service = new GptService();

        $result = $service->translateText('Ceci est un test', 'en', 'fr');

        $this->assertEquals('This is a translation', $result);
    }

    /** @test */
    public function it_can_generate_meta_tags()
    {
        Http::fake([
            'api.openai.com/*' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => json_encode([
                                'meta_title' => 'Test Meta Title',
                                'meta_description' => 'Test meta description for SEO',
                                'focus_keyword' => 'test keyword',
                                'secondary_keywords' => ['keyword 1', 'keyword 2'],
                            ]),
                        ],
                    ],
                ],
                'usage' => [
                    'prompt_tokens' => 100,
                    'completion_tokens' => 50,
                    'total_tokens' => 150,
                ],
            ], 200),
        ]);

        config(['services.openai.api_key' => 'test-key']);
        $service = new GptService();

        $result = $service->generateMeta([
            'title' => 'Test Article',
            'content' => 'Lorem ipsum dolor sit amet...',
            'language' => 'fr',
        ]);

        $this->assertArrayHasKey('meta_title', $result);
        $this->assertArrayHasKey('meta_description', $result);
        $this->assertEquals('Test Meta Title', $result['meta_title']);
    }

    /** @test */
    public function it_can_generate_faqs()
    {
        Http::fake([
            'api.openai.com/*' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => json_encode([
                                'faqs' => [
                                    ['question' => 'Question 1?', 'answer' => 'Answer 1'],
                                    ['question' => 'Question 2?', 'answer' => 'Answer 2'],
                                ],
                            ]),
                        ],
                    ],
                ],
                'usage' => [
                    'prompt_tokens' => 200,
                    'completion_tokens' => 150,
                    'total_tokens' => 350,
                ],
            ], 200),
        ]);

        config(['services.openai.api_key' => 'test-key']);
        $service = new GptService();

        $result = $service->generateFaqs([
            'title' => 'Test Article',
            'content' => 'Lorem ipsum...',
            'count' => 2,
        ]);

        $this->assertCount(2, $result);
        $this->assertEquals('Question 1?', $result[0]['question']);
    }

    /** @test */
    public function it_uses_correct_model_for_translation()
    {
        Http::fake([
            'api.openai.com/*' => Http::response([
                'choices' => [['message' => ['content' => 'Translated']]],
                'usage' => ['prompt_tokens' => 10, 'completion_tokens' => 5, 'total_tokens' => 15],
            ], 200),
        ]);

        config(['services.openai.api_key' => 'test-key']);
        $service = new GptService();

        $service->translateText('Test', 'en', 'fr');

        Http::assertSent(function ($request) {
            $body = json_decode($request->body(), true);
            // Doit utiliser gpt-4o-mini pour les traductions (99% moins cher)
            return $body['model'] === 'gpt-4o-mini';
        });
    }

    /** @test */
    public function it_handles_api_errors_gracefully()
    {
        Http::fake([
            'api.openai.com/*' => Http::response([
                'error' => ['message' => 'Rate limit exceeded'],
            ], 429),
        ]);

        config(['services.openai.api_key' => 'test-key']);
        $service = new GptService();

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('OpenAI API error');

        $service->chat([
            'messages' => [['role' => 'user', 'content' => 'Test']],
        ]);
    }

    /** @test */
    public function it_estimates_tokens_correctly()
    {
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('estimateTokens');
        $method->setAccessible(true);

        // ~100 caractères = ~28 tokens
        $text = str_repeat('a', 100);
        $tokens = $method->invoke($this->service, $text);
        
        $this->assertGreaterThan(20, $tokens);
        $this->assertLessThan(40, $tokens);
    }

    /** @test */
    public function it_parses_json_response_correctly()
    {
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('parseJsonResponse');
        $method->setAccessible(true);

        // JSON simple
        $result = $method->invoke($this->service, '{"key": "value"}');
        $this->assertEquals(['key' => 'value'], $result);

        // JSON avec markdown
        $result = $method->invoke($this->service, "```json\n{\"key\": \"value\"}\n```");
        $this->assertEquals(['key' => 'value'], $result);
    }
}