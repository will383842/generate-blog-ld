<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AdminUser;
use Illuminate\Support\Facades\Hash;

class AdminUsersSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'Super Admin',
                'email' => 'admin@sos-expat.com',
                'password' => Hash::make('Admin@2025!'),
                'role' => 'super_admin',
                'timezone' => 'Europe/Paris',
                'locale' => 'fr',
                'is_active' => true,
            ],
            [
                'name' => 'Admin',
                'email' => 'admin2@sos-expat.com',
                'password' => Hash::make('Admin@2025!'),
                'role' => 'admin',
                'timezone' => 'Europe/Paris',
                'locale' => 'fr',
                'is_active' => true,
            ],
            [
                'name' => 'Éditeur',
                'email' => 'editor@sos-expat.com',
                'password' => Hash::make('Editor@2025!'),
                'role' => 'editor',
                'timezone' => 'Europe/Paris',
                'locale' => 'fr',
                'is_active' => true,
            ],
        ];

        foreach ($users as $userData) {
            AdminUser::firstOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }
    }
}
