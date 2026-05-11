<?php

namespace App\Domains\Academic\Application\Actions;

use App\Domains\Academic\Domain\Models\StudyClass;

class EnrollStudent
{
    public function handle(StudyClass $studyClass, string $studentId): void
    {
        $studyClass->students()->syncWithoutDetaching([
            $studentId => ['cycle_number' => $studyClass->current_session_number]
        ]);
    }
}


