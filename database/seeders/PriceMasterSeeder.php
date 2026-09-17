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
            // GROUP
            [
                'name' => 'Group (12 Weeks)',
                'price_per_session' => 3300000,
                'total_sessions' => 24,
            ],
            [
                'name' => 'Group',
                'price_per_session' => 3300000,
                'total_sessions' => 24,
            ],

            // IELTS
            [
                'name' => 'IELTS (5 Sessions)',
                'price_per_session' => 3000000,
                'total_sessions' => 5,
            ],
            [
                'name' => 'IELTS (10 Sessions)',
                'price_per_session' => 5000000,
                'total_sessions' => 10,
            ],
            [
                'name' => 'IELTS (20 Sessions)',
                'price_per_session' => 9000000,
                'total_sessions' => 20,
            ],
            [
                'name' => 'IELTS (30 Sessions)',
                'price_per_session' => 12000000,
                'total_sessions' => 30,
            ],
            [
                'name' => 'IELTS (40 Sessions)',
                'price_per_session' => 14000000,
                'total_sessions' => 40,
            ],

            // TOEFL
            [
                'name' => 'TOEFL (10 Sessions)',
                'price_per_session' => 4000000,
                'total_sessions' => 10,
            ],
            [
                'name' => 'TOEFL (20 Sessions)',
                'price_per_session' => 7000000,
                'total_sessions' => 20,
            ],
            [
                'name' => 'TOEFL (30 Sessions)',
                'price_per_session' => 9000000,
                'total_sessions' => 30,
            ],

            // TOEFL iBT
            [
                'name' => 'TOEFL iBT (5 Sessions)',
                'price_per_session' => 3000000,
                'total_sessions' => 5,
            ],
            [
                'name' => 'TOEFL iBT (10 Sessions)',
                'price_per_session' => 5000000,
                'total_sessions' => 10,
            ],
            [
                'name' => 'TOEFL iBT (20 Sessions)',
                'price_per_session' => 9000000,
                'total_sessions' => 20,
            ],
            [
                'name' => 'TOEFL iBT (30 Sessions)',
                'price_per_session' => 12000000,
                'total_sessions' => 30,
            ],
            [
                'name' => 'TOEFL iBT (40 Sessions)',
                'price_per_session' => 14000000,
                'total_sessions' => 40,
            ],

            // PRIVATE
            [
                'name' => 'Private (10 Sessions)',
                'price_per_session' => 4000000,
                'total_sessions' => 10,
            ],
            [
                'name' => 'Private (20 Sessions)',
                'price_per_session' => 7000000,
                'total_sessions' => 20,
            ],
            [
                'name' => 'Private (30 Sessions)',
                'price_per_session' => 9000000,
                'total_sessions' => 30,
            ],
            [
                'name' => 'Private',
                'price_per_session' => 4000000,
                'total_sessions' => 36,
            ],

            // Legacy / Aliases for existing study class references
            [
                'name' => 'IELTS Prep - Express / Starter (5 Sesi)',
                'price_per_session' => 3000000,
                'total_sessions' => 5,
            ],
            [
                'name' => 'IELTS Prep - Intermediate (10 Sesi)',
                'price_per_session' => 5000000,
                'total_sessions' => 10,
            ],
            [
                'name' => 'IELTS Prep - Intensive / Advanced (20 Sesi)',
                'price_per_session' => 9000000,
                'total_sessions' => 20,
            ],
            [
                'name' => 'IELTS Prep - Master (30 Sesi)',
                'price_per_session' => 12000000,
                'total_sessions' => 30,
            ],
            [
                'name' => 'IELTS Prep - Master / Ultimate (40 Sesi)',
                'price_per_session' => 14000000,
                'total_sessions' => 40,
            ],
            [
                'name' => 'TOEFL Prep - Express / Basic (5 Sesi)',
                'price_per_session' => 3000000,
                'total_sessions' => 5,
            ],
            [
                'name' => 'TOEFL Prep - Basic (10 Sesi)',
                'price_per_session' => 4000000,
                'total_sessions' => 10,
            ],
            [
                'name' => 'TOEFL Prep - Intermediate (10 Sesi iBT)',
                'price_per_session' => 5000000,
                'total_sessions' => 10,
            ],
            [
                'name' => 'TOEFL Prep - Advanced (20 Sesi)',
                'price_per_session' => 7000000,
                'total_sessions' => 20,
            ],
            [
                'name' => 'TOEFL Prep - Master (30 Sesi)',
                'price_per_session' => 9000000,
                'total_sessions' => 30,
            ],
            [
                'name' => 'TOEFL Prep - Master / Ultimate (40 Sesi iBT)',
                'price_per_session' => 14000000,
                'total_sessions' => 40,
            ],
        ];

        foreach ($packages as $package) {
            PriceMaster::updateOrCreate(
                ['name' => $package['name']],
                [
                    'price_per_session' => $package['price_per_session'],
                    'total_sessions' => $package['total_sessions'] ?? null,
                ]
            );
        }
    }
}
