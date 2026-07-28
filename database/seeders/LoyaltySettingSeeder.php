<?php

namespace Database\Seeders;

use App\Domains\Finance\Domain\Models\LoyaltySetting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LoyaltySettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing settings first
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        LoyaltySetting::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $tiers = [
            [
                'tier_name' => 'Silver',
                'voucher_name' => 'Silver',
                'discount_amount' => 330000,
                'cafe_points' => 50000,
                'min_rejoin_count' => 2,
                'use_join_date_limit' => false,
                'join_date_limit' => null,
                'join_date_operator' => 'before',
            ],
            [
                'tier_name' => 'Gold',
                'voucher_name' => 'Gold',
                'discount_amount' => 495000,
                'cafe_points' => 100000,
                'min_rejoin_count' => 5,
                'use_join_date_limit' => false,
                'join_date_limit' => null,
                'join_date_operator' => 'before',
            ],
            [
                'tier_name' => 'Platinum',
                'voucher_name' => 'Platinum',
                'discount_amount' => 660000,
                'cafe_points' => 200000,
                'min_rejoin_count' => 10,
                'use_join_date_limit' => false,
                'join_date_limit' => null,
                'join_date_operator' => 'before',
            ],
            [
                'tier_name' => 'Super Platinum',
                'voucher_name' => 'Diamond (100)',
                'discount_amount' => 990000,
                'cafe_points' => 200000,
                'min_rejoin_count' => 20,
                'use_join_date_limit' => true,
                'join_date_limit' => '2020-01-01',
                'join_date_operator' => 'before',
            ],
        ];

        foreach ($tiers as $tier) {
            LoyaltySetting::create($tier);
        }
    }
}
