<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            IndonesiaRegionSeeder::class,
            BranchSeeder::class,
            LeadTypeSeeder::class,
            LeadPhaseSeeder::class,
            LeadSourceSeeder::class,
            RoleAndPermissionSeeder::class,
            UserSeeder::class,
            MonthlyTargetSeeder::class,
            LeadSeeder::class,
            TaskSeeder::class,
            ChatTemplateSeeder::class,
        ]);


    }
}
