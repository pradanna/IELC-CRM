<?php

namespace App\Actions\Crm\PtExam;

use App\Models\PtExam;

class DeletePtExamAction
{
    public function execute(PtExam $ptExam): bool
    {
        return $ptExam->delete();
    }
}
