<?php

namespace App\Actions\CRM\PtExam;

use App\Models\PtExam;

class UpdatePtExamAction
{
    public function execute(PtExam $ptExam, array $data): bool
    {
        return $ptExam->update($data);
    }
}
