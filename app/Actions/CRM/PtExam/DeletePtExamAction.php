<?php

namespace App\Actions\CRM\PtExam;

use App\Models\PtExam;

class DeletePtExamAction
{
    public function execute(PtExam $ptExam): bool
    {
        return $ptExam->delete();
    }
}
