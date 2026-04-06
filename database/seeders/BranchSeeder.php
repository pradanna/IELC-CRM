<?php

namespace Database\Seeders;

use App\Models\Branch;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        $branches = [
            [
                'id'   => '97f2c695-8b3d-4c33-8cbd-73595610bc93',
                'name' => 'Solo',
                'code' => 'SOLO'
            ],
            [
                'id'   => '97f2c695-9b3d-4c33-8cbd-73595610bc94',
                'name' => 'Semarang',
                'code' => 'SMG'
            ],
        ];

        foreach ($branches as $branch) {
            Branch::updateOrCreate(
                ['code' => $branch['code']],
                $branch,
            );
        }
    }
}
