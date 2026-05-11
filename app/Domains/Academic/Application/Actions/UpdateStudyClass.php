<?php

namespace App\Domains\Academic\Application\Actions;

use App\Domains\Academic\Domain\Models\StudyClass;

class UpdateStudyClass
{
    public function handle(StudyClass $studyClass, array $data): StudyClass
    {
        $studyClass->update($data);
        return $studyClass;
    }
}


