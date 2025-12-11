<?php

namespace Tests\Feature;

use App\Models\AdminUser;
use App\Models\Article;
use App\Models\Country;
use App\Models\Language;
use App\Models\Platform;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ArticleTest extends TestCase
{
    use RefreshDatabase;

    protected AdminUser $admin;
    protected Platform $platform;
    protected Country $country;
    protected Language $language;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Seed nécessaire
        $this->artisan('db:seed', ['--class' => 'LanguageSeeder']);
        $this->artisan('db:seed', ['--class' => 'CountrySeeder']);
        $this->artisan('db:seed', ['--class' => 'PlatformSeeder']);
        
        $this->admin = AdminUser::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);
        
        $this->platform = Platform::first();
        $this->country = Country::first();
        $this->language = Language::first();
    }

    public function test_admin_can_list_articles(): void
    {
        Article::factory()->count(5)->create([
            'platform_id' => $this->platform->id,
        ]);

        $token = $this->admin->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/admin/articles');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'title',
                        'slug',
                        'status',
                        'type',
                    ]
                ],
                'meta',
            ]);
    }

    public function test_admin_can_view_single_article(): void
    {
        $article = Article::factory()->create([
            'platform_id' => $this->platform->id,
            'title' => 'Test Article',
        ]);

        $token = $this->admin->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->getJson("/api/admin/articles/{$article->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $article->id,
                    'title' => 'Test Article',
                ],
            ]);
    }

    public function test_admin_can_create_article(): void
    {
        $token = $this->admin->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/admin/articles', [
                'platform_id' => $this->platform->id,
                'country_id' => $this->country->id,
                'language_id' => $this->language->id,
                'type' => 'article',
                'title' => 'New Article',
                'content' => 'Article content here',
                'meta_description' => 'Meta description',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('articles', [
            'title' => 'New Article',
            'type' => 'article',
        ]);
    }

    public function test_admin_can_update_article(): void
    {
        $article = Article::factory()->create([
            'platform_id' => $this->platform->id,
            'title' => 'Original Title',
        ]);

        $token = $this->admin->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->putJson("/api/admin/articles/{$article->id}", [
                'title' => 'Updated Title',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('articles', [
            'id' => $article->id,
            'title' => 'Updated Title',
        ]);
    }

    public function test_admin_can_publish_article(): void
    {
        $article = Article::factory()->create([
            'platform_id' => $this->platform->id,
            'status' => 'draft',
        ]);

        $token = $this->admin->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson("/api/admin/articles/{$article->id}/publish");

        $response->assertStatus(200);

        $this->assertDatabaseHas('articles', [
            'id' => $article->id,
            'status' => 'published',
        ]);
    }

    public function test_admin_can_unpublish_article(): void
    {
        $article = Article::factory()->create([
            'platform_id' => $this->platform->id,
            'status' => 'published',
        ]);

        $token = $this->admin->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson("/api/admin/articles/{$article->id}/unpublish");

        $response->assertStatus(200);

        $this->assertDatabaseHas('articles', [
            'id' => $article->id,
            'status' => 'draft',
        ]);
    }

    public function test_super_admin_can_delete_article(): void
    {
        $superAdmin = AdminUser::factory()->create([
            'role' => 'super_admin',
            'is_active' => true,
        ]);

        $article = Article::factory()->create([
            'platform_id' => $this->platform->id,
        ]);

        $token = $superAdmin->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->deleteJson("/api/admin/articles/{$article->id}");

        $response->assertStatus(200);

        $this->assertSoftDeleted('articles', [
            'id' => $article->id,
        ]);
    }

    public function test_regular_admin_cannot_delete_article(): void
    {
        $article = Article::factory()->create([
            'platform_id' => $this->platform->id,
        ]);

        $token = $this->admin->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->deleteJson("/api/admin/articles/{$article->id}");

        $response->assertStatus(403);
    }

    public function test_articles_can_be_filtered_by_status(): void
    {
        Article::factory()->create([
            'platform_id' => $this->platform->id,
            'status' => 'published',
        ]);
        
        Article::factory()->create([
            'platform_id' => $this->platform->id,
            'status' => 'draft',
        ]);

        $token = $this->admin->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/admin/articles?status=published');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_articles_pagination_works(): void
    {
        Article::factory()->count(30)->create([
            'platform_id' => $this->platform->id,
        ]);

        $token = $this->admin->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/admin/articles?per_page=10&page=1');

        $response->assertStatus(200)
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('meta.total', 30)
            ->assertJsonPath('meta.last_page', 3);
    }
}
