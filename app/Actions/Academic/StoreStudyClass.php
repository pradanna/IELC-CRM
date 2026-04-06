<?php

namespace App\Actions\Academic;

use App\Models\StudyClass;

class StoreStudyClass
{
    public function handle(array $data): StudyClass
    {
        return StudyClass::create($data);
    }
}
