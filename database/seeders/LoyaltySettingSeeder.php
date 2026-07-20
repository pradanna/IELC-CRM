<?php

namespace Database\Seeders;

use App\Domains\Finance\Domain\Models\LoyaltySetting;
use Illuminate\Database\Seeder;

class LoyaltySettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tiers = [
            [
                'tier_name' => 'Silver',
                'voucher_name' => 'Ruby',
                'cafe_points' => 50,
                'min_rejoin_count' => 2,
            ],
            [
                'tier_name' => 'Gold',
                'voucher_name' => 'Emerald',
                'cafe_points' => 100,
                'min_rejoin_count' => 5,
            ],
            [
                'tier_name' => 'Platinum',
                'voucher_name' => 'Diamond',
                'cafe_points' => 200,
                'min_rejoin_count' => 10,
            ],
        ];

        foreach ($tiers as $tier) {
            LoyaltySetting::updateOrCreate(
                ['tier_name' => $tier['tier_name']],
                $tier
            );
        }
    }
}
