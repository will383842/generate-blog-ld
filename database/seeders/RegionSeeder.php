<?php

namespace Database\Seeders;

use App\Models\Region;
use Illuminate\Database\Seeder;

class RegionSeeder extends Seeder
{
    public function run(): void
    {
        $regions = [
            ['name' => 'Europe', 'code' => 'europe', 'order' => 1],                    // ✅ 'europe' au lieu de 'EU'
            ['name' => 'Amérique du Nord', 'code' => 'north-america', 'order' => 2],  // ✅ 'north-america' au lieu de 'NA'
            ['name' => 'Amérique du Sud', 'code' => 'south-america', 'order' => 3],   // ✅ 'south-america' au lieu de 'SA'
            ['name' => 'Asie', 'code' => 'asia', 'order' => 4],                       // ✅ 'asia' au lieu de 'AS'
            ['name' => 'Afrique', 'code' => 'africa', 'order' => 5],                  // ✅ 'africa' au lieu de 'AF'
            ['name' => 'Océanie', 'code' => 'oceania', 'order' => 6],                 // ✅ 'oceania' au lieu de 'OC'
            ['name' => 'Moyen-Orient', 'code' => 'middle-east', 'order' => 7],        // ✅ 'middle-east' au lieu de 'ME'
        ];

        foreach ($regions as $region) {
            Region::updateOrCreate(
                ['code' => $region['code']],
                $region
            );
        }
    }
}