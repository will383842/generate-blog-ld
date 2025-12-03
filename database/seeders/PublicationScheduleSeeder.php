<?php

namespace Database\Seeders;

use App\Models\PublicationSchedule;
use App\Models\Platform;
use Illuminate\Database\Seeder;

class PublicationScheduleSeeder extends Seeder
{
    public function run(): void
    {
        $platforms = Platform::all();

        foreach ($platforms as $platform) {
            PublicationSchedule::updateOrCreate(
                ['platform_id' => $platform->id],
                [
                    'articles_per_day' => 100,
                    'max_per_hour' => 15,
                    'active_hours' => [9, 10, 11, 14, 15, 16, 17], // 9h-11h + 14h-17h
                    'active_days' => [1, 2, 3, 4, 5], // Lundi à Vendredi
                    'min_interval_minutes' => 6,
                    'timezone' => 'Europe/Paris',
                    'is_active' => true,
                    'pause_on_error' => true,
                    'max_errors_before_pause' => 5,
                ]
            );
        }

        $this->command->info('✓ ' . $platforms->count() . ' configurations de publication créées');
    }
}
