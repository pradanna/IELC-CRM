<?php

namespace Database\Seeders;

use App\Models\LeadType;
use Illuminate\Database\Seeder;

class LeadTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['name' => 'Kids', 'code' => 'kids'],
            ['name' => 'Teens', 'code' => 'teens'],
            ['name' => 'Adult', 'code' => 'adult'],
            ['name' => 'IELTS', 'code' => 'ielts'],
            ['name' => 'TOEFL', 'code' => 'toefl'],
            ['name' => 'TOEFL iBT', 'code' => 'toefl_ibt'],
        ];

        foreach ($types as $type) {
            LeadType::updateOrCreate(['code' => $type['code']], $type);
        }
    }
}
