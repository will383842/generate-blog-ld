<?php

namespace Tests\Feature;

use App\Models\AdminUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MediaTest extends TestCase
{
    use RefreshDatabase;

    protected AdminUser $admin;

    protected function setUp(): void
    {
        parent::setUp();
        
        Storage::fake('public');
        
        $this->admin = AdminUser::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);
    }

    public function test_admin_can_list_media(): void
    {
        $token = $this->admin->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/admin/media');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data',
                'total',
                'current_page',
                'per_page',
                'last_page',
            ]);
    }

    public function test_admin_can_get_media_stats(): void
    {
        $token = $this->admin->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/admin/media/stats');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'total',
                    'by_type' => [
                        'image',
                        'video',
                        'document',
                        'audio',
                    ],
                    'total_size',
                    'recent_uploads',
                ],
            ]);
    }

    public function test_admin_can_get_folders(): void
    {
        $token = $this->admin->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/admin/media/folders');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'path',
                        'count',
                    ]
                ],
            ]);
    }

    public function test_admin_can_upload_image(): void
    {
        $token = $this->admin->createToken('test')->plainTextToken;

        $file = UploadedFile::fake()->image('test-image.jpg', 800, 600);

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/admin/media', [
                'file' => $file,
                'folder' => 'images',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Média uploadé avec succès',
            ])
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'path',
                    'url',
                    'type',
                    'size',
                ],
            ]);

        // Vérifier que le fichier existe
        $path = $response->json('data.path');
        Storage::disk('public')->assertExists($path);
    }

    public function test_admin_can_upload_document(): void
    {
        $token = $this->admin->createToken('test')->plainTextToken;

        $file = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/admin/media', [
                'file' => $file,
                'folder' => 'documents',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ]);

        $path = $response->json('data.path');
        Storage::disk('public')->assertExists($path);
    }

    public function test_upload_validates_file_size(): void
    {
        $token = $this->admin->createToken('test')->plainTextToken;

        // Fichier trop large (> 10MB)
        $file = UploadedFile::fake()->create('large-file.pdf', 11000, 'application/pdf');

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/admin/media', [
                'file' => $file,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_upload_requires_file(): void
    {
        $token = $this->admin->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/admin/media', [
                'folder' => 'images',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_admin_can_rename_media(): void
    {
        $token = $this->admin->createToken('test')->plainTextToken;

        // Upload un fichier d'abord
        $file = UploadedFile::fake()->image('original.jpg');
        
        $uploadResponse = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/admin/media', [
                'file' => $file,
                'folder' => 'images',
            ]);

        $mediaId = $uploadResponse->json('data.id');

        // Renommer
        $response = $this->withHeader('Authorization', "Bearer $token")
            ->putJson("/api/admin/media/{$mediaId}", [
                'name' => 'renamed-file.jpg',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Média renommé avec succès',
            ]);
    }

    public function test_admin_can_delete_media(): void
    {
        $token = $this->admin->createToken('test')->plainTextToken;

        // Upload un fichier d'abord
        $file = UploadedFile::fake()->image('to-delete.jpg');
        
        $uploadResponse = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/admin/media', [
                'file' => $file,
                'folder' => 'images',
            ]);

        $mediaId = $uploadResponse->json('data.id');
        $path = $uploadResponse->json('data.path');

        // Supprimer
        $response = $this->withHeader('Authorization', "Bearer $token")
            ->deleteJson("/api/admin/media/{$mediaId}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Média supprimé avec succès',
            ]);

        // Vérifier que le fichier n'existe plus
        Storage::disk('public')->assertMissing($path);
    }

    public function test_unauthenticated_user_cannot_upload(): void
    {
        $file = UploadedFile::fake()->image('test.jpg');

        $response = $this->postJson('/api/admin/media', [
            'file' => $file,
        ]);

        $response->assertStatus(401);
    }

    public function test_editor_role_cannot_upload(): void
    {
        $editor = AdminUser::factory()->create([
            'role' => 'editor',
            'is_active' => true,
        ]);

        $token = $editor->createToken('test')->plainTextToken;
        $file = UploadedFile::fake()->image('test.jpg');

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/admin/media', [
                'file' => $file,
            ]);

        // Editor n'a pas les droits admin
        $response->assertStatus(403);
    }
}
