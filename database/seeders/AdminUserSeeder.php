<?php

namespace Database\Seeders;

use App\Models\AdminUser;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        // ✅ TON COMPTE PRINCIPAL
        AdminUser::updateOrCreate(
            ['email' => 'williamsjullin@gmail.com'],
            [
                'name' => 'Williams Jullin',
                'password' => Hash::make('11111111'),
                'role' => 'super_admin',
                'is_active' => true,
                'last_login_at' => null,
            ]
        );
        
        // Compte de développement secondaire (optionnel)
        AdminUser::updateOrCreate(
            ['email' => 'dev@content-engine.local'],
            [
                'name' => 'Dev User',
                'password' => Hash::make('dev123!'),
                'role' => 'admin',
                'is_active' => true,
                'last_login_at' => null,
            ]
        );
    }
}