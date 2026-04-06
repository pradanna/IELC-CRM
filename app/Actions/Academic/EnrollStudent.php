<?php

namespace App\Actions\Academic;

use App\Models\StudyClass;

class EnrollStudent
{
    public function handle(StudyClass $studyClass, int $studentId): void
    {
        $studyClass->students()->syncWithoutDetaching([
            $studentId => ['cycle_number' => $studyClass->current_session_number]
        ]);
    }
}
