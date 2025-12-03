<?php

namespace Database\Seeders;

use App\Models\AdminUser;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        // Compte administrateur principal
        AdminUser::updateOrCreate(
            ['email' => 'admin@content-engine.local'],
            [
                'name' => 'Williams',
                'password' => Hash::make('admin123!'),
                'role' => 'super_admin', // ✅ CORRIGÉ : Ajout du rôle super_admin
                'is_active' => true,
                'last_login_at' => null,
            ]
        );
        
        // Compte de développement secondaire
        AdminUser::updateOrCreate(
            ['email' => 'dev@content-engine.local'],
            [
                'name' => 'Dev User',
                'password' => Hash::make('dev123!'),
                'role' => 'admin', // Rôle admin pour le dev
                'is_active' => true,
                'last_login_at' => null,
            ]
        );
    }
}