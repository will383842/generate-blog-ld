<?php

namespace Database\Seeders;

use App\Models\AdminUser;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * AdminUserSeeder - Création des comptes administrateurs
 * 
 * PRODUCTION READY:
 * - Le compte principal Williams est TOUJOURS créé
 * - Le compte dev est créé UNIQUEMENT en environnement local/development/staging
 * - En production, seul le compte Williams existe
 */
class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        // =====================================================================
        // COMPTE PRINCIPAL - Williams (TOUJOURS CRÉÉ)
        // =====================================================================
        AdminUser::updateOrCreate(
            ['email' => 'williamsjullin@gmail.com'],
            [
                'name' => 'Williams Jullin',
                'password' => Hash::make('MJullin2006/*%'),
                'role' => 'super_admin',
                'is_active' => true,
                'last_login_at' => null,
            ]
        );
        
        $this->command->info('✅ Compte super_admin créé: williamsjullin@gmail.com');
        
        // =====================================================================
        // COMPTE DEV - Uniquement en environnement de développement
        // =====================================================================
        // Ce compte n'est PAS créé en production (APP_ENV=production)
        // Il est créé uniquement pour faciliter le développement local
        if (app()->environment('local', 'development', 'staging')) {
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
            
            $this->command->info('🔧 Compte dev créé: dev@content-engine.local (environnement: ' . app()->environment() . ')');
        } else {
            $this->command->info('🔒 Compte dev NON créé (environnement production)');
        }
        
        // Résumé
        $this->command->info('');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('  COMPTES ADMIN CRÉÉS');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('  📧 williamsjullin@gmail.com (super_admin)');
        
        if (app()->environment('local', 'development', 'staging')) {
            $this->command->info('  📧 dev@content-engine.local (admin) [DEV ONLY]');
        }
        
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('');
    }
}