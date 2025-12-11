<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RolesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates roles and permissions for the system
     */
    public function run(): void
    {
        $now = Carbon::now();
        
        // Define roles with their permissions
        $roles = [
            [
                'name' => 'Super Admin',
                'slug' => 'super_admin',
                'description' => 'Full system access with all permissions',
                'is_active' => true,
                'level' => 100,
                'permissions' => [
                    // Users & Roles
                    'users.view', 'users.create', 'users.edit', 'users.delete',
                    'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
                    
                    // Content
                    'content.view', 'content.create', 'content.edit', 'content.delete', 'content.publish',
                    
                    // Platforms
                    'platforms.view', 'platforms.create', 'platforms.edit', 'platforms.delete', 'platforms.configure',
                    
                    // Settings
                    'settings.view', 'settings.edit', 'settings.advanced',
                    
                    // API Keys
                    'api-keys.view', 'api-keys.create', 'api-keys.edit', 'api-keys.delete',
                    
                    // Countries
                    'countries.view', 'countries.create', 'countries.edit', 'countries.delete',
                    
                    // Analytics
                    'analytics.view', 'analytics.export',
                    
                    // System
                    'system.view', 'system.configure', 'system.maintenance',
                    
                    // Workers
                    'workers.view', 'workers.manage', 'workers.logs',
                    
                    // Monitoring
                    'monitoring.view', 'monitoring.alerts',
                ],
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Admin',
                'slug' => 'admin',
                'description' => 'Administrative access with most permissions',
                'is_active' => true,
                'level' => 80,
                'permissions' => [
                    // Users (limited)
                    'users.view', 'users.create', 'users.edit',
                    
                    // Content
                    'content.view', 'content.create', 'content.edit', 'content.delete', 'content.publish',
                    
                    // Platforms
                    'platforms.view', 'platforms.edit', 'platforms.configure',
                    
                    // Settings (limited)
                    'settings.view', 'settings.edit',
                    
                    // API Keys (limited)
                    'api-keys.view', 'api-keys.edit',
                    
                    // Countries
                    'countries.view', 'countries.edit',
                    
                    // Analytics
                    'analytics.view', 'analytics.export',
                    
                    // Workers
                    'workers.view', 'workers.manage',
                    
                    // Monitoring
                    'monitoring.view', 'monitoring.alerts',
                ],
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Editor',
                'slug' => 'editor',
                'description' => 'Content creation and editing permissions',
                'is_active' => true,
                'level' => 50,
                'permissions' => [
                    // Content
                    'content.view', 'content.create', 'content.edit', 'content.publish',
                    
                    // Platforms (view only)
                    'platforms.view',
                    
                    // Countries (view only)
                    'countries.view',
                    
                    // Analytics (view only)
                    'analytics.view',
                    
                    // Monitoring (view only)
                    'monitoring.view',
                ],
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Viewer',
                'slug' => 'viewer',
                'description' => 'Read-only access to content and analytics',
                'is_active' => true,
                'level' => 20,
                'permissions' => [
                    // Content (view only)
                    'content.view',
                    
                    // Platforms (view only)
                    'platforms.view',
                    
                    // Countries (view only)
                    'countries.view',
                    
                    // Analytics (view only)
                    'analytics.view',
                    
                    // Monitoring (view only)
                    'monitoring.view',
                ],
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Content Manager',
                'slug' => 'content_manager',
                'description' => 'Advanced content management permissions',
                'is_active' => true,
                'level' => 60,
                'permissions' => [
                    // Content
                    'content.view', 'content.create', 'content.edit', 'content.delete', 'content.publish',
                    
                    // Platforms
                    'platforms.view', 'platforms.configure',
                    
                    // Countries
                    'countries.view', 'countries.edit',
                    
                    // Analytics
                    'analytics.view', 'analytics.export',
                    
                    // Workers (view only)
                    'workers.view',
                    
                    // Monitoring
                    'monitoring.view',
                ],
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        // Insert roles and their permissions
        foreach ($roles as $roleData) {
            $permissions = $roleData['permissions'];
            unset($roleData['permissions']);
            
            // Insert role
            $roleId = DB::table('roles')->insertGetId($roleData);
            
            // Insert permissions
            foreach ($permissions as $permission) {
                DB::table('permissions')->insert([
                    'role_id' => $roleId,
                    'permission' => $permission,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
            
            $this->command->info("✓ Role '{$roleData['name']}' created with " . count($permissions) . " permissions");
        }

        $this->command->line('');
        $this->command->info('✓ All roles and permissions created successfully');
        $this->command->line('');
        $this->command->line('Role hierarchy:');
        $this->command->line('  1. Super Admin (level 100) - Full access');
        $this->command->line('  2. Admin (level 80) - Most permissions');
        $this->command->line('  3. Content Manager (level 60) - Content management');
        $this->command->line('  4. Editor (level 50) - Content editing');
        $this->command->line('  5. Viewer (level 20) - Read-only');
    }
}
