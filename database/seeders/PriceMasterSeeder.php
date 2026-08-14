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
                'name' => 'Group Class (Anak / Remaja / Dewasa) - 3 Bulan',
                'price_per_session' => 137500,
            ],
            [
                'name' => 'Group Class Promo Semarang - 3 Bulan',
                'price_per_session' => 41667,
            ],
            [
                'name' => 'Private Class (Anak / Remaja / Dewasa)',
                'price_per_session' => 400000,
            ],
            [
                'name' => 'Private Class Promo Semarang',
                'price_per_session' => 300000,
            ],
            [
                'name' => 'IELTS Prep - Express / Starter (5 Sesi)',
                'price_per_session' => 600000,
            ],
            [
                'name' => 'IELTS Prep - Intermediate (10 Sesi)',
                'price_per_session' => 500000,
            ],
            [
                'name' => 'IELTS Prep - Intensive / Advanced (20 Sesi)',
                'price_per_session' => 450000,
            ],
            [
                'name' => 'IELTS Prep - Master / Ultimate (40 Sesi)',
                'price_per_session' => 350000,
            ],
            [
                'name' => 'TOEFL Prep - Express / Basic (5 Sesi)',
                'price_per_session' => 600000,
            ],
            [
                'name' => 'TOEFL Prep - Basic (10 Sesi)',
                'price_per_session' => 400000,
            ],
            [
                'name' => 'TOEFL Prep - Intermediate (10 Sesi iBT)',
                'price_per_session' => 500000,
            ],
            [
                'name' => 'TOEFL Prep - Advanced (20 Sesi)',
                'price_per_session' => 350000,
            ],
            [
                'name' => 'TOEFL Prep - Master (30 Sesi)',
                'price_per_session' => 300000,
            ],
            [
                'name' => 'TOEFL Prep - Master / Ultimate (40 Sesi iBT)',
                'price_per_session' => 350000,
            ],
        ];

        foreach ($packages as $package) {
            PriceMaster::firstOrCreate(
                ['name' => $package['name']],
                ['price_per_session' => $package['price_per_session']]
            );
        }
    }
}
