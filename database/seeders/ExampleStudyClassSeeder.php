<?php

namespace Database\Seeders;

use App\Domains\Master\Domain\Models\Branch;
use App\Domains\Academic\Domain\Models\StudyClass;
use App\Domains\Finance\Domain\Models\PriceMaster;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class ExampleStudyClassSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $branches = Branch::all();
        if ($branches->isEmpty()) {
            $this->command->warn('No branches found. Please seed branches first.');
            return;
        }

        $classes = [
            'Jovie & Co',
            'Galang & Co',
            'Gafaro & Co',
            'Wira & Co',
            'Mikael & Co',
            'Narasya & Co',
            'Dayu & Co',
            'Timmy & Co',
            'Gavin & Co',
            'Brian & Co',
            'Jescelyn & Co',
            'Neil & Co',
            'George & Co',
            'Adit & Co',
            'Bima & Co',
            'Clairine & Co',
            'Mika & Co',
            'Kenzo & Co',
            'Damar & Co',
            'Adiba & Co',
            'Caril & Co',
            'Nadindra & Co',
            'Karina & Co',
            'Matthew & Co',
            'Namita & Co',
            'Richela & Co',
            'Leticia & Co',
            'Ihsan & Co',
            'Aisha & Co',
            'Abi & Co',
            'Arsyad & Co',
            'Kerston & Co',
            'Rafa & co',
            'Talita & Co',
            'Azzam & Co',
            'Tirta & Co',
            'Keenan & Co',
            'Dana & Co',
            'Aqsa & Co',
            'Khanza & Co',
            'Jysnu & Co',
            'Jose & Co',
            'Alan & Co',
            'Nelson & Co',
            'Declan & Co',
            'Kezia & Co',
            'Giri & Co',
            'Olin & Co',
            'Khalila & Co',
            'Ihsaniar & Co',
            'Dustin & Co',
            'Tokyo & Co',
            'London & Co',
            'Milan & Co',
            'Lisbon & Co',
            'Paris & Co',
            'Sydney & Co',
            'IELTS 40 Session',
            'IELTS 30 Session',
            'IELTS 20 Session',
            'IELTS 10 Session',
            'TOEFL 20 Session',
            'TOEFL 30 Session',
            'TOEFL 10 Session',
            'Ind - 10 Session',
            'Ind- Livya Fransisca (PR)',
            'Ind - Karen Brilliant (PR)',
            'Ind - Axel Delano (PR)',
            'Privat 30',
            'Privat 10',
            'Privat 20',
            'Privat 20 berdua',
            'Privat 16',
        ];

        $branchCount = $branches->count();
        $defaultPriceMaster = PriceMaster::first();
        $defaultPriceMasterId = $defaultPriceMaster?->id;

        foreach ($classes as $index => $name) {
            $branch = $branches[$index % $branchCount];

            // Parse meetings count intelligently
            $totalMeetings = 24; // default English/TOEFL standard
            if (preg_match('/(\d+)\s+Session/i', $name, $matches)) {
                $totalMeetings = (int) $matches[1];
            } elseif (preg_match('/Privat\s+(\d+)/i', $name, $matches)) {
                $totalMeetings = (int) $matches[1];
            }

            // Alternate schedule days for realistic distribution
            $scheduleDays = ($index % 2 === 0) 
                ? ['Monday', 'Wednesday'] 
                : ['Tuesday', 'Thursday'];

            $type = ($index % 5 === 0) ? 'online' : 'offline';

            StudyClass::updateOrCreate(
                [
                    'name' => $name,
                    'branch_id' => $branch->id,
                ],
                [
                    'type' => $type,
                    'price_master_id' => $defaultPriceMasterId,
                    'start_session_date' => Carbon::now()->startOfMonth()->subDays(15), // active class started mid-month
                    'end_session_date' => Carbon::now()->startOfMonth()->addMonths(3),
                    'total_meetings' => $totalMeetings,
                    'meetings_per_week' => 2,
                    'current_session_number' => 1,
                    'schedule_days' => $scheduleDays,
                ]
            );
        }

        $this->command->info(count($classes) . ' sample study classes seeded successfully.');
    }
}
