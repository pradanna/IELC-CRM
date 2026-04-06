<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MonthlyTargetSeeder extends Seeder
{
    public function run(): void
    {
        $branches = \App\Models\Branch::all();

        foreach ($branches as $branch) {
            for ($month = 1; $month <= 12; $month++) {
                \App\Models\MonthlyTarget::updateOrCreate(
                    [
                        'branch_id' => $branch->id,
                        'year'      => 2026,
                        'month'     => $month,
                    ],
                    [
                        'target_enrolled' => rand(15, 30), // Random target between 15-30
                    ]
                );
            }
        }
    }
}
