<?php

namespace App\Actions\Academic;

use App\Models\StudyClass;

class UpdateStudyClass
{
    public function handle(StudyClass $studyClass, array $data): StudyClass
    {
        $studyClass->update($data);
        return $studyClass;
    }
}
