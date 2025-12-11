<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class UsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates admin and test users
     */
    public function run(): void
    {
        $now = Carbon::now();
        
        $users = [
            [
                'name' => 'Williams Jullin',
                'email' => 'williams@sos-expat.com',
                'password' => Hash::make('admin123456'),
                'email_verified_at' => $now,
                'role' => 'super_admin',
                'is_active' => true,
                'locale' => 'fr',
                'timezone' => 'Europe/Paris',
                'avatar' => null,
                'phone' => '+33612345678',
                'bio' => 'CEO et fondateur de SOS-Expat, Ulixai et Ulysse.AI',
                'last_login_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Admin User',
                'email' => 'admin@sos-expat.com',
                'password' => Hash::make('admin123456'),
                'email_verified_at' => $now,
                'role' => 'admin',
                'is_active' => true,
                'locale' => 'en',
                'timezone' => 'Europe/Paris',
                'avatar' => null,
                'phone' => '+33612345679',
                'bio' => 'Administrator',
                'last_login_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Editor User',
                'email' => 'editor@sos-expat.com',
                'password' => Hash::make('editor123456'),
                'email_verified_at' => $now,
                'role' => 'editor',
                'is_active' => true,
                'locale' => 'en',
                'timezone' => 'Europe/London',
                'avatar' => null,
                'phone' => '+441234567890',
                'bio' => 'Content Editor',
                'last_login_at' => $now->subDays(2),
                'created_at' => $now->subMonths(1),
                'updated_at' => $now->subDays(2),
            ],
            [
                'name' => 'Viewer User',
                'email' => 'viewer@sos-expat.com',
                'password' => Hash::make('viewer123456'),
                'email_verified_at' => $now,
                'role' => 'viewer',
                'is_active' => true,
                'locale' => 'es',
                'timezone' => 'Europe/Madrid',
                'avatar' => null,
                'phone' => '+34612345678',
                'bio' => 'Read-only viewer',
                'last_login_at' => $now->subDays(5),
                'created_at' => $now->subMonths(2),
                'updated_at' => $now->subDays(5),
            ],
            [
                'name' => 'Test User',
                'email' => 'test@sos-expat.com',
                'password' => Hash::make('test123456'),
                'email_verified_at' => $now,
                'role' => 'editor',
                'is_active' => false,
                'locale' => 'fr',
                'timezone' => 'America/New_York',
                'avatar' => null,
                'phone' => '+16175551234',
                'bio' => 'Test account - Inactive',
                'last_login_at' => null,
                'created_at' => $now->subMonths(3),
                'updated_at' => $now->subMonths(3),
            ],
        ];

        // Insert users
        foreach ($users as $user) {
            DB::table('users')->insert($user);
        }

        $this->command->info('✓ ' . count($users) . ' users created successfully');
        $this->command->line('');
        $this->command->line('Default credentials:');
        $this->command->line('  Super Admin:');
        $this->command->line('    Email: williams@sos-expat.com');
        $this->command->line('    Password: admin123456');
        $this->command->line('');
        $this->command->line('  Admin:');
        $this->command->line('    Email: admin@sos-expat.com');
        $this->command->line('    Password: admin123456');
        $this->command->line('');
        $this->command->line('  Editor:');
        $this->command->line('    Email: editor@sos-expat.com');
        $this->command->line('    Password: editor123456');
        $this->command->line('');
        $this->command->line('  Viewer:');
        $this->command->line('    Email: viewer@sos-expat.com');
        $this->command->line('    Password: viewer123456');
        $this->command->line('');
        $this->command->warn('⚠ IMPORTANT: Change these passwords in production!');
    }
}
