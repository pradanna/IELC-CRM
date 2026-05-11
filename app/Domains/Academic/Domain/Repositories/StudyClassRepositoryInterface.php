<?php

namespace App\Domains\Academic\Domain\Repositories;

use App\Domains\Academic\Domain\Models\StudyClass;

interface StudyClassRepositoryInterface
{
    public function findOrFail(string $id): StudyClass;
}
