<?php

namespace Database\Seeders;

use App\Models\Timezone;
use Illuminate\Database\Seeder;

class TimezoneSeeder extends Seeder
{
    public function run(): void
    {
        $timezones = [
            // Europe
            ['name' => 'Europe/Paris', 'offset_utc' => '+01:00', 'offset_minutes' => 60, 'abbreviation' => 'CET'],
            ['name' => 'Europe/London', 'offset_utc' => '+00:00', 'offset_minutes' => 0, 'abbreviation' => 'GMT'],
            ['name' => 'Europe/Berlin', 'offset_utc' => '+01:00', 'offset_minutes' => 60, 'abbreviation' => 'CET'],
            ['name' => 'Europe/Madrid', 'offset_utc' => '+01:00', 'offset_minutes' => 60, 'abbreviation' => 'CET'],
            ['name' => 'Europe/Rome', 'offset_utc' => '+01:00', 'offset_minutes' => 60, 'abbreviation' => 'CET'],
            ['name' => 'Europe/Lisbon', 'offset_utc' => '+00:00', 'offset_minutes' => 0, 'abbreviation' => 'WET'],
            ['name' => 'Europe/Amsterdam', 'offset_utc' => '+01:00', 'offset_minutes' => 60, 'abbreviation' => 'CET'],
            ['name' => 'Europe/Brussels', 'offset_utc' => '+01:00', 'offset_minutes' => 60, 'abbreviation' => 'CET'],
            ['name' => 'Europe/Moscow', 'offset_utc' => '+03:00', 'offset_minutes' => 180, 'abbreviation' => 'MSK'],
            ['name' => 'Europe/Istanbul', 'offset_utc' => '+03:00', 'offset_minutes' => 180, 'abbreviation' => 'TRT'],
            ['name' => 'Europe/Athens', 'offset_utc' => '+02:00', 'offset_minutes' => 120, 'abbreviation' => 'EET'],
            ['name' => 'Europe/Warsaw', 'offset_utc' => '+01:00', 'offset_minutes' => 60, 'abbreviation' => 'CET'],
            
            // Asie
            ['name' => 'Asia/Bangkok', 'offset_utc' => '+07:00', 'offset_minutes' => 420, 'abbreviation' => 'ICT'],
            ['name' => 'Asia/Singapore', 'offset_utc' => '+08:00', 'offset_minutes' => 480, 'abbreviation' => 'SGT'],
            ['name' => 'Asia/Hong_Kong', 'offset_utc' => '+08:00', 'offset_minutes' => 480, 'abbreviation' => 'HKT'],
            ['name' => 'Asia/Shanghai', 'offset_utc' => '+08:00', 'offset_minutes' => 480, 'abbreviation' => 'CST'],
            ['name' => 'Asia/Tokyo', 'offset_utc' => '+09:00', 'offset_minutes' => 540, 'abbreviation' => 'JST'],
            ['name' => 'Asia/Seoul', 'offset_utc' => '+09:00', 'offset_minutes' => 540, 'abbreviation' => 'KST'],
            ['name' => 'Asia/Dubai', 'offset_utc' => '+04:00', 'offset_minutes' => 240, 'abbreviation' => 'GST'],
            ['name' => 'Asia/Kolkata', 'offset_utc' => '+05:30', 'offset_minutes' => 330, 'abbreviation' => 'IST'],
            ['name' => 'Asia/Ho_Chi_Minh', 'offset_utc' => '+07:00', 'offset_minutes' => 420, 'abbreviation' => 'ICT'],
            ['name' => 'Asia/Jakarta', 'offset_utc' => '+07:00', 'offset_minutes' => 420, 'abbreviation' => 'WIB'],
            ['name' => 'Asia/Manila', 'offset_utc' => '+08:00', 'offset_minutes' => 480, 'abbreviation' => 'PHT'],
            ['name' => 'Asia/Kuala_Lumpur', 'offset_utc' => '+08:00', 'offset_minutes' => 480, 'abbreviation' => 'MYT'],
            
            // Amériques
            ['name' => 'America/New_York', 'offset_utc' => '-05:00', 'offset_minutes' => -300, 'abbreviation' => 'EST'],
            ['name' => 'America/Los_Angeles', 'offset_utc' => '-08:00', 'offset_minutes' => -480, 'abbreviation' => 'PST'],
            ['name' => 'America/Chicago', 'offset_utc' => '-06:00', 'offset_minutes' => -360, 'abbreviation' => 'CST'],
            ['name' => 'America/Toronto', 'offset_utc' => '-05:00', 'offset_minutes' => -300, 'abbreviation' => 'EST'],
            ['name' => 'America/Vancouver', 'offset_utc' => '-08:00', 'offset_minutes' => -480, 'abbreviation' => 'PST'],
            ['name' => 'America/Mexico_City', 'offset_utc' => '-06:00', 'offset_minutes' => -360, 'abbreviation' => 'CST'],
            ['name' => 'America/Sao_Paulo', 'offset_utc' => '-03:00', 'offset_minutes' => -180, 'abbreviation' => 'BRT'],
            ['name' => 'America/Buenos_Aires', 'offset_utc' => '-03:00', 'offset_minutes' => -180, 'abbreviation' => 'ART'],
            ['name' => 'America/Lima', 'offset_utc' => '-05:00', 'offset_minutes' => -300, 'abbreviation' => 'PET'],
            ['name' => 'America/Bogota', 'offset_utc' => '-05:00', 'offset_minutes' => -300, 'abbreviation' => 'COT'],
            
            // Afrique
            ['name' => 'Africa/Cairo', 'offset_utc' => '+02:00', 'offset_minutes' => 120, 'abbreviation' => 'EET'],
            ['name' => 'Africa/Johannesburg', 'offset_utc' => '+02:00', 'offset_minutes' => 120, 'abbreviation' => 'SAST'],
            ['name' => 'Africa/Lagos', 'offset_utc' => '+01:00', 'offset_minutes' => 60, 'abbreviation' => 'WAT'],
            ['name' => 'Africa/Casablanca', 'offset_utc' => '+01:00', 'offset_minutes' => 60, 'abbreviation' => 'WEST'],
            ['name' => 'Africa/Nairobi', 'offset_utc' => '+03:00', 'offset_minutes' => 180, 'abbreviation' => 'EAT'],
            
            // Océanie
            ['name' => 'Australia/Sydney', 'offset_utc' => '+11:00', 'offset_minutes' => 660, 'abbreviation' => 'AEDT'],
            ['name' => 'Australia/Melbourne', 'offset_utc' => '+11:00', 'offset_minutes' => 660, 'abbreviation' => 'AEDT'],
            ['name' => 'Australia/Perth', 'offset_utc' => '+08:00', 'offset_minutes' => 480, 'abbreviation' => 'AWST'],
            ['name' => 'Pacific/Auckland', 'offset_utc' => '+13:00', 'offset_minutes' => 780, 'abbreviation' => 'NZDT'],
            
            // UTC
            ['name' => 'UTC', 'offset_utc' => '+00:00', 'offset_minutes' => 0, 'abbreviation' => 'UTC'],
        ];

        foreach ($timezones as $timezone) {
            Timezone::updateOrCreate(
                ['name' => $timezone['name']],
                $timezone
            );
        }

        $this->command->info('✓ ' . count($timezones) . ' timezones créés');
    }
}
