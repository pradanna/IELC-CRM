<?php

namespace App\Actions\CRM\PtExam;

use App\Models\PtExam;

class CreatePtExamAction
{
    public function handle(array $data): PtExam
    {
        return PtExam::create($data);
    }
}
