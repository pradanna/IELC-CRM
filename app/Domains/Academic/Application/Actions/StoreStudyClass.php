<?php

namespace App\Domains\Academic\Application\Actions;

use App\Domains\Academic\Domain\Models\StudyClass;

class StoreStudyClass
{
    public function handle(array $data): StudyClass
    {
        return StudyClass::create($data);
    }
}


