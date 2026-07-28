<?php

namespace App\Domains\Academic\Application\Actions;

use App\Domains\Academic\Domain\Models\StudyClass;

class EnrollStudent
{
    public function handle(StudyClass $studyClass, string $studentId): void
    {
        $student = \App\Domains\Academic\Domain\Models\Student::find($studentId);
        if (!$student) return;

        $studyClass->students()->syncWithoutDetaching([
            $studentId => [
                'lead_id' => $student->lead_id,
                'joined_at' => now()->toDateString(),
                'end_date' => $studyClass->end_session_date?->format('Y-m-d'),
                'status' => 'active',
                'cycle_number' => $studyClass->current_session_number ?? 1,
            ]
        ]);
    }
}


