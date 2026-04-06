<?php

namespace App\Actions\Academic;

use App\Models\StudyClass;

class ResetClassCycle
{
    /**
     * Finishes the current class cycle and creates a new one, 
     * optionally carrying over the students from the previous cycle.
     */
    public function handle(StudyClass $studyClass): StudyClass
    {
        // 1. Capture current students of the current cycle
        $currentStudents = $studyClass->students()->pluck('students.id');

        // 2. Increment the cycle number
        $studyClass->increment('current_session_number');

        // 3. Clear the dates for the new term (Manual input expected)
        $studyClass->update([
            'start_session_date' => null, // User will update for the new cycle
            'end_session_date' => null,
        ]);

        // 4. Carry over students to the new cycle ('lanjut sesi sebelumnya')
        if ($currentStudents->isNotEmpty()) {
            foreach ($currentStudents as $studentId) {
                $studyClass->students()->attach($studentId, [
                    'cycle_number' => $studyClass->current_session_number
                ]);
            }
        }
        
        activity()
            ->performedOn($studyClass)
            ->log("Reset class cycle to #{$studyClass->current_session_number} for '{$studyClass->name}'. Students carried over.");

        return $studyClass->fresh(['branch', 'instructor', 'students']);
    }
}
