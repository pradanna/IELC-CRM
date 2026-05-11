<?php

namespace App\Domains\Academic\Application\Actions;

use App\Domains\Academic\Domain\Models\Student;
use App\Domains\Academic\Domain\Models\StudyClass;
use Illuminate\Support\Facades\DB;

class UnenrollStudent
{
    public function handle(StudyClass $studyClass, Student $student): void
    {
        DB::transaction(function () use ($studyClass, $student) {
            $studyClass->students()->detach($student->id);
            
            activity()
                ->performedOn($student)
                ->causedBy(auth()->user())
                ->log("Student unenrolled from class: " . $studyClass->name);
        });
    }
}


