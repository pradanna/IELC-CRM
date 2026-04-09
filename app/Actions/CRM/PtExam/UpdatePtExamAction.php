<?php

namespace App\Actions\Crm\PtExam;

use App\Models\PtExam;

class UpdatePtExamAction
{
    public function execute(PtExam $ptExam, array $data): bool
    {
        return $ptExam->update($data);
    }
}
