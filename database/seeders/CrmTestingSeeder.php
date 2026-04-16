<?php

namespace database\seeders;

use App\Models\Branch;
use App\Models\Lead;
use App\Models\LeadPhase;
use App\Models\LeadSource;
use App\Models\LeadType;
use App\Models\Student;
use App\Models\StudyClass;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CrmTestingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $branch = Branch::first();
        $source = LeadSource::first();
        $type = LeadType::where('code', 'regular')->first() ?? LeadType::first();
        $newPhase = LeadPhase::where('code', 'lead')->first();
        $prospectPhase = LeadPhase::where('code', 'prospect')->first();
        $enrolledPhase = LeadPhase::where('code', 'enrollment')->first();

        // 1. Setup User Nadia
        $nadia = User::updateOrCreate(
            ['email' => 'nadia@gmail.com'],
            [
                'password' => Hash::make('password'),
                'branch_id' => $branch->id ?? null,
            ]
        );
        $nadia->assignRole('frontdesk');

        \App\Models\Frontdesk::updateOrCreate(
            ['user_id' => $nadia->id],
            [
                'name' => 'Nadia Frontdesk',
                'phone' => '081234567800',
            ]
        );

        // 2. Setup User Nia
        $nia = User::updateOrCreate(
            ['email' => 'nia@gmail.com'],
            [
                'password' => Hash::make('password'),
                'branch_id' => $branch->id ?? null,
            ]
        );
        $nia->assignRole('frontdesk');

        \App\Models\Frontdesk::updateOrCreate(
            ['user_id' => $nia->id],
            [
                'name' => 'Nia Frontdesk',
                'phone' => '081234567801',
            ]
        );

        // 2. Scenario: Silent Leads for Nadia (Tasks)
        // Task 1: 5 days silent (Pending)
        Lead::create([
            'lead_number' => 'LT' . rand(10000, 99999),
            'name' => 'Testing Silent Lead 1',
            'phone' => '081234567891',
            'email' => 'silent1@example.com',
            'branch_id' => $branch->id,
            'lead_source_id' => $source->id,
            'lead_type_id' => $type->id,
            'lead_phase_id' => $prospectPhase->id,
            'owner_id' => $nadia->id,
            'last_activity_at' => Carbon::now()->subDays(5),
            'follow_up_count' => 1
        ]);

        // Task 2: 6 days silent (Overdue - with trigger set to 4 days)
        Lead::create([
            'lead_number' => 'LT' . rand(10000, 99999),
            'name' => 'Testing Silent Lead 2 (Overdue)',
            'phone' => '081234567892',
            'email' => 'silent2@example.com',
            'branch_id' => $branch->id,
            'lead_source_id' => $source->id,
            'lead_type_id' => $type->id,
            'lead_phase_id' => $prospectPhase->id,
            'owner_id' => $nadia->id,
            'last_activity_at' => Carbon::now()->subDays(6),
            'follow_up_count' => 0
        ]);

        // 3. Scenario: Auto Clean Targets
        // Target 1: New lead but 10 days old (Born > 7 days ago)
        Lead::create([
            'lead_number' => 'LT' . rand(10000, 99999),
            'name' => 'Old New Lead (Cleanup Target)',
            'phone' => '081234567893',
            'email' => 'old_new@example.com',
            'branch_id' => $branch->id,
            'lead_source_id' => $source->id,
            'lead_type_id' => $type->id,
            'lead_phase_id' => $newPhase->id,
            'owner_id' => $nadia->id,
            'created_at' => Carbon::now()->subDays(10),
            'last_activity_at' => null
        ]);

        // Target 2: Prospective lead but 35 days silent (Born > 30 days ago)
        Lead::create([
            'lead_number' => 'LT' . rand(10000, 99999),
            'name' => 'Old Prospect Lead (Cleanup Target)',
            'phone' => '081234567894',
            'email' => 'old_prospect@example.com',
            'branch_id' => $branch->id,
            'lead_source_id' => $source->id,
            'lead_type_id' => $type->id,
            'lead_phase_id' => $prospectPhase->id,
            'owner_id' => $nadia->id,
            'last_activity_at' => Carbon::now()->subDays(35)
        ]);

        // 4. Scenario: Expiring Students
        // Student 1: 3 days left
        $leadStudent1 = Lead::create([
            'lead_number' => 'LT' . rand(10000, 99999),
            'name' => 'Student Expiring Soon (3 days)',
            'phone' => '081234567895',
            'branch_id' => $branch->id,
            'owner_id' => $nadia->id,
            'lead_source_id' => $source->id,
            'lead_type_id' => $type->id,
            'lead_phase_id' => $enrolledPhase->id,
        ]);

        $student1 = Student::create([
            'lead_id' => $leadStudent1->id,
            'student_number' => 'STU-' . rand(1000, 9999),
            'start_join' => Carbon::now()->subMonths(3),
            'status' => 'active'
        ]);

        $class1 = StudyClass::create([
            'branch_id' => $branch->id,
            'name' => 'IELTS Intensive Group',
            'start_session_date' => Carbon::now()->subMonths(3),
            'end_session_date' => Carbon::now()->addDays(3),
            'total_meetings' => 24,
            'meetings_per_week' => 2
        ]);

        $student1->studyClasses()->attach($class1->id);

        // Student 2: 12 days left
        $leadStudent2 = Lead::create([
            'lead_number' => 'LT' . rand(10000, 99999),
            'name' => 'Student Expiring Mid (12 days)',
            'phone' => '081234567896',
            'branch_id' => $branch->id,
            'owner_id' => $nadia->id,
            'lead_source_id' => $source->id,
            'lead_type_id' => $type->id,
            'lead_phase_id' => $enrolledPhase->id,
        ]);

        $student2 = Student::create([
            'lead_id' => $leadStudent2->id,
            'student_number' => 'STU-' . rand(1000, 9999),
            'start_join' => Carbon::now()->subMonths(2),
            'status' => 'active'
        ]);

        $class2 = StudyClass::create([
            'branch_id' => $branch->id,
            'name' => 'General English Adult',
            'start_session_date' => Carbon::now()->subMonths(2),
            'end_session_date' => Carbon::now()->addDays(12),
            'total_meetings' => 24,
            'meetings_per_week' => 2
        ]);

        $student2->studyClasses()->attach($class2->id);

        // 5. Scenario: Daily Activities for Today
        $leads = Lead::where('owner_id', $nadia->id)->limit(3)->get();
        foreach ($leads as $index => $lead) {
            \App\Models\LeadActivity::create([
                'lead_id' => $lead->id,
                'user_id' => $nadia->id,
                'type' => $index % 2 === 0 ? 'call' : 'message',
                'description' => "Follow up Nadia #" . ($index + 1),
                'created_at' => Carbon::now()->subMinutes(rand(10, 120))
            ]);
        }

        // 6. Data for Nia
        $niaLead = Lead::create([
            'lead_number' => 'LT' . rand(10000, 99999),
            'name' => 'Nia Personal Lead',
            'phone' => '089999999999',
            'branch_id' => $branch->id,
            'lead_source_id' => $source->id,
            'lead_type_id' => $type->id,
            'lead_phase_id' => $prospectPhase->id,
            'owner_id' => $nia->id,
            'created_at' => Carbon::now()
        ]);

        \App\Models\LeadActivity::create([
            'lead_id' => $niaLead->id,
            'user_id' => $nia->id,
            'type' => 'call',
            'description' => "Nia follow up her own lead",
            'created_at' => Carbon::now()
        ]);
    }
}
