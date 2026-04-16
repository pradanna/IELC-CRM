<?php

namespace App\Actions\Crm\PtExam;

use App\Models\PtExam;

class DeletePtExamAction
{
    public function handle(PtExam $ptExam): bool
    {
        return $ptExam->delete();
    }
}

