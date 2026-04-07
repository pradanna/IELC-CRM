<?php

namespace App\Actions\Academic;

use App\Models\Lead;
use App\Models\Student;

class PromoteLeadToStudent
{
    public function handle(Lead $lead): Student
    {
        // Generate student number (e.g., STU-2026-0001)
        $year = now()->year;
        $count = Student::whereYear('created_at', $year)->count() + 1;
        $studentNumber = 'STU-' . $year . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);

        $student = Student::create([
            'lead_id' => $lead->id,
            'student_number' => $studentNumber,
            'start_join' => now(),
            'status' => 'active',
        ]);

        // Update Lead Phase to Enrollment and set timestamp
        $enrollmentPhase = \App\Models\LeadPhase::where('code', 'enrollment')->first();
        $lead->update([
            'lead_phase_id' => $enrollmentPhase?->id,
            'enrolled_at' => now(),
        ]);

        // Clear dashboard cache
        \Illuminate\Support\Facades\Cache::increment('crm_dashboard_version');

        return $student;
    }
}
