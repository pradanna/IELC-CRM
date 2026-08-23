<?php

namespace Database\Seeders;

use App\Domains\Finance\Domain\Models\PriceMaster;
use Illuminate\Database\Seeder;

class PriceMasterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $packages = [
            [
                'name' => 'Group',
                'price_per_session' => 3300000, // 24 sesi x 137.500
            ],
            [
                'name' => 'Group Class Promo Semarang - 3 Bulan',
                'price_per_session' => 1000000, // 24 sesi x 41.667
            ],
            [
                'name' => 'Private',
                'price_per_session' => 9600000, // 24 sesi x 400.000 (standard cycle)
            ],
            [
                'name' => 'Private Class Promo Semarang',
                'price_per_session' => 7200000, // 24 sesi x 300.000
            ],
            [
                'name' => 'IELTS Prep - Express / Starter (5 Sesi)',
                'price_per_session' => 3000000, // 5 sesi x 600.000
            ],
            [
                'name' => 'IELTS Prep - Intermediate (10 Sesi)',
                'price_per_session' => 5000000, // 10 sesi x 500.000
            ],
            [
                'name' => 'IELTS Prep - Intensive / Advanced (20 Sesi)',
                'price_per_session' => 9000000, // 20 sesi x 450.000
            ],
            [
                'name' => 'IELTS Prep - Master / Ultimate (40 Sesi)',
                'price_per_session' => 14000000, // 40 sesi x 350.000
            ],
            [
                'name' => 'TOEFL Prep - Express / Basic (5 Sesi)',
                'price_per_session' => 3000000, // 5 sesi x 600.000
            ],
            [
                'name' => 'TOEFL Prep - Basic (10 Sesi)',
                'price_per_session' => 4000000, // 10 sesi x 400.000
            ],
            [
                'name' => 'TOEFL Prep - Intermediate (10 Sesi iBT)',
                'price_per_session' => 5000000, // 10 sesi x 500.000
            ],
            [
                'name' => 'TOEFL Prep - Advanced (20 Sesi)',
                'price_per_session' => 7000000, // 20 sesi x 350.000
            ],
            [
                'name' => 'TOEFL Prep - Master (30 Sesi)',
                'price_per_session' => 9000000, // 30 sesi x 300.000
            ],
            [
                'name' => 'TOEFL Prep - Master / Ultimate (40 Sesi iBT)',
                'price_per_session' => 14000000, // 40 sesi x 350.000
            ],
        ];

        foreach ($packages as $package) {
            PriceMaster::updateOrCreate(
                ['name' => $package['name']],
                ['price_per_session' => $package['price_per_session']]
            );
        }
    }
}
