<?php

namespace App\Domains\Academic\Application\Actions\PtExam;

use App\Domains\Academic\Domain\Models\PtExam;

class CreatePtExamAction
{
    public function handle(array $data): PtExam
    {
        return PtExam::create($data);
    }
}
