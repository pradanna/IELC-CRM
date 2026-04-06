<?php

namespace Database\Seeders;

use App\Models\Task;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class TaskSeeder extends Seeder
{
    public function run(): void
    {
        $leads = Lead::all();
        $owner = User::role('superadmin')->first() ?? User::first();

        $titles = [
            'Follow-up Call', 'Send Invoice', 'Schedule Consultation', 
            'Requirement Check', 'Check Payment Status', 'Placement Test Prep',
            'Final Confirmation', 'Send Course Brochure', 'Update Personal Data'
        ];

        for ($i = 1; $i <= 20; $i++) {
            $dueType = rand(0, 2); // 0: Overdue, 1: Today, 2: Upcoming
            $dueDate = match($dueType) {
                0 => now()->subDays(rand(1, 5)),
                1 => now(),
                2 => now()->addDays(rand(1, 5)),
            };

            Task::create([
                'id' => Str::uuid(),
                'lead_id' => $leads->random()->id,
                'assigned_to' => $owner->id,
                'title' => $titles[array_rand($titles)],
                'due_date' => $dueDate,
                'is_completed' => false,
                'created_at' => now()->subDays(rand(5, 10)),
            ]);
        }
    }
}
