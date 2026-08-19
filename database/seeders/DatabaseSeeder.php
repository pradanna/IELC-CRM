<?php

namespace Database\Seeders;

use App\Domains\Shared\Domain\Models\User;
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
            InfoSourceSeeder::class,
            RoleAndPermissionSeeder::class,
            UserSeeder::class,
            MonthlyTargetSeeder::class,
            TaskSeeder::class,
            ChatTemplateSeeder::class,
            PtExamSeeder::class,
            IeltsPtExamSeeder::class,
            LoyaltySettingSeeder::class,
            PriceMasterSeeder::class,
            StudyClassSeeder::class,
            DataSiswaSeeder::class,
            BranchMonthlyStudentSnapshotSeeder::class,
        ]);

        if (app()->environment('local', 'testing')) {
            $this->call([
                ExampleStudyClassSeeder::class,
            ]);
        }
    }
}
