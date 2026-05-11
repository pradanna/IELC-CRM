<?php

namespace App\Domains\Academic\Infrastructure\Repositories;

use App\Domains\Academic\Domain\Models\StudyClass;
use App\Domains\Academic\Domain\Repositories\StudyClassRepositoryInterface;

class EloquentStudyClassRepository implements StudyClassRepositoryInterface
{
    public function findOrFail(string $id): StudyClass
    {
        return StudyClass::findOrFail($id);
    }
}
