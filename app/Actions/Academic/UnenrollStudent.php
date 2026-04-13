<?php

namespace App\Actions\Academic;

use App\Models\Student;
use App\Models\StudyClass;
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
