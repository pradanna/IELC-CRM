<?php

namespace App\Domains\Academic\Application\Actions;

use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\Academic\Domain\Models\Student;

class PromoteLeadToStudent
{
    public function handle(Lead $lead): Student
    {
        // Check if student already exists for this lead
        $student = Student::where('lead_id', $lead->id)->first();

        if (!$student) {
            // Generate unique student number (e.g., STU-2026-0001)
            $year = now()->year;
            $count = Student::whereYear('created_at', $year)->count() + 1;
            $studentNumber = 'STU-' . $year . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);

            $latestInvoice = $lead->invoices()->latest()->first();
            $startJoin = $latestInvoice ? ($latestInvoice->start_date ?? now()) : now();

            $student = Student::create([
                'lead_id' => $lead->id,
                'student_number' => $studentNumber,
                'start_join' => $startJoin,
                'status' => 'active',
            ]);
        } else {
            // If already exists, ensure status is active
            $student->update(['status' => 'active']);
        }

        // Update Lead Phase to Enrollment and set timestamp
        $enrollmentPhase = \App\Domains\Master\Domain\Models\LeadPhase::where('code', 'enrollment')->first();
        $lead->update([
            'lead_phase_id' => $enrollmentPhase?->id,
            'enrolled_at' => $student->start_join ?? now(),
        ]);

        // Clear dashboard cache
        \Illuminate\Support\Facades\Cache::increment('crm_dashboard_version');

        return $student;
    }
}
